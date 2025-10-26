<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proprietaire extends Model
{
    use HasFactory;

    protected $table = 'proprietaires';

    protected $fillable = [
        'nom_raison',
        'cin',
        'rc',
        'ice',
        'ifiscale',
        'adresse',
        'telephone',
        'email',
        'representant_nom',
        'representant_fonction',
        'representant_cin',
        'type_proprietaire',
        'statut',
        'taux_gestion_tgi_pct',
        'part_liquidation_pct',
        'conditions_particulieres',
    ];

    protected $casts = [
        'taux_gestion_tgi_pct' => 'decimal:2',
        'part_liquidation_pct' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
