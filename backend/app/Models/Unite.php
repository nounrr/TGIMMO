<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class Unite extends Model
{
    use HasFactory, HasDocuments;

    protected $fillable = [
        'numero_unite',
        'adresse_complete',
        'titre_foncier',
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
        'taux_gestion_pct',
        'frais_min_mensuel',
        'description_bien',
        'pouvoirs_accordes',
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

    public function mandats()
    {
        return $this->belongsToMany(MandatGestion::class, 'mandat_unites', 'unite_id', 'mandat_id');
    }

    public function activeMandats()
    {
        return $this->belongsToMany(MandatGestion::class, 'mandat_unites', 'unite_id', 'mandat_id')
            ->whereIn('mandats_gestion.statut', ['actif', 'en_attente', 'modifier', 'signe'])
            ->orderBy('mandats_gestion.created_at', 'desc');
    }

    public function getActiveMandatAttribute()
    {
        return $this->activeMandats->first();
    }

    public function proprietaires()
    {
        return $this->belongsToMany(Proprietaire::class, 'unites_proprietaires', 'unite_id', 'proprietaire_id')
                    ->withPivot(['part_numerateur', 'part_denominateur', 'pourcentage', 'date_debut', 'date_fin']);
    }

    public function ownerships()
    {
        return $this->hasMany(UniteProprietaire::class, 'unite_id');
    }
}
