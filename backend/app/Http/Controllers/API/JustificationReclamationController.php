<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\JustificationReclamationResource;
use App\Models\Reclamation;
use App\Models\JustificationReclamation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JustificationReclamationController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:reclamations.justifications.upload')->only(['store']);
        $this->middleware('permission:reclamations.justifications.delete')->only(['destroy']);
    }

    public function store(Request $request, Reclamation $reclamation)
    {
        $request->validate([
            'files' => ['required','array'],
            'files.*' => ['file','max:5120'],
        ]);
        $created = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store('reclamations/justifications', 'public');
            $created[] = JustificationReclamation::create([
                'reclamation_id' => $reclamation->id,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'uploaded_by' => $request->user()->id ?? null,
            ]);
        }
        return JustificationReclamationResource::collection(collect($created));
    }

    public function destroy(Reclamation $reclamation, JustificationReclamation $justification)
    {
        if ($justification->reclamation_id !== $reclamation->id) {
            return response()->json(['message' => 'Not related'], 422);
        }
        if ($justification->path) {
            Storage::disk('public')->delete($justification->path);
        }
        $justification->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
