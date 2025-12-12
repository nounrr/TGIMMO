<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FranchiseBail extends Model
{
    use HasFactory;

    protected $table = 'franchise_bail';

    protected $fillable = [
        'bail_id',
        'date_debut',
        'date_fin',
        'pourcentage_remise',
        'motif',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'pourcentage_remise' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function bail()
    {
        return $this->belongsTo(Bail::class, 'bail_id');
    }

    /**
     * Vérifie si cette franchise est active pour une date donnée
     */
    public function isActiveForDate($date)
    {
        $checkDate = is_string($date) ? \Carbon\Carbon::parse($date) : $date;
        return $checkDate->greaterThanOrEqualTo($this->date_debut) 
            && $checkDate->lessThanOrEqualTo($this->date_fin);
    }

    /**
     * Calcule le montant après remise
     */
    public function calculerMontantApresRemise($montantOriginal)
    {
        $remise = ($this->pourcentage_remise / 100) * $montantOriginal;
        return $montantOriginal - $remise;
    }
}
