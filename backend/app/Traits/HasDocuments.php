<?php

namespace App\Traits;

use App\Models\GedDocument;

trait HasDocuments
{
    public function documents()
    {
        return $this->morphToMany(GedDocument::class, 'documentable', 'ged_documentables')
                    ->withTimestamps();
    }
}
