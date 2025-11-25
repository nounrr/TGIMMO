<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInterventionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('interventions.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'bail_id' => ['sometimes','nullable','exists:baux,id'],
            'prestataire_id' => ['sometimes','nullable','exists:prestataires,id'],
            'reclamation_id' => ['sometimes','nullable','exists:reclamations,id'],

            'demandeur_nom_societe' => ['sometimes','nullable','string','max:150'],
            'demandeur_service' => ['sometimes','nullable','string','max:150'],
            'demandeur_telephone' => ['sometimes','nullable','string','max:50'],
            'demandeur_email' => ['sometimes','nullable','email','max:150'],

            'date_demande' => ['sometimes','nullable','date'],
            'urgence' => ['sometimes','in:urgent,normal,planifie'],

            'nature_probleme' => ['sometimes','nullable','string','max:255'],
            'localisation' => ['sometimes','nullable','string','max:255'],
            'symptomes' => ['sometimes','nullable','string'],
            'pieces_materiel' => ['sometimes','nullable','string'],
            'actions_effectuees' => ['sometimes','nullable','string'],

            'date_planifiee' => ['sometimes','nullable','date'],
            'status' => ['sometimes','in:ouvert,planifie,en_cours,resolu,ferme,annule'],
        ];
    }
}
