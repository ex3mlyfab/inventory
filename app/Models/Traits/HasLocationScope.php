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

            // Super Admin bypasses all scoping via super_admin permission.
            if ($user->hasPermissionTo('super_admin')) {
                return;
            }

            // User is assigned to a specific location: scope all queries to it.
            if ($user->storage_location_id) {
                $column = (new static)->getTable() === 'storage_locations' ? 'id' : 'storage_location_id';
                $builder->where($column, $user->storage_location_id);
                return;
            }

            // Unassigned user: only system-wide permission holders can see all records.
            // Everyone else (Store Officer, Pharmacist, Location Manager without an
            // assigned store, etc.) receives an empty result set until they are
            // assigned to a location by a Super Admin.
            if (
                ! $user->hasPermissionTo('locations.view') &&
                ! $user->hasPermissionTo('locations.manage') &&
                ! $user->hasPermissionTo('locations.view_all')
            ) {
                $builder->whereRaw('0 = 1'); // Empty result — blocked until assigned.
            }

            // Unassigned user with location management permissions (e.g. Inventory Manager)
            // falls through with no scope applied — they see everything.
        });
    }
}

