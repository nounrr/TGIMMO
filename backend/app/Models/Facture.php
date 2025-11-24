<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use HasFactory;

    protected $fillable = ['intervention_id','prestataire_id','numero','date','due_date','montant_ht','tva','total_ttc','status','paid_at'];

    protected $casts = [
        'date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'date',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    public function intervention() { return $this->belongsTo(Intervention::class); }
    public function prestataire() { return $this->belongsTo(Prestataire::class); }
    public function documents() { return $this->morphMany(GedDocument::class, 'documentable'); }
}
