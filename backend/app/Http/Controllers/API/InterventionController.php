<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInterventionRequest;
use App\Http\Requests\UpdateInterventionRequest;
use App\Http\Resources\InterventionResource;
use App\Models\Intervention;
use App\Services\DocumentTemplateService;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:interventions.view')->only(['index','show']);
        $this->middleware('permission:interventions.create')->only(['store']);
        $this->middleware('permission:interventions.update')->only(['update']);
        $this->middleware('permission:interventions.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Intervention::with(['bail','locataire','proprietaire','prestataire','reclamation']);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('urgence')) $query->where('urgence', $request->urgence);
        if ($request->filled('prestataire_id')) $query->where('prestataire_id', $request->prestataire_id);
        if ($request->filled('bail_id')) $query->where('bail_id', $request->bail_id);
        if ($request->filled('locataire_id')) $query->where('locataire_id', $request->locataire_id);
        if ($request->filled('proprietaire_id')) $query->where('proprietaire_id', $request->proprietaire_id);
        if ($request->filled('reclamation_id')) $query->where('reclamation_id', $request->reclamation_id);
        if ($q = $request->query('q')) {
            $query->where(function($sub) use ($q) {
                $sub->where('nature_probleme','like',"%$q%")
                    ->orWhere('localisation','like',"%$q%")
                    ->orWhere('symptomes','like',"%$q%")
                    ->orWhere('pieces_materiel','like',"%$q%")
                    ->orWhere('demandeur_nom_societe','like',"%$q%");
            });
        }
        $items = $query->latest()->paginate(25);
        return InterventionResource::collection($items);
    }

    public function store(StoreInterventionRequest $request)
    {
        $data = $request->validated();
        if (!isset($data['status'])) $data['status'] = 'ouvert';
        if (!isset($data['urgence'])) $data['urgence'] = 'normal';
        
        // Auto-remplir locataire_id depuis le bail si bail_id fourni
        if (!empty($data['bail_id']) && empty($data['locataire_id'])) {
            $bail = \App\Models\Bail::find($data['bail_id']);
            if ($bail) {
                $data['locataire_id'] = $bail->locataire_id;
            }
        }
        
        $inter = Intervention::create($data);
        return new InterventionResource($inter->load(['bail','locataire','proprietaire','prestataire','reclamation']));
    }

    public function show(Intervention $intervention)
    {
        return new InterventionResource($intervention->load(['bail','locataire','proprietaire','prestataire','reclamation']));
    }

    public function update(UpdateInterventionRequest $request, Intervention $intervention)
    {
        $intervention->update($request->validated());
        return new InterventionResource($intervention->load(['bail','locataire','proprietaire','prestataire','reclamation']));
    }

    public function destroy(Intervention $intervention)
    {
        $intervention->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function downloadDocx(Intervention $intervention, DocumentTemplateService $docService)
    {
        $intervention->load(['bail','locataire','proprietaire','prestataire','reclamation']);
        $tmpFile = $docService->generateInterventionDocx($intervention);
        $filename = "intervention_{$intervention->id}.docx";
        return response()->download($tmpFile, $filename)->deleteFileAfterSend(true);
    }
}
