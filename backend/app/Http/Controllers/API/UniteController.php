<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Unite;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UniteController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:unites.view')->only(['index', 'show']);
        $this->middleware('permission:unites.create')->only(['store']);
        $this->middleware('permission:unites.update')->only(['update']);
        $this->middleware('permission:unites.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $q = Unite::query()->with('proprietaires');
        
        // Appliquer le filtrage par statut selon les permissions
        $q = $this->applyStatusPermissions($q, 'unites');
        
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
        if ($immeuble = $request->query('immeuble')) {
            $q->where('immeuble', $immeuble);
        }
        if ($statut = $request->query('statut')) {
            $q->where('statut', $statut);
        }
        if ($request->boolean('withLocataire')) {
            $q->with('locataireActuel');
        }

        if ($sortBy = $request->query('sort_by')) {
            $direction = $request->query('order', 'asc');
            if (in_array($sortBy, ['created_at', 'updated_at', 'numero_unite', 'immeuble', 'type_unite'])) {
                $q->orderBy($sortBy, $direction);
            }
        } else {
            $q->orderBy('created_at', 'desc');
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
        
        $owners = $request->input('owners', []);
        // If single owner was passed (legacy or simple form), convert to array format
        if (empty($owners) && isset($data['proprietaire_id'])) {
            $owners = [[
                'proprietaire_id' => $data['proprietaire_id'],
                'part_numerateur' => 1,
                'part_denominateur' => 1
            ]];
        }
        unset($data['proprietaire_id']); // Clean up

        $unite = Unite::create($data);

        if (!empty($owners) && is_array($owners)) {
            foreach ($owners as $owner) {
                if (empty($owner['proprietaire_id'])) continue;
                
                $num = $owner['part_numerateur'] ?? 1;
                $den = $owner['part_denominateur'] ?? 1;
                $pct = ($den > 0) ? ($num / $den) * 100 : 0;

                $unite->proprietaires()->attach($owner['proprietaire_id'], [
                    'part_numerateur' => $num,
                    'part_denominateur' => $den,
                    // 'part_pourcent' is a generated column, do not insert manually
                    'date_debut' => now(),
                ]);
            }
        }

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

    public function getImmeubles()
    {
        $immeubles = Unite::select('immeuble')
            ->whereNotNull('immeuble')
            ->where('immeuble', '!=', '')
            ->distinct()
            ->orderBy('immeuble')
            ->pluck('immeuble');
            
        return response()->json($immeubles);
    }

    private function validateData(Request $request, bool $creating, ?Unite $unite = null): array
    {
        $user = $request->user();
        $isCommercial = $user && $user->hasRole('commercial');

        // Pour le commercial: seul le numero_unite est requis, tous les autres champs sont optionnels
        $rules = [
            'numero_unite' => ['required', 'string', 'max:50'], // Toujours requis
            'type_unite' => ['nullable', 'string', 'max:100'],
            'adresse_complete' => ['nullable', 'string', 'max:255'],
            'immeuble' => ['nullable', 'string', 'max:150'],
            'bloc' => ['nullable', 'string', 'max:50'],
            'etage' => ['nullable', 'string', 'max:50'],
            'superficie_m2' => ['nullable', 'numeric', 'min:0'],
            'nb_pieces' => ['nullable', 'integer', 'min:0'],
            'nb_sdb' => ['nullable', 'integer', 'min:0'],
            'nb_appartements' => ['nullable', 'integer', 'min:0'],
            'statut' => ['nullable', 'string'],
            'equipements' => ['nullable', 'string'],
            'mobilier' => ['nullable', 'string'],
            'proprietaire_id' => ['nullable', 'exists:proprietaires,id'],
        ];

        $data = $request->validate($rules);

        if ($creating && $isCommercial) {
            $data['statut'] = 'en_negociation';
        }

        return $data;
    }
}
