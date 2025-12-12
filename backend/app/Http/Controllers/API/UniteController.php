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
        $q = Unite::query()->with(['activeMandats', 'proprietaires']);
        
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
        $allowedSorts = ['numero_unite','type_unite','statut','adresse_complete','superficie_m2','nb_pieces','created_at', 'updated_at', 'is_linked'];
        
        if ($sortBy === 'is_linked') {
            $q->withCount(['mandats as is_linked_count' => function ($query) {
                $query->whereIn('statut', ['actif', 'en_attente', 'modifier', 'signe']);
            }])->orderBy('is_linked_count', $sortDir);
        } elseif ($sortBy && in_array($sortBy, $allowedSorts, true)) {
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
        
        // Handle auto-generation of numero_unite if empty
        $needsAutoNumber = false;
        if (empty($data['numero_unite'])) {
            $data['numero_unite'] = 'TEMP_' . uniqid();
            $needsAutoNumber = true;
        }

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

        if ($needsAutoNumber) {
            $unite->update(['numero_unite' => 'U_' . $unite->id]);
            $unite->refresh();
        }

        if (!empty($owners) && is_array($owners)) {
            // Direct link without MandatGestion
            foreach ($owners as $owner) {
                if (empty($owner['proprietaire_id'])) continue;
                
                $num = $owner['part_numerateur'] ?? 1;
                $den = $owner['part_denominateur'] ?? 1;
                $pct = ($den > 0) ? ($num / $den) * 100 : 0;

                \App\Models\UniteProprietaire::create([
                    'unite_id' => $unite->id,
                    'proprietaire_id' => $owner['proprietaire_id'],
                    'part_numerateur' => $num,
                    'part_denominateur' => $den,
                    'pourcentage' => $pct,
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

        // Handle owners update if provided
        if ($request->has('owners')) {
            $owners = $request->input('owners', []);
            
            // Delete existing direct links (no mandate)
            \App\Models\UniteProprietaire::where('unite_id', $unite->id)
                ->whereNull('mandat_id')
                ->delete();

            if (!empty($owners)) {
                foreach ($owners as $owner) {
                    if (empty($owner['proprietaire_id'])) continue;
                    
                    $num = $owner['part_numerateur'] ?? 1;
                    $den = $owner['part_denominateur'] ?? 1;
                    $pct = ($den > 0) ? ($num / $den) * 100 : 0;

                    \App\Models\UniteProprietaire::create([
                        'unite_id' => $unite->id,
                        'proprietaire_id' => $owner['proprietaire_id'],
                        'part_numerateur' => $num,
                        'part_denominateur' => $den,
                        'pourcentage' => $pct,
                        // No mandate_id
                    ]);
                }
            }
        }

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
            'numero_unite' => ['nullable', 'string', 'max:50'], // Optionnel, auto-généré si vide
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
            'coordonnees_gps' => ['nullable', 'string'],
            
            // Nouveaux champs de gestion
            'taux_gestion_pct' => ['nullable', 'numeric', 'between:0,100'],
            'frais_min_mensuel' => ['nullable', 'numeric', 'min:0'],
            'description_bien' => ['nullable', 'string'],
            'pouvoirs_accordes' => ['nullable', 'string'],
        ];

        $data = $request->validate($rules);

        if ($creating && $isCommercial) {
            $data['statut'] = 'en_negociation';
        }

        return $data;
    }
}
