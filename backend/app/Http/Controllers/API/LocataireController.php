<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Locataire;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LocataireController extends Controller
{
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
        $rules = [
            'type_personne' => ['nullable', 'in:personne,societe'],
            'nom' => ['nullable', 'string', 'max:150'],
            'prenom' => ['nullable', 'string', 'max:150'],
            'raison_sociale' => ['nullable', 'string', 'max:200'],
            'date_naissance' => ['nullable', 'date'],
            'lieu_naissance' => ['nullable', 'string', 'max:150'],
            'date_creation_entreprise' => ['nullable', 'date'],
            'nationalite' => ['nullable', 'string', 'max:100'],
            'situation_familiale' => ['nullable', 'string', 'max:100'],
            'nb_personnes_foyer' => ['nullable', 'integer', 'min:0'],
            'cin' => ['nullable', 'string', 'max:50'],
            'rc' => ['nullable', 'string', 'max:50'],
            'ice' => ['nullable', 'string', 'max:50'],
            'ifiscale' => ['nullable', 'string', 'max:50'],
            'adresse_bien_loue' => ['nullable', 'string', 'max:255'],
            'adresse_actuelle' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'profession_activite' => ['nullable', 'string', 'max:150'],
            'employeur_denomination' => ['nullable', 'string', 'max:200'],
            'employeur_adresse' => ['nullable', 'string', 'max:255'],
            'type_contrat' => ['nullable', 'in:CDI,CDD,independant,societe,autre'],
            'revenu_mensuel_net' => ['nullable', 'numeric'],
            'chiffre_affaires_dernier_ex' => ['nullable', 'numeric'],
            'exercice_annee' => ['nullable', 'integer', 'digits:4'],
            'anciennete_mois' => ['nullable', 'integer', 'min:0'],
            'references_locatives' => ['nullable', 'string'],
        ];

        return $request->validate($rules);
    }
}
