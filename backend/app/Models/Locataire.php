<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class Locataire extends Model
{
    use HasFactory, HasDocuments;

    protected $table = 'locataires';

    protected $fillable = [
        'type_personne',
        'nom',
        'nom_ar',
        'prenom',
        'prenom_ar',
        'raison_sociale',
        'date_naissance',
        'lieu_naissance',
        'date_creation_entreprise',
        'nationalite',
        'situation_familiale',
        'nb_personnes_foyer',
        'cin',
        'rc',
        'ice',
        'ifiscale',
        'adresse_bien_loue',
        'adresse_actuelle',
        'adresse_ar',
        'ville',
        'telephone',
        'email',
        'profession_activite',
        'employeur_denomination',
        'employeur_adresse',
        'type_contrat',
        'revenu_mensuel_net',
        'chiffre_affaires_dernier_ex',
        'exercice_annee',
        'anciennete_mois',
        'references_locatives',
        'statut',
    ];

    protected $casts = [
        'telephone' => 'array',
        'date_naissance' => 'date',
        'date_creation_entreprise' => 'date',
        'revenu_mensuel_net' => 'decimal:2',
        'chiffre_affaires_dernier_ex' => 'decimal:2',
        'exercice_annee' => 'integer',
        'anciennete_mois' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function baux()
    {
        return $this->hasMany(Bail::class);
    }

    public function bauxActifs()
    {
        return $this->hasMany(Bail::class)->where('statut', 'actif');
    }
}
