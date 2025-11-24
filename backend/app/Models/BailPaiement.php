<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BailPaiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'bail_id','period_month','period_year','due_date','amount_due','amount_paid','status','paid_at','method','reference','notes','cheque_image_path'
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'period_month' => 'integer',
        'period_year' => 'integer'
    ];

    public function bail()
    {
        return $this->belongsTo(Bail::class);
    }

    public function scopeForYear($q, $year) { return $q->where('period_year', $year); }
    public function scopeForMonth($q, $month) { return $q->where('period_month', $month); }
    public function scopePaid($q) { return $q->where('status','paid'); }
}