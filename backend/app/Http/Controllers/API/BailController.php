<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\BailResource;
use App\Models\Bail;
use App\Models\Unite;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;

class BailController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:baux.view')->only(['index', 'show']);
        $this->middleware('permission:baux.create')->only(['store']);
        $this->middleware('permission:baux.update')->only(['update']);
        $this->middleware('permission:baux.delete')->only(['destroy']);
        $this->middleware('permission:baux.download')->only(['downloadPdf', 'downloadDocx']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Bail::with(['locataire', 'unite', 'unite.proprietaires', 'unite.activeMandats']);

        $this->applyStatusPermissions($query, 'baux');

        // Filtres optionnels
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('locataire_id')) {
            $query->where('locataire_id', $request->locataire_id);
        }

        if ($request->filled('unite_id')) {
            $query->where('unite_id', $request->unite_id);
        }

        if ($request->filled('search')) {
            $query->search($request->get('search'));
        }

        // Tri
        $sortBy = $request->query('sort_by');
        $sortDir = strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['numero_bail', 'date_debut', 'date_fin', 'montant_loyer', 'statut', 'created_at', 'updated_at'];
        
        if ($sortBy && in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('date_debut', 'desc');
        }

        $perPage = (int) $request->get('per_page', 20);
        if ($perPage <= 0) { $perPage = 20; }
        $baux = $query->paginate($perPage);

        return BailResource::collection($baux);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero_bail' => 'nullable|string|unique:baux,numero_bail',
            'locataire_id' => 'required|exists:locataires,id',
            'unite_id' => 'required|exists:unites,id',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'duree' => 'nullable|integer|min:1',
            'montant_loyer' => 'required|numeric|min:0',
            'charges' => 'nullable|numeric|min:0',
            'depot_garantie' => 'nullable|numeric|min:0',
            'mode_paiement' => ['required', Rule::in(['virement', 'cheque', 'especes'])],
            'renouvellement_auto' => 'boolean',
            'clause_particuliere' => 'nullable|string',
            'observations' => 'nullable|string',
            'statut' => ['nullable', Rule::in(['actif', 'en_attente', 'resilie'])],
            'doc_content' => 'nullable|string',
            'doc_variables' => 'nullable|array',
            'doc_template_key' => 'nullable|string',
        ]);

        // Vérifier que l'unité est disponible (statut = vacant)
        $unite = Unite::with(['activeMandats', 'proprietaires'])->findOrFail($validated['unite_id']);
        
        // Vérifier si l'unité a au moins un propriétaire
        $activeMandat = $unite->activeMandats->first();

        if (!$activeMandat) {
            // Check if there are any mandates to give a better error
            $anyMandat = $unite->mandats()->latest()->first();
            $msg = 'Impossible de créer un bail pour cette unité car elle n\'a aucun mandat actif (statuts acceptés: actif, en_attente, modifier, signe).';
            if ($anyMandat) {
                $msg .= ' Dernier mandat trouvé avec statut: ' . $anyMandat->statut;
            }
            return response()->json([
                'message' => $msg,
                'errors' => ['unite_id' => [$msg]]
            ], 422);
        }

        $proprietaires = $unite->proprietaires;
        if ($proprietaires->isEmpty()) {
            return response()->json([
                'message' => 'Impossible de créer un bail pour cette unité car elle n\'a aucun propriétaire assigné.',
                'errors' => ['unite_id' => ['L\'unité n\'a aucun propriétaire assigné.']]
            ], 422);
        }
        
        if ($unite->statut !== 'vacant') {
            return response()->json([
                'message' => 'Cette unité n\'est pas disponible. Statut actuel: ' . $unite->statut,
                'errors' => [
                    'unite_id' => ['L\'unité doit avoir le statut "vacant" pour créer un bail.']
                ]
            ], 422);
        }

        // Générer un numéro de bail si non fourni
        if (empty($validated['numero_bail'])) {
            $validated['numero_bail'] = 'BAIL-' . date('Y') . '-' . str_pad(Bail::count() + 1, 5, '0', STR_PAD_LEFT);
        }

        // Définir le statut par défaut
        if (!isset($validated['statut'])) {
            $validated['statut'] = 'en_attente';
        }

        // Transaction pour créer le bail et mettre à jour l'unité
        DB::beginTransaction();
        try {
            // Créer le bail
            $bail = Bail::create($validated);

            // Mettre à jour l'unité: statut + liens locataire/bail actuels
            $unite->update([
                'statut' => 'loue',
                'locataire_actuel_id' => $bail->locataire_id,
                'bail_actuel_id' => $bail->id,
                'date_entree_actuelle' => $bail->date_debut,
            ]);

            DB::commit();

            return new BailResource($bail->load(['locataire', 'unite']));
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erreur lors de la création du bail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $bail = Bail::with(['locataire', 'unite.proprietaires', 'unite.activeMandats'])->findOrFail($id);
        
        return new BailResource($bail);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $bail = Bail::findOrFail($id);

        $validated = $request->validate([
            'numero_bail' => 'nullable|string|unique:baux,numero_bail,' . $id,
            'locataire_id' => 'sometimes|exists:locataires,id',
            'unite_id' => 'sometimes|exists:unites,id',
            'type_bien' => ['sometimes', Rule::in(['appartement', 'bureau', 'local_commercial', 'autre'])],
            'adresse_bien' => 'sometimes|string|max:255',
            'superficie' => 'nullable|numeric|min:0',
            'etage_bloc' => 'nullable|string|max:50',
            'nombre_pieces' => 'nullable|integer|min:0',
            'nombre_sdb' => 'nullable|integer|min:0',
            'garage' => 'boolean',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'duree' => 'nullable|integer|min:1',
            'montant_loyer' => 'sometimes|numeric|min:0',
            'charges' => 'nullable|numeric|min:0',
            'depot_garantie' => 'nullable|numeric|min:0',
            'mode_paiement' => ['sometimes', Rule::in(['virement', 'cheque', 'especes'])],
            'renouvellement_auto' => 'boolean',
            'clause_particuliere' => 'nullable|string',
            'equipements' => 'nullable|array',
            'observations' => 'nullable|string',
            'statut' => ['sometimes', Rule::in(['actif', 'en_attente', 'resilie'])],
            'doc_content' => 'nullable|string',
            'doc_variables' => 'nullable|array',
            'doc_template_key' => 'nullable|string',
            'date_resiliation' => 'nullable|date',
            'resiliation_doc_content' => 'nullable|string',
            'resiliation_doc_variables' => 'nullable|array',
        ]);

        // Si le statut change à "resilie", libérer l'unité
        DB::beginTransaction();
        try {
            if (isset($validated['statut']) && $validated['statut'] === 'resilie' && $bail->statut !== 'resilie') {
                $bail->unite->update([
                    'statut' => 'vacant',
                    'locataire_actuel_id' => null,
                    'bail_actuel_id' => null,
                    'date_entree_actuelle' => null,
                ]);
            }

            $bail->update($validated);

            DB::commit();

            return new BailResource($bail->load(['locataire', 'unite']));
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du bail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $bail = Bail::findOrFail($id);

        DB::beginTransaction();
        try {
            // Libérer l'unité si le bail est actif ou en_attente relié
            if (in_array($bail->statut, ['actif','en_attente'])) {
                $bail->unite->update([
                    'statut' => 'vacant',
                    'locataire_actuel_id' => null,
                    'bail_actuel_id' => null,
                    'date_entree_actuelle' => null,
                ]);
            }

            $bail->delete();

            DB::commit();

            return response()->json([
                'message' => 'Bail supprimé avec succès'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erreur lors de la suppression du bail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download bail as PDF
     */
    public function downloadPdf(string $id)
    {
        $bail = Bail::with(['locataire', 'unite'])->findOrFail($id);
        
        $pdf = Pdf::loadView('pdf.bail', ['bail' => $bail]);
        
        $filename = 'bail_' . $bail->numero_bail . '_' . date('Ymd') . '.pdf';
        
        return $pdf->download($filename);
    }

    /**
     * Download bail as DOCX
     */
    public function downloadDocx(string $id)
    {
        $bail = Bail::with(['locataire', 'unite.proprietaires', 'unite.activeMandats'])->findOrFail($id);
        
        // Create PhpWord document
        $phpWord = new PhpWord();
        
        // Define styles
        $phpWord->addFontStyle('titleStyle', ['bold' => true, 'size' => 18, 'name' => 'Arial']);
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
            'CONTRAT DE BAIL',
            'titleStyle',
            'centerAlign'
        );
        
        $section->addTextBreak(1);
        
        // Numero de bail
        if ($bail->numero_bail) {
            $section->addText('N° ' . $bail->numero_bail, 'headerStyle', 'centerAlign');
            $section->addTextBreak(1);
        }
        
        // Section 1: Les parties
        $section->addText('ENTRE LES SOUSSIGNÉS :', 'headerStyle');
        $section->addTextBreak(1);
        
        // Bailleur (propriétaire)
        $section->addText('LE BAILLEUR :', 'subHeaderStyle');
        $proprietaires = $bail->unite && $bail->unite->activeMandat ? $bail->unite->activeMandat->proprietaires : collect([]);
        if ($proprietaires->isNotEmpty()) {
            foreach ($proprietaires as $prop) {
                $section->addText($prop->nom_raison ?: '', 'normalStyle');
                if ($prop->cin) {
                    $section->addText('CIN : ' . $prop->cin, 'normalStyle');
                }
                if ($prop->adresse_complete) {
                    $section->addText('Adresse : ' . $prop->adresse_complete, 'normalStyle');
                }
            }
        }
        
        $section->addTextBreak(1);
        
        // Preneur (locataire)
        $section->addText('LE PRENEUR :', 'subHeaderStyle');
        if ($bail->locataire) {
            $section->addText(($bail->locataire->nom ?: '') . ' ' . ($bail->locataire->prenom ?: ''), 'normalStyle');
            if ($bail->locataire->cin) {
                $section->addText('CIN : ' . $bail->locataire->cin, 'normalStyle');
            }
            if ($bail->locataire->telephone) {
                $section->addText('Téléphone : ' . $bail->locataire->telephone, 'normalStyle');
            }
            if ($bail->locataire->email) {
                $section->addText('Email : ' . $bail->locataire->email, 'normalStyle');
            }
        }
        
        $section->addTextBreak(1);
        
        // Section 2: Désignation du bien
        $section->addText('I. DÉSIGNATION DU BIEN LOUÉ', 'headerStyle');
        $section->addTextBreak(1);
        
        if ($bail->unite) {
            if ($bail->unite->numero_unite) {
                $section->addText('Unité N° : ' . $bail->unite->numero_unite, 'normalStyle');
            }
            if ($bail->unite->type_bien) {
                $section->addText('Type : ' . ucfirst($bail->unite->type_bien), 'normalStyle');
            }
            if ($bail->unite->superficie_m2) {
                $section->addText('Superficie : ' . number_format($bail->unite->superficie_m2, 2) . ' m²', 'normalStyle');
            }
            if ($bail->unite->adresse_complete) {
                $section->addText('Adresse : ' . $bail->unite->adresse_complete, 'normalStyle');
            }
            if ($bail->unite->immeuble) {
                $section->addText('Immeuble : ' . $bail->unite->immeuble, 'normalStyle');
            }
            if ($bail->unite->etage) {
                $section->addText('Étage : ' . $bail->unite->etage, 'normalStyle');
            }
        }
        
        $section->addTextBreak(1);
        
        // Section 3: Durée du bail
        $section->addText('II. DURÉE DU BAIL', 'headerStyle');
        $section->addTextBreak(1);
        
        $section->addText('Date de début : ' . date('d/m/Y', strtotime($bail->date_debut)), 'normalStyle');
        if ($bail->date_fin) {
            $section->addText('Date de fin : ' . date('d/m/Y', strtotime($bail->date_fin)), 'normalStyle');
        }
        if ($bail->duree_mois) {
            $section->addText('Durée : ' . $bail->duree_mois . ' mois', 'normalStyle');
        }
        
        $section->addTextBreak(1);
        
        // Section 4: Loyer et charges
        $section->addText('III. LOYER ET CHARGES', 'headerStyle');
        $section->addTextBreak(1);
        
        if ($bail->montant_loyer) {
            $section->addText('Loyer mensuel : ' . number_format($bail->montant_loyer, 2) . ' MAD', 'boldStyle');
        }
        if ($bail->montant_charges) {
            $section->addText('Charges mensuelles : ' . number_format($bail->montant_charges, 2) . ' MAD', 'normalStyle');
        }
        if ($bail->montant_depot_garantie) {
            $section->addText('Dépôt de garantie : ' . number_format($bail->montant_depot_garantie, 2) . ' MAD', 'normalStyle');
        }
        if ($bail->periodicite_paiement) {
            $section->addText('Périodicité de paiement : ' . ucfirst($bail->periodicite_paiement), 'normalStyle');
        }
        
        $section->addTextBreak(1);
        
        // Section 5: Usage du bien
        if ($bail->usage_prevu) {
            $section->addText('IV. USAGE DU BIEN', 'headerStyle');
            $section->addTextBreak(1);
            $section->addText('Usage prévu : ' . ucfirst($bail->usage_prevu), 'normalStyle');
            $section->addTextBreak(1);
        }
        
        // Section 6: Clauses particulières
        if ($bail->clauses_particulieres) {
            $section->addText('V. CLAUSES PARTICULIÈRES', 'headerStyle');
            $section->addTextBreak(1);
            $section->addText($bail->clauses_particulieres, 'normalStyle', 'justified');
            $section->addTextBreak(1);
        }
        
        // Section 7: Dispositions générales
        $section->addText('VI. DISPOSITIONS GÉNÉRALES', 'headerStyle');
        $section->addTextBreak(1);
        
        if ($bail->renouvellement_auto) {
            $section->addText('Renouvellement automatique : Oui', 'normalStyle');
        }
        if ($bail->indexation_loyer) {
            $section->addText('Indexation du loyer : Oui', 'normalStyle');
        }
        
        $section->addTextBreak(2);
        
        // Signature section
        $section->addText('SIGNATURES', 'headerStyle');
        $section->addTextBreak(1);
        
        // Create table for signatures
        $table = $section->addTable([
            'borderSize' => 0,
            'cellMargin' => 50,
            'width' => 100 * 50,
        ]);
        
        $table->addRow();
        $cell1 = $table->addCell(5000);
        $cell1->addText('Le Bailleur', 'boldStyle');
        $cell1->addTextBreak(3);
        $proprietaires = $bail->unite ? $bail->unite->proprietaires : collect([]);
        if ($proprietaires->isNotEmpty()) {
            $cell1->addText($proprietaires->first()->nom_raison ?: '', 'normalStyle');
        }
        
        $cell2 = $table->addCell(5000);
        $cell2->addText('Le Preneur', 'boldStyle');
        $cell2->addTextBreak(3);
        if ($bail->locataire) {
            $cell2->addText(($bail->locataire->nom ?: '') . ' ' . ($bail->locataire->prenom ?: ''), 'normalStyle');
        }
        
        // Lieu et date de signature
        if ($bail->lieu_signature || $bail->date_signature) {
            $section->addTextBreak(2);
            $signatureInfo = 'Fait à ';
            $signatureInfo .= $bail->lieu_signature ?: '________________';
            $signatureInfo .= ', le ';
            $signatureInfo .= $bail->date_signature ? date('d/m/Y', strtotime($bail->date_signature)) : date('d/m/Y');
            $section->addText($signatureInfo, 'normalStyle');
        }
        
        // Generate filename
        $filename = 'bail_' . $bail->numero_bail . '.docx';
        
        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'bail_');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);
        
        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Provide default editor template and variable list for a bail.
     */
    public function editorTemplate(Bail $bail, \App\Services\DocumentTemplateService $tpl)
    {
        $baseTemplate = <<<'EOT'
<div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2 style="text-align: center; text-decoration: underline;">Fiche des Baux – Locataire et Biens</h2>
    
    <h3>1. Informations générales du bail</h3>
    <p><strong>• N° de bail :</strong> {{bail.numero}}</p>
    <p><strong>• Type de bien :</strong> {{unite.type}}</p>
    <p><strong>• Adresse du bien :</strong> {{unite.adresse}}</p>
    <p><strong>• Superficie :</strong> {{unite.superficie}} m²</p>
    <p><strong>• Étage / Bloc :</strong> {{unite.etage}} / {{unite.bloc}}</p>
    <p><strong>• Nombre de pièces :</strong> {{unite.nb_pieces}}</p>
    <p><strong>• Nombre SDB :</strong> {{unite.nb_sdb}}</p>
    <p><strong>• Garage :</strong> Oui ☐ Non ☐</p>

    <h3>2. Informations sur le locataire</h3>
    <p><strong>• Nom & Prénom / Raison sociale :</strong> {{locataire.nom_complet}}</p>
    <p><strong>• Type de locataire :</strong> {{locataire.type}}</p>
    <p><strong>• CIN / Identifiant fiscal :</strong> {{locataire.cin}}</p>
    <p><strong>• Contact :</strong> Tél {{locataire.telephone}} Mail {{locataire.email}}</p>
    <p><strong>• Date de naissance / Création de l’entreprise :</strong> {{locataire.date_naissance}}</p>
    <p><strong>• Représentant légal (si entreprise) :</strong> _______________________________________________________</p>

    <h3>3. Détails du bail</h3>
    <p><strong>• Date de début :</strong> {{bail.date_debut}}</p>
    <p><strong>• Date de fin :</strong> {{bail.date_fin}}</p>
    <p><strong>• Durée :</strong> {{bail.duree}} mois</p>
    <p><strong>• Montant du loyer :</strong> {{bail.montant_loyer}} MAD / mois</p>
    <p><strong>• Charges :</strong> {{bail.charges}} MAD / mois</p>
    <p><strong>• Dépôt de garantie :</strong> {{bail.depot_garantie}} MAD</p>
    <p><strong>• Mode de paiement :</strong> {{bail.mode_paiement}}</p>
    <p><strong>• Renouvellement automatique :</strong> {{bail.renouvellement_auto}}</p>
    <p><strong>• Clause particulière :</strong> {{bail.clause_particuliere}}</p>

    <h3>4. Équipements et mobilier (si applicable)</h3>
    <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="background-color: #f2f2f2;">
                <th style="width: 30%;">Équipement / Mobilier</th>
                <th style="width: 15%;">Présent</th>
                <th style="width: 15%;">Quantité</th>
                <th style="width: 20%;">État initial</th>
                <th style="width: 20%;">Observations</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Réfrigérateur</td>
                <td>☐ Oui ☐ Non</td>
                <td></td>
                <td>Bon ☐ Moyen ☐ Mauvais ☐</td>
                <td></td>
            </tr>
            <tr>
                <td>Cuisinière</td>
                <td>☐ Oui ☐ Non</td>
                <td></td>
                <td>Bon ☐ Moyen ☐ Mauvais ☐</td>
                <td></td>
            </tr>
            <tr>
                <td>Climatisation</td>
                <td>☐ Oui ☐ Non</td>
                <td></td>
                <td>Bon ☐ Moyen ☐ Mauvais ☐</td>
                <td></td>
            </tr>
            <tr>
                <td>Chauffe-eau</td>
                <td>☐ Oui ☐ Non</td>
                <td></td>
                <td>Bon ☐ Moyen ☐ Mauvais ☐</td>
                <td></td>
            </tr>
            <tr>
                <td>Luminaires</td>
                <td>☐ Oui ☐ Non</td>
                <td></td>
                <td>Bon ☐ Moyen ☐ Mauvais ☐</td>
                <td></td>
            </tr>
            <tr>
                <td>Mobilier de salon</td>
                <td>☐ Oui ☐ Non</td>
                <td></td>
                <td>Bon ☐ Moyen ☐ Mauvais ☐</td>
                <td></td>
            </tr>
            <tr>
                <td>Mobilier de chambre</td>
                <td>☐ Oui ☐ Non</td>
                <td></td>
                <td>Bon ☐ Moyen ☐ Mauvais ☐</td>
                <td></td>
            </tr>
            <tr>
                <td>Autres (préciser)</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <h3>5. Observations générales / Notes</h3>
    <p>{{bail.observations}}</p>
    <p>______________________________________________________________________________________________________________________</p>
    <p>______________________________________________________________________________________________________________________</p>
</div>
EOT;

        $bail->load(['unite.proprietaires', 'unite.activeMandats', 'locataire']);
        $variables = $this->getEditorVariables($bail);

        return response()->json([
            'template' => $baseTemplate,
            'variables' => $variables,
            'current' => [
                'doc_content' => $bail->doc_content,
                'doc_variables' => $bail->doc_variables,
                'doc_template_key' => $bail->doc_template_key,
            ]
        ]);
    }

    /**
     * Render a preview of editor content with variable interpolation.
     */
    public function resiliationTemplate(Bail $bail)
    {
        $baseTemplate = <<<'EOT'
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
    <h2 style="text-align: center; text-decoration: underline; margin-bottom: 30px;">ACTE DE RÉSILIATION DE CONTRAT DE BAIL</h2>
    
    <p><strong>Entre les soussignés :</strong></p>
    
    <p><strong>Le Bailleur (Propriétaire)</strong></p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li><strong>Nom/raison sociale :</strong> {{proprietaire.nom_complet}}</li>
        <li><strong>Adresse :</strong> {{proprietaire.adresse}}</li>
        <li><strong>CIN/RC :</strong> {{proprietaire.cin_rc}}</li>
        <li><strong>Téléphone/E-mail :</strong> {{proprietaire.contact}}</li>
    </ul>
    
    <p><strong>Et</strong></p>
    
    <p><strong>Le Locataire</strong></p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li><strong>Nom/raison sociale :</strong> {{locataire.nom_complet}}</li>
        <li><strong>Adresse :</strong> {{locataire.adresse}}</li>
        <li><strong>CIN/RC :</strong> {{locataire.cin_rc}}</li>
        <li><strong>Téléphone/E-mail :</strong> {{locataire.contact}}</li>
    </ul>
    
    <hr style="margin: 20px 0;">
    
    <h3>Préambule</h3>
    <p>En date du {{bail.date_debut}}, les parties ont conclu un contrat de bail concernant le bien immobilier sis à :</p>
    <p><strong>{{unite.adresse}}</strong></p>
    <p>Le présent acte a pour objet de constater la résiliation dudit bail conformément aux dispositions légales et contractuelles, ainsi qu’aux accords convenus entre les deux parties.</p>
    
    <hr style="margin: 20px 0;">
    
    <h3>Article 1 – Objet de la résiliation</h3>
    <p>Le bail consenti le {{bail.date_debut}} est résilié à compter du {{bail.date_resiliation}}</p>
    <p>Le locataire libérera les lieux loués et restituera les clés au bailleur à cette date.</p>
    <p>En cas de retard, le locataire sera amené à payer un montant forfaitaire de 500 dirhams par jour de retard.</p>
    
    <h3>Article 2 – État des lieux de sortie</h3>
    <p>Un état des lieux de sortie contradictoire sera établi entre les parties le {{bail.date_resiliation}}</p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li>Si l’état des lieux révèle une conformité avec l’état initial, le bailleur restituera le dépôt de garantie conformément à l’article 3.</li>
        <li>En cas de dégradations ou réparations locatives à la charge du locataire, une retenue sera opérée sur le dépôt de garantie, ou facturée au locataire si insuffisant.</li>
    </ul>
    
    <h3>Article 3 – Dépôt de garantie</h3>
    <p>Le bailleur reconnaît avoir reçu du locataire la somme de {{bail.depot_garantie}} MAD à titre de dépôt de garantie lors de la signature du bail.</p>
    <p>Cette somme sera restituée au locataire dans un délai de 30 jours, sauf autre accord à compter de la restitution des lieux, sous réserve de déductions éventuelles pour :</p>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li>loyers et charges impayés,</li>
        <li>réparations locatives ou remises en état,</li>
        <li>pénalités éventuelles convenues au bail.</li>
    </ul>
    
    <h3>Article 4 – Obligations du locataire</h3>
    <p>Jusqu’à la date effective de résiliation, le locataire s’engage à :</p>
    <ol style="margin-left: 20px;">
        <li>Payer les loyers et charges dus,</li>
        <li>Maintenir les lieux en bon état d’entretien courant,</li>
        <li>Régler toutes factures d’eau, d’électricité, de syndic ou autres charges récupérables,</li>
        <li>Restituer toutes les clés, badges et télécommandes remis par le bailleur.</li>
    </ol>
    
    <h3>Article 5 – Libération réciproque</h3>
    <p>Après restitution des lieux et apurement des comptes, les parties déclarent être libres de toute obligation réciproque au titre du bail initial.</p>
    
    <h3>Article 6 – Frais de timbres et d’enregistrement</h3>
    <p>Les frais de timbres et d’enregistrement sont à la charge de l’ex-locataire.</p>
    
    <h3>Article 7 – Notifications</h3>
    <p>Toutes notifications entre les parties relatives à la présente résiliation devront être faites par lettre recommandée avec accusé de réception ou remise en main propre contre décharge.</p>
    
    <h3>Article 8 – Dispositions diverses</h3>
    <ul style="list-style-type: disc; margin-left: 20px;">
        <li>Le présent acte annule et remplace toutes correspondances ou accords antérieurs concernant la résiliation du bail.</li>
        <li>Chaque partie reconnaît avoir reçu un exemplaire original signé du présent acte.</li>
    </ul>
    
    <hr style="margin: 20px 0;">
    
    <p>Fait à <strong>Casablanca</strong>, le {{date_jour}}</p>
    <p>En deux exemplaires originaux, dont un remis à chaque partie.</p>
    
    <table style="width: 100%; margin-top: 30px;">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <strong>Le Bailleur</strong><br>
                Nom et signature (et cachet le cas échéant)
            </td>
            <td style="width: 50%; vertical-align: top;">
                <strong>Le Locataire</strong><br>
                Nom et signature
            </td>
        </tr>
    </table>
</div>
EOT;

        $unite = $bail->unite;
        $locataire = $bail->locataire;
        $proprietaire = $unite->proprietaires->first();
        
        $variables = [
            'proprietaire.nom_complet' => $proprietaire ? $proprietaire->nom_complet : 'TGI',
            'proprietaire.adresse' => $proprietaire ? $proprietaire->adresse : '',
            'proprietaire.cin_rc' => $proprietaire ? ($proprietaire->rc ?: $proprietaire->cin) : '',
            'proprietaire.contact' => $proprietaire ? ($proprietaire->telephone . ' / ' . $proprietaire->email) : '',
            
            'locataire.nom_complet' => $locataire->nom_complet,
            'locataire.adresse' => $locataire->adresse_legale ?: $unite->adresse_complete,
            'locataire.cin_rc' => $locataire->cin ?: $locataire->rc,
            'locataire.contact' => $locataire->telephone . ' / ' . $locataire->email,
            
            'bail.date_debut' => $bail->date_debut ? $bail->date_debut->format('d/m/Y') : '',
            'bail.date_resiliation' => $bail->date_resiliation ? $bail->date_resiliation->format('d/m/Y') : '.../.../....',
            'bail.depot_garantie' => number_format($bail->depot_garantie, 2),
            
            'unite.adresse' => $unite->adresse_complete,
            
            'date_jour' => date('d/m/Y'),
        ];

        return response()->json([
            'template' => $baseTemplate,
            'variables' => $variables,
            'template_key' => 'resiliation_default'
        ]);
    }

    public function renderResiliationPreview(Request $request, Bail $bail)
    {
        $content = $request->input('content');
        $variables = $request->input('variables', []);

        foreach ($variables as $key => $value) {
            $content = str_replace('{{' . $key . '}}', $value ?? '', $content);
            $content = str_replace('{{ ' . $key . ' }}', $value ?? '', $content);
        }

        return response()->json(['html' => $content]);
    }

    public function renderPreview(Request $request, Bail $bail)
    {
        $data = $request->validate([
            'content' => 'required|string',
            'variables' => 'nullable|array'
        ]);

        $bail->load(['unite.proprietaires', 'unite.activeMandats', 'locataire']);
        $baseVars = $this->getEditorVariables($bail);
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
     */
    private function getEditorVariables(Bail $bail): array
    {
        $unite = $bail->unite;
        $proprietaire = $unite ? $unite->proprietaires->first() : null;
        $locataire = $bail->locataire;
        
        // Fetch agency settings
        $agencyCapital = \App\Models\Setting::where('key', 'agency_capital')->value('value') ?? '100.000,00';

        $variables = [
            // Agency variables
            'agence.capital' => $agencyCapital,

            // Bail variables
            'bail.numero' => $bail->numero_bail,
            'bail.date_debut' => $bail->date_debut?->toDateString(),
            'bail.date_fin' => $bail->date_fin?->toDateString(),
            'bail.duree' => $bail->duree,
            'bail.montant_loyer' => $bail->montant_loyer,
            'bail.charges' => $bail->charges,
            'bail.depot_garantie' => $bail->depot_garantie,
            'bail.mode_paiement' => $bail->mode_paiement,
            'bail.clause_particuliere' => $bail->clause_particuliere,
            'bail.observations' => $bail->observations,

            // Unite variables
            'unite.id' => $unite?->id,
            'unite.numero' => $unite?->numero_unite,
            'unite.adresse' => $unite?->adresse_complete,
            'unite.titre_foncier' => $unite?->titre_foncier,
            'unite.type' => $unite?->type_unite,
            'unite.superficie' => $unite?->superficie_m2,
            'unite.nb_pieces' => $unite?->nb_pieces,
            'unite.nb_sdb' => $unite?->nb_sdb,
            'unite.etage' => $unite?->etage,
            'unite.bloc' => $unite?->bloc,

            // Proprietaire variables
            'proprietaire.nom_complet' => $proprietaire ? $proprietaire->nom_complet : '',
            'proprietaire.cin' => $proprietaire ? $proprietaire->cin_rc : '',
            'proprietaire.adresse' => $proprietaire ? $proprietaire->adresse : '',
            
            // Locataire variables
            'locataire.nom_complet' => $locataire ? ($locataire->nom . ' ' . $locataire->prenom) : '',
            'locataire.type' => $locataire ? $locataire->type_locataire : '',
            'locataire.cin' => $locataire ? $locataire->cin_rc : '',
            'locataire.adresse' => $locataire ? $locataire->adresse : '',
            'locataire.telephone' => $locataire ? $locataire->telephone : '',
            'locataire.email' => $locataire ? $locataire->email : '',
            'locataire.date_naissance' => $locataire ? $locataire->date_naissance : '',
        ];

        return $variables;
    }
}
