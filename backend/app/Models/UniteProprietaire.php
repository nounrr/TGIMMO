<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UniteProprietaire extends Model
{
    use HasFactory;

    protected $table = 'unites_proprietaires';

    protected $fillable = [
        'unite_id',
        'proprietaire_id',
        'part_numerateur',
        'part_denominateur',
        'pourcentage',
        'date_debut',
        'date_fin',
    ];

    protected $casts = [
        'pourcentage' => 'decimal:2',
    ];

    public function unite()
    {
        return $this->belongsTo(Unite::class, 'unite_id');
    }

    public function proprietaire()
    {
        return $this->belongsTo(Proprietaire::class);
    }
}
