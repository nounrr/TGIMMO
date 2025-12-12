<?php

namespace App\Http\Controllers;

use App\Models\GedDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class GedController extends Controller
{
    public function index(Request $request)
    {
        $query = GedDocument::with(['unites', 'baux', 'proprietaires', 'locataires', 'mandats', 'avenants', 'interventions', 'devis', 'factures', 'reclamations', 'imputationCharges', 'approcheProprietaires', 'approcheLocataires', 'uploader']);

        if ($request->has('q')) {
            $q = $request->q;
            $query->where('original_name', 'like', "%{$q}%")
                  ->orWhere('description', 'like', "%{$q}%");
        }

        // Filter by entity
        if ($request->has('entity_type') && $request->has('entity_id')) {
            $type = $request->entity_type; // 'unite', 'bail', etc.
            $id = $request->entity_id;
            
            // Map frontend type to relationship name
            $relationMap = [
                'unite' => 'unites',
                'bail' => 'baux',
                'proprietaire' => 'proprietaires',
                'locataire' => 'locataires',
                'mandat' => 'mandats',
                'avenant' => 'avenants',
                'intervention' => 'interventions',
                'devis' => 'devis',
                'facture' => 'factures',
                'reclamation' => 'reclamations',
                'imputation_charge' => 'imputationCharges',
                'approche_proprietaire' => 'approcheProprietaires',
                'approche_locataire' => 'approcheLocataires',
            ];

            if (isset($relationMap[$type])) {
                $query->whereHas($relationMap[$type], function ($q) use ($id) {
                    $q->where('id', $id);
                });
            }
        }

        return $query->latest()->paginate($request->per_page ?? 15);
    }

    public function show($id)
    {
        $doc = GedDocument::with(['unites', 'baux', 'proprietaires', 'locataires', 'mandats', 'avenants', 'interventions', 'devis', 'factures', 'reclamations', 'imputationCharges', 'approcheProprietaires', 'approcheLocataires', 'uploader'])
            ->findOrFail($id);
        return response()->json($doc);
    }

    public function store(Request $request)
    {
        $request->validate([
            'files.*' => 'required|file|max:10240', // 10MB max
            'links' => 'nullable|array',
            'links.*.type' => 'required|string|in:unite,bail,proprietaire,locataire,mandat,avenant,intervention,devis,facture,reclamation,imputation_charge,approche_proprietaire,approche_locataire',
            'links.*.id' => 'required|integer',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
        ]);

        $uploadedFiles = [];

        DB::transaction(function () use ($request, &$uploadedFiles) {
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('ged', 'public');
                    
                    $doc = GedDocument::create([
                        'original_name' => $file->getClientOriginalName(),
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'path' => $path,
                        'uploaded_by' => auth()->id(),
                        'description' => $request->description,
                        'category' => $request->category,
                    ]);

                    if ($request->has('links')) {
                        foreach ($request->links as $link) {
                            // Handle JSON string if it comes as string
                            if (is_string($link)) {
                                $link = json_decode($link, true);
                            }
                            
                            $modelClass = $this->getModelClass($link['type']);
                            if ($modelClass) {
                                $doc->{$this->getRelationName($link['type'])}()->attach($link['id']);
                            }
                        }
                    }
                    
                    $uploadedFiles[] = $doc->load(['unites', 'baux', 'proprietaires', 'locataires', 'mandats', 'avenants', 'interventions', 'devis', 'factures', 'reclamations', 'imputationCharges', 'approcheProprietaires', 'approcheLocataires']);
                }
            }
        });

        return response()->json(['data' => $uploadedFiles, 'message' => 'Documents uploaded successfully']);
    }

    public function update(Request $request, $id)
    {
        $doc = GedDocument::findOrFail($id);

        $validated = $request->validate([
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'links' => 'nullable|array',
            'links.*.type' => 'required|string|in:unite,bail,proprietaire,locataire,mandat,avenant,intervention,devis,facture,reclamation,imputation_charge,approche_proprietaire,approche_locataire',
            'links.*.id' => 'required|integer',
        ]);

        if (array_key_exists('description', $validated)) {
            $doc->description = $validated['description'];
        }
        if (array_key_exists('category', $validated)) {
            $doc->category = $validated['category'];
        }
        $doc->save();

        if (isset($validated['links'])) {
            $byType = [];
            foreach ($validated['links'] as $link) {
                if (is_string($link)) {
                    $link = json_decode($link, true);
                }
                if (!isset($link['type'], $link['id'])) {
                    continue;
                }
                $byType[$link['type']][] = $link['id'];
            }

            // For each supported relation, sync to provided IDs when present; if type missing, leave links untouched
            $relations = [
                'unite','bail','proprietaire','locataire','mandat','avenant','intervention','devis','facture','reclamation','imputation_charge','approche_proprietaire','approche_locataire'
            ];
            foreach ($relations as $type) {
                $relationName = $this->getRelationName($type);
                if (!$relationName) continue;
                if (isset($byType[$type])) {
                    $ids = array_values(array_unique($byType[$type]));
                    $doc->{$relationName}()->sync($ids);
                }
            }
        }

        return response()->json(['message' => 'Document updated successfully', 'data' => $doc->fresh(['unites', 'baux', 'proprietaires', 'locataires', 'mandats', 'avenants', 'interventions', 'devis', 'factures', 'reclamations', 'imputationCharges', 'approcheProprietaires', 'approcheLocataires'])]);
    }

    public function destroy($id)
    {
        $doc = GedDocument::findOrFail($id);
        // Delete file from storage if present
        if ($doc->path) {
            try {
                Storage::disk('public')->delete($doc->path);
            } catch (\Throwable $e) {
                // ignore
            }
        }
        $doc->delete();
        return response()->json(null, 204);
    }

    public function attach(Request $request, $id)
    {
        $doc = GedDocument::findOrFail($id);
        
        $request->validate([
            'type' => 'required|string|in:unite,bail,proprietaire,locataire,mandat,avenant,intervention,devis,facture,reclamation,imputation_charge,approche_proprietaire,approche_locataire',
            'id' => 'required|integer',
        ]);

        $modelClass = $this->getModelClass($request->type);
        if ($modelClass) {
            $doc->{$this->getRelationName($request->type)}()->syncWithoutDetaching([$request->id]);
        }

        return response()->json(['message' => 'Document linked successfully', 'data' => $doc->fresh(['unites', 'baux', 'proprietaires', 'locataires', 'mandats', 'avenants', 'interventions', 'devis', 'factures', 'reclamations', 'imputationCharges', 'approcheProprietaires', 'approcheLocataires'])]);
    }

    public function detach(Request $request, $id)
    {
        $doc = GedDocument::findOrFail($id);
        
        $request->validate([
            'type' => 'required|string|in:unite,bail,proprietaire,locataire,mandat,avenant,intervention,devis,facture,reclamation,imputation_charge,approche_proprietaire,approche_locataire',
            'id' => 'required|integer',
        ]);

        $modelClass = $this->getModelClass($request->type);
        if ($modelClass) {
            $doc->{$this->getRelationName($request->type)}()->detach($request->id);
        }

        return response()->json(['message' => 'Document unlinked successfully', 'data' => $doc->fresh(['unites', 'baux', 'proprietaires', 'locataires', 'mandats', 'avenants', 'interventions', 'devis', 'factures', 'reclamations', 'imputationCharges', 'approcheProprietaires', 'approcheLocataires'])]);
    }

    private function getModelClass($type)
    {
        return match ($type) {
            'unite' => \App\Models\Unite::class,
            'bail' => \App\Models\Bail::class,
            'proprietaire' => \App\Models\Proprietaire::class,
            'locataire' => \App\Models\Locataire::class,
            'mandat' => \App\Models\MandatGestion::class,
            'avenant' => \App\Models\AvenantMandat::class,
            'intervention' => \App\Models\Intervention::class,
            'devis' => \App\Models\Devis::class,
            'facture' => \App\Models\Facture::class,
            'reclamation' => \App\Models\Reclamation::class,
            'imputation_charge' => \App\Models\ImputationCharge::class,
            'approche_proprietaire' => \App\Models\ApprocheProprietaire::class,
            'approche_locataire' => \App\Models\ApprocheLocataire::class,
            default => null,
        };
    }

    private function getRelationName($type)
    {
        return match ($type) {
            'unite' => 'unites',
            'bail' => 'baux',
            'proprietaire' => 'proprietaires',
            'locataire' => 'locataires',
            'mandat' => 'mandats',
            'avenant' => 'avenants',
            'intervention' => 'interventions',
            'devis' => 'devis',
            'facture' => 'factures',
            'reclamation' => 'reclamations',
            'imputation_charge' => 'imputationCharges',
            'approche_proprietaire' => 'approcheProprietaires',
            'approche_locataire' => 'approcheLocataires',
            default => null,
        };
    }
}
