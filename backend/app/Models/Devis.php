<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class Devis extends Model
{
    use HasFactory, HasDocuments;

    protected $table = 'devis';

    protected $fillable = [
        'intervention_id','prestataire_id','numero','date_proposition','montant_ht','tva','total_ttc','valid_until','status'
    ];

    protected $casts = [
        'date_proposition' => 'date',
        'valid_until' => 'date',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    public function intervention() { return $this->belongsTo(Intervention::class); }
    public function prestataire() { return $this->belongsTo(Prestataire::class); }
    // Documents handled via HasDocuments trait
}
