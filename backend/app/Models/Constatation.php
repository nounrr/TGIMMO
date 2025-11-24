<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Constatation extends Model
{
    use HasFactory;

    protected $fillable = ['intervention_id','date_constat','agent_nom','notes'];

    public function intervention() { return $this->belongsTo(Intervention::class); }
}
