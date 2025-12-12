<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RemiseCle extends Model
{
    use HasFactory;

    protected $table = 'remises_cles';

    protected $fillable = [
        'bail_id',
        'date_remise',
        'cles',
        'remarques',
        'statut',
        'doc_content',
        'doc_variables',
        'doc_template_key',
    ];

    protected $casts = [
        'date_remise' => 'datetime',
        'cles' => 'array',
        'doc_variables' => 'array',
    ];

    public function bail()
    {
        return $this->belongsTo(Bail::class, 'bail_id');
    }
}
