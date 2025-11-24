<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReclamationTypeRequest;
use App\Http\Requests\UpdateReclamationTypeRequest;
use App\Http\Resources\ReclamationTypeResource;
use App\Models\ReclamationType;
use Illuminate\Http\Request;

class ReclamationTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:reclamation-types.view')->only(['index','show']);
        $this->middleware('permission:reclamation-types.create')->only(['store']);
        $this->middleware('permission:reclamation-types.update')->only(['update']);
        $this->middleware('permission:reclamation-types.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = ReclamationType::query();
        if ($request->filled('active')) {
            $query->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }
        $types = $query->orderBy('name')->get();
        return ReclamationTypeResource::collection($types);
    }

    public function store(StoreReclamationTypeRequest $request)
    {
        $type = ReclamationType::create($request->validated());
        return new ReclamationTypeResource($type);
    }

    public function show(ReclamationType $reclamation_type)
    {
        return new ReclamationTypeResource($reclamation_type);
    }

    public function update(UpdateReclamationTypeRequest $request, ReclamationType $reclamation_type)
    {
        $reclamation_type->update($request->validated());
        return new ReclamationTypeResource($reclamation_type);
    }

    public function destroy(ReclamationType $reclamation_type)
    {
        $reclamation_type->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
