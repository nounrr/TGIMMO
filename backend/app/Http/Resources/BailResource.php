<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero_bail' => $this->numero_bail,
            
            // Relations
            'locataire_id' => $this->locataire_id,
            'locataire' => [
                'id' => $this->locataire?->id,
                'type' => $this->locataire?->type,
                'nom' => $this->locataire?->nom,
                'prenom' => $this->locataire?->prenom,
                'raison_sociale' => $this->locataire?->raison_sociale,
                'email' => $this->locataire?->email,
                'telephone' => $this->locataire?->telephone,
            ],
            
            'unite_id' => $this->unite_id,
            'unite' => [
                'id' => $this->unite?->id,
                'numero_unite' => $this->unite?->numero_unite,
                'reference' => $this->unite?->reference,
                'type_unite' => $this->unite?->type_unite,
                'adresse_complete' => $this->unite?->adresse_complete,
                'superficie_m2' => $this->unite?->superficie_m2,
                'nb_pieces' => $this->unite?->nb_pieces,
                'nb_sdb' => $this->unite?->nb_sdb,
                'equipements' => $this->unite?->equipements ? explode(',', $this->unite->equipements) : [],
                'statut' => $this->unite?->statut,
            ],

            
            // Dates et durée
            'date_debut' => $this->date_debut?->format('Y-m-d'),
            'date_fin' => $this->date_fin?->format('Y-m-d'),
            'duree' => $this->duree,
            
            // Aspects financiers
            'montant_loyer' => $this->montant_loyer,
            'charges' => $this->charges,
            'depot_garantie' => $this->depot_garantie,
            'loyer_total' => $this->loyer_total,
            'mode_paiement' => $this->mode_paiement,
            
            // Renouvellement et clauses
            'renouvellement_auto' => $this->renouvellement_auto,
            'clause_particuliere' => $this->clause_particuliere,
            
            // Équipements et observations
            'equipements' => $this->equipements,
            'observations' => $this->observations,
            
            // Statut
            'statut' => $this->statut,
            
            // Métadonnées
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
