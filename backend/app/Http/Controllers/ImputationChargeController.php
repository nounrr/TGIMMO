<?php

namespace App\Http\Controllers;

use App\Models\ImputationCharge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ImputationChargeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:charges.view')->only(['index', 'show']);
        $this->middleware('permission:charges.create')->only(['store']);
        $this->middleware('permission:charges.update')->only(['update']);
        $this->middleware('permission:charges.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = ImputationCharge::query();

        if ($request->filled('impute_a')) {
            $query->where('impute_a',$request->impute_a);
        }
        if ($request->filled('id_impute')) {
            $query->where('id_impute',$request->id_impute);
        }

        $charges = $query->latest()->paginate(15);
        return response()->json($charges);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'montant' => 'required|numeric',
            'impute_a' => 'required|string|in:bail,unite,intervention,reclamation,locataire,proprietaire,charge_libre',
            'id_impute' => 'nullable|integer',
            'payer_type' => 'required|string|in:locataire,proprietaire,societe',
            'payer_id' => 'nullable|integer',
            'notes' => 'nullable|string',
            'titre' => 'nullable|string'
        ]);
        // Conditional validation: payer_id required if payer_type locataire/proprietaire
        $validator->after(function($v) use ($request) {
            if (in_array($request->payer_type,['locataire','proprietaire']) && empty($request->payer_id)) {
                $v->errors()->add('payer_id','payer_id est requis pour payer_type '.$request->payer_type);
            }
        });

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $charge = ImputationCharge::create($request->only(['montant','impute_a','id_impute','payer_type','payer_id','notes','titre']));
        return response()->json(['message' => 'Charge créée avec succès', 'data' => $charge], 201);
    }

    public function show($id)
    {
        $charge = ImputationCharge::with(['intervention', 'facture', 'unite', 'proprietaire', 'locataire', 'bail'])->find($id);
        if (!$charge) return response()->json(['message' => 'Charge introuvable'], 404);
        return response()->json(['data' => $charge]);
    }

    public function update(Request $request, $id)
    {
        $charge = ImputationCharge::find($id);
        if (!$charge) return response()->json(['message' => 'Charge introuvable'], 404);

        $validator = Validator::make($request->all(), [
            'montant' => 'sometimes|numeric',
            'impute_a' => 'sometimes|string|in:bail,unite,intervention,reclamation,locataire,proprietaire,charge_libre',
            'id_impute' => 'nullable|integer',
            'payer_type' => 'sometimes|string|in:locataire,proprietaire,societe',
            'payer_id' => 'nullable|integer',
            'notes' => 'nullable|string',
            'titre' => 'nullable|string'
        ]);
        $validator->after(function($v) use ($request) {
            if ($request->filled('payer_type') && in_array($request->payer_type,['locataire','proprietaire']) && empty($request->payer_id)) {
                $v->errors()->add('payer_id','payer_id est requis pour payer_type '.$request->payer_type);
            }
        });

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $charge->update($request->only(['montant','impute_a','id_impute','payer_type','payer_id','notes','titre']));
        return response()->json(['message' => 'Charge mise à jour', 'data' => $charge]);
    }

    public function destroy($id)
    {
        $charge = ImputationCharge::find($id);
        if (!$charge) return response()->json(['message' => 'Charge introuvable'], 404);
        $charge->delete();
        return response()->json(['message' => 'Charge supprimée']);
    }
}
