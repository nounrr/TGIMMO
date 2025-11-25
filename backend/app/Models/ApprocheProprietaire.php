<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprocheProprietaire extends Model
{
    use HasFactory;

    protected $table = 'approche_proprietaires';

    protected $fillable = [
        'proprietaire_id',
        'description',
        'statut',
        'audio_path',
    ];

    protected $appends = ['audio_url'];

    public function getAudioUrlAttribute()
    {
        return $this->audio_path ? asset('storage/' . $this->audio_path) : null;
    }

    public function proprietaire()
    {
        return $this->belongsTo(Proprietaire::class, 'proprietaire_id');
    }
}