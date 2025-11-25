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
        'audio_path',
    ];

    protected $appends = ['audio_url'];

    public function getAudioUrlAttribute()
    {
        return $this->audio_path ? asset('storage/' . $this->audio_path) : null;
    }

    public function locataire()
    {
        return $this->belongsTo(Locataire::class, 'locataire_id');
    }
}