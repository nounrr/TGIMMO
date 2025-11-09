<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MandatGestion extends Model
{
    use HasFactory;

    protected $table = 'mandats_gestion';

    protected $fillable = [
        'proprietaire_id',
        'reference',
        'date_debut',
        'date_fin',
        'taux_gestion_pct',
        'assiette_honoraires',
        'tva_applicable',
        'tva_taux',
        'frais_min_mensuel',
        'periodicite_releve',
        'charge_maintenance',
        'mode_versement',
        'description_bien',
        'usage_bien',
        'pouvoirs_accordes',
        'lieu_signature',
        'date_signature',
        'langue',
        'notes_clauses',
        'statut',
        'created_by',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_signature' => 'date',
        'tva_applicable' => 'boolean',
        'taux_gestion_pct' => 'decimal:2',
        'tva_taux' => 'decimal:2',
        'frais_min_mensuel' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function proprietaire()
    {
    return $this->belongsTo(Proprietaire::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function avenants()
    {
        return $this->hasMany(AvenantMandat::class, 'mandat_id');
    }
}
