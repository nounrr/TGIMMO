<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MandatGestion;
use App\Services\DocumentTemplateService;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;

class MandatGestionController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:mandats.view')->only(['index', 'show']);
        $this->middleware('permission:mandats.create')->only(['store']);
        $this->middleware('permission:mandats.update')->only(['update']);
        $this->middleware('permission:mandats.delete')->only(['destroy']);
        $this->middleware('permission:mandats.download')->only(['downloadDocx']);
    }

    public function index(Request $request)
    {
        $query = MandatGestion::query()->with(['proprietaire']);

        $this->applyStatusPermissions($query, 'mandats');

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('lieu_signature', 'like', "%{$search}%");
            });
        }

        if ($proprietaireId = $request->query('proprietaire_id')) {
            $query->where('proprietaire_id', $proprietaireId);
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        if ($from = $request->query('date_debut_from')) {
            $query->whereDate('date_debut', '>=', $from);
        }
        if ($to = $request->query('date_debut_to')) {
            $query->whereDate('date_debut', '<=', $to);
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $query->paginate($perPage);

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request, true);
        // Always set the creator from the authenticated user
        $data['created_by'] = $request->user()->id;
        $mandat = MandatGestion::create($data);
        return response()->json($mandat->load('proprietaire'), 201);
    }

    public function show(MandatGestion $mandats_gestion)
    {
        // Route model binding will inject the record when using apiResource with parameter name
        return response()->json($mandats_gestion->load('proprietaire'));
    }

    public function update(Request $request, MandatGestion $mandats_gestion)
    {
        $data = $this->validatedData($request, false, $mandats_gestion->id);
        $mandats_gestion->update($data);
        return response()->json($mandats_gestion->load('proprietaire'));
    }

    public function destroy(MandatGestion $mandats_gestion)
    {
        $mandats_gestion->delete();
        return response()->json(null, 204);
    }

    public function downloadDocx(MandatGestion $mandats_gestion)
    {
        $this->middleware('permission:mandats.view');
        
        $mandat = $mandats_gestion->load('proprietaire');
        
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
        
        $proprietaire = $mandat->proprietaire;
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
        
        $section->addTextBreak(1);
        
        // Section 2: Durée du mandat
        $section->addText('II. DURÉE DU MANDAT', 'headerStyle');
        $section->addTextBreak(1);
        
        $section->addText('Date de début : ' . date('d/m/Y', strtotime($mandat->date_debut)), 'normalStyle');
        if ($mandat->date_fin) {
            $section->addText('Date de fin : ' . date('d/m/Y', strtotime($mandat->date_fin)), 'normalStyle');
        }
        
        $section->addTextBreak(1);
        
        // Section 3: Honoraires
        $section->addText('III. HONORAIRES DE GESTION', 'headerStyle');
        $section->addTextBreak(1);
        
        if ($mandat->taux_gestion_pct) {
            $section->addText('Taux de gestion : ' . $mandat->taux_gestion_pct . ' %', 'normalStyle');
        }
        $section->addText('Assiette des honoraires : ' . ucfirst(str_replace('_', ' ', $mandat->assiette_honoraires)), 'normalStyle');
        
        if ($mandat->frais_min_mensuel) {
            $section->addText('Frais minimum mensuel : ' . number_format($mandat->frais_min_mensuel, 2) . ' MAD', 'normalStyle');
        }
        
        if ($mandat->tva_applicable) {
            $section->addText('TVA applicable : Oui (' . ($mandat->tva_taux ?: '20') . ' %)', 'normalStyle');
        }
        
        if ($mandat->periodicite_releve) {
            $section->addText('Périodicité des relevés : ' . ucfirst($mandat->periodicite_releve), 'normalStyle');
        }
        
        $section->addTextBreak(1);
        
        // Section 4: Description du bien
        if ($mandat->description_bien) {
            $section->addText('IV. DESCRIPTION DU BIEN', 'headerStyle');
            $section->addTextBreak(1);
            
            $section->addText($mandat->description_bien, 'normalStyle', 'justified');
            
            if ($mandat->usage_bien) {
                $section->addText('Usage : ' . ucfirst($mandat->usage_bien), 'normalStyle');
            }
            
            $section->addTextBreak(1);
        }
        
        // Section 5: Pouvoirs accordés
        if ($mandat->pouvoirs_accordes) {
            $section->addText('V. POUVOIRS ACCORDÉS AU GESTIONNAIRE', 'headerStyle');
            $section->addTextBreak(1);
            
            $section->addText($mandat->pouvoirs_accordes, 'normalStyle', 'justified');
            
            $section->addTextBreak(1);
        }
        
        // Section 6: Autres dispositions
        $section->addText('VI. AUTRES DISPOSITIONS', 'headerStyle');
        $section->addTextBreak(1);
        
        if ($mandat->charge_maintenance) {
            $section->addText('Charge de maintenance : ' . ucfirst(str_replace('_', ' ', $mandat->charge_maintenance)), 'normalStyle');
        }
        if ($mandat->mode_versement) {
            $section->addText('Mode de versement : ' . ucfirst($mandat->mode_versement), 'normalStyle');
        }
        
        if ($mandat->notes_clauses) {
            $section->addTextBreak(1);
            $section->addText('Notes et clauses particulières :', 'subHeaderStyle');
            $section->addText($mandat->notes_clauses, 'normalStyle', 'justified');
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
        $cell1->addText('Le Propriétaire', 'boldStyle');
        $cell1->addTextBreak(3);
        $cell1->addText($proprietaire->nom_raison ?: '', 'normalStyle');
        
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

    private function validatedData(Request $request, bool $creating, ?int $id = null): array
    {
        $uniqueRef = 'unique:mandats_gestion,reference';
        if (!$creating && $id) {
            $uniqueRef = 'unique:mandats_gestion,reference,' . $id;
        }

        return $request->validate([
            'proprietaire_id'    => ['required', 'exists:proprietaires,id'],
            'reference'          => ['nullable', 'string', 'max:80', $uniqueRef],
            'date_debut'         => ['required', 'date'],
            'date_fin'           => ['nullable', 'date', 'after_or_equal:date_debut'],
            'taux_gestion_pct'   => ['nullable', 'numeric', 'between:0,100'],
            'assiette_honoraires'=> ['required', 'in:loyers_encaisse,loyers_factures'],
            'tva_applicable'     => ['nullable', 'boolean'],
            'tva_taux'           => ['nullable', 'numeric', 'between:0,100'],
            'frais_min_mensuel'  => ['nullable', 'numeric'],
            'periodicite_releve' => ['nullable', 'in:mensuel,trimestriel,annuel'],
            'charge_maintenance' => ['nullable', 'in:proprietaire,gestionnaire,locataire,mixte'],
            'mode_versement'     => ['nullable', 'in:virement,cheque,especes,prelevement'],
            'description_bien'   => ['nullable', 'string'],
            'usage_bien'         => ['nullable', 'in:habitation,commercial,professionnel,autre'],
            'pouvoirs_accordes'  => ['nullable', 'string'],
            'lieu_signature'     => ['nullable', 'string', 'max:120'],
            'date_signature'     => ['nullable', 'date'],
            'langue'             => ['nullable', 'in:ar,fr,ar_fr'],
            'notes_clauses'      => ['nullable', 'string'],
            'statut'             => ['nullable', 'in:brouillon,en_validation,signe,actif,resilie'],
        ]);
    }
}
