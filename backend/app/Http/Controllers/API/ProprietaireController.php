<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Proprietaire;
use Illuminate\Http\Request;

class ProprietaireController extends Controller
{
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
        
        if ($type = $request->query('type')) {
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
        $data = $this->validatedData($request, false);
        $proprietaire->update($data);
        return response()->json($proprietaire);
    }

    public function destroy(Proprietaire $proprietaire)
    {
        $proprietaire->delete();
        return response()->json(null, 204);
    }

    private function validatedData(Request $request, bool $creating): array
    {
        return $request->validate([
            'nom_raison' => ['required', 'string', 'max:200'],
            'cin' => ['nullable', 'string', 'max:50'],
            'rc' => ['nullable', 'string', 'max:50'],
            'ice' => ['nullable', 'string', 'max:50'],
            'ifiscale' => ['nullable', 'string', 'max:50'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'representant_nom' => ['nullable', 'string', 'max:150'],
            'representant_fonction' => ['nullable', 'string', 'max:120'],
            'representant_cin' => ['nullable', 'string', 'max:50'],
            'type_proprietaire' => ['nullable', 'in:unique,coproprietaire,heritier,sci,autre'],
            'statut' => ['nullable', 'in:brouillon,signe,actif,resilie'],
            'taux_gestion_tgi_pct' => ['nullable', 'numeric', 'between:0,100'],
            'part_liquidation_pct' => ['nullable', 'numeric', 'between:0,100'],
            'conditions_particulieres' => ['nullable', 'string'],
        ]);
    }
}
