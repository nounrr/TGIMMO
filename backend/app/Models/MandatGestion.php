<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class MandatGestion extends Model
{
    use HasFactory, HasDocuments;

    protected $table = 'mandats_gestion';

    protected $fillable = [
        'mandat_id',
        'date_debut',
        'date_fin',
        'statut',
        'reference',
        'created_by',
        'doc_content',
        'doc_variables',
        'doc_template_key',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'doc_variables' => 'array',
    ];

    public function unites()
    {
        return $this->belongsToMany(Unite::class, 'mandat_unites', 'mandat_id', 'unite_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
