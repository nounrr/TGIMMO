<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AvenantMandat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AvenantMandatController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:avenants.view')->only(['index', 'show']);
        $this->middleware('permission:avenants.create')->only(['store']);
        $this->middleware('permission:avenants.update')->only(['update']);
        $this->middleware('permission:avenants.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = AvenantMandat::query()->with(['mandat.proprietaire', 'signataireInterne']);

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhere('objet_resume', 'like', "%{$search}%")
                  ->orWhere('lieu_signature', 'like', "%{$search}%");
            });
        }

        if ($mandatId = $request->query('mandat_id')) {
            $query->where('mandat_id', $mandatId);
        }

        if ($statut = $request->query('statut')) {
            $query->where('statut', $statut);
        }

        if ($from = $request->query('date_effet_from')) {
            $query->whereDate('date_effet', '>=', $from);
        }
        if ($to = $request->query('date_effet_to')) {
            $query->whereDate('date_effet', '<=', $to);
        }

        $perPage = (int) $request->query('per_page', 15);
        $result = $query->paginate($perPage);
        return response()->json($result);
    }

    public function store(Request $request)
    {
        $data = $this->validatedData($request, true);
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('avenants', 'public');
            $data['fichier_url'] = Storage::disk('public')->url($path);
        }

        $avenant = AvenantMandat::create($data);
        return response()->json($avenant->load(['mandat.proprietaire', 'signataireInterne']), 201);
    }

    public function show(AvenantMandat $avenants_mandat)
    {
        return response()->json($avenants_mandat->load(['mandat.proprietaire', 'signataireInterne']));
    }

    public function update(Request $request, AvenantMandat $avenants_mandat)
    {
        $data = $this->validatedData($request, false, $avenants_mandat->id);

        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('avenants', 'public');
            $data['fichier_url'] = Storage::disk('public')->url($path);
        }

        $avenants_mandat->update($data);
        return response()->json($avenants_mandat->load(['mandat.proprietaire', 'signataireInterne']));
    }

    public function destroy(AvenantMandat $avenants_mandat)
    {
        $avenants_mandat->delete();
        return response()->json(null, 204);
    }

    private function validatedData(Request $request, bool $creating, ?int $id = null): array
    {
        $uniqueRef = 'unique:avenants_mandat,reference';
        if (!$creating && $id) {
            $uniqueRef = 'unique:avenants_mandat,reference,' . $id;
        }

        return $request->validate([
            'mandat_id'            => ['required', 'exists:mandats_gestion,id'],
            'reference'            => ['nullable', 'string', 'max:80', $uniqueRef],
            'date_pouvoir_initial' => ['nullable', 'date'],
            'objet_resume'         => ['nullable', 'string', 'max:255'],
            'modifs_text'          => ['nullable', 'string'],
            'date_effet'           => ['required', 'date'],
            'lieu_signature'       => ['nullable', 'string', 'max:120'],
            'date_signature'       => ['nullable', 'date'],
            'rep_b_user_id'        => ['required', 'exists:users,id'],
            'statut'               => ['nullable', 'in:brouillon,signe,actif,annule'],
            'fichier'              => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);
    }
}
