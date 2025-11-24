<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\DevisResource;
use App\Models\Devis;
use App\Services\DocumentTemplateService;
use Illuminate\Http\Request;

class DevisController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:devis.view')->only(['index','show']);
        $this->middleware('permission:devis.create')->only(['store']);
        $this->middleware('permission:devis.update')->only(['update']);
        $this->middleware('permission:devis.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $q = Devis::with(['prestataire']);
        if ($request->filled('intervention_id')) $q->where('intervention_id', $request->intervention_id);
        if ($request->filled('prestataire_id')) $q->where('prestataire_id', $request->prestataire_id);
        if ($request->filled('status')) $q->where('status', $request->status);
        return DevisResource::collection($q->latest()->paginate(25));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'intervention_id' => ['required','exists:interventions,id'],
            'prestataire_id' => ['nullable','exists:prestataires,id'],
            'numero' => ['nullable','string','max:100'],
            'date_proposition' => ['nullable','date'],
            'montant_ht' => ['required','numeric','min:0'],
            'tva' => ['nullable','numeric','min:0'],
            'total_ttc' => ['nullable','numeric','min:0'],
            'valid_until' => ['nullable','date'],
            'status' => ['nullable','in:propose,accepte,refuse'],
        ]);
        if (!isset($data['total_ttc'])) {
            $data['total_ttc'] = round(($data['montant_ht'] ?? 0) * (1 + (($data['tva'] ?? 0)/100)), 2);
        }
        $devis = Devis::create($data);
        return new DevisResource($devis->load(['prestataire']));
    }

    public function show(Devis $devi)
    {
        return new DevisResource($devi->load(['prestataire','documents']));
    }

    public function update(Request $request, Devis $devi)
    {
        $data = $request->validate([
            'prestataire_id' => ['sometimes','nullable','exists:prestataires,id'],
            'numero' => ['sometimes','nullable','string','max:100'],
            'date_proposition' => ['sometimes','nullable','date'],
            'montant_ht' => ['sometimes','numeric','min:0'],
            'tva' => ['sometimes','numeric','min:0'],
            'total_ttc' => ['sometimes','numeric','min:0'],
            'valid_until' => ['sometimes','nullable','date'],
            'status' => ['sometimes','in:propose,accepte,refuse'],
        ]);
        $devi->update($data);
        return new DevisResource($devi->load(['prestataire','documents']));
    }

    public function destroy(Devis $devi)
    {
        $devi->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function downloadDocx(Devis $devi, DocumentTemplateService $docService)
    {
        $devi->load(['prestataire','intervention']);
        $tmpFile = $docService->generateDevisDocx($devi);
        $numero = $devi->numero ?? $devi->id;
        $filename = "devis_{$numero}.docx";
        return response()->download($tmpFile, $filename)->deleteFileAfterSend(true);
    }
}
