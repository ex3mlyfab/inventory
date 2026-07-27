<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * Core system permissions that cannot be deleted.
     */
    protected static array $corePermissions = [
        'products.view', 'products.create', 'products.edit', 'products.delete',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'units.view', 'units.create', 'units.edit', 'units.delete',
        'locations.view', 'locations.manage',
        'stock.view', 'stock.allocate', 'stock.adjust', 'stock.approve', 'stock.transfer', 'stock.count', 'stock.movements.view',
        'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete', 'suppliers.manage',
        'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.approve.l2', 'requisitions.cancel', 'requisitions.issue',
        'purchase-orders.view', 'purchase-orders.create', 'purchase-orders.approve.l1', 'purchase-orders.approve.l2',
        'grn.view', 'grn.create', 'grn.approve',
        'assets.view', 'assets.manage',
        'maintenance.schedule', 'maintenance.view',
        'work-orders.manage',
        'calibration.manage',
        'users.manage', 'roles.manage', 'settings.manage', 'departments.manage',
        'reports.view', 'reports.export', 'audit-trail.view'
    ];

    /**
     * Store a newly created permission.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:permissions,name',
                'regex:/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/', // Enforce group.action format
            ],
        ], [
            'name.regex' => 'The permission name must be in the format: group.action (e.g. reports.publish)',
        ]);

        $permission = Permission::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        return back()->with('success', "Permission '{$permission->name}' created successfully.");
    }

    /**
     * Remove the specified permission.
     */
    public function destroy(Permission $permission)
    {
        if (in_array($permission->name, self::$corePermissions)) {
            return back()->with('error', 'Core system permissions cannot be deleted.');
        }

        $permissionName = $permission->name;
        $permission->delete();

        return back()->with('success', "Permission '{$permissionName}' deleted successfully.");
    }
}
