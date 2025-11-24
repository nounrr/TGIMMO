<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Proprietaire;
use App\Models\BailPaiement;
use App\Models\Bail;

class MaintenanceController extends Controller
{
    /**
     * Create ownership pivot rows for units that have validated payments but no owners.
     * POST /maintenance/fix-missing-ownerships
     * Body: proprietaire_id (required), mois (optional), annee (optional)
     */
    public function fixMissingOwnerships(Request $request)
    {
        $validated = $request->validate([
            'proprietaire_id' => 'required|exists:proprietaires,id',
            'mois' => 'nullable|integer|min:1|max:12',
            'annee' => 'nullable|integer|min:2000|max:2100',
        ]);

        $proprietaireId = $validated['proprietaire_id'];
        $mois = $validated['mois'] ?? null;
        $annee = $validated['annee'] ?? null;

        $paiementsQuery = DB::table('bail_paiements')
            ->join('baux', 'bail_paiements.bail_id', '=', 'baux.id')
            ->select('baux.unite_id', 'baux.id as bail_id', 'baux.date_debut')
            ->where('bail_paiements.status', 'valide');

        if ($mois) {
            $paiementsQuery->where('bail_paiements.period_month', $mois);
        }
        if ($annee) {
            $paiementsQuery->where('bail_paiements.period_year', $annee);
        }

        $rows = $paiementsQuery->get();
        $units = $rows->pluck('unite_id')->unique()->filter();

        $created = [];
        foreach ($units as $uniteId) {
            $hasOwner = DB::table('unites_proprietaires')->where('unite_id', $uniteId)->exists();
            if ($hasOwner) continue; // skip units already owned

            $bailDates = $rows->where('unite_id', $uniteId)->pluck('date_debut')->filter();
            $dateDebut = $bailDates->count() ? $bailDates->sort()->first() : now()->toDateString();

            // insert ownership row
            DB::table('unites_proprietaires')->insert([
                'unite_id' => $uniteId,
                'proprietaire_id' => $proprietaireId,
                'part_numerateur' => 1,
                'part_denominateur' => 1,
                'date_debut' => $dateDebut,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $created[] = $uniteId;
        }

        return response()->json([
            'created_count' => count($created),
            'units_created' => $created,
            'filter' => ['mois' => $mois, 'annee' => $annee],
        ]);
    }
}
