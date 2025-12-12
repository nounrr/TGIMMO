<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class Intervention extends Model
{
    use HasFactory, HasDocuments;

    protected $fillable = [
        'bail_id', 'prestataire_id', 'reclamation_id',
        'demandeur_nom_societe', 'demandeur_service', 'demandeur_telephone', 'demandeur_email',
        'date_demande', 'urgence',
        'nature_probleme', 'localisation', 'symptomes', 'pieces_materiel',
        'actions_effectuees', 'date_planifiee', 'status', 'charge',
    ];

    protected $casts = [
        'date_demande' => 'date',
        'date_planifiee' => 'date',
        'charge' => 'decimal:2',
    ];

    public function bail() { return $this->belongsTo(Bail::class); }
    public function prestataire() { return $this->belongsTo(Prestataire::class); }
    public function reclamation() { return $this->belongsTo(Reclamation::class); }
}
