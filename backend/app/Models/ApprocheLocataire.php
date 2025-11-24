<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprocheLocataire extends Model
{
    use HasFactory;

    protected $table = 'approche_locataires';

    protected $fillable = [
        'locataire_id',
        'description',
        'statut',
    ];

    public function locataire()
    {
        return $this->belongsTo(Locataire::class, 'locataire_id');
    }
}