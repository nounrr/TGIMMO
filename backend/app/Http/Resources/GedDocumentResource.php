<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GedDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category,
            'original_name' => $this->original_name,
            'mime' => $this->mime,
            'size' => $this->size,
            'url' => $this->path ? url('storage/'.$this->path) : null,
        ];
    }
}
