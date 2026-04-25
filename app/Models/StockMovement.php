<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'stock_batch_id', 'user_id', 'type', 'quantity', 
        'balance_before', 'balance_after', 'reference_type', 
        'reference_id', 'notes'
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class, 'stock_batch_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
