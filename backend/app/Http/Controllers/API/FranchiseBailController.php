<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\FranchiseBail;
use App\Models\Bail;
use Illuminate\Http\Request;

class FranchiseBailController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:baux.view')->only(['index', 'show']);
        $this->middleware('permission:baux.create')->only(['store']);
        $this->middleware('permission:baux.update')->only(['update']);
        $this->middleware('permission:baux.delete')->only(['destroy']);
    }

    /**
     * Liste des franchises d'un bail
     */
    public function index(Request $request, $bailId = null)
    {
        $query = FranchiseBail::with('bail');
        
        if ($bailId) {
            $query->where('bail_id', $bailId);
        }
        
        $franchises = $query->orderBy('date_debut', 'desc')->get();
        
        return response()->json($franchises);
    }

    /**
     * Créer une nouvelle franchise
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'bail_id' => 'required|exists:baux,id',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'pourcentage_remise' => 'required|numeric|min:0|max:100',
            'motif' => 'nullable|string',
        ]);

        // Vérifier les chevauchements
        $overlaps = FranchiseBail::where('bail_id', $data['bail_id'])
            ->where(function ($q) use ($data) {
                $q->whereBetween('date_debut', [$data['date_debut'], $data['date_fin']])
                  ->orWhereBetween('date_fin', [$data['date_debut'], $data['date_fin']])
                  ->orWhere(function ($q2) use ($data) {
                      $q2->where('date_debut', '<=', $data['date_debut'])
                         ->where('date_fin', '>=', $data['date_fin']);
                  });
            })
            ->exists();

        if ($overlaps) {
            return response()->json([
                'message' => 'Cette période chevauche une franchise existante.'
            ], 422);
        }

        $franchise = FranchiseBail::create($data);

        return response()->json($franchise->load('bail'), 201);
    }

    /**
     * Afficher une franchise
     */
    public function show(FranchiseBail $franchise)
    {
        return response()->json($franchise->load('bail'));
    }

    /**
     * Mettre à jour une franchise
     */
    public function update(Request $request, FranchiseBail $franchise)
    {
        $data = $request->validate([
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'sometimes|required|date|after_or_equal:date_debut',
            'pourcentage_remise' => 'sometimes|required|numeric|min:0|max:100',
            'motif' => 'nullable|string',
        ]);

        // Vérifier les chevauchements (exclure la franchise actuelle)
        if (isset($data['date_debut']) || isset($data['date_fin'])) {
            $dateDebut = $data['date_debut'] ?? $franchise->date_debut;
            $dateFin = $data['date_fin'] ?? $franchise->date_fin;

            $overlaps = FranchiseBail::where('bail_id', $franchise->bail_id)
                ->where('id', '!=', $franchise->id)
                ->where(function ($q) use ($dateDebut, $dateFin) {
                    $q->whereBetween('date_debut', [$dateDebut, $dateFin])
                      ->orWhereBetween('date_fin', [$dateDebut, $dateFin])
                      ->orWhere(function ($q2) use ($dateDebut, $dateFin) {
                          $q2->where('date_debut', '<=', $dateDebut)
                             ->where('date_fin', '>=', $dateFin);
                      });
                })
                ->exists();

            if ($overlaps) {
                return response()->json([
                    'message' => 'Cette période chevauche une franchise existante.'
                ], 422);
            }
        }

        $franchise->update($data);

        return response()->json($franchise->load('bail'));
    }

    /**
     * Supprimer une franchise
     */
    public function destroy(FranchiseBail $franchise)
    {
        $franchise->delete();
        return response()->json(['message' => 'Franchise supprimée avec succès']);
    }

    /**
     * Calculer le loyer avec franchise pour une période
     */
    public function calculerLoyer(Request $request, $bailId)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $bail = Bail::findOrFail($bailId);
        $loyerAvecFranchise = $bail->calculerLoyerAvecFranchise($request->date);
        $franchise = $bail->getFranchiseActive($request->date);

        return response()->json([
            'bail_id' => $bailId,
            'date' => $request->date,
            'loyer_normal' => $bail->montant_loyer,
            'loyer_avec_franchise' => $loyerAvecFranchise,
            'franchise_active' => $franchise ? [
                'id' => $franchise->id,
                'pourcentage_remise' => $franchise->pourcentage_remise,
                'date_debut' => $franchise->date_debut,
                'date_fin' => $franchise->date_fin,
                'motif' => $franchise->motif,
            ] : null,
        ]);
    }
}
