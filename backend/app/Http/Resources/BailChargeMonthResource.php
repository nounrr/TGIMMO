<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BailChargeMonthResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'mois' => $this->resource['mois'] ?? null,
            'total' => $this->resource['total'] ?? 0,
            'total_locataire' => $this->resource['total_locataire'] ?? 0,
            'total_proprietaire' => $this->resource['total_proprietaire'] ?? 0,
            'details' => collect($this->resource['details'] ?? [])->map(function ($d) {
                return [
                    'id' => $d['id'] ?? null,
                    'montant' => $d['montant'] ?? 0,
                    'charge_to' => $d['charge_to'] ?? null,
                    'notes' => $d['notes'] ?? null,
                ];
            })->values(),
        ];
    }
}
