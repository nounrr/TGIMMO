<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reception extends Model
{
    use HasFactory;

    protected $fillable = ['intervention_id','recepteur_type','recepteur_id','date_reception','statut','observations'];

    protected $casts = [
        'date_reception' => 'date',
    ];

    public function intervention() { return $this->belongsTo(Intervention::class); }
}
