<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnitOfMeasure extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'abbreviation',
        'base_unit_id',
        'conversion_factor',
    ];

    protected $casts = [
        'conversion_factor' => 'decimal:4',
    ];

    /**
     * Get the base unit this UoM converts to.
     */
    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(self::class, 'base_unit_id');
    }

    /**
     * Convert a quantity from this UoM to the base UoM.
     */
    public function convertToBase(float $quantity): float
    {
        return $quantity * (float) $this->conversion_factor;
    }

    /**
     * Convert a quantity from the base UoM to this UoM.
     */
    public function convertFromBase(float $quantity): float
    {
        return $quantity / (float) $this->conversion_factor;
    }
}
