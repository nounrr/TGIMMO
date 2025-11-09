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
    private function findLatestMandatIdFor(int $proprietaireId): ?int
    {
        $mandat = MandatGestion::where('proprietaire_id', $proprietaireId)
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
            ->groupBy('date_debut')
            ->map(function ($rows) {
                return [
                    'date_debut' => optional($rows->first())->date_debut?->toDateString(),
                    'date_fin' => optional($rows->first())->date_fin?->toDateString(),
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
        $dateFin = $data['date_fin'] ?? null;

        $createdDocs = [];

        DB::transaction(function () use ($request, $tpl, $unite, $dateDebut, $dateFin, $data, &$createdDocs) {
            // Replace existing group for same unite and date_debut
            UniteProprietaire::where('unite_id', $unite->id)
                ->whereDate('date_debut', $dateDebut)
                ->delete();

            $now = now();
            $ownershipRows = [];
            foreach ($data['owners'] as $o) {
                $ownership = UniteProprietaire::create([
                    'unite_id' => $unite->id,
                    'proprietaire_id' => $o['proprietaire_id'],
                    'part_numerateur' => $o['part_numerateur'],
                    'part_denominateur' => $o['part_denominateur'],
                    'date_debut' => $dateDebut,
                    'date_fin' => $dateFin,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $ownershipRows[] = $ownership;
            }

            // Generate documents if requested
            if ($request->boolean('generate_documents')) {
                $user = $request->user();
                $reqType = $request->input('mandat_template_type'); // auto|personne|societe
                $reqLangue = $request->input('mandat_langue'); // ar|fr|ar_fr
                $createAvenant = $request->has('create_avenant') ? $request->boolean('create_avenant') : true; // default true
                $includeAllOwnerNames = $request->boolean('include_all_owner_names');

                foreach ($ownershipRows as $row) {
                    $prop = Proprietaire::find($row->proprietaire_id);
                    if (!$prop) { continue; }

                    // Create Mandat de gestion (brouillon)
                    $mandat = null;
                    // Optional permission check if Spatie permissions are in use
                    if (method_exists($user, 'can') ? $user->can('mandats.create') : true) {
                        $pouvoirsText = $tpl->getMandatTemplateByType($reqType, $prop);
                        // Append all owner names if requested and template is person (or auto resolved to person)
                        if ($includeAllOwnerNames) {
                            $personTemplateUsed = ($reqType === 'personne') || ($reqType === 'auto' && !$prop->rc && !$prop->ice && !$prop->ifiscale && $prop->type_proprietaire !== 'societe');
                            if ($personTemplateUsed) {
                                $allNames = collect($data['owners'])
                                    ->map(fn($o) => Proprietaire::find($o['proprietaire_id']))
                                    ->filter()
                                    ->map(fn($p) => $p->nom_raison ?? ($p->nom_ar ?: $p->email))
                                    ->unique()
                                    ->values();
                                if ($allNames->count() > 1) {
                                    $namesLine = ($reqLangue === 'fr')
                                        ? "Co-propriétaires: " . $allNames->join(', ') . "\n"
                                        : (($reqLangue === 'ar' || $reqLangue === 'ar_fr') ? "الملاك المشتركون: " . $allNames->join('، ') . "\n" : "");
                                    $pouvoirsText = $namesLine . $pouvoirsText;
                                }
                            }
                        }
                        $descBien = $tpl->buildUniteDescription($unite);
                        $mandat = MandatGestion::create([
                            'proprietaire_id' => $prop->id,
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

                        $createdDocs[] = ['type' => 'mandat', 'id' => $mandat->id, 'proprietaire_id' => $prop->id];
                    }

                    // Create Avenant au pouvoir (brouillon)
                    if ($createAvenant && (method_exists($user, 'can') ? $user->can('avenants.create') : true)) {
                        $avenantText = $tpl->getAvenantTemplate();
                        $objet = 'Avenant au pouvoir – Unité ' . ($unite->numero_unite ?: ('#'.$unite->id));
                        $avenant = AvenantMandat::create([
                            'mandat_id' => $mandat?->id ?? $this->findLatestMandatIdFor($prop->id),
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
}
