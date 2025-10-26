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
        'immeuble',
        'bloc',
        'etage',
        'type_unite',
        'superficie_m2',
        'nb_pieces',
        'nb_sdb',
        'equipements',
        'mobilier',
        'statut',
        'locataire_actuel_id',
        'bail_actuel_id',
        'date_entree_actuelle',
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
}
