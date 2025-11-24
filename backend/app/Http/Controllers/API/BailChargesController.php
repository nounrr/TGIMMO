<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Bail;
use App\Http\Resources\BailChargeMonthResource;
use Illuminate\Http\Request;

class BailChargesController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:charges.view')->only(['index']);
    }

    /**
     * Retourne les charges mensuelles agrégées pour un bail donné.
     */
    public function index(Request $request, Bail $bail)
    {
        $data = $bail->chargesMensuelles();
        return response()->json([
            'bail_id' => $bail->id,
            'charges_mensuelles' => BailChargeMonthResource::collection($data),
        ]);
    }
}
