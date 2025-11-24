<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInterventionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('interventions.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'bail_id' => ['nullable','exists:baux,id'],
            'locataire_id' => ['nullable','exists:locataires,id'],
            'proprietaire_id' => ['nullable','exists:proprietaires,id'],
            'prestataire_id' => ['nullable','exists:prestataires,id'],
            'reclamation_id' => ['nullable','exists:reclamations,id'],

            'demandeur_nom_societe' => ['nullable','string','max:150'],
            'demandeur_service' => ['nullable','string','max:150'],
            'demandeur_telephone' => ['nullable','string','max:50'],
            'demandeur_email' => ['nullable','email','max:150'],

            'date_demande' => ['nullable','date'],
            'urgence' => ['required','in:urgent,normal,planifie'],

            'nature_probleme' => ['nullable','string','max:255'],
            'localisation' => ['nullable','string','max:255'],
            'symptomes' => ['nullable','string'],
            'pieces_materiel' => ['nullable','string'],
            'actions_effectuees' => ['nullable','string'],

            'date_planifiee' => ['nullable','date'],
            'status' => ['nullable','in:ouvert,planifie,en_cours,resolu,ferme,annule'],
        ];
    }
}
