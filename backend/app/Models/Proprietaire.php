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
        'nom_ar',
        'prenom_ar',
        'cin',
        'rc',
        'ice',
        'ifiscale',
        'adresse',
        'adresse_ar',
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

    public function unites()
    {
        return $this->belongsToMany(Unite::class, 'unites_proprietaires', 'proprietaire_id', 'unite_id')
            ->withPivot(['part_numerateur', 'part_denominateur', 'part_pourcent', 'date_debut', 'date_fin'])
            ->withTimestamps();
    }

    public function mandatsGestion()
    {
        return $this->hasMany(MandatGestion::class, 'proprietaire_id');
    }
}
