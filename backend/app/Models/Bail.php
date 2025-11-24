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

    /**
     * Relation avec les imputations de charges du bail
     */
    public function imputationsCharges()
    {
        // Legacy relation kept only if bail_id column still exists.
        return ImputationCharge::query()->where('impute_a','bail')->where('id_impute',$this->id);
    }

    /**
     * Agrégation mensuelle des charges du bail avec répartition locataire / propriétaire.
     * Retourne une collection de tableaux: mois, total, total_locataire, total_proprietaire, details[].
     */
    public function chargesMensuelles()
    {
        // Retrieve charges via polymorphic fields if legacy column removed.
        $charges = ImputationCharge::where('impute_a','bail')->where('id_impute',$this->id)->get();

        $grouped = $charges->groupBy(function ($c) {
            return $c->created_at ? $c->created_at->format('Y-m') : now()->format('Y-m');
        });

        return $grouped->map(function ($items, $month) {
            $totalLocataire = $items->where('payer_type', 'locataire')->sum('montant');
            $totalProprietaire = $items->where('payer_type', 'proprietaire')->sum('montant');
            return [
                'mois' => $month,
                'total' => $items->sum('montant'),
                'total_locataire' => $totalLocataire,
                'total_proprietaire' => $totalProprietaire,
                'details' => $items->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'montant' => $c->montant,
                        'payer_type' => $c->payer_type,
                        'notes' => $c->notes,
                    ];
                })->values(),
            ];
        })->values();
    }

        /**
         * Scope de recherche générique sur numero bail, locataire, unité, propriétaires.
         */
        public function scopeSearch($query, $term)
        {
                if (!trim($term)) return $query;
                $like = '%' . str_replace(['%','_'], ['',''], $term) . '%';
                return $query->where(function ($q) use ($like) {
                        $q->where('numero_bail', 'LIKE', $like)
                            ->orWhereHas('locataire', function ($l) use ($like) {
                                    $l->where('nom', 'LIKE', $like)
                                        ->orWhere('prenom', 'LIKE', $like)
                                        ->orWhere('raison_sociale', 'LIKE', $like);
                            })
                            ->orWhereHas('unite', function ($u) use ($like) {
                                    $u->where('numero_unite', 'LIKE', $like)
                                        ->orWhere('adresse_complete', 'LIKE', $like)
                                        ->orWhere('immeuble', 'LIKE', $like);
                            })
                            ->orWhereHas('unite.proprietaires', function ($p) use ($like) {
                                    $p->where('nom_raison', 'LIKE', $like)
                                        ->orWhere('cin', 'LIKE', $like)
                                        ->orWhere('rc', 'LIKE', $like);
                            });
                });
        }
}
