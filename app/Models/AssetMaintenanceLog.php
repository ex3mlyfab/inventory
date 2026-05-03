<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetMaintenanceLog extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'asset_id', 'type', 'performed_at', 'next_due_at', 
        'performed_by', 'cost', 'notes', 'status'
    ];

    protected $casts = [
        'performed_at' => 'date',
        'next_due_at' => 'date',
        'cost' => 'decimal:2',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
