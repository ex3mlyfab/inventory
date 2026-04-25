<?php

namespace App\Models\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait HasLocationScope
{
    /**
     * Boot the scope.
     */
    public static function bootHasLocationScope(): void
    {
        static::addGlobalScope('location_access', function (Builder $builder) {
            $user = Auth::user();

            if (! $user) {
                return;
            }

            // Super Admin can see everything
            if ($user->hasRole('Super Admin')) {
                return;
            }

            // If the user is assigned to a specific location, filter by it
            if ($user->storage_location_id) {
                $column = (new static)->getTable() === 'storage_locations' ? 'id' : 'storage_location_id';
                $builder->where($column, $user->storage_location_id);
            }
        });
    }
}
