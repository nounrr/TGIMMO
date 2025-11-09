<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RemiseCle;
use App\Models\Bail;
use Illuminate\Http\Request;

class RemiseCleController extends Controller
{
    /**
     * Normalise la structure des clés pour un enregistrement.
     */
    protected function normalizeEntry(RemiseCle $r): RemiseCle
    {
        $cles = $r->cles;
        if (is_array($cles) && array_is_list($cles)) {
            return $r; // déjà bon format
        }
        if (is_array($cles)) {
            $out = [];
            $map = [
                'porte_principale' => 'Porte principale',
                'boite_lettres' => 'Boîte aux lettres',
                'portail_garage' => 'Portail / Garage',
            ];
            foreach ($map as $key => $label) {
                if (!empty($cles[$key])) {
                    $node = $cles[$key];
                    $qty = $node['nombre'] ?? $node['count'] ?? null;
                    $checked = array_key_exists('checked', $node) ? (bool)$node['checked'] : true;
                    if ($checked && $qty && $qty > 0) {
                        $out[] = ['type' => $key, 'label' => $label, 'nombre' => (int)$qty];
                    }
                }
            }
            if (!empty($cles['autres']) && is_array($cles['autres'])) {
                foreach ($cles['autres'] as $a) {
                    if (!$a) continue;
                    $qty = $a['nombre'] ?? $a['count'] ?? null;
                    if (!empty($a['label']) && $qty && $qty > 0) {
                        $out[] = ['type' => 'autre', 'label' => $a['label'], 'nombre' => (int)$qty];
                    }
                }
            }
            $r->cles = $out;
        }
        return $r;
    }

    public function index(Request $request, Bail $bail)
    {
        $this->authorize('view', [RemiseCle::class, $bail]);
        $remises = $bail->remisesCles()->latest()->get();
        $normalized = $remises->map(fn($r) => $this->normalizeEntry($r));
        return response()->json(['data' => $normalized]);
    }

    /**
     * Liste globale de toutes les remises de clés (tous baux)
     */
    public function all(Request $request)
    {
        $this->authorize('viewAny', RemiseCle::class);

        $query = RemiseCle::with(['bail.locataire', 'bail.unite'])
            ->latest('date_remise');

        // Server-side filters
        if ($request->filled('date_from')) {
            $query->where('date_remise', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('date_remise', '<=', $request->query('date_to'));
        }
        if ($request->filled('bail_id')) {
            $query->where('bail_id', $request->query('bail_id'));
        }
        if ($request->filled('unite_id')) {
            $uniteId = $request->query('unite_id');
            $query->whereHas('bail', fn($q) => $q->where('unite_id', $uniteId));
        }
        if ($request->filled('locataire_id')) {
            $locId = $request->query('locataire_id');
            $query->whereHas('bail', fn($q) => $q->where('locataire_id', $locId));
        }
        if ($q = $request->query('q')) {
            $query->where(function ($sub) use ($q) {
                $sub->where('id', $q)
                    ->orWhereHas('bail', fn($b) => $b->where('numero_bail', 'like', "%$q%"))
                    ->orWhereHas('bail.locataire', function ($l) use ($q) {
                        $l->where('nom', 'like', "%$q%")
                          ->orWhere('prenom', 'like', "%$q%");
                    });
            });
        }

        $remises = $query->get()->map(fn($r) => $this->normalizeEntry($r));

        // Filter by key type after normalization
        if ($type = $request->query('type')) {
            $remises = $remises->filter(function ($r) use ($type) {
                foreach (($r->cles ?? []) as $c) {
                    if (($c['type'] ?? null) === $type) return true;
                }
                return false;
            })->values();
        }

        $data = $remises->map(function ($r) {
            return [
                'id' => $r->id,
                'date_remise' => $r->date_remise,
                'remarques' => $r->remarques,
                'cles' => $r->cles,
                'bail' => $r->bail ? [
                    'id' => $r->bail->id,
                    'numero_bail' => $r->bail->numero_bail,
                    'locataire' => $r->bail->locataire ? [
                        'id' => $r->bail->locataire->id,
                        'prenom' => $r->bail->locataire->prenom,
                        'nom' => $r->bail->locataire->nom,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request, Bail $bail)
    {
        $this->authorize('create', [RemiseCle::class, $bail]);
        $data = $request->validate([
            'date_remise' => ['required', 'date'],
            'cles' => ['required', 'array'],
            'remarques' => ['nullable', 'string'],
        ]);

        $remise = $bail->remisesCles()->create($data);
        return response()->json(['data' => $remise], 201);
    }
}
