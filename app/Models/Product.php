<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'category_id', 'name', 'sku', 'barcode', 'description', 
        'image_path', 'unit_of_measure_id', 'reorder_level', 'reorder_quantity', 
        'is_expirable', 'requires_prescription', 'status'
    ];

    protected $casts = [
        'is_expirable' => 'boolean',
        'requires_prescription' => 'boolean',
    ];

    protected $appends = ['quantity_on_hand', 'image_url'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function unitOfMeasure(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_of_measure_id');
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function stockBatches(): HasMany
    {
        return $this->hasMany(StockBatch::class);
    }

    public function getQuantityOnHandAttribute(): int
    {
        return $this->stockBatches()->where('status', 'active')->sum('quantity_on_hand');
    }
}
