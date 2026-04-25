<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Permission;
use App\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with their permissions.
     */
    public function index(): Response
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0]; // Group by module prefix
        });

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'permissionGroups' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $validated['name']]);
        
        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return back()->with('success', "Role '{$role->name}' created successfully.");
    }
    public function edit(Role $role): Response
    {
        $role->load('permissions');
        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return Inertia::render('admin/roles/edit', [
            'role' => $role,
            'rolePermissions' => $role->permissions->pluck('name'),
            'permissionGroups' => $permissions,
        ]);
    }

    /**
     * Update the specified role's permissions.
     */
    public function update(Request $request, Role $role)
    {
        // Prevent modifying Super Admin permissions
        if ($role->name === 'Super Admin') {
            return back()->with('error', 'Super Admin role cannot be modified.');
        }

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role->syncPermissions($validated['permissions']);

        return back()
            ->with('success', "Permissions updated for '{$role->name}' role.");
    }
}
