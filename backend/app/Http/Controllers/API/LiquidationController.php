<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Liquidation;
use App\Models\MandatGestion;
use App\Models\Proprietaire;
use App\Models\Bail;
use App\Models\BailPaiement;
use App\Models\ImputationCharge;
use App\Models\Unite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class LiquidationController extends Controller
{
    public function index(Request $request)
    {
        $query = Liquidation::with(['proprietaire', 'creator']);

        if ($request->has('proprietaire_id')) {
            $query->where('proprietaire_id', $request->proprietaire_id);
        }
        if ($request->has('annee')) {
            $query->where('annee', $request->annee);
        }
        if ($request->has('mois')) {
            $query->where('mois', $request->mois);
        }

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function preview(Request $request)
    {
        $request->validate([
            'proprietaire_id' => 'required|exists:proprietaires,id',
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2000|max:2100',
        ]);

        $data = $this->calculateLiquidation($request->proprietaire_id, $request->mois, $request->annee);

        return response()->json($data);
    }

    public function pending(Request $request)
    {
        $request->validate([
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2000|max:2100',
        ]);

        $mois = $request->mois;
        $annee = $request->annee;

        // 1. Find owners who have received payments in this month/year
        $ownersWithPayments = DB::table('bail_paiements')
            ->join('baux', 'bail_paiements.bail_id', '=', 'baux.id')
            ->join('unites_proprietaires', 'baux.unite_id', '=', 'unites_proprietaires.unite_id')
            ->where('bail_paiements.period_month', $mois)
            ->where('bail_paiements.period_year', $annee)
            ->where('bail_paiements.status', 'valide')
            ->distinct()
            ->pluck('unites_proprietaires.proprietaire_id');

        $debug = [];
        // Capture debug info when no owners found to help diagnose missing pivot ownership data
        if ($ownersWithPayments->isEmpty()) {
            $debug['payments_raw'] = DB::table('bail_paiements')
                ->select('id','bail_id','period_month','period_year','status','amount_paid')
                ->where('period_month', $mois)
                ->where('period_year', $annee)
                ->where('status','valide')
                ->get();
            $debug['bails_for_payments'] = DB::table('bail_paiements')
                ->join('baux','bail_paiements.bail_id','=','baux.id')
                ->select('bail_paiements.id as paiement_id','baux.id as bail_id','baux.unite_id')
                ->where('bail_paiements.period_month',$mois)
                ->where('bail_paiements.period_year',$annee)
                ->where('bail_paiements.status','valide')
                ->get();
            $debug['ownership_rows_for_units'] = DB::table('bail_paiements')
                ->join('baux','bail_paiements.bail_id','=','baux.id')
                ->leftJoin('unites_proprietaires','baux.unite_id','=','unites_proprietaires.unite_id')
                ->select('baux.unite_id','unites_proprietaires.proprietaire_id','unites_proprietaires.part_numerateur','unites_proprietaires.part_denominateur')
                ->where('bail_paiements.period_month',$mois)
                ->where('bail_paiements.period_year',$annee)
                ->distinct()
                ->get();
        }

        // 2. Filter out owners who already have a liquidation for this month/year
        $alreadyLiquidated = Liquidation::where('mois', $mois)
            ->where('annee', $annee)
            ->pluck('proprietaire_id');

        $pendingOwners = $ownersWithPayments->diff($alreadyLiquidated);

        // 3. Calculate preview for each pending owner
        $results = [];
        foreach ($pendingOwners as $ownerId) {
            $proprietaire = Proprietaire::find($ownerId);
            if (!$proprietaire) continue;

            $calc = $this->calculateLiquidation($ownerId, $mois, $annee);

            // Include even if amounts are 0 when there are validated payments (avoid silent exclusion)
            $hasPayments = count($calc['details']['paiements_ids']) > 0;
            if ($hasPayments || $calc['total_loyer'] > 0 || $calc['total_charges'] > 0) {
                $results[] = [
                    'proprietaire' => $proprietaire,
                    'calcul' => $calc,
                    'excluded' => false,
                ];
            } else {
                $debug['excluded'][] = [
                    'proprietaire_id' => $ownerId,
                    'reason' => 'no payments or charges',
                ];
            }
        }

        return response()->json([
            'data' => $results,
            'meta' => [
                'owners_found' => $ownersWithPayments->count(),
                'already_liquidated_count' => $alreadyLiquidated->count(),
                'pending_owners_count' => count($pendingOwners),
            ],
            'debug' => $request->boolean('debug') ? $debug : null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'proprietaire_id' => 'required|exists:proprietaires,id',
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2000|max:2100',
        ]);

        DB::beginTransaction();
        try {
            // Check if already exists
            $exists = Liquidation::where('proprietaire_id', $request->proprietaire_id)
                ->where('mois', $request->mois)
                ->where('annee', $request->annee)
                ->exists();
            
            if ($exists) {
                return response()->json(['message' => 'Une liquidation existe déjà pour ce propriétaire et ce mois.'], 422);
            }

            $calc = $this->calculateLiquidation($request->proprietaire_id, $request->mois, $request->annee);

            $liquidation = Liquidation::create([
                'proprietaire_id' => $request->proprietaire_id,
                'mandat_id' => $calc['mandat_id'],
                'mois' => $request->mois,
                'annee' => $request->annee,
                'total_loyer' => $calc['total_loyer'],
                'total_charges' => $calc['total_charges'],
                'total_honoraires' => $calc['total_honoraires'],
                'montant_net' => $calc['montant_net'],
                'date_liquidation' => now(),
                'statut' => 'valide',
                'details' => $calc['details'],
                'created_by' => Auth::id(),
            ]);

            // Mark charges as paid (deducted)
            if (!empty($calc['details']['charges_ids'])) {
                ImputationCharge::whereIn('id', $calc['details']['charges_ids'])
                    ->update([
                        'statut_paiement' => 'paye',
                        'date_paiement' => now(),
                        'notes' => DB::raw("CONCAT(COALESCE(notes, ''), ' [Liquidation #{$liquidation->id}]')")
                    ]);
            }

            DB::commit();
            return response()->json($liquidation, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création de la liquidation: ' . $e->getMessage()], 500);
        }
    }

    private function calculateLiquidation($proprietaireId, $mois, $annee)
    {
        // 1. Get Proprietaire & Rate (ignoring Mandat rate as per request)
        $proprietaire = Proprietaire::with('unites')->find($proprietaireId);
        if (!$proprietaire) {
            return [
                'mandat_id' => null,
                'taux_applique' => 0,
                'total_loyer' => 0,
                'total_charges' => 0,
                'total_honoraires' => 0,
                'montant_net' => 0,
                'details' => []
            ];
        }

        // Use rate from Proprietaire model
        $taux = $proprietaire->taux_gestion_tgi_pct ?? 0;
        
        // Try to find a mandat just for reference (ID), but don't use its rate
        $mandat = MandatGestion::where('proprietaire_id', $proprietaireId)
            ->where('statut', 'actif')
            ->first();
        $mandatId = $mandat ? $mandat->id : null;

        // 2. Calculate Revenue (Loyer) with Ownership Share
        $totalLoyer = 0;
        $paiementsIds = [];
        $bailsIds = [];
        $unitesIds = $proprietaire->unites->pluck('id');

        foreach ($proprietaire->unites as $unit) {
            $sharePct = $unit->pivot->part_pourcent ?? 0;
            if ($sharePct <= 0) continue;

            // Get bails for this unit
            $bails = Bail::where('unite_id', $unit->id)->get();
            
            foreach ($bails as $bail) {
                $bailsIds[] = $bail->id;
                
                $payments = BailPaiement::where('bail_id', $bail->id)
                    ->where('period_month', $mois)
                    ->where('period_year', $annee)
                    ->where('status', 'valide')
                    ->get();
                    
                foreach ($payments as $payment) {
                    $paiementsIds[] = $payment->id;
                    $rawAmount = $payment->amount_paid ?? $payment->amount_due;
                    // Apply ownership share
                    $shareAmount = $rawAmount * ($sharePct / 100);
                    $totalLoyer += $shareAmount;
                }
            }
        }
        
        $bailsIds = array_unique($bailsIds);
        $paiementsIds = array_unique($paiementsIds);

        // 3. Calculate Charges (Deductible)
        $chargesQuery = ImputationCharge::where('statut_paiement', 'non_paye')
            ->whereMonth('created_at', $mois)
            ->whereYear('created_at', $annee)
            ->where(function($q) use ($proprietaireId, $unitesIds, $bailsIds) {
                // Case 1: Assigned to Proprietaire
                $q->where(function($sq) use ($proprietaireId) {
                    $sq->where('impute_a', 'proprietaire')
                      ->where('id_impute', $proprietaireId);
                });
                // Case 2: Payer is Proprietaire (regardless of impute_a)
                $q->orWhere(function($sq) use ($proprietaireId) {
                    $sq->where('payer_type', 'proprietaire')
                      ->where('payer_id', $proprietaireId);
                });
                // Case 3: Assigned to Unit/Bail but implicitly paid by owner? 
                // Usually if payer_type is not set, we might assume owner if impute_a is unit?
                // But let's stick to explicit payer_type='proprietaire' for now as per form.
            });

        $charges = $chargesQuery->get();
        $totalCharges = $charges->sum('montant');

        // 4. Calculate Honoraires
        $honoraires = $totalLoyer * ($taux / 100);

        // 5. Net
        $net = $totalLoyer - $honoraires - $totalCharges;

        return [
            'mandat_id' => $mandatId,
            'taux_applique' => $taux,
            'total_loyer' => $totalLoyer,
            'total_charges' => $totalCharges,
            'total_honoraires' => $honoraires,
            'montant_net' => $net,
            'details' => [
                'paiements_ids' => $paiementsIds,
                'charges_ids' => $charges->pluck('id'),
                'bails_concernes' => $bailsIds,
                'unites_concernees' => $unitesIds,
            ]
        ];
    }
}
