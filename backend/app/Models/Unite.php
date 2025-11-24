<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unite extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero_unite',
        'adresse_complete',
        'coordonnees_gps',
        'immeuble',
        'bloc',
        'etage',
        'type_unite',
        'superficie_m2',
        'nb_pieces',
        'nb_sdb',
        'nb_appartements',
        'equipements',
        'mobilier',
        'statut',
    ];

    protected $casts = [
        'superficie_m2' => 'decimal:2',
        'nb_pieces' => 'integer',
        'nb_sdb' => 'integer',
        'date_entree_actuelle' => 'date',
    ];

    public function locataireActuel()
    {
        return $this->belongsTo(Locataire::class, 'locataire_actuel_id');
    }

    public function proprietaires()
    {
        return $this->belongsToMany(Proprietaire::class, 'unites_proprietaires', 'unite_id', 'proprietaire_id')
            ->withPivot(['part_numerateur', 'part_denominateur', 'part_pourcent', 'date_debut', 'date_fin'])
            ->withTimestamps();
    }

    public function ownerships()
    {
        return $this->hasMany(UniteProprietaire::class, 'unite_id');
    }
}
