<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'contact_person',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'tax_id',
        'category',
        'status',
        'description',
    ];

    public function stockBatches(): HasMany
    {
        return $this->hasMany(StockBatch::class);
    }

    public function products(): HasManyThrough
    {
        return $this->hasManyThrough(Product::class, StockBatch::class, 'supplier_id', 'id', 'id', 'product_id');
    }
}
