<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MandatGestion;
use Illuminate\Http\Request;

class MandatGestionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:mandats.view')->only(['index', 'show']);
        $this->middleware('permission:mandats.create')->only(['store']);
        $this->middleware('permission:mandats.update')->only(['update']);
        $this->middleware('permission:mandats.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = MandatGestion::query()->with(['proprietaire']);

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('lieu_signature', 'like', "%{$search}%");
            });
        }

        if ($proprietaireId = $request->query('proprietaire_id')) {
            $query->where('proprietaire_id', $proprietaireId);
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        if ($from = $request->query('date_debut_from')) {
            $query->whereDate('date_debut', '>=', $from);
        }
        if ($to = $request->query('date_debut_to')) {
            $query->whereDate('date_debut', '<=', $to);
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $query->paginate($perPage);

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request, true);
        // Always set the creator from the authenticated user
        $data['created_by'] = $request->user()->id;
        $mandat = MandatGestion::create($data);
        return response()->json($mandat->load('proprietaire'), 201);
    }

    public function show(MandatGestion $mandats_gestion)
    {
        // Route model binding will inject the record when using apiResource with parameter name
        return response()->json($mandats_gestion->load('proprietaire'));
    }

    public function update(Request $request, MandatGestion $mandats_gestion)
    {
        $data = $this->validatedData($request, false, $mandats_gestion->id);
        $mandats_gestion->update($data);
        return response()->json($mandats_gestion->load('proprietaire'));
    }

    public function destroy(MandatGestion $mandats_gestion)
    {
        $mandats_gestion->delete();
        return response()->json(null, 204);
    }

    private function validatedData(Request $request, bool $creating, ?int $id = null): array
    {
        $uniqueRef = 'unique:mandats_gestion,reference';
        if (!$creating && $id) {
            $uniqueRef = 'unique:mandats_gestion,reference,' . $id;
        }

        return $request->validate([
            'proprietaire_id'    => ['required', 'exists:proprietaires,id'],
            'reference'          => ['nullable', 'string', 'max:80', $uniqueRef],
            'date_debut'         => ['required', 'date'],
            'date_fin'           => ['nullable', 'date', 'after_or_equal:date_debut'],
            'taux_gestion_pct'   => ['nullable', 'numeric', 'between:0,100'],
            'assiette_honoraires'=> ['required', 'in:loyers_encaisse,loyers_factures'],
            'tva_applicable'     => ['nullable', 'boolean'],
            'tva_taux'           => ['nullable', 'numeric', 'between:0,100'],
            'frais_min_mensuel'  => ['nullable', 'numeric'],
            'periodicite_releve' => ['nullable', 'in:mensuel,trimestriel,annuel'],
            'charge_maintenance' => ['nullable', 'in:proprietaire,gestionnaire,locataire,mixte'],
            'mode_versement'     => ['nullable', 'in:virement,cheque,especes,prelevement'],
            'description_bien'   => ['nullable', 'string'],
            'usage_bien'         => ['nullable', 'in:habitation,commercial,professionnel,autre'],
            'pouvoirs_accordes'  => ['nullable', 'string'],
            'lieu_signature'     => ['nullable', 'string', 'max:120'],
            'date_signature'     => ['nullable', 'date'],
            'langue'             => ['nullable', 'in:ar,fr,ar_fr'],
            'notes_clauses'      => ['nullable', 'string'],
            'statut'             => ['nullable', 'in:brouillon,en_validation,signe,actif,resilie'],
        ]);
    }
}
