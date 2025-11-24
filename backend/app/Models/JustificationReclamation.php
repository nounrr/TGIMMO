<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JustificationReclamation extends Model
{
    use HasFactory;

    protected $fillable = [
        'reclamation_id', 'path', 'original_name', 'mime', 'size', 'uploaded_by'
    ];

    public function reclamation()
    {
        return $this->belongsTo(Reclamation::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
