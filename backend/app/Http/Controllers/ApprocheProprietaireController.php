<?php

namespace App\Http\Controllers;

use App\Models\ApprocheProprietaire;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprocheProprietaireController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:approches-proprietaires.view')->only(['index', 'show']);
        $this->middleware('permission:approches-proprietaires.create')->only(['store']);
        $this->middleware('permission:approches-proprietaires.update')->only(['update']);
        $this->middleware('permission:approches-proprietaires.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = ApprocheProprietaire::with('proprietaire');

        $this->applyStatusPermissions($query, 'approches-proprietaires');

        if ($request->filled('proprietaire_id')) {
            $query->where('proprietaire_id', $request->get('proprietaire_id'));
        }
        if ($sortBy = $request->query('sort_by')) {
            $direction = $request->query('order', 'asc');
            if (in_array($sortBy, ['created_at', 'updated_at', 'description'])) {
                $query->orderBy($sortBy, $direction);
            }
        } else {
            $query->orderByDesc('id');
        }
        return JsonResource::collection($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request)
    {
        // Policy authorize call (will throw 403 if not allowed)
        $this->authorize('create', \App\Models\ApprocheProprietaire::class);
        // Authorize via policy for explicit backend check (secondary to middleware)
        if (!$request->user() || !$request->user()->can('approches-proprietaires.create')) {
            return response()->json([
                'error' => 'forbidden',
                'message' => 'Vous n\'avez pas la permission de créer une approche propriétaire.',
                'required' => 'approches-proprietaires.create'
            ], 403);
        }
        $data = $request->validate([
            'proprietaire_id' => 'required|exists:proprietaires,id',
            'description' => 'nullable|string',
        ]);
        $item = ApprocheProprietaire::create($data);
        return new JsonResource($item->load('proprietaire'));
    }

    public function show(ApprocheProprietaire $approcheProprietaire)
    {
        return new JsonResource($approcheProprietaire->load('proprietaire'));
    }

    public function update(Request $request, ApprocheProprietaire $approcheProprietaire)
    {
        $this->authorize('update', $approcheProprietaire);
        if (!$request->user() || !$request->user()->can('approches-proprietaires.update')) {
            return response()->json([
                'error' => 'forbidden',
                'message' => 'Vous n\'avez pas la permission de modifier cette approche propriétaire.',
                'required' => 'approches-proprietaires.update'
            ], 403);
        }
        $data = $request->validate([
            'proprietaire_id' => 'sometimes|exists:proprietaires,id',
            'description' => 'nullable|string',
        ]);
        $approcheProprietaire->update($data);
        return new JsonResource($approcheProprietaire->load('proprietaire'));
    }

    public function destroy(ApprocheProprietaire $approcheProprietaire)
    {
        $this->authorize('delete', $approcheProprietaire);
        $user = request()->user();
        if (!$user || !$user->can('approches-proprietaires.delete')) {
            return response()->json([
                'error' => 'forbidden',
                'message' => 'Vous n\'avez pas la permission de supprimer cette approche propriétaire.',
                'required' => 'approches-proprietaires.delete'
            ], 403);
        }
        $approcheProprietaire->delete();
        return response()->json(['deleted' => true]);
    }
}