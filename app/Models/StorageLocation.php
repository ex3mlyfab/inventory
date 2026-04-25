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
use App\Models\Traits\HasLocationScope;

class StorageLocation extends Model
{
    use HasFactory, HasUlids, LogsActivity, SoftDeletes, HasLocationScope;

    protected $fillable = [
        'name',
        'code',
        'type',
        'department_id',
        'address',
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
            ->logOnly(['name', 'code', 'type', 'department_id', 'is_active'])
            ->logOnlyDirty();
    }

    /**
     * Get the department this location belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the users assigned to this location.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
