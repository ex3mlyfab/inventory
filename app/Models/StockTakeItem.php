<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTakeItem extends Model
{
    use HasUlids;

    protected $fillable = [
        'stock_take_session_id', 'product_id', 'stock_batch_id', 
        'system_quantity', 'counted_quantity', 'variance'
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(StockTakeSession::class, 'stock_take_session_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class, 'stock_batch_id');
    }
}
