<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RemiseCle;
use App\Models\Bail;
use App\Services\DocumentTemplateService;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;

class RemiseCleController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:remises-cles.view')->only(['index', 'show']);
        $this->middleware('permission:remises-cles.create')->only(['store']);
        $this->middleware('permission:remises-cles.update')->only(['update']);
        $this->middleware('permission:remises-cles.delete')->only(['destroy']);
    }

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

        $this->applyStatusPermissions($query, 'remises-cles');

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
            'doc_content' => ['nullable', 'string'],
            'doc_variables' => ['nullable', 'array'],
            'doc_template_key' => ['nullable', 'string'],
        ]);

        $remise = $bail->remisesCles()->create($data);
        return response()->json(['data' => $remise], 201);
    }

    public function show(RemiseCle $remiseCle)
    {
        $this->authorize('view', [RemiseCle::class, $remiseCle->bail]);
        return response()->json(['data' => $remiseCle->load('bail.locataire', 'bail.unite')]);
    }

    public function update(Request $request, RemiseCle $remiseCle)
    {
        $this->authorize('update', $remiseCle);
        $data = $request->validate([
            'date_remise' => ['sometimes', 'date'],
            'cles' => ['sometimes', 'array'],
            'remarques' => ['nullable', 'string'],
            'doc_content' => ['nullable', 'string'],
            'doc_variables' => ['nullable', 'array'],
            'doc_template_key' => ['nullable', 'string'],
        ]);

        $remiseCle->update($data);
        return response()->json(['data' => $remiseCle]);
    }

    public function editorTemplate(RemiseCle $remiseCle, DocumentTemplateService $tpl)
    {
        $this->authorize('view', [RemiseCle::class, $remiseCle->bail]);
        
        $baseTemplate = <<<'EOT'
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
    <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px;">FORMULAIRE DE REMISE DES CLÉS</h2>
    
    <p style="margin-bottom: 15px;">
        <strong>TGI :</strong> {{proprietaire.nom_complet}} 
        <span style="float: right;"><strong>Locataire :</strong> {{locataire.nom_complet}}</span>
    </p>
    <p style="margin-bottom: 20px;"><strong>Adresse du bien loué :</strong> {{unite.adresse}}</p>
    
    <p><strong>Clés remises :</strong></p>
    <table style="width: 100%; border: none; margin-bottom: 20px;">
        <tr>
            <td style="padding: 5px;">{{checkbox_porte}} Porte principale – Nombre : {{remise.qty_porte}}</td>
            <td style="padding: 5px;">{{checkbox_boite}} Boîte aux lettres – Nombre : {{remise.qty_boite}}</td>
        </tr>
        <tr>
            <td style="padding: 5px;">{{checkbox_garage}} Portail / Garage – Nombre : {{remise.qty_garage}}</td>
            <td style="padding: 5px;">{{checkbox_autre}} Autres (préciser) : {{remise.autres_details}}</td>
        </tr>
    </table>
    
    <p style="margin-bottom: 20px;"><strong>Date de remise :</strong> {{remise.date_jour}} / {{remise.date_mois}} / {{remise.date_annee}} à {{remise.heure}} heures</p>
    
    <p style="text-align: justify; margin-bottom: 20px;">
        Je soussigné(e), M./Mme <strong>{{proprietaire.nom_complet}}</strong>, bailleur, atteste avoir remis les clés du logement cité ci-dessus à M./Mme <strong>{{locataire.nom_complet}}</strong>, locataire.
    </p>
    
    <p style="margin-bottom: 40px;">Fait à <strong>Casablanca</strong>, le {{remise.date_jour}} / {{remise.date_mois}} / {{remise.date_annee}}</p>
    
    <table style="width: 100%;">
        <tr>
            <td style="width: 50%; vertical-align: top;"><strong>Signature du bailleur :</strong></td>
            <td style="width: 50%; vertical-align: top;"><strong>Signature du locataire :</strong></td>
        </tr>
    </table>
</div>
EOT;

        $bail = $remiseCle->bail;
        $unite = $bail->unite;
        $locataire = $bail->locataire;
        $proprietaire = $unite->activeMandat?->proprietaires->first();
        
        // Helper to extract quantity
        $cles = $remiseCle->cles ?? [];
        $getQty = function($type) use ($cles) {
            foreach ($cles as $c) {
                if (($c['type'] ?? '') === $type) return $c['nombre'] ?? 0;
            }
            return 0;
        };
        
        $qtyPorte = $getQty('porte_principale');
        $qtyBoite = $getQty('boite_lettres');
        $qtyGarage = $getQty('portail_garage');
        
        // Extract "autres"
        $autres = [];
        foreach ($cles as $c) {
            if (($c['type'] ?? '') === 'autre') {
                $autres[] = ($c['label'] ?? 'Autre') . ' (' . ($c['nombre'] ?? 0) . ')';
            }
        }
        $autresStr = empty($autres) ? '.............................................' : implode(', ', $autres);
        $qtyAutre = count($autres);

        $date = $remiseCle->date_remise;

        $variables = [
            'remise.date_remise' => $date ? $date->format('d/m/Y H:i') : '',
            'remise.date_jour' => $date ? $date->format('d') : '...',
            'remise.date_mois' => $date ? $date->format('m') : '...',
            'remise.date_annee' => $date ? $date->format('Y') : '....',
            'remise.heure' => $date ? $date->format('H:i') : '...',
            
            'remise.qty_porte' => $qtyPorte ?: '..........',
            'remise.qty_boite' => $qtyBoite ?: '..........',
            'remise.qty_garage' => $qtyGarage ?: '..........',
            'remise.autres_details' => $autresStr,
            
            'checkbox_porte' => $qtyPorte > 0 ? '☑' : '☐',
            'checkbox_boite' => $qtyBoite > 0 ? '☑' : '☐',
            'checkbox_garage' => $qtyGarage > 0 ? '☑' : '☐',
            'checkbox_autre' => $qtyAutre > 0 ? '☑' : '☐',

            'remise.remarques' => $remiseCle->remarques,
            
            'proprietaire.nom_complet' => $proprietaire ? $proprietaire->nom_complet : 'TGI',
            
            'locataire.nom_complet' => $locataire->nom_complet,
            
            'unite.type' => $unite->type_unite,
            'unite.adresse' => $unite->adresse_complete,
        ];

        return response()->json([
            'template' => $baseTemplate,
            'variables' => $variables,
            'template_key' => 'remise_cle_fr_v1'
        ]);
    }

    public function renderPreview(Request $request, RemiseCle $remiseCle)
    {
        $this->authorize('view', [RemiseCle::class, $remiseCle->bail]);
        
        $content = $request->input('content');
        $variables = $request->input('variables', []);

        foreach ($variables as $key => $value) {
            $content = str_replace('{{' . $key . '}}', $value ?? '', $content);
            $content = str_replace('{{ ' . $key . ' }}', $value ?? '', $content);
        }

        return response()->json(['html' => $content]);
    }
}
