<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Liquidation extends Model
{
    use HasFactory;

    protected $fillable = [
        'proprietaire_id',
        'mandat_id',
        'mois',
        'annee',
        'total_loyer',
        'total_charges',
        'total_honoraires',
        'montant_net',
        'date_liquidation',
        'statut',
        'details',
        'created_by',
    ];

    protected $casts = [
        'total_loyer' => 'decimal:2',
        'total_charges' => 'decimal:2',
        'total_honoraires' => 'decimal:2',
        'montant_net' => 'decimal:2',
        'date_liquidation' => 'date',
        'details' => 'array',
    ];

    public function proprietaire()
    {
        return $this->belongsTo(Proprietaire::class);
    }

    public function mandat()
    {
        return $this->belongsTo(MandatGestion::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
