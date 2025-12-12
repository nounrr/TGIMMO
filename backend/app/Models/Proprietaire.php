<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class Proprietaire extends Model
{
    use HasFactory, HasDocuments;

    protected $table = 'proprietaires';

    protected $fillable = [
        'nom_raison',
        'nom_ar',
        'prenom_ar',
        'cin',
        'rc',
        'chiffre_affaires',
        'ice',
        'ifiscale',
        'adresse',
        'adresse_ar',
        'ville',
        'telephone',
        'email',
        'rib',
        'representant_nom',
        'representant_fonction',
        'representant_cin',
        'type_proprietaire',
        'statut',
        'taux_gestion',
        'assiette_honoraires',
        'periodicite_releve',
        'conditions_particulieres',
    ];

    protected $casts = [
        'telephone' => 'array',
        'taux_gestion' => 'decimal:2',
        'chiffre_affaires' => 'decimal:2',
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
