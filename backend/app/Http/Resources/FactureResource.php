<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'intervention_id' => $this->intervention_id,
            'prestataire' => $this->prestataire ? [ 'id' => $this->prestataire->id, 'nom' => $this->prestataire->nom ] : null,
            'numero' => $this->numero,
            'date' => $this->date,
            'due_date' => $this->due_date,
            'montant_ht' => $this->montant_ht,
            'tva' => $this->tva,
            'total_ttc' => $this->total_ttc,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'documents' => GedDocumentResource::collection($this->whenLoaded('documents')),
        ];
    }
}
