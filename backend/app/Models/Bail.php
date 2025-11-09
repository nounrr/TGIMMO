<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bail extends Model
{
    use HasFactory;

    protected $table = 'baux';

    protected $fillable = [
        'numero_bail',
        'locataire_id',
        'unite_id',
        'date_debut',
        'date_fin',
        'duree',
        'montant_loyer',
        'charges',
        'depot_garantie',
        'mode_paiement',
        'renouvellement_auto',
        'clause_particuliere',
        'observations',
        'statut',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'montant_loyer' => 'decimal:2',
        'charges' => 'decimal:2',
        'depot_garantie' => 'decimal:2',
        'renouvellement_auto' => 'boolean',
        'duree' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec le locataire
     */
    public function locataire()
    {
        return $this->belongsTo(Locataire::class, 'locataire_id');
    }

    /**
     * Relation avec l'unité
     */
    public function unite()
    {
        return $this->belongsTo(Unite::class, 'unite_id');
    }

    /**
     * Remises de clés liées au bail
     */
    public function remisesCles()
    {
        return $this->hasMany(RemiseCle::class, 'bail_id');
    }

    /**
     * Scope pour filtrer les baux actifs
     */
    public function scopeActif($query)
    {
        return $query->where('statut', 'actif');
    }

    /**
     * Scope pour filtrer les baux résiliés
     */
    public function scopeResilie($query)
    {
        return $query->where('statut', 'resilie');
    }

    /**
     * Scope pour filtrer les baux en attente
     */
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    /**
     * Vérifier si le bail est actif
     */
    public function isActif(): bool
    {
        return $this->statut === 'actif';
    }

    /**
     * Vérifier si le bail est résilié
     */
    public function isResilie(): bool
    {
        return $this->statut === 'resilie';
    }

    /**
     * Calculer le loyer total (loyer + charges)
     */
    public function getLoyerTotalAttribute(): float
    {
        return $this->montant_loyer + $this->charges;
    }
}
