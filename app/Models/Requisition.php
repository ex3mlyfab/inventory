<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Requisition extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'type',
        'reference',
        'requested_by',
        'approved_by',       // legacy – kept for backward compat, mirrors level2_approved_by
        'requesting_location_id',
        'issuing_location_id',
        'requesting_department_id',
        'supplier_id',
        'purpose',
        'required_by',
        'status',
        'notes',
        'release_form_path',
        // Level 1
        'level1_approved_by',
        'level1_approved_at',
        'level1_notes',
        // Level 2
        'level2_approved_by',
        'level2_approved_at',
        'level2_notes',
    ];

    protected $casts = [
        'required_by'        => 'date',
        'level1_approved_at' => 'datetime',
        'level2_approved_at' => 'datetime',
    ];

    // ── Relationships ───────────────────────────────────────────────────

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** Legacy single approver — mirrors level2 approver */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function level1Approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'level1_approved_by');
    }

    public function level2Approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'level2_approved_by');
    }

    /** The store requesting the stock (internal only) */
    public function requestingLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class, 'requesting_location_id');
    }

    /** The department requesting the stock (departmental only) */
    public function requestingDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'requesting_department_id');
    }

    /** The store that will issue/supply the stock (internal & departmental) */
    public function issuingLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class, 'issuing_location_id');
    }

    /** Suggested supplier (purchase only) */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RequisitionItem::class);
    }

    // ── Stage Helpers ────────────────────────────────────────────────────

    public function isInternal(): bool
    {
        return $this->type === 'internal';
    }

    public function isDepartmental(): bool
    {
        return $this->type === 'departmental';
    }

    public function isPurchase(): bool
    {
        return $this->type === 'purchase';
    }

    /** True if a requisition can still be cancelled (not yet actioned beyond L1) */
    public function isPending(): bool
    {
        return in_array($this->status, ['draft', 'submitted']);
    }

    /** Returns which approval stage is awaiting action, or null if none */
    public function currentApprovalStage(): ?string
    {
        return match ($this->status) {
            'submitted'      => 'level1',
            'level1_approved' => 'level2',
            default          => null,
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

    /**
     * Check if a given user is the expected Level 1 approver for this requisition.
     *
     * Internal → dept head of the requesting location's department
     * Purchase → Procurement Officer or Inventory Manager
     */
    public function isExpectedLevel1Approver(User $user): bool
    {
        if ($this->isInternal() || $this->isDepartmental()) {
            // Load the department and check head_user_id
            $deptId = $this->isInternal() 
                ? $this->requestingLocation?->department_id 
                : $this->requesting_department_id;

            if (! $deptId) return false;

            $department = Department::find($deptId);
            
            // Allow if user is explicit department head
            if ($department?->head_user_id === $user->id) {
                return true;
            }

            // Allow if user belongs to the department AND has the Ward/Dept Head role
            if ($user->department_id === $deptId && $user->hasRole('Ward/Dept Head')) {
                return true;
            }

            return false;
        }

        // Purchase: Procurement Officer or Inventory Manager
        return $user->hasAnyRole(['Procurement Officer', 'Inventory Manager']);
    }

    /**
     * Check if a given user is the expected Level 2 approver (always Medical Director).
     */
    public function isExpectedLevel2Approver(User $user): bool
    {
        return $user->hasRole('Medical Director');
    }
}
