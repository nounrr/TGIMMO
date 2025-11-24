<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReclamationResource extends JsonResource
{
    /** @return array<string,mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bail_id' => $this->bail_id,
            'reclamation_type_id' => $this->reclamation_type_id,
            'description' => $this->description,
            'source' => $this->source,
            'status' => $this->status,
            'type' => $this->type ? [
                'id' => $this->type->id,
                'name' => $this->type->name,
            ] : null,
            'bail' => $this->bail ? [
                'id' => $this->bail->id,
                'numero_bail' => $this->bail->numero_bail,
            ] : null,
            'justifications' => JustificationReclamationResource::collection($this->whenLoaded('justifications')),
            'created_at' => $this->created_at,
        ];
    }
}
