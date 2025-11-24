<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Locataire;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LocataireController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        // Appliquer les permissions Spatie par action
        $this->middleware('permission:locataires.view')->only(['index', 'show']);
        $this->middleware('permission:locataires.create')->only(['store']);
        $this->middleware('permission:locataires.update')->only(['update']);
        $this->middleware('permission:locataires.delete')->only(['destroy']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Locataire::query();

        // Appliquer le filtrage par statut selon les permissions
        $query = $this->applyStatusPermissions($query, 'locataires');

        // Recherche globale
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('raison_sociale', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        // Filtre par type de personne
        if ($type = $request->query('type')) {
            $query->where('type_personne', $type);
        }

        // Tri
        $sortBy = $request->query('sort_by');
        $sortDir = strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['nom', 'prenom', 'raison_sociale', 'type_personne', 'statut', 'email', 'telephone', 'created_at'];
        if ($sortBy && in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $paginatedData = $query->paginate($perPage);
        
        // Statistiques juridiques globales (sans filtres)
        $stats = [
            // Répartition juridique
            'total_personnes' => Locataire::where('type_personne', 'personne')->count(),
            'total_societes' => Locataire::where('type_personne', 'societe')->count(),
            // Contrats (typologie)
            'contrats' => [
                'CDI' => Locataire::where('type_contrat', 'CDI')->count(),
                'CDD' => Locataire::where('type_contrat', 'CDD')->count(),
                'independant' => Locataire::where('type_contrat', 'independant')->count(),
                'societe' => Locataire::where('type_contrat', 'societe')->count(),
                'autre' => Locataire::where('type_contrat', 'autre')->count(),
            ],
            // Identifiants légaux disponibles
            'identifiants' => [
                'cin' => Locataire::whereNotNull('cin')->where('cin', '!=', '')->count(),
                'rc' => Locataire::whereNotNull('rc')->where('rc', '!=', '')->count(),
                'ice' => Locataire::whereNotNull('ice')->where('ice', '!=', '')->count(),
                'ifiscale' => Locataire::whereNotNull('ifiscale')->where('ifiscale', '!=', '')->count(),
            ],
        ];
        
        // Ajouter les stats à la réponse paginée
        $response = $paginatedData->toArray();
        $response['stats'] = $stats;
        
        return response()->json($response);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $this->validatedData($request, true);
        $locataire = Locataire::create($data);
        return response()->json($locataire, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Locataire $locataire)
    {
        return response()->json($locataire);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Locataire $locataire)
    {
        $data = $this->validatedData($request, false);
        $locataire->update($data);
        return response()->json($locataire);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Locataire $locataire)
    {
        $locataire->delete();
        return response()->json(null, 204);
    }

    private function validatedData(Request $request, bool $creating): array
    {
        $user = $request->user();
        $isCommercial = $user && $user->hasRole('commercial');

        // Pour le commercial: seul le nom est requis, tous les autres champs sont optionnels
        $rules = [
            'type_personne' => ['nullable', 'in:personne,societe'],
            'nom' => ['required', 'string', 'max:150'], // Toujours requis
            'prenom' => ['nullable', 'string', 'max:150'],
            'nom_ar' => ['nullable', 'string', 'max:150'],
            'prenom_ar' => ['nullable', 'string', 'max:150'],
            'raison_sociale' => ['nullable', 'string', 'max:200'],
            'profession_activite' => ['nullable', 'string', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'adresse_actuelle' => ['nullable', 'string', 'max:255'],
            'adresse_ar' => ['nullable', 'string', 'max:255'],
            'cin' => ['nullable', 'string', 'max:20'],
            'rc' => ['nullable', 'string', 'max:50'],
            'ice' => ['nullable', 'string', 'max:50'],
            'date_naissance' => ['nullable', 'date'],
            'lieu_naissance' => ['nullable', 'string', 'max:150'],
            'date_creation_entreprise' => ['nullable', 'date'],
            'nationalite' => ['nullable', 'string', 'max:100'],
            'situation_familiale' => ['nullable', 'in:celibataire,marie,divorce,veuf'],
            'nb_personnes_foyer' => ['nullable', 'integer', 'min:0'],
            'ifiscale' => ['nullable', 'string', 'max:50'],
            'adresse_bien_loue' => ['nullable', 'string', 'max:255'],
            'employeur_denomination' => ['nullable', 'string', 'max:200'],
            'employeur_adresse' => ['nullable', 'string', 'max:255'],
            'type_contrat' => ['nullable', 'in:cdi,cdd,independant,autre'],
            'revenu_mensuel_net' => ['nullable', 'numeric', 'min:0'],
            'chiffre_affaires_dernier_ex' => ['nullable', 'numeric', 'min:0'],
            'exercice_annee' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'anciennete_mois' => ['nullable', 'integer', 'min:0'],
            'references_locatives' => ['nullable', 'string'],
            'statut' => ['nullable', 'string'],
        ];
        
        $data = $request->validate($rules);

        if ($creating && $isCommercial) {
            $data['statut'] = 'en_negociation';
        }

        return $data;
    }
}
