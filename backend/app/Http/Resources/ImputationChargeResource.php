<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImputationChargeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'impute_a' => $this->impute_a,
            'id_impute' => $this->id_impute,
            'payer_type' => $this->payer_type,
            'payer_id' => $this->payer_id,
            'montant' => $this->montant,
            'titre' => $this->titre,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
