<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\BailResource;
use App\Models\Bail;
use App\Models\Unite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;

class BailController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Bail::with(['locataire', 'unite']);

        // Filtres optionnels
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('locataire_id')) {
            $query->where('locataire_id', $request->locataire_id);
        }

        if ($request->filled('unite_id')) {
            $query->where('unite_id', $request->unite_id);
        }

        $baux = $query->orderBy('date_debut', 'desc')->paginate(20);

        return BailResource::collection($baux);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero_bail' => 'nullable|string|unique:baux,numero_bail',
            'locataire_id' => 'required|exists:locataires,id',
            'unite_id' => 'required|exists:unites,id',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'duree' => 'nullable|integer|min:1',
            'montant_loyer' => 'required|numeric|min:0',
            'charges' => 'nullable|numeric|min:0',
            'depot_garantie' => 'nullable|numeric|min:0',
            'mode_paiement' => ['required', Rule::in(['virement', 'cheque', 'especes'])],
            'renouvellement_auto' => 'boolean',
            'clause_particuliere' => 'nullable|string',
            'observations' => 'nullable|string',
            'statut' => ['nullable', Rule::in(['actif', 'en_attente', 'resilie'])],
        ]);

        // Vérifier que l'unité est disponible (statut = vacant)
        $unite = Unite::findOrFail($validated['unite_id']);
        
        if ($unite->statut !== 'vacant') {
            return response()->json([
                'message' => 'Cette unité n\'est pas disponible. Statut actuel: ' . $unite->statut,
                'errors' => [
                    'unite_id' => ['L\'unité doit avoir le statut "vacant" pour créer un bail.']
                ]
            ], 422);
        }

        // Générer un numéro de bail si non fourni
        if (empty($validated['numero_bail'])) {
            $validated['numero_bail'] = 'BAIL-' . date('Y') . '-' . str_pad(Bail::count() + 1, 5, '0', STR_PAD_LEFT);
        }

        // Définir le statut par défaut
        if (!isset($validated['statut'])) {
            $validated['statut'] = 'en_attente';
        }

        // Transaction pour créer le bail et mettre à jour l'unité
        DB::beginTransaction();
        try {
            // Créer le bail
            $bail = Bail::create($validated);

            // Mettre à jour l'unité: statut + liens locataire/bail actuels
            $unite->update([
                'statut' => 'loue',
                'locataire_actuel_id' => $bail->locataire_id,
                'bail_actuel_id' => $bail->id,
                'date_entree_actuelle' => $bail->date_debut,
            ]);

            DB::commit();

            return new BailResource($bail->load(['locataire', 'unite']));
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erreur lors de la création du bail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $bail = Bail::with(['locataire', 'unite'])->findOrFail($id);
        
        return new BailResource($bail);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $bail = Bail::findOrFail($id);

        $validated = $request->validate([
            'numero_bail' => 'nullable|string|unique:baux,numero_bail,' . $id,
            'locataire_id' => 'sometimes|exists:locataires,id',
            'unite_id' => 'sometimes|exists:unites,id',
            'type_bien' => ['sometimes', Rule::in(['appartement', 'bureau', 'local_commercial', 'autre'])],
            'adresse_bien' => 'sometimes|string|max:255',
            'superficie' => 'nullable|numeric|min:0',
            'etage_bloc' => 'nullable|string|max:50',
            'nombre_pieces' => 'nullable|integer|min:0',
            'nombre_sdb' => 'nullable|integer|min:0',
            'garage' => 'boolean',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'duree' => 'nullable|integer|min:1',
            'montant_loyer' => 'sometimes|numeric|min:0',
            'charges' => 'nullable|numeric|min:0',
            'depot_garantie' => 'nullable|numeric|min:0',
            'mode_paiement' => ['sometimes', Rule::in(['virement', 'cheque', 'especes'])],
            'renouvellement_auto' => 'boolean',
            'clause_particuliere' => 'nullable|string',
            'equipements' => 'nullable|array',
            'observations' => 'nullable|string',
            'statut' => ['sometimes', Rule::in(['actif', 'en_attente', 'resilie'])],
        ]);

        // Si le statut change à "resilie", libérer l'unité
        DB::beginTransaction();
        try {
            if (isset($validated['statut']) && $validated['statut'] === 'resilie' && $bail->statut !== 'resilie') {
                $bail->unite->update([
                    'statut' => 'vacant',
                    'locataire_actuel_id' => null,
                    'bail_actuel_id' => null,
                    'date_entree_actuelle' => null,
                ]);
            }

            $bail->update($validated);

            DB::commit();

            return new BailResource($bail->load(['locataire', 'unite']));
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du bail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $bail = Bail::findOrFail($id);

        DB::beginTransaction();
        try {
            // Libérer l'unité si le bail est actif ou en_attente relié
            if (in_array($bail->statut, ['actif','en_attente'])) {
                $bail->unite->update([
                    'statut' => 'vacant',
                    'locataire_actuel_id' => null,
                    'bail_actuel_id' => null,
                    'date_entree_actuelle' => null,
                ]);
            }

            $bail->delete();

            DB::commit();

            return response()->json([
                'message' => 'Bail supprimé avec succès'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erreur lors de la suppression du bail',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download bail as PDF
     */
    public function downloadPdf(string $id)
    {
        $bail = Bail::with(['locataire', 'unite'])->findOrFail($id);
        
        $pdf = Pdf::loadView('pdf.bail', ['bail' => $bail]);
        
        $filename = 'bail_' . $bail->numero_bail . '_' . date('Ymd') . '.pdf';
        
        return $pdf->download($filename);
    }
}
