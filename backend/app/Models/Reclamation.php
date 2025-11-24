<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reclamation extends Model
{
    use HasFactory;

    protected $fillable = [
        'bail_id', 'reclamation_type_id', 'description', 'source', 'status'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function bail()
    {
        return $this->belongsTo(Bail::class, 'bail_id');
    }

    public function type()
    {
        return $this->belongsTo(ReclamationType::class, 'reclamation_type_id');
    }

    public function justifications()
    {
        return $this->hasMany(JustificationReclamation::class);
    }
}
