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
        'date_debut',
        'date_fin',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'part_pourcent' => 'decimal:4',
    ];

    public function unite()
    {
        return $this->belongsTo(Unite::class);
    }

    public function proprietaire()
    {
        return $this->belongsTo(Proprietaire::class);
    }
}
