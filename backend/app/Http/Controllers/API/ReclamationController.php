<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReclamationRequest;
use App\Http\Requests\UpdateReclamationRequest;
use App\Http\Resources\ReclamationResource;
use App\Models\Reclamation;
use App\Models\JustificationReclamation;
use App\Services\DocumentTemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReclamationController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:reclamations.view')->only(['index','show']);
        $this->middleware('permission:reclamations.create')->only(['store']);
        $this->middleware('permission:reclamations.update')->only(['update']);
        $this->middleware('permission:reclamations.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Reclamation::with(['type','bail']);
        if ($request->filled('bail_id')) $query->where('bail_id', $request->bail_id);
        if ($request->filled('reclamation_type_id')) $query->where('reclamation_type_id', $request->reclamation_type_id);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('source')) $query->where('source', $request->source);
        if ($search = $request->query('q')) {
            $query->where(function($q) use ($search) {
                $q->where('description','like',"%$search%");
            });
        }
        if ($sortBy = $request->query('sort_by')) {
            $direction = $request->query('order', 'asc');
            if (in_array($sortBy, ['created_at', 'updated_at', 'status', 'source', 'date_reclamation'])) {
                $query->orderBy($sortBy, $direction);
            }
        } else {
            $query->latest();
        }
        $recs = $query->paginate(25);
        return ReclamationResource::collection($recs);
    }

    public function store(StoreReclamationRequest $request)
    {
        $data = $request->validated();
        $files = $request->file('files', []);
        unset($data['files']);

        DB::beginTransaction();
        try {
            $rec = Reclamation::create($data);
            foreach ($files as $file) {
                $path = $file->store('reclamations/justifications', 'public');
                JustificationReclamation::create([
                    'reclamation_id' => $rec->id,
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'uploaded_by' => $request->user()->id ?? null,
                ]);
            }
            DB::commit();
            return new ReclamationResource($rec->load(['type','bail','justifications']));
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur création','error' => $e->getMessage()], 500);
        }
    }

    public function show(Reclamation $reclamation)
    {
        $reclamation->load(['type','bail','justifications']);
        return new ReclamationResource($reclamation);
    }

    public function update(UpdateReclamationRequest $request, Reclamation $reclamation)
    {
        $reclamation->update($request->validated());
        return new ReclamationResource($reclamation->load(['type','bail','justifications']));
    }

    public function destroy(Reclamation $reclamation)
    {
        $reclamation->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function downloadDocx(Reclamation $reclamation, DocumentTemplateService $docService)
    {
        $reclamation->load(['type','bail','justifications']);
        $tmpFile = $docService->generateReclamationDocx($reclamation);
        $filename = "reclamation_{$reclamation->id}.docx";
        return response()->download($tmpFile, $filename)->deleteFileAfterSend(true);
    }
}
