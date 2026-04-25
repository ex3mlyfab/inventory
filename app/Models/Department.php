<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Department extends Model
{
    use HasFactory, HasUlids, LogsActivity, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'parent_id',
        'head_user_id',
        'type',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the activity log options for this model.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'code', 'parent_id', 'head_user_id', 'type', 'is_active'])
            ->logOnlyDirty();
    }

    /**
     * Get the parent department.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * Get the child departments.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * Get the department head / supervisor.
     */
    public function head(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_user_id');
    }

    /**
     * Alias for head relationship.
     */
    public function supervisor(): BelongsTo
    {
        return $this->head();
    }

    /**
     * Get users in this department.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get storage locations in this department.
     */
    public function storageLocations(): HasMany
    {
        return $this->hasMany(StorageLocation::class);
    }
}
