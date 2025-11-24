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
        $this->middleware('permission:paiements.view')->only(['index', 'show']);
        $this->middleware('permission:paiements.create')->only(['store']);
        $this->middleware('permission:paiements.update')->only(['update']);
        $this->middleware('permission:paiements.delete')->only(['destroy']);
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
}