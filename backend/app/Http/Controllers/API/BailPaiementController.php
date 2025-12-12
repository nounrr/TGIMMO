<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bail;
use App\Models\BailPaiement;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class BailPaiementController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:paiements.view')->only(['index', 'show', 'getAllBauxWithPaiements']);
        $this->middleware('permission:paiements.create')->only(['store']);
        $this->middleware('permission:paiements.update')->only(['update']);
        $this->middleware('permission:paiements.delete')->only(['destroy']);
    }

    // GET /paiements/all-baux - returns all active baux with their paiements
    public function getAllBauxWithPaiements()
    {
        try {
            $baux = Bail::with(['unite.proprietaires', 'locataire'])
                ->whereNull('date_resiliation')
                ->get();
            
            $result = $baux->map(function ($bail) {
                $paiements = BailPaiement::where('bail_id', $bail->id)
                    ->orderBy('period_year')
                    ->orderBy('period_month')
                    ->get();
                
                // Get charges for this locataire
                $chargesLocataire = [];
                if ($bail->locataire_id) {
                    $chargesLocataire = \App\Models\ImputationCharge::where('impute_a', 'locataire')
                        ->where('id_impute', $bail->locataire_id)
                        ->get()
                        ->map(fn($c) => [
                            'id' => $c->id,
                            'titre' => $c->titre,
                            'montant' => $c->montant,
                            'date_paiement' => $c->date_paiement,
                            'statut_paiement' => $c->statut_paiement,
                            'notes' => $c->notes,
                            'created_at' => $c->created_at,
                        ])
                        ->toArray();
                }
                
                return [
                    'id' => $bail->id,
                    'numero_bail' => $bail->numero_bail,
                    'date_resiliation' => $bail->date_resiliation,
                    'montant_loyer' => $bail->montant_loyer,
                    'charges' => $bail->charges,
                    'loyer_total' => $bail->loyer_total,
                    'unite' => [
                        'id' => $bail->unite->id ?? null,
                        'numero_unite' => $bail->unite->numero_unite ?? null,
                        'reference' => $bail->unite->reference ?? null,
                        'adresse' => $bail->unite->adresse ?? null,
                        'ville' => $bail->unite->ville ?? null,
                        'proprietaires' => $bail->unite->proprietaires->map(fn($p) => [
                            'id' => $p->id,
                            'nom_raison' => $p->nom_raison,
                            'nom_complet' => $p->nom_complet ?? $p->nom_raison,
                            'cin' => $p->cin ?? null,
                            'ice' => $p->ice ?? null,
                        ]) ?? [],
                    ],
                    'locataire' => [
                        'id' => $bail->locataire->id ?? null,
                        'nom' => $bail->locataire->nom ?? null,
                        'prenom' => $bail->locataire->prenom ?? null,
                        'raison_sociale' => $bail->locataire->raison_sociale ?? null,
                        'cin' => $bail->locataire->cin ?? null,
                        'ice' => $bail->locataire->ice ?? null,
                    ],
                    'paiements' => $paiements,
                    'charges_locataire' => $chargesLocataire,
                ];
            });
            
            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'fetch_failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // GET /baux/{bail}/paiements
    public function index(Bail $bail)
    {
        $items = BailPaiement::where('bail_id', $bail->id)->orderBy('period_year')->orderBy('period_month')->get();
        return response()->json(['data' => $items]);
    }

    // POST /baux/{bail}/paiements -> create a single payment record
    public function store(Request $request, Bail $bail)
    {
        $validated = $request->validate([
            'period_month' => ['required','integer','between:1,12'],
            'period_year' => ['required','integer','min:2000'],
            'due_date' => ['nullable','date'],
            'amount_due' => ['required','numeric','min:0'],
            'notes' => ['nullable','string']
        ]);

        // Prevent duplicates
        $exists = BailPaiement::where('bail_id',$bail->id)
            ->where('period_month',$validated['period_month'])
            ->where('period_year',$validated['period_year'])->exists();
        if ($exists) return response()->json(['message' => 'Paiement déjà existant pour cette période'], 422);

        $payment = BailPaiement::create([
            'bail_id' => $bail->id,
            'period_month' => $validated['period_month'],
            'period_year' => $validated['period_year'],
            'due_date' => $validated['due_date'] ?? null,
            'amount_due' => $validated['amount_due'],
            'status' => 'en_validation',
            'notes' => $validated['notes'] ?? null,
        ]);
        return response()->json(['data' => $payment], 201);
    }

    // PATCH /paiements/{paiement}
    public function update(Request $request, BailPaiement $paiement)
    {
        $validated = $request->validate([
            'amount_due' => ['nullable','numeric','min:0'],
            'amount_paid' => ['nullable','numeric','min:0'],
            'status' => ['nullable', Rule::in(['en_validation','valide'])],
            'method' => ['nullable','string','max:100'],
            'reference' => ['nullable','string','max:150'],
            'notes' => ['nullable','string'],
            'due_date' => ['nullable','date'],
        ]);

        $paiement->fill($validated);
        if (isset($validated['amount_paid'])) {
            if ($validated['amount_paid'] >= ($validated['amount_due'] ?? $paiement->amount_due)) {
                // Payment recorded in full, still requires validation unless explicitly marked
                $paiement->status = $paiement->status === 'valide' ? 'valide' : 'en_validation';
            }
        }
        $paiement->save();
        return response()->json(['data' => $paiement]);
    }
    // POST /paiements/{paiement}/valider -> mark as validated
    public function valider(BailPaiement $paiement, Request $request)
    {
        // Expect amount_paid already set (during creation or update)
        if ($paiement->amount_paid === null) {
            $paiement->amount_paid = $paiement->amount_due; // assume full if not specified
        }
        $paiement->status = 'valide';
        $paiement->paid_at = now();
        $paiement->method = $request->input('method');
        $paiement->reference = $request->input('reference');
        if ($request->hasFile('cheque_image')) {
            $file = $request->file('cheque_image');
            $path = $file->store('cheques', 'public');
            $paiement->cheque_image_path = $path;
        }
        $paiement->save();
        return response()->json(['data' => $paiement]);
    }

    // GET /baux/paiements-pending?month=YYYY-MM
    public function pending(Request $request)
    {
        try {
            $monthStr = $request->query('month');
            $month = $monthStr ? Carbon::parse($monthStr.'-01') : Carbon::now();
            $year = (int)$month->format('Y');
            $m = (int)$month->format('n');

            // Fetch active baux expected to pay monthly
            $baux = Bail::with(['unite.proprietaires','locataire'])
                ->whereNull('date_resiliation')
                ->get();

            $results = [];
            foreach ($baux as $bail) {
                // Find payment record for this period
                $p = BailPaiement::where('bail_id', $bail->id)
                    ->where('period_year', $year)
                    ->where('period_month', $m)
                    ->first();
                $isPaid = $p && $p->status === 'valide';
                $ownerName = null;
                if ($bail->unite && $bail->unite->proprietaires) {
                    $firstOwner = $bail->unite->proprietaires->first();
                    $ownerName = $firstOwner?->nom_raison;
                }
                $results[] = [
                    'bail_id' => $bail->id,
                    'reference' => $bail->numero_bail ?? ('Bail#'.$bail->id),
                    'proprietaire' => $ownerName,
                    'unite' => ($bail->unite->numero_unite ?? $bail->unite->reference ?? null),
                    'locataire' => ($bail->locataire->nom ?? $bail->locataire->raison_sociale ?? null),
                    'month' => $month->format('Y-m'),
                    'paiement' => $p,
                    'is_paid' => $isPaid,
                ];
            }

            // Unpaid first, then paid
            usort($results, function($a,$b){
                return ($a['is_paid'] <=> $b['is_paid']);
            });

            return response()->json(['data' => $results]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'pending_list_failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}