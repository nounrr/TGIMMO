<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Unite;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UniteController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:unites.view')->only(['index', 'show']);
        $this->middleware('permission:unites.create')->only(['store']);
        $this->middleware('permission:unites.update')->only(['update']);
        $this->middleware('permission:unites.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $q = Unite::query();
        
        // Filtres
        if ($s = $request->query('q')) {
            $q->where(function ($w) use ($s) {
                $w->where('numero_unite','like',"%{$s}%")
                  ->orWhere('adresse_complete','like',"%{$s}%")
                  ->orWhere('immeuble','like',"%{$s}%");
            });
        }
        if ($type = $request->query('type_unite')) {
            $q->where('type_unite', $type);
        }
        if ($statut = $request->query('statut')) {
            $q->where('statut', $statut);
        }
        if ($request->boolean('withLocataire')) {
            $q->with('locataireActuel');
        }
        
        // Statistiques globales (indépendantes des filtres)
        $stats = [
            'total' => Unite::count(),
            'total_vacant' => Unite::where('statut', 'vacant')->count(),
            'total_loue' => Unite::where('statut', 'loue')->count(),
            'total_maintenance' => Unite::where('statut', 'maintenance')->count(),
            'total_reserve' => Unite::where('statut', 'reserve')->count(),
        ];
        
        // Tri sécurisé
        $sortBy = $request->query('sort_by');
        $sortDir = strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['numero_unite','type_unite','statut','adresse_complete','superficie_m2','nb_pieces','created_at'];
        if ($sortBy && in_array($sortBy, $allowedSorts, true)) {
            $q->orderBy($sortBy, $sortDir);
        } else {
            // Ordre par défaut
            $q->orderBy('numero_unite', 'asc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $q->paginate($perPage);
        
        // Ajouter les stats à la réponse
        return response()->json(array_merge($result->toArray(), ['stats' => $stats]));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request, true);
        $unite = Unite::create($data);
        return response()->json($unite, 201);
    }

    public function show(Request $request, Unite $unite)
    {
        if ($request->boolean('withLocataire')) {
            $unite->loadMissing('locataireActuel');
        }
        return response()->json($unite);
    }

    public function update(Request $request, Unite $unite)
    {
        $data = $this->validateData($request, false, $unite);
        $unite->fill($data)->save();
        return response()->json($unite);
    }

    public function destroy(Unite $unite)
    {
        $unite->delete();
        return response()->json(null, 204);
    }

    private function validateData(Request $request, bool $creating, ?Unite $unite = null): array
    {
        $uniqueNumero = Rule::unique('unites','numero_unite');
        if ($unite) {
            $uniqueNumero = $uniqueNumero->ignore($unite->id);
        }
        return $request->validate([
            'numero_unite' => ['required','string','max:100',$uniqueNumero],
            'adresse_complete' => ['required','string','max:255'],
            'immeuble' => ['nullable','string','max:150'],
            'bloc' => ['nullable','string','max:100'],
            'etage' => ['nullable','string','max:50'],
            'type_unite' => ['required', Rule::in(['appartement','bureau','local_commercial','garage','autre'])],
            'superficie_m2' => ['nullable','numeric','min:0'],
            'nb_pieces' => ['nullable','integer','min:0'],
            'nb_sdb' => ['nullable','integer','min:0'],
            'equipements' => ['nullable','string'],
            'mobilier' => ['nullable','string'],
            'statut' => ['nullable', Rule::in(['vacant','loue','maintenance','reserve'])],
            'locataire_actuel_id' => ['nullable','integer','exists:locataires,id'],
            'bail_actuel_id' => ['nullable','integer'],
            'date_entree_actuelle' => ['nullable','date'],
        ]);
    }
}
