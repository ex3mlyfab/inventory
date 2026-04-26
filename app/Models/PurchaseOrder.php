<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'requisition_id',
        'supplier_id',
        'po_number',
        'total_amount',
        'status',
        'notes',
        'created_by',
        'level1_approved_by',
        'level1_approved_at',
        'level1_notes',
        'level2_approved_by',
        'level2_approved_at',
        'level2_notes',
    ];

    protected $casts = [
        'total_amount'       => 'decimal:2',
        'level1_approved_at' => 'datetime',
        'level2_approved_at' => 'datetime',
    ];

    // ── Relationships ───────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function level1Approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'level1_approved_by');
    }

    public function level2Approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'level2_approved_by');
    }

    // ── Stage Helpers ────────────────────────────────────────────────────

    public function currentApprovalStage(): ?string
    {
        return match ($this->status) {
            'submitted'       => 'level1',
            'level1_approved' => 'level2',
            default           => null,
        };
    }

    public function awaitingLevel1(): bool
    {
        return $this->status === 'submitted';
    }

    public function awaitingLevel2(): bool
    {
        return $this->status === 'level1_approved';
    }

    public function isExpectedLevel1Approver(User $user): bool
    {
        // Procurement Supervisor
        return $user->hasRole('Procurement Supervisor');
    }

    public function isExpectedLevel2Approver(User $user): bool
    {
        // Medical Director
        return $user->hasRole('Medical Director');
    }
}
