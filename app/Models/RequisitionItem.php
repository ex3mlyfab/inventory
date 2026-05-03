<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequisitionItem extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'requisition_id',
        'product_id',
        'quantity_requested',
        'quantity_on_hand',
        'quantity_used',
        'quantity_approved',
        'quantity_issued',
        'estimated_unit_cost',
        'notes',
    ];

    protected $casts = [
        'estimated_unit_cost' => 'decimal:2',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
