<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\FactureResource;
use App\Models\Facture;
use App\Services\DocumentTemplateService;
use Illuminate\Http\Request;

class FactureController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:factures.view')->only(['index','show']);
        $this->middleware('permission:factures.create')->only(['store']);
        $this->middleware('permission:factures.update')->only(['update']);
        $this->middleware('permission:factures.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $q = Facture::with(['prestataire']);
        if ($request->filled('intervention_id')) $q->where('intervention_id', $request->intervention_id);
        if ($request->filled('prestataire_id')) $q->where('prestataire_id', $request->prestataire_id);
        if ($request->filled('status')) $q->where('status', $request->status);
        if ($request->filled('date_from')) $q->where('date', '>=', $request->date_from);
        if ($request->filled('date_to')) $q->where('date', '<=', $request->date_to);
        return FactureResource::collection($q->latest()->paginate(25));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'intervention_id' => ['nullable','exists:interventions,id'],
            'prestataire_id' => ['nullable','exists:prestataires,id'],
            'numero' => ['nullable','string','max:100'],
            'date' => ['nullable','date'],
            'due_date' => ['nullable','date'],
            'montant_ht' => ['required','numeric','min:0'],
            'tva' => ['nullable','numeric','min:0'],
            'total_ttc' => ['nullable','numeric','min:0'],
            'status' => ['nullable','in:brouillon,emise,payee,annulee'],
            'paid_at' => ['nullable','date'],
        ]);
        if (!isset($data['total_ttc'])) {
            $data['total_ttc'] = round(($data['montant_ht'] ?? 0) * (1 + (($data['tva'] ?? 0)/100)), 2);
        }
        $facture = Facture::create($data);
        return new FactureResource($facture->load(['prestataire']));
    }

    public function show(Facture $facture)
    {
        return new FactureResource($facture->load(['prestataire','documents']));
    }

    public function update(Request $request, Facture $facture)
    {
        $data = $request->validate([
            'prestataire_id' => ['sometimes','nullable','exists:prestataires,id'],
            'numero' => ['sometimes','nullable','string','max:100'],
            'date' => ['sometimes','nullable','date'],
            'due_date' => ['sometimes','nullable','date'],
            'montant_ht' => ['sometimes','numeric','min:0'],
            'tva' => ['sometimes','numeric','min:0'],
            'total_ttc' => ['sometimes','numeric','min:0'],
            'status' => ['sometimes','in:brouillon,emise,payee,annulee'],
            'paid_at' => ['sometimes','nullable','date'],
        ]);
        $facture->update($data);
        return new FactureResource($facture->load(['prestataire','documents']));
    }

    public function destroy(Facture $facture)
    {
        $facture->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function downloadDocx(Facture $facture, DocumentTemplateService $docService)
    {
        $facture->load(['prestataire','intervention']);
        $tmpFile = $docService->generateFactureDocx($facture);
        $numero = $facture->numero ?? $facture->id;
        $filename = "facture_{$numero}.docx";
        return response()->download($tmpFile, $filename)->deleteFileAfterSend(true);
    }
}
