<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUniteOwnershipsRequest;
use App\Models\Unite;
use App\Models\UniteProprietaire;
use App\Models\Proprietaire;
use App\Models\MandatGestion;
use App\Models\AvenantMandat;
use App\Services\DocumentTemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UniteProprietaireController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:unites.ownership.view')->only(['index']);
        $this->middleware('permission:unites.ownership.manage')->only(['store']);
        $this->middleware('permission:unites-proprietaires.status.modifier')->only(['updateStatus']);
    }

    private function findLatestMandatIdFor(int $uniteId): ?int
    {
        $mandat = MandatGestion::where('unite_id', $uniteId)
            ->latest('id')
            ->first();
        return $mandat?->id;
    }

    // List ownership groups by date_debut for a unite
    public function index(Unite $unite)
    {
        $groups = UniteProprietaire::query()
            ->where('unite_id', $unite->id)
            ->orderBy('date_debut')
            ->get()
            ->groupBy(function ($item) {
                return $item->date_debut->toDateString() . '|' . ($item->statut ?? 'actif');
            })
            ->map(function ($rows) {
                $first = $rows->first();
                return [
                    'date_debut' => $first->date_debut?->toDateString(),
                    'date_fin' => $first->date_fin?->toDateString(),
                    'statut' => $first->statut ?? 'actif',
                    'mandat_id' => $first->mandat_id,
                    'owners' => $rows->map(function ($row) {
                        return [
                            'id' => $row->id,
                            'proprietaire_id' => $row->proprietaire_id,
                            'part_numerateur' => (int) $row->part_numerateur,
                            'part_denominateur' => (int) $row->part_denominateur,
                            'part_pourcent' => (float) $row->part_pourcent,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json($groups);
    }

    // Create or replace an ownership group for a unite and date_debut
    public function store(StoreUniteOwnershipsRequest $request, Unite $unite, DocumentTemplateService $tpl)
    {
        $data = $request->validated();

        // Ensure path param matches body
        if ((int)$unite->id !== (int)$data['unite_id']) {
            return response()->json(['message' => 'Conflit: unite_id du corps ne correspond pas à l’URL.'], 422);
        }

        $dateDebut = $data['date_debut'];
        $originalDateDebut = $request->input('original_date_debut');
        $dateFin = $data['date_fin'] ?? null;
        $mandatId = $request->input('mandat_id');
        $applyModifierStatus = $request->boolean('apply_modifier_status');

        $createdDocs = [];

        DB::transaction(function () use ($request, $tpl, $unite, $dateDebut, $originalDateDebut, $dateFin, $data, $mandatId, $applyModifierStatus, &$createdDocs) {
            
            $ownershipRows = [];

            if ($applyModifierStatus) {
                // Versioning flow: create new active rows, mark previous snapshot as 'modifier'.
                // Requires dropping unique constraint on (unite_id, proprietaire_id, date_debut) to allow coexistence.
                $existingActive = UniteProprietaire::where('unite_id', $unite->id)
                    ->whereDate('date_debut', $dateDebut)
                    ->where('statut', 'actif')
                    ->get();

                // Mark existing active rows as modifier (historical snapshot)
                foreach ($existingActive as $old) {
                    $old->update(['statut' => 'modifier']);
                }

                // Mark mandat as 'modifier' if provided (business rule for document workflow/versioning)
                if ($mandatId) {
                    MandatGestion::where('id', $mandatId)->update(['statut' => 'modifier']);
                }

                $now = now();
                foreach ($data['owners'] as $o) {
                    $ownership = UniteProprietaire::create([
                        'unite_id' => $unite->id,
                        'proprietaire_id' => $o['proprietaire_id'],
                        'part_numerateur' => $o['part_numerateur'],
                        'part_denominateur' => $o['part_denominateur'],
                        'date_debut' => $dateDebut,
                        'date_fin' => $dateFin,
                        'mandat_id' => $mandatId,
                        'statut' => 'actif',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    $ownershipRows[] = $ownership;
                }
            } else {
                // Normal behavior: Sync existing group for same unite and date_debut
                // We update existing records to preserve IDs, delete removed ones, and create new ones.
                
                // Use original_date_debut if provided to find the records being edited
                $searchDate = $originalDateDebut ?: $dateDebut;

                $existingRecords = UniteProprietaire::where('unite_id', $unite->id)
                    ->whereDate('date_debut', $searchDate)
                    ->where('statut', '!=', 'modifier')
                    ->get();

                $incomingById = collect($data['owners'])->filter(fn($o) => !empty($o['id']))->keyBy('id');
                $incomingByProp = collect($data['owners'])->keyBy('proprietaire_id');
                $processedRecordIds = [];
                $processedPropIds = [];
                $now = now();

                foreach ($existingRecords as $record) {
                    // Prefer matching by row id if provided
                    $newData = $incomingById->get($record->id) ?? $incomingByProp->get($record->proprietaire_id);
                    if ($newData) {
                        // Update existing record in place
                        $record->update([
                            'part_numerateur' => $newData['part_numerateur'],
                            'part_denominateur' => $newData['part_denominateur'],
                            'proprietaire_id' => $newData['proprietaire_id'],
                            'date_debut' => $dateDebut, // Update date_debut in case it changed
                            'date_fin' => $dateFin,
                            'mandat_id' => $mandatId,
                        ]);
                        $ownershipRows[] = $record;
                        $processedRecordIds[] = $record->id;
                        $processedPropIds[] = $record->proprietaire_id;
                    } else {
                        // Delete removed record
                        $record->delete();
                    }
                }

                // Create new records for added owners
                foreach ($incomingByProp as $o) {
                    // If owner row has an id and it was processed, skip
                    if (!empty($o['id']) && in_array($o['id'], $processedRecordIds)) {
                        continue;
                    }
                    // If this proprietaire_id is already updated, skip creation to avoid duplicates
                    if (in_array($o['proprietaire_id'], $processedPropIds)) {
                        continue;
                    }
                    // Otherwise create as new (added owner or row without prior id)
                        $ownership = UniteProprietaire::create([
                            'unite_id' => $unite->id,
                            'proprietaire_id' => $o['proprietaire_id'],
                            'part_numerateur' => $o['part_numerateur'],
                            'part_denominateur' => $o['part_denominateur'],
                            'date_debut' => $dateDebut,
                            'date_fin' => $dateFin,
                            'mandat_id' => $mandatId,
                            'statut' => 'actif',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                        $ownershipRows[] = $ownership;
                }
            }

            $createdDocs = $ownershipRows; // Restore variable name expected by doc generation

            // Generate documents if requested

            // Generate documents if requested
            if ($request->boolean('generate_documents')) {
                $user = $request->user();
                $reqType = $request->input('mandat_template_type'); // auto|personne|societe
                $reqLangue = $request->input('mandat_langue'); // ar|fr|ar_fr
                $createAvenant = $request->has('create_avenant') ? $request->boolean('create_avenant') : true; // default true
                $includeAllOwnerNames = $request->boolean('include_all_owner_names');

                // We create ONE mandat for the unit, using the first owner as the primary contact for template purposes
                if (!empty($ownershipRows)) {
                    $firstOwnerRow = $ownershipRows[0];
                    $prop = Proprietaire::find($firstOwnerRow->proprietaire_id);
                    
                    if ($prop) {
                        // Create Mandat de gestion (brouillon)
                        $mandat = null;
                        // Optional permission check if Spatie permissions are in use
                        if (method_exists($user, 'can') ? $user->can('mandats.create') : true) {
                            $pouvoirsText = $tpl->getMandatTemplateByType($reqType, $prop);
                            
                            // Append all owner names if requested
                            // We list ALL owners in the mandat text
                            $allNames = collect($data['owners'])
                                ->map(fn($o) => Proprietaire::find($o['proprietaire_id']))
                                ->filter()
                                ->map(fn($p) => $p->nom_raison ?? ($p->nom_ar ?: $p->email))
                                ->unique()
                                ->values();
                                
                            if ($includeAllOwnerNames) {
                                $personTemplateUsed = ($reqType === 'personne') || ($reqType === 'auto' && !$prop->rc && !$prop->ice && !$prop->ifiscale && $prop->type_proprietaire !== 'societe');
                                if ($personTemplateUsed && $allNames->count() > 1) {
                                    $namesLine = ($reqLangue === 'fr')
                                        ? "Co-propriétaires: " . $allNames->join(', ') . "\n"
                                        : (($reqLangue === 'ar' || $reqLangue === 'ar_fr') ? "الملاك المشتركون: " . $allNames->join('، ') . "\n" : "");
                                    $pouvoirsText = $namesLine . $pouvoirsText;
                                }
                            }
                            
                            $descBien = $tpl->buildUniteDescription($unite);
                            
                            $mandat = MandatGestion::create([
                                'unite_id' => $unite->id,
                                'reference' => null,
                                'date_debut' => $dateDebut,
                                'date_fin' => $dateFin,
                                'taux_gestion_pct' => $prop->taux_gestion_tgi_pct,
                                'assiette_honoraires' => 'loyers_encaisse',
                                'tva_applicable' => false,
                                'tva_taux' => null,
                                'frais_min_mensuel' => null,
                                'periodicite_releve' => 'trimestriel',
                                'charge_maintenance' => null,
                                'mode_versement' => null,
                                'description_bien' => $descBien,
                                'usage_bien' => null,
                                'pouvoirs_accordes' => $pouvoirsText,
                                'lieu_signature' => 'Tanger',
                                'date_signature' => null,
                                'langue' => $reqLangue ?: 'ar',
                                'notes_clauses' => null,
                                'statut' => 'brouillon',
                                'created_by' => $user->id,
                            ]);

                            // We just return the first owner ID for the response metadata, or maybe 0
                            $createdDocs[] = ['type' => 'mandat', 'id' => $mandat->id, 'proprietaire_id' => $prop->id];
                        }

                        // Create Avenant au pouvoir (brouillon)
                        if ($createAvenant && (method_exists($user, 'can') ? $user->can('avenants.create') : true)) {
                            $avenantText = $tpl->getAvenantTemplate();
                            $objet = 'Avenant au pouvoir – Unité ' . ($unite->numero_unite ?: ('#'.$unite->id));
                            $avenant = AvenantMandat::create([
                                'mandat_id' => $mandat?->id ?? $this->findLatestMandatIdFor($unite->id),
                                'reference' => null,
                                'date_pouvoir_initial' => null,
                                'objet_resume' => $objet,
                                'modifs_text' => $avenantText,
                                'date_effet' => $dateDebut,
                                'lieu_signature' => 'Tanger',
                                'date_signature' => null,
                                'rep_b_user_id' => $user->id,
                                'statut' => 'brouillon',
                                'fichier_url' => null,
                                'created_by' => $user->id,
                            ]);
                            $createdDocs[] = ['type' => 'avenant', 'id' => $avenant->id, 'proprietaire_id' => $prop->id];
                        }
                    }
                }
            }
        });

        return response()->json([
            'message' => 'Répartition de propriété enregistrée avec succès.',
            'generated_documents' => $createdDocs,
        ], 201);
    }

    // Delete a specific ownership entry
    public function destroy(Unite $unite, UniteProprietaire $ownership)
    {
        if ($ownership->unite_id !== $unite->id) {
            return response()->json(['message' => 'Elément non lié à cette unité.'], 404);
        }
        $ownership->delete();
        return response()->json(['message' => 'Supprimé']);
    }

    // Update status for an ownership group (identified by date_debut and current statut)
    public function updateStatus(Request $request, Unite $unite)
    {
        $validated = $request->validate([
            'date_debut' => ['required','date'],
            'current_statut' => ['required','in:actif,modifier'],
            'new_statut' => ['required','in:actif,modifier'],
        ]);

        if ($validated['current_statut'] === $validated['new_statut']) {
            return response()->json(['message' => 'Aucun changement requis.'], 200);
        }

        $count = UniteProprietaire::where('unite_id', $unite->id)
            ->whereDate('date_debut', $validated['date_debut'])
            ->where('statut', $validated['current_statut'])
            ->update(['statut' => $validated['new_statut']]);

        return response()->json([
            'message' => 'Statut mis à jour',
            'updated' => $count,
        ]);
    }
}
