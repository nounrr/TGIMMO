<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AvenantMandat extends Model
{
    use HasFactory;

    protected $table = 'avenants_mandat';

    protected $fillable = [
        'mandat_id',
        'reference',
        'date_pouvoir_initial',
        'objet_resume',
        'modifs_text',
        'date_effet',
        'lieu_signature',
        'date_signature',
        'rep_b_user_id',
        'statut',
        'fichier_url',
        'created_by',
    ];

    protected $casts = [
        'date_pouvoir_initial' => 'date',
        'date_effet' => 'date',
        'date_signature' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function mandat()
    {
        return $this->belongsTo(MandatGestion::class, 'mandat_id');
    }

    public function signataireInterne()
    {
        return $this->belongsTo(User::class, 'rep_b_user_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
