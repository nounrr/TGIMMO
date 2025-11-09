<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Prestataire;
use Illuminate\Http\Request;

class PrestataireController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:prestataires.view')->only(['index', 'show']);
        $this->middleware('permission:prestataires.create')->only(['store']);
        $this->middleware('permission:prestataires.update')->only(['update']);
        $this->middleware('permission:prestataires.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $q = Prestataire::query();

        // Recherche globale
        if ($s = $request->query('q')) {
            $q->where(function ($w) use ($s) {
                $w->where('nom_raison', 'like', "%{$s}%")
                  ->orWhere('domaine_activite', 'like', "%{$s}%")
                  ->orWhere('contact_nom', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('telephone', 'like', "%{$s}%")
                  ->orWhere('rc', 'like', "%{$s}%")
                  ->orWhere('ice', 'like', "%{$s}%");
            });
        }

        // Filtre par domaine d'activité
        if ($domaine = $request->query('domaine_activite')) {
            $q->where('domaine_activite', 'like', "%{$domaine}%");
        }

        // Tri sécurisé
        $sortBy = $request->query('sort_by');
        $sortDir = strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['nom_raison', 'domaine_activite', 'contact_nom', 'email', 'telephone', 'created_at'];
        if ($sortBy && in_array($sortBy, $allowedSorts, true)) {
            $q->orderBy($sortBy, $sortDir);
        } else {
            $q->orderBy('nom_raison', 'asc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $q->paginate($perPage);
        return response()->json($result);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request);
        $prestataire = Prestataire::create($data);
        return response()->json($prestataire, 201);
    }

    public function show(Prestataire $prestataire)
    {
        return response()->json($prestataire);
    }

    public function update(Request $request, Prestataire $prestataire)
    {
        $data = $this->validatedData($request, false);
        $prestataire->fill($data)->save();
        return response()->json($prestataire);
    }

    public function destroy(Prestataire $prestataire)
    {
        $prestataire->delete();
        return response()->json(null, 204);
    }

    private function validatedData(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'nom_raison' => ['required', 'string', 'max:200'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'rc' => ['nullable', 'string', 'max:50'],
            'ifiscale' => ['nullable', 'string', 'max:50'],
            'ice' => ['nullable', 'string', 'max:50'],
            'domaine_activite' => ['nullable', 'string', 'max:150'],
            'contact_nom' => ['nullable', 'string', 'max:150'],
            'rib' => ['nullable', 'string', 'max:100'],
        ]);
    }
}
