<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Proprietaire;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProprietaireController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:proprietaires.view')->only(['index', 'show']);
        $this->middleware('permission:proprietaires.create')->only(['store']);
        $this->middleware('permission:proprietaires.update')->only(['update']);
        $this->middleware('permission:proprietaires.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Proprietaire::query();
        
        // Appliquer le filtrage par statut selon les permissions
        $query = $this->applyStatusPermissions($query, 'proprietaires');
        
        // Filtres
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom_raison', 'like', "%{$search}%")
                  ->orWhere('cin', 'like', "%{$search}%")
                  ->orWhere('rc', 'like', "%{$search}%")
                  ->orWhere('ice', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        if ($type = $request->query('type_proprietaire')) {
            $query->where('type_proprietaire', $type);
        }
        
        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        // Statistiques globales (indépendantes des filtres)
        $stats = [
            'total' => Proprietaire::count(),
            'total_actif' => Proprietaire::where('statut', 'actif')->count(),
            'total_signe' => Proprietaire::where('statut', 'signe')->count(),
            'total_brouillon' => Proprietaire::where('statut', 'brouillon')->count(),
            'total_resilie' => Proprietaire::where('statut', 'resilie')->count(),
        ];
        
        // Tri
        $sortBy = $request->query('sort_by');
        $sortDir = strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['nom_raison', 'type_proprietaire', 'statut', 'email', 'telephone', 'created_at', 'updated_at'];
        if ($sortBy && in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $query->paginate($perPage);
        
        // Ajouter les stats à la réponse
        return response()->json(array_merge($result->toArray(), ['stats' => $stats]));
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request, true);
        $prop = Proprietaire::create($data);
        return response()->json($prop, 201);
    }

    public function show(Proprietaire $proprietaire)
    {
        return response()->json($proprietaire);
    }

    public function update(Request $request, Proprietaire $proprietaire)
    {
        $data = $this->validatedData($request, false, $proprietaire->id);
        $proprietaire->update($data);
        return response()->json($proprietaire);
    }

    public function destroy(Proprietaire $proprietaire)
    {
        $proprietaire->delete();
        return response()->json(null, 204);
    }

    private function validatedData(Request $request, bool $creating, ?int $id = null): array
    {
        $user = $request->user();
        $isCommercial = $user && $user->hasRole('commercial');

        // Pour le commercial: seul le nom_raison est requis, tous les autres champs sont optionnels
        $rules = [
            'nom_raison' => ['required', 'string', 'max:200'], // Toujours requis
            'nom_ar' => ['nullable', 'string', 'max:200'],
            'prenom_ar' => ['nullable', 'string', 'max:200'],
            'type_proprietaire' => ['nullable', 'in:unique,coproprietaire,heritier,sci,autre'],
            'statut' => ['nullable', 'string'],
            'telephone' => ['nullable', 'array'],
            'telephone.*' => ['string', 'regex:/^0[5-7][0-9]{8}$/'],
            'email' => ['nullable', 'email', 'max:150'],
            'rib' => ['nullable', 'string', 'regex:/^[0-9]{24}$/'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'adresse_ar' => ['nullable', 'string', 'max:255'],
            'ville' => ['nullable', 'string', 'max:100'],
            'cin' => ['nullable', 'string', 'regex:/^[A-Z]{1,2}[0-9]{1,6}$/', Rule::unique('proprietaires', 'cin')->ignore($id)],
            'rc' => ['nullable', 'string', 'max:50'],
            'chiffre_affaires' => ['nullable', 'numeric', 'min:0'],
            'ice' => ['nullable', 'string', 'regex:/^[0-9]{15}$/'],
            'ifiscale' => ['nullable', 'string', 'regex:/^[0-9]{1,50}$/'],
            'representant_nom' => ['nullable', 'string', 'max:200'],
            'representant_fonction' => ['nullable', 'string', 'max:100'],
            'representant_cin' => ['nullable', 'string', 'max:20'],
            'taux_gestion' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'assiette_honoraires' => ['nullable', 'string'],
            'periodicite_releve' => ['nullable', 'string'],
            'conditions_particulieres' => ['nullable', 'string'],
        ];

        $data = $request->validate($rules);

        if ($creating && $isCommercial) {
            $data['statut'] = 'en_negociation';
        }

        return $data;
    }
}
