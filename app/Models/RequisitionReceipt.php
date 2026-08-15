<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequisitionReceipt extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'requisition_id',
        'requisition_item_id',
        'received_by',
        'source_stock_movement_id',
        'quantity_received',
        'quantity_short',
        'shortage_reason',
    ];

    protected $casts = [
        'quantity_received' => 'integer',
        'quantity_short' => 'integer',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function requisitionItem(): BelongsTo
    {
        return $this->belongsTo(RequisitionItem::class, 'requisition_item_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function sourceStockMovement(): BelongsTo
    {
        return $this->belongsTo(StockMovement::class, 'source_stock_movement_id');
    }
}
