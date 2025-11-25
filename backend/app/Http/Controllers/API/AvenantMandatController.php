<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AvenantMandat;
use App\Services\DocumentTemplateService;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;

class AvenantMandatController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:avenants.view')->only(['index', 'show']);
        $this->middleware('permission:avenants.create')->only(['store']);
        $this->middleware('permission:avenants.update')->only(['update']);
        $this->middleware('permission:avenants.delete')->only(['destroy']);
        $this->middleware('permission:avenants.download')->only(['downloadDocx']);
    }

    public function index(Request $request)
    {
        $query = AvenantMandat::query()->with(['mandat.proprietaire', 'signataireInterne']);

        $this->applyStatusPermissions($query, 'avenants');

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('objet_resume', 'like', "%{$search}%")
                  ->orWhere('lieu_signature', 'like', "%{$search}%");
            });
        }

        if ($mandatId = $request->query('mandat_id')) {
            $query->where('mandat_id', $mandatId);
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        if ($from = $request->query('date_effet_from')) {
            $query->whereDate('date_effet', '>=', $from);
        }
        if ($to = $request->query('date_effet_to')) {
            $query->whereDate('date_effet', '<=', $to);
        }

        if ($sortBy = $request->query('sort_by')) {
            $direction = $request->query('order', 'asc');
            // Security check to prevent SQL injection via column names
            if (in_array($sortBy, ['created_at', 'updated_at', 'reference', 'objet_resume', 'date_effet'])) {
                $query->orderBy($sortBy, $direction);
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $query->paginate($perPage);
        return response()->json($result);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request, true);
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('avenants', 'public');
            $data['fichier_url'] = Storage::disk('public')->url($path);
        }

        $avenant = AvenantMandat::create($data);
        return response()->json($avenant->load(['mandat.proprietaire', 'signataireInterne']), 201);
    }

    public function show(AvenantMandat $avenants_mandat)
    {
        return response()->json($avenants_mandat->load(['mandat.proprietaire', 'signataireInterne']));
    }

    public function update(Request $request, AvenantMandat $avenants_mandat)
    {
        $data = $this->validatedData($request, false, $avenants_mandat->id);

        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('avenants', 'public');
            $data['fichier_url'] = Storage::disk('public')->url($path);
        }

        $avenants_mandat->update($data);
        return response()->json($avenants_mandat->load(['mandat.proprietaire', 'signataireInterne']));
    }

    public function destroy(AvenantMandat $avenants_mandat)
    {
        $avenants_mandat->delete();
        return response()->json(null, 204);
    }

    public function downloadDocx(AvenantMandat $avenants_mandat)
    {
        $this->middleware('permission:avenants.view');
        
        $avenant = $avenants_mandat->load(['mandat.proprietaire', 'signataireInterne']);
        $templateService = new DocumentTemplateService();
        
        // Get avenant template
        $templateText = $templateService->getAvenantTemplate();
        
        // Create PhpWord document
        $phpWord = new PhpWord();
        
        // Define styles
        $phpWord->addFontStyle('titleStyle', ['bold' => true, 'size' => 16, 'name' => 'Arial']);
        $phpWord->addFontStyle('headerStyle', ['bold' => true, 'size' => 12, 'name' => 'Arial']);
        $phpWord->addFontStyle('normalStyle', ['size' => 11, 'name' => 'Arial']);
        $phpWord->addParagraphStyle('centerAlign', ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER, 'spaceAfter' => 240]);
        $phpWord->addParagraphStyle('justified', ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::BOTH, 'spaceAfter' => 120]);
        
        $section = $phpWord->addSection([
            'marginTop' => 1000,
            'marginBottom' => 1000,
            'marginLeft' => 1200,
            'marginRight' => 1200,
        ]);
        
        // Title
        $section->addText(
            'AVENANT AU MANDAT DE GESTION',
            'titleStyle',
            'centerAlign'
        );
        
        $section->addTextBreak(1);
        
        // Reference and date
        if ($avenant->reference) {
            $section->addText('Référence : ' . $avenant->reference, 'headerStyle');
        }
        if ($avenant->date_effet) {
            $section->addText('Date d\'effet : ' . date('d/m/Y', strtotime($avenant->date_effet)), 'normalStyle');
        }
        
        $section->addTextBreak(1);
        
        // Mandat parent info
        $section->addText('MANDAT PARENT', 'headerStyle');
        $section->addText('Référence du mandat : ' . ($avenant->mandat->reference ?: 'N°' . $avenant->mandat->id), 'normalStyle');
        if ($avenant->mandat->proprietaire) {
            $section->addText('Propriétaire : ' . $avenant->mandat->proprietaire->nom_raison, 'normalStyle');
        }
        
        $section->addTextBreak(1);
        
        // Objet
        if ($avenant->objet_resume) {
            $section->addText('OBJET', 'headerStyle');
            $section->addText($avenant->objet_resume, 'normalStyle', 'justified');
            $section->addTextBreak(1);
        }
        
        // Date pouvoir initial
        if ($avenant->date_pouvoir_initial) {
            $section->addText('Date du pouvoir initial : ' . date('d/m/Y', strtotime($avenant->date_pouvoir_initial)), 'normalStyle');
            $section->addTextBreak(1);
        }
        
        // Modifications
        if ($avenant->modifs_text) {
            $section->addText('MODIFICATIONS APPORTÉES', 'headerStyle');
            $section->addTextBreak(1);
            
            // Split by paragraphs and add each one
            $paragraphs = explode("\n\n", $avenant->modifs_text);
            foreach ($paragraphs as $para) {
                if (trim($para)) {
                    $section->addText(trim($para), 'normalStyle', 'justified');
                    $section->addTextBreak(1);
                }
            }
        }
        
        // Signature section
        $section->addTextBreak(2);
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
        $cell1->addText('Le Propriétaire', 'normalStyle');
        $cell1->addTextBreak(3);
        $cell1->addText($avenant->mandat->proprietaire->nom_raison ?? '', 'normalStyle');
        
        $cell2 = $table->addCell(5000);
        $cell2->addText('Le Gestionnaire', 'normalStyle');
        $cell2->addTextBreak(3);
        $cell2->addText($avenant->signataireInterne->name ?? '', 'normalStyle');
        
        // Lieu et date de signature
        if ($avenant->lieu_signature || $avenant->date_signature) {
            $section->addTextBreak(2);
            $signatureInfo = 'Fait à ';
            $signatureInfo .= $avenant->lieu_signature ?: '________________';
            $signatureInfo .= ', le ';
            $signatureInfo .= $avenant->date_signature ? date('d/m/Y', strtotime($avenant->date_signature)) : '________________';
            $section->addText($signatureInfo, 'normalStyle');
        }
        
        // Generate filename
        $filename = 'avenant_' . ($avenant->reference ?: $avenant->id) . '.docx';
        
        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'avenant_');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);
        
        return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
    }

    private function validatedData(Request $request, bool $creating, ?int $id = null): array
    {
        $uniqueRef = 'unique:avenants_mandat,reference';
        if (!$creating && $id) {
            $uniqueRef = 'unique:avenants_mandat,reference,' . $id;
        }

        return $request->validate([
            'mandat_id'            => ['required', 'exists:mandats_gestion,id'],
            'reference'            => ['nullable', 'string', 'max:80', $uniqueRef],
            'date_pouvoir_initial' => ['nullable', 'date'],
            'objet_resume'         => ['nullable', 'string', 'max:255'],
            'modifs_text'          => ['nullable', 'string'],
            'date_effet'           => ['required', 'date'],
            'lieu_signature'       => ['nullable', 'string', 'max:120'],
            'date_signature'       => ['nullable', 'date'],
            'rep_b_user_id'        => ['required', 'exists:users,id'],
            'statut'               => ['nullable', 'in:brouillon,signe,actif,annule'],
            'fichier'              => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);
    }
}
