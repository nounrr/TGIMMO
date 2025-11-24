<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_id' => $this->intervention_id,
            'prestataire' => $this->prestataire ? [ 'id' => $this->prestataire->id, 'nom' => $this->prestataire->nom ] : null,
            'numero' => $this->numero,
            'date_proposition' => $this->date_proposition,
            'montant_ht' => $this->montant_ht,
            'tva' => $this->tva,
            'total_ttc' => $this->total_ttc,
            'valid_until' => $this->valid_until,
            'status' => $this->status,
            'documents' => GedDocumentResource::collection($this->whenLoaded('documents')),
        ];
    }
}
