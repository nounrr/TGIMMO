<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MandatGestion extends Model
{
    use HasFactory;

    protected $table = 'mandats_gestion';

    protected $fillable = [
        'unite_id',
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

    public function unite()
    {
        return $this->belongsTo(Unite::class, 'unite_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function avenants()
    {
        return $this->hasMany(AvenantMandat::class, 'mandat_id');
    }

    // Get proprietaires through unite's ownership records
    public function proprietaires()
    {
        return $this->hasManyThrough(
            Proprietaire::class,
            UniteProprietaire::class,
            'unite_id', // Foreign key on unites_proprietaires table
            'id', // Foreign key on proprietaires table
            'unite_id', // Local key on mandats_gestion table
            'proprietaire_id' // Local key on unites_proprietaires table
        )->where('unites_proprietaires.mandat_id', $this->id);
    }

    // Backward compatibility: get first proprietaire
    public function proprietaire()
    {
        return $this->proprietaires()->limit(1);
    }
}
