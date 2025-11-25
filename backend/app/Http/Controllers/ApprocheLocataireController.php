<?php

namespace App\Http\Controllers;

use App\Models\ApprocheLocataire;
use App\Traits\HandlesStatusPermissions;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprocheLocataireController extends Controller
{
    use HandlesStatusPermissions;

    public function __construct()
    {
        $this->middleware('permission:approches-locataires.view')->only(['index', 'show']);
        $this->middleware('permission:approches-locataires.create')->only(['store']);
        $this->middleware('permission:approches-locataires.update')->only(['update']);
        $this->middleware('permission:approches-locataires.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = ApprocheLocataire::with('locataire');
        
        // Appliquer le filtrage par statut selon les permissions
        $query = $this->applyStatusPermissions($query, 'approches-locataires');

        if ($request->filled('locataire_id')) {
            $query->where('locataire_id', $request->get('locataire_id'));
        }
        if ($sortBy = $request->query('sort_by')) {
            $direction = $request->query('order', 'asc');
            if (in_array($sortBy, ['created_at', 'updated_at', 'description', 'statut'])) {
                $query->orderBy($sortBy, $direction);
            }
        } else {
            $query->orderByDesc('id');
        }
        return JsonResource::collection($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request)
    {
        $this->authorize('create', \App\Models\ApprocheLocataire::class);
        if (!$request->user() || !$request->user()->can('approches-locataires.create')) {
            return response()->json([
                'error' => 'forbidden',
                'message' => 'Vous n\'avez pas la permission de créer une approche locataire.',
                'required' => 'approches-locataires.create'
            ], 403);
        }
        $data = $request->validate([
            'locataire_id' => 'required|exists:locataires,id',
            'description' => 'nullable|string',
            'statut' => 'nullable|string',
        ]);

        $approche = ApprocheLocataire::create($data);
        return response()->json($approche, 201);
    }

    public function show($id)
    {
        $approche = ApprocheLocataire::with('locataire')->findOrFail($id);
        return response()->json($approche);
    }

    public function update(Request $request, $id)
    {
        $approche = ApprocheLocataire::findOrFail($id);
        $data = $request->validate([
            'locataire_id' => 'sometimes|exists:locataires,id',
            'description' => 'nullable|string',
            'statut' => 'nullable|string',
        ]);
        $approche->update($data);
        return response()->json($approche);
    }

    public function destroy($id)
    {
        $approche = ApprocheLocataire::findOrFail($id);
        $approche->delete();
        return response()->json(['message' => 'Approche supprimée']);
    }
}
