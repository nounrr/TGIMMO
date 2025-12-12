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
        $this->middleware('permission:interventions.view')->only(['index','show','getNatures']);
        $this->middleware('permission:interventions.create')->only(['store']);
        $this->middleware('permission:interventions.update')->only(['update']);
        $this->middleware('permission:interventions.delete')->only(['destroy']);
    }

    public function getNatures()
    {
        $natures = Intervention::select('nature_probleme')
            ->whereNotNull('nature_probleme')
            ->where('nature_probleme', '!=', '')
            ->distinct()
            ->orderBy('nature_probleme')
            ->pluck('nature_probleme');
            
        return response()->json($natures);
    }

    public function index(Request $request)
    {
        $query = Intervention::with(['bail.unite', 'bail.locataire', 'prestataire', 'reclamation']);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('urgence')) $query->where('urgence', $request->urgence);
        if ($request->filled('prestataire_id')) $query->where('prestataire_id', $request->prestataire_id);
        if ($request->filled('bail_id')) $query->where('bail_id', $request->bail_id);
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
        if ($sortBy = $request->query('sort_by')) {
            $direction = strtolower($request->query('order', 'asc')) === 'desc' ? 'desc' : 'asc';
            if (in_array($sortBy, ['created_at', 'updated_at', 'nature_probleme', 'status', 'urgence', 'date_planifiee'])) {
                $query->orderBy($sortBy, $direction);
            }
        } else {
            $query->latest();
        }
        $items = $query->paginate(25);
        return InterventionResource::collection($items);
    }

    public function store(StoreInterventionRequest $request)
    {
        $data = $request->validated();
        if (!isset($data['status'])) $data['status'] = 'ouvert';
        if (!isset($data['urgence'])) $data['urgence'] = 'normal';
        
        $inter = Intervention::create($data);
        return new InterventionResource($inter->load(['bail.unite', 'bail.locataire', 'prestataire', 'reclamation']));
    }

    public function show(Intervention $intervention)
    {
        return new InterventionResource($intervention->load(['bail.unite', 'bail.locataire', 'prestataire', 'reclamation']));
    }

    public function update(UpdateInterventionRequest $request, Intervention $intervention)
    {
        $intervention->update($request->validated());
        return new InterventionResource($intervention->load(['bail.unite', 'bail.locataire', 'prestataire', 'reclamation']));
    }

    public function destroy(Intervention $intervention)
    {
        $intervention->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function downloadDocx(Intervention $intervention, DocumentTemplateService $docService)
    {
        $intervention->load(['bail.unite', 'bail.locataire', 'prestataire', 'reclamation']);
        $tmpFile = $docService->generateInterventionDocx($intervention);
        $filename = "intervention_{$intervention->id}.docx";
        return response()->download($tmpFile, $filename)->deleteFileAfterSend(true);
    }
}
