<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GedDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'category', 'path', 'original_name', 'mime', 'size', 'uploaded_by', 'description'
    ];

    /**
     * Get all of the unites that are assigned this document.
     */
    public function unites()
    {
        return $this->morphedByMany(Unite::class, 'documentable', 'ged_documentables');
    }

    /**
     * Get all of the baux that are assigned this document.
     */
    public function baux()
    {
        return $this->morphedByMany(Bail::class, 'documentable', 'ged_documentables');
    }

    /**
     * Get all of the proprietaires that are assigned this document.
     */
    public function proprietaires()
    {
        return $this->morphedByMany(Proprietaire::class, 'documentable', 'ged_documentables');
    }

    /**
     * Get all of the locataires that are assigned this document.
     */
    public function locataires()
    {
        return $this->morphedByMany(Locataire::class, 'documentable', 'ged_documentables');
    }

    public function mandats()
    {
        return $this->morphedByMany(MandatGestion::class, 'documentable', 'ged_documentables');
    }

    public function avenants()
    {
        return $this->morphedByMany(AvenantMandat::class, 'documentable', 'ged_documentables');
    }

    public function interventions()
    {
        return $this->morphedByMany(Intervention::class, 'documentable', 'ged_documentables');
    }

    public function devis()
    {
        return $this->morphedByMany(Devis::class, 'documentable', 'ged_documentables');
    }

    public function factures()
    {
        return $this->morphedByMany(Facture::class, 'documentable', 'ged_documentables');
    }

    public function reclamations()
    {
        return $this->morphedByMany(Reclamation::class, 'documentable', 'ged_documentables');
    }

    public function imputationCharges()
    {
        return $this->morphedByMany(ImputationCharge::class, 'documentable', 'ged_documentables');
    }

    public function approcheProprietaires()
    {
        return $this->morphedByMany(ApprocheProprietaire::class, 'documentable', 'ged_documentables');
    }

    public function approcheLocataires()
    {
        return $this->morphedByMany(ApprocheLocataire::class, 'documentable', 'ged_documentables');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
