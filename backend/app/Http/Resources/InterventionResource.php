<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InterventionResource extends JsonResource
{
    /** @return array<string,mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bail' => $this->bail ? [ 
                'id' => $this->bail->id, 
                'numero_bail' => $this->bail->numero_bail,
                'unite' => $this->bail->unite, // Changed from bien to unite
                'locataire' => $this->bail->locataire 
            ] : null,
            'prestataire' => $this->prestataire ? [ 'id' => $this->prestataire->id, 'nom' => $this->prestataire->nom ] : null,
            'reclamation' => $this->reclamation ? [ 'id' => $this->reclamation->id ] : null,

            'demandeur_nom_societe' => $this->demandeur_nom_societe,
            'demandeur_service' => $this->demandeur_service,
            'demandeur_telephone' => $this->demandeur_telephone,
            'demandeur_email' => $this->demandeur_email,

            'date_demande' => $this->date_demande,
            'urgence' => $this->urgence,
            'nature_probleme' => $this->nature_probleme,
            'localisation' => $this->localisation,
            'symptomes' => $this->symptomes,
            'pieces_materiel' => $this->pieces_materiel,
            'actions_effectuees' => $this->actions_effectuees,
            'date_planifiee' => $this->date_planifiee,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
