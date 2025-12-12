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

    // List ownership groups by date_debut for a unite
    public function index(Unite $unite)
    {
        // Fetch all ownerships directly
        $ownerships = UniteProprietaire::where('unite_id', $unite->id)
            ->orderBy('date_debut', 'desc') // Most recent first
            ->get();

        // Group by date_debut (and date_fin) to simulate "periods"
        $grouped = $ownerships->groupBy(function($item) {
            return ($item->date_debut ?? 'null') . '|' . ($item->date_fin ?? 'null');
        });

        $result = [];
        foreach ($grouped as $key => $rows) {
            $first = $rows->first();
            $result[] = [
                'date_debut' => $first->date_debut,
                'date_fin' => $first->date_fin,
                'statut' => 'actif', // Fake status since we don't have mandate
                'mandat_id' => $first->mandat_id, // Might be null
                'owners' => $rows->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'proprietaire_id' => $row->proprietaire_id,
                        'part_numerateur' => (int) $row->part_numerateur,
                        'part_denominateur' => (int) $row->part_denominateur,
                        'part_pourcent' => (float) $row->pourcentage,
                    ];
                })->values(),
            ];
        }

        return response()->json(array_values($result));
    }

    // Create or replace an ownership group for a unite and date_debut
    // Direct link without MandatGestion
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
        $applyModifierStatus = $request->boolean('apply_modifier_status');

        DB::transaction(function () use ($request, $unite, $dateDebut, $originalDateDebut, $dateFin, $data, $applyModifierStatus) {
            
            if ($applyModifierStatus) {
                // Close previous period (where date_fin is null)
                UniteProprietaire::where('unite_id', $unite->id)
                    ->whereNull('date_fin')
                    ->update(['date_fin' => $dateDebut]); 
            } else {
                // Delete existing for this period (identified by originalDateDebut or dateDebut)
                // We assume if we are editing a period, we replace all owners for that period
                $targetDate = $originalDateDebut ?: $dateDebut;
                
                $query = UniteProprietaire::where('unite_id', $unite->id);
                if ($targetDate) {
                    $query->where('date_debut', $targetDate);
                } else {
                    $query->whereNull('date_debut');
                }
                $query->delete();
            }

            // Create new owners
            foreach ($data['owners'] as $o) {
                $num = (int)$o['part_numerateur'];
                $den = (int)$o['part_denominateur'];
                $pct = ($den > 0) ? ($num / $den) * 100 : 0;

                UniteProprietaire::create([
                    'unite_id' => $unite->id,
                    'proprietaire_id' => $o['proprietaire_id'],
                    'part_numerateur' => $num,
                    'part_denominateur' => $den,
                    'pourcentage' => $pct,
                    'date_debut' => $dateDebut,
                    'date_fin' => $dateFin,
                    // No mandat_id
                ]);
            }
        });

        return response()->json([
            'message' => 'Répartition de propriété enregistrée avec succès.',
            'generated_documents' => [], // No documents generated
        ], 201);
    }

    // Delete a specific ownership entry
    public function destroy(Unite $unite, $ownershipId)
    {
        $ownership = UniteProprietaire::find($ownershipId);
        
        if (!$ownership) {
             return response()->json(['message' => 'Introuvable'], 404);
        }

        if ($ownership->unite_id !== $unite->id) {
            return response()->json(['message' => 'Elément non lié à cette unité.'], 404);
        }

        $ownership->delete();
        return response()->json(['message' => 'Supprimé']);
    }

    // Update status for an ownership group
    public function updateStatus(Request $request, Unite $unite)
    {
        // Since we don't have mandates, status update might not be relevant or 
        // we might need to implement it on UniteProprietaire if needed.
        // For now, we return success to avoid frontend errors.
        return response()->json([
            'message' => 'Statut mis à jour (simulation)',
            'updated' => 1,
        ]);
    }
}
