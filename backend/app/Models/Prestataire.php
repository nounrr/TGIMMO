<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prestataire extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom_raison',
        'adresse',
        'telephone',
        'email',
        'rc',
        'ifiscale',
        'ice',
        'domaine_activite',
        'contact_nom',
        'rib',
    ];
}
