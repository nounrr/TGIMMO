<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MandatGestion;
use App\Services\DocumentTemplateService;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use Barryvdh\DomPDF\Facade\Pdf;

class MandatGestionController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:mandats.view')->only(['index', 'show']);
        $this->middleware('permission:mandats.create')->only(['store']);
        $this->middleware('permission:mandats.update')->only(['update']);
        $this->middleware('permission:mandats.delete')->only(['destroy']);
        $this->middleware('permission:mandats.download')->only(['downloadDocx', 'downloadPdf']);
    }

    public function index(Request $request)
    {
        $query = MandatGestion::query()->with(['unites.proprietaires']);

        $this->applyStatusPermissions($query, 'mandats');

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('mandat_id', 'like', "%{$search}%");
            });
        }

        if ($uniteId = $request->query('unite_id')) {
            $query->whereHas('unites', function ($q) use ($uniteId) {
                $q->where('unites.id', $uniteId);
            });
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        // Tri
        $sortBy = $request->query('sort_by');
        $sortDir = strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['reference', 'mandat_id', 'date_debut', 'date_fin', 'statut', 'created_at', 'updated_at'];

        if ($sortBy && in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $query->paginate($perPage);

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'unite_ids' => 'required|array',
            'unite_ids.*' => 'exists:unites,id',
            'owners' => 'required|array',
            'owners.*.proprietaire_id' => 'required|exists:proprietaires,id',
            'owners.*.part_numerateur' => 'required|integer|min:1',
            'owners.*.part_denominateur' => 'required|integer|min:1',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'statut' => 'required|in:actif,inactif,resilie,en_attente,signe,brouillon,modifier',
            'reference' => 'nullable|string',
            'mandat_id' => 'nullable|string',
            'taux_gestion_pct' => 'nullable|numeric|min:0|max:100',
            'doc_content' => 'nullable|string',
            'doc_variables' => 'nullable|array',
            'doc_template_key' => 'nullable|string|max:120',
        ]);

        $data['created_by'] = $request->user()->id;
        
        // Create Mandat
        $mandat = MandatGestion::create(\Illuminate\Support\Arr::except($data, ['unite_ids', 'owners', 'taux_gestion_pct']));

        // Attach Unites
        if (!empty($data['unite_ids'])) {
            $mandat->unites()->sync($data['unite_ids']);

            // Update taux_gestion_pct for units if provided
            if (isset($data['taux_gestion_pct']) && $data['taux_gestion_pct'] !== null) {
                \App\Models\Unite::whereIn('id', $data['unite_ids'])->update(['taux_gestion_pct' => $data['taux_gestion_pct']]);
            }
        }

        // Attach Owners to each Unite
        if (!empty($data['owners']) && !empty($data['unite_ids'])) {
            foreach ($data['unite_ids'] as $uniteId) {
                foreach ($data['owners'] as $owner) {
                    \Illuminate\Support\Facades\DB::table('unites_proprietaires')->insert([
                        'unite_id' => $uniteId,
                        'proprietaire_id' => $owner['proprietaire_id'],
                        'part_numerateur' => $owner['part_numerateur'],
                        'part_denominateur' => $owner['part_denominateur'],
                        'pourcentage' => ($owner['part_numerateur'] / $owner['part_denominateur']) * 100,
                        'date_debut' => $mandat->date_debut,
                        'date_fin' => $mandat->date_fin,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        return response()->json($mandat->load(['unites.proprietaires']), 201);
    }

    public function show(MandatGestion $mandats_gestion)
    {
        return response()->json($mandats_gestion->load(['unites.proprietaires']));
    }

    public function update(Request $request, MandatGestion $mandats_gestion)
    {
        $data = $request->validate([
            'unite_ids' => 'sometimes|array',
            'unite_ids.*' => 'exists:unites,id',
            'owners' => 'sometimes|array',
            'owners.*.proprietaire_id' => 'required_with:owners|exists:proprietaires,id',
            'owners.*.part_numerateur' => 'required_with:owners|integer|min:1',
            'owners.*.part_denominateur' => 'required_with:owners|integer|min:1',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'statut' => 'sometimes|in:actif,inactif,resilie,en_attente,signe,brouillon,modifier',
            'reference' => 'nullable|string',
            'mandat_id' => 'nullable|string',
            'doc_content' => 'sometimes|nullable|string',
            'doc_variables' => 'sometimes|array',
            'doc_template_key' => 'sometimes|nullable|string|max:120',
        ]);

        // Sync Unites
        if (array_key_exists('unite_ids', $data)) {
             $mandats_gestion->unites()->sync($data['unite_ids']);
             unset($data['unite_ids']);
        }

        // Sync Owners (Update logic is complex, for now we append new periods if owners change, or just update if same period?)
        // For simplicity in this fix, we will just add new records if owners are provided, 
        // assuming the user is defining the ownership for this mandat's period.
        // A more robust solution would be to sync/replace for the specific period.
        if (array_key_exists('owners', $data) && $mandats_gestion->unites->isNotEmpty()) {
             // This part is tricky without a direct relationship. 
             // We might want to clear existing ownerships for this period and these units?
             // For now, let's just insert like in store, but be aware of duplicates.
             // Ideally, we should delete existing ownerships for these units that match the mandat dates exactly.
             
             foreach ($mandats_gestion->unites as $unite) {
                 // Delete existing for this exact period (simple approach)
                 \Illuminate\Support\Facades\DB::table('unites_proprietaires')
                    ->where('unite_id', $unite->id)
                    ->where('date_debut', $mandats_gestion->date_debut)
                    ->delete();

                 foreach ($data['owners'] as $owner) {
                    \Illuminate\Support\Facades\DB::table('unites_proprietaires')->insert([
                        'unite_id' => $unite->id,
                        'proprietaire_id' => $owner['proprietaire_id'],
                        'part_numerateur' => $owner['part_numerateur'],
                        'part_denominateur' => $owner['part_denominateur'],
                        'pourcentage' => ($owner['part_numerateur'] / $owner['part_denominateur']) * 100,
                        'date_debut' => $data['date_debut'] ?? $mandats_gestion->date_debut,
                        'date_fin' => $data['date_fin'] ?? $mandats_gestion->date_fin,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
             }
             unset($data['owners']);
        }

        // If doc_variables provided as array, store JSON
        if (array_key_exists('doc_variables', $data)) {
            $mandats_gestion->doc_variables = $data['doc_variables'];
            unset($data['doc_variables']);
        }
        
        $mandats_gestion->update($data);

        return response()->json($mandats_gestion->load(['unites.proprietaires']));
    }

    /**
     * Provide default editor template and variable list for a mandat.
     */
    public function editorTemplate(MandatGestion $mandats_gestion, DocumentTemplateService $tpl)
    {
        $baseTemplate = <<<'EOT'
<h1>Mandat de gestion</h1>
<p>Référence: {{mandat.reference}}</p>
<p>Unité: {{unite.numero}} (ID {{unite.id}})</p>
<p>Période: {{mandat.date_debut}} → {{mandat.date_fin}}</p>
<h2>Propriétaires</h2>
{{proprietaires.liste}}
<h2>Pouvoirs accordés</h2>
<div>{{mandat.pouvoirs_accordes}}</div>
<h2>Description du bien</h2>
<div>{{mandat.description_bien}}</div>
EOT;

        $mandat = $mandats_gestion->load(['unites.proprietaires']);
        $variables = $this->getEditorVariables($mandat);

        return response()->json([
            'template' => $baseTemplate,
            'variables' => $variables,
            'current' => [
                'doc_content' => $mandat->doc_content,
                'doc_variables' => $mandat->doc_variables,
                'doc_template_key' => $mandat->doc_template_key,
            ]
        ]);
    }

    /**
     * Render a preview of editor content with variable interpolation.
     */
    public function renderPreview(Request $request, MandatGestion $mandats_gestion)
    {
        $data = $request->validate([
            'content' => 'required|string',
            'variables' => 'nullable|array'
        ]);

        $mandat = $mandats_gestion->load(['unites.proprietaires']);
        $baseVars = $this->getEditorVariables($mandat);
        $allVars = array_merge($baseVars, $data['variables'] ?? []);

        $rendered = preg_replace_callback('/{{\s*([^}]+)\s*}}/', function($m) use ($allVars) {
            $key = trim($m[1]);
            return array_key_exists($key, $allVars) ? ($allVars[$key] ?? '') : $m[0];
        }, $data['content']);

        return response()->json([
            'html' => $rendered,
            'variables_used' => array_keys($allVars)
        ]);
    }

    /**
     * Helper to generate all available variables for the editor.
     * 
     * NEW SIMPLIFIED LOGIC:
     * - Always provide summary variables (count, liste)
     * - Always use INDEXED variables (unite_1, proprietaire_1) regardless of count
     * - This ensures consistent variable naming in templates
     */
    private function getEditorVariables(MandatGestion $mandat): array
    {
        $variables = [
            // Mandat variables
            'mandat.reference' => $mandat->reference,
            'mandat.mandat_id' => $mandat->mandat_id,
            'mandat.date_debut' => $mandat->date_debut?->toDateString(),
            'mandat.date_fin' => $mandat->date_fin?->toDateString(),
            'mandat.statut' => $mandat->statut,
        ];

        // === UNITES VARIABLES ===
        $unitesCount = $mandat->unites->count();
        $variables['unites.count'] = $unitesCount;
        
        if ($unitesCount > 0) {
            $variables['unites.liste_numeros'] = $mandat->unites->pluck('numero_unite')->filter()->implode(', ');
            $variables['unites.liste_adresses'] = $mandat->unites->pluck('adresse_complete')->filter()->implode('; ');
            $variables['unites.liste_titres'] = $mandat->unites->pluck('titre_foncier')->filter()->implode(', ');
            
            // Always generate indexed variables for each unit
            foreach ($mandat->unites as $index => $u) {
                $i = $index + 1;
                $variables["unite_{$i}.numero"] = $u->numero_unite;
                $variables["unite_{$i}.adresse"] = $u->adresse_complete;
                $variables["unite_{$i}.titre_foncier"] = $u->titre_foncier;
                $variables["unite_{$i}.immeuble"] = $u->immeuble;
                $variables["unite_{$i}.bloc"] = $u->bloc;
                $variables["unite_{$i}.etage"] = $u->etage;
                $variables["unite_{$i}.type"] = $u->type_unite;
                $variables["unite_{$i}.superficie"] = $u->superficie_m2;
                $variables["unite_{$i}.nb_pieces"] = $u->nb_pieces;
                $variables["unite_{$i}.nb_sdb"] = $u->nb_sdb;
                $variables["unite_{$i}.description"] = $u->description_bien;
                $variables["unite_{$i}.taux_gestion_pct"] = $u->taux_gestion_pct;
            }
        }

        // === PROPRIETAIRES VARIABLES ===
        // Get all unique proprietaires from all unites
        $allProprietaires = collect();
        foreach ($mandat->unites as $u) {
            if ($u->proprietaires) {
                foreach ($u->proprietaires as $p) {
                    if (!$allProprietaires->contains('id', $p->id)) {
                        $allProprietaires->push($p);
                    }
                }
            }
        }
        
        $proprietairesCount = $allProprietaires->count();
        $variables['proprietaires.count'] = $proprietairesCount;
        
        if ($proprietairesCount > 0) {
            $variables['proprietaires.liste'] = $allProprietaires->map(function($p) {
                return $p->nom_raison ?: $p->email ?: '#'.$p->id;
            })->implode(', ');
            
            // Always generate indexed variables for each proprietaire
            foreach ($allProprietaires as $index => $p) {
                $i = $index + 1;
                
                // Get pivot data from first unite where this proprietaire appears
                $pivot = null;
                foreach ($mandat->unites as $u) {
                    $found = $u->proprietaires->firstWhere('id', $p->id);
                    if ($found) {
                        $pivot = $found->pivot;
                        break;
                    }
                }
                
                $variables["proprietaire_{$i}.nom_complet"] = $p->nom_raison;
                $variables["proprietaire_{$i}.cin"] = $p->cin;
                $variables["proprietaire_{$i}.rc"] = $p->rc;
                $variables["proprietaire_{$i}.chiffre_affaires"] = $p->chiffre_affaires;
                $variables["proprietaire_{$i}.ice"] = $p->ice;
                $variables["proprietaire_{$i}.adresse"] = $p->adresse;
                $variables["proprietaire_{$i}.telephone"] = $p->telephone;
                $variables["proprietaire_{$i}.email"] = $p->email;
                $variables["proprietaire_{$i}.type"] = $p->type_proprietaire;
                $variables["proprietaire_{$i}.representant_legal"] = $p->representant_nom;
                
                $variables["proprietaire_{$i}.part_numerateur"] = $pivot?->part_numerateur;
                $variables["proprietaire_{$i}.part_denominateur"] = $pivot?->part_denominateur;
                $variables["proprietaire_{$i}.pourcentage"] = $pivot?->pourcentage;
            }
        }

        return $variables;
    }

    public function destroy(MandatGestion $mandats_gestion)
    {
        $mandats_gestion->delete();
        return response()->json(null, 204);
    }

    public function downloadPdf(MandatGestion $mandats_gestion)
    {
        $this->middleware('permission:mandats.view');
        
        $mandat = $mandats_gestion->load(['unites.proprietaires']);
        
        $pdf = Pdf::loadView('pdf.mandat', ['mandat' => $mandat]);
        
        $filename = 'mandat_' . ($mandat->reference ?: $mandat->id) . '.pdf';
        
        return $pdf->download($filename);
    }

    public function generatePdf(Request $request, MandatGestion $mandats_gestion)
    {
        $this->middleware('permission:mandats.view');
        
        $htmlContent = $request->input('html_content');
        
        if (!$htmlContent) {
            return response()->json(['message' => 'HTML content is required'], 400);
        }

        // 1. Variable Substitution
        $mandat = $mandats_gestion->load(['unites.proprietaires']);
        $baseVars = $this->getEditorVariables($mandat);
        
        // Merge with any variables passed from frontend
        $frontendVars = $request->input('doc_variables', []);
        if (is_string($frontendVars)) {
             $frontendVars = json_decode($frontendVars, true) ?? [];
        }
        $allVars = array_merge($baseVars, $frontendVars);

        $htmlContent = preg_replace_callback('/{{\s*([^}]+)\s*}}/', function($m) use ($allVars) {
            $key = trim($m[1]);
            return array_key_exists($key, $allVars) ? ($allVars[$key] ?? '') : $m[0];
        }, $htmlContent);

        // 2. Arabic Text Processing
        // We use ArPHP to reshape Arabic glyphs for dompdf
        try {
            $arabic = new \ArPHP\I18N\Arabic('Glyphs');
            
            // Apply reshaping only to text content between tags
            $htmlContent = preg_replace_callback('/>([^<]+)</', function($matches) use ($arabic) {
                $content = $matches[1];
                
                // Find Arabic sequences (words, spaces, commas, dots, numbers) to reshape as a block
                // We include numbers so they can be positioned correctly relative to Arabic text in RTL mode
                    return '>' . preg_replace_callback('/([\p{Arabic}\p{Mn}]+(?:[\s,\.]*[\p{Arabic}\p{Mn}]+)*)/u', function($m) use ($arabic) {
                        $text = $m[1];
                        // Reshape Arabic glyphs without reversing characters
                        $reshaped = $arabic->utf8Glyphs($text);

                        // Force Latin digits (0-9) instead of Eastern Arabic numerals
                        $eastern = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
                        $latin = ['0','1','2','3','4','5','6','7','8','9'];
                        $reshaped = str_replace($eastern, $latin, $reshaped);

                        // Ensure RTL rendering for this Arabic block
                        return '<span dir="rtl">' . $reshaped . '</span>';
                    }, $content) . '<';
            }, $htmlContent);
        } catch (\Exception $e) {
            // Fallback if ArPHP fails or not installed (though we installed it)
            \Log::warning('Arabic reshaping failed: ' . $e->getMessage());
        }

        // Wrap content in basic HTML structure for PDF
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: "Tajawal", sans-serif; }
                img { max-width: 100%; }
                table { width: 100%; border-collapse: collapse; }
                td, th { border: 1px solid #ddd; padding: 8px; }
            </style>
        </head>
        <body>' . $htmlContent . '</body>
        </html>';
        
        $pdf = Pdf::loadHTML($html);
        $pdf->setOption(['isRemoteEnabled' => true]);
        
        $filename = 'mandat_' . ($mandats_gestion->reference ?: $mandats_gestion->id) . '.pdf';
        
        return $pdf->download($filename);
    }

    public function downloadDocx(MandatGestion $mandats_gestion)
    {
        $this->middleware('permission:mandats.view');
        
        $mandat = $mandats_gestion->load(['unites.proprietaires']);
        
        // Create PhpWord document
        $phpWord = new PhpWord();
        
        // Define styles
        $phpWord->addFontStyle('titleStyle', ['bold' => true, 'size' => 16, 'name' => 'Arial']);
        $phpWord->addFontStyle('headerStyle', ['bold' => true, 'size' => 13, 'name' => 'Arial', 'color' => '1F4788']);
        $phpWord->addFontStyle('subHeaderStyle', ['bold' => true, 'size' => 11, 'name' => 'Arial']);
        $phpWord->addFontStyle('normalStyle', ['size' => 11, 'name' => 'Arial']);
        $phpWord->addFontStyle('boldStyle', ['bold' => true, 'size' => 11, 'name' => 'Arial']);
        $phpWord->addParagraphStyle('centerAlign', ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER, 'spaceAfter' => 240]);
        $phpWord->addParagraphStyle('justified', ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::BOTH, 'spaceAfter' => 120]);
        $phpWord->addParagraphStyle('leftAlign', ['spaceAfter' => 120]);
        
        $section = $phpWord->addSection([
            'marginTop' => 1000,
            'marginBottom' => 1000,
            'marginLeft' => 1200,
            'marginRight' => 1200,
        ]);
        
        // Title
        $section->addText(
            'MANDAT DE GESTION',
            'titleStyle',
            'centerAlign'
        );
        
        $section->addTextBreak(1);
        
        // Reference
        if ($mandat->reference) {
            $section->addText('Référence : ' . $mandat->reference, 'headerStyle', 'centerAlign');
            $section->addTextBreak(1);
        }
        
        // Section 1: Identification du propriétaire
        $section->addText('I. IDENTIFICATION DU PROPRIÉTAIRE', 'headerStyle');
        $section->addTextBreak(1);
        
        $proprietaire = null;
        if ($mandat->unites->isNotEmpty()) {
            $unite = $mandat->unites->first();
            if ($unite->proprietaires->isNotEmpty()) {
                $proprietaire = $unite->proprietaires->first();
            }
        }

        if ($proprietaire) {
            $isSociete = !empty($proprietaire->rc) || !empty($proprietaire->ice) || $proprietaire->type_proprietaire === 'societe';
            
            if ($isSociete) {
                $section->addText('Raison sociale : ' . ($proprietaire->nom_raison ?: ''), 'normalStyle');
                if ($proprietaire->rc) {
                    $section->addText('RC : ' . $proprietaire->rc, 'normalStyle');
                }
                if ($proprietaire->ice) {
                    $section->addText('ICE : ' . $proprietaire->ice, 'normalStyle');
                }
                if ($proprietaire->ifiscale) {
                    $section->addText('IF : ' . $proprietaire->ifiscale, 'normalStyle');
                }
            } else {
                $section->addText('Nom complet : ' . ($proprietaire->nom_raison ?: ''), 'normalStyle');
                if ($proprietaire->cin) {
                    $section->addText('CIN : ' . $proprietaire->cin, 'normalStyle');
                }
            }
            
            if ($proprietaire->adresse_complete) {
                $section->addText('Adresse : ' . $proprietaire->adresse_complete, 'normalStyle');
            }
            if ($proprietaire->ville) {
                $section->addText('Ville : ' . $proprietaire->ville, 'normalStyle');
            }
            if ($proprietaire->telephone) {
                $section->addText('Téléphone : ' . $proprietaire->telephone, 'normalStyle');
            }
            if ($proprietaire->email) {
                $section->addText('Email : ' . $proprietaire->email, 'normalStyle');
            }
        } else {
            $section->addText('Aucun propriétaire identifié.', 'normalStyle');
        }
        
        $section->addTextBreak(1);
        
        // Section 2: Durée du mandat
        $section->addText('II. DURÉE DU MANDAT', 'headerStyle');
        $section->addTextBreak(1);
        
        $section->addText('Date de début : ' . date('d/m/Y', strtotime($mandat->date_debut)), 'normalStyle');
        if ($mandat->date_fin) {
            $section->addText('Date de fin : ' . date('d/m/Y', strtotime($mandat->date_fin)), 'normalStyle');
        }

        // Signatures table
        $table = $section->addTable([
            'alignment' => \PhpOffice\PhpWord\SimpleType\JcTable::CENTER,
            'width' => 100 * 50,
        ]);
        
        $table->addRow();
        $cell1 = $table->addCell(5000);
        $cell1->addText('Le Propriétaire', 'boldStyle');
        $cell1->addTextBreak(3);
        $cell1->addText($proprietaire ? ($proprietaire->nom_raison ?: '') : '', 'normalStyle');
        
        $cell2 = $table->addCell(5000);
        $cell2->addText('Le Gestionnaire', 'boldStyle');
        $cell2->addTextBreak(3);
        $cell2->addText('', 'normalStyle');
        
        // Lieu et date de signature
        if ($mandat->lieu_signature || $mandat->date_signature) {
            $section->addTextBreak(2);
            $signatureInfo = 'Fait à ';
            $signatureInfo .= $mandat->lieu_signature ?: '________________';
            $signatureInfo .= ', le ';
            $signatureInfo .= $mandat->date_signature ? date('d/m/Y', strtotime($mandat->date_signature)) : '________________';
            $section->addText($signatureInfo, 'normalStyle');
        }
        
        // Generate filename
        $filename = 'mandat_' . ($mandat->reference ?: $mandat->id) . '.docx';
        
        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'mandat_');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);
        
        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }
}
