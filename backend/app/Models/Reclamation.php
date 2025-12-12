<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasDocuments;

class Reclamation extends Model
{
    use HasFactory, HasDocuments;

    protected $fillable = [
        'unite_id', 'reclamation_type_id', 'description', 'source', 'status'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function unite()
    {
        return $this->belongsTo(Unite::class, 'unite_id');
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
