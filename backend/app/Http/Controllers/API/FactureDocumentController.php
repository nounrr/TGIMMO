<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\GedDocumentResource;
use App\Models\Facture;
use App\Models\GedDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FactureDocumentController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:documents.upload')->only(['store']);
        $this->middleware('permission:documents.delete')->only(['destroy']);
    }

    public function store(Request $request, Facture $facture)
    {
        $request->validate([
            'files' => ['required','array'],
            'files.*' => ['file','max:10240'],
            'category' => ['nullable','string','max:50'],
        ]);
        $docs = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store('ged/factures', 'public');
            $docs[] = $facture->documents()->create([
                'category' => $request->input('category'),
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'uploaded_by' => $request->user()->id ?? null,
            ]);
        }
        return GedDocumentResource::collection(collect($docs));
    }

    public function destroy(Facture $facture, GedDocument $document)
    {
        if ($document->documentable_type !== Facture::class || (int)$document->documentable_id !== (int)$facture->id) {
            return response()->json(['message' => 'Not related'], 422);
        }
        Storage::disk('public')->delete($document->path);
        $document->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
