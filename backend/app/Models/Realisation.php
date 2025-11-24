<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Realisation extends Model
{
    use HasFactory;

    protected $fillable = ['intervention_id','type','date_prevue','date_reelle','statut','cout_reel','notes'];

    protected $casts = [
        'date_prevue' => 'date',
        'date_reelle' => 'date',
        'cout_reel' => 'decimal:2',
    ];

    public function intervention() { return $this->belongsTo(Intervention::class); }
}
