<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class ImputationCharge extends Model
{
    use HasFactory, HasDocuments;

    public const IMPUTE_VALUES = ['bail','unite','intervention','reclamation','locataire','proprietaire','charge_libre'];
    public const PAYER_TYPES = ['locataire','proprietaire','societe'];

    protected $fillable = [
        'impute_a','id_impute','payer_type','payer_id','montant','notes','titre','statut_paiement','date_paiement'
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    public function imputedModel()
    {
        return match ($this->impute_a) {
            'bail' => Bail::find($this->id_impute),
            'locataire' => Locataire::find($this->id_impute),
            'proprietaire' => Proprietaire::find($this->id_impute),
            'unite' => Unite::find($this->id_impute),
            'intervention' => Intervention::find($this->id_impute),
            'reclamation' => Reclamation::find($this->id_impute),
            default => null,
        };
    }
}
