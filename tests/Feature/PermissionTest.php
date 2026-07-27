<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

beforeEach(function () {
    // Create the Super Admin role since the middleware expects it
    Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
});

test('guest users cannot access permission management', function () {
    $response = $this->post(route('admin.permissions.store'), ['name' => 'reports.publish']);
    $response->assertRedirect();
});

test('non-admin users cannot access permission management', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->post(route('admin.permissions.store'), ['name' => 'reports.publish'])
        ->assertForbidden();
});

test('super admin can create a new permission', function () {
    $user = User::factory()->create();
    $user->assignRole('Super Admin');
    $this->actingAs($user);

    $response = $this->post(route('admin.permissions.store'), [
        'name' => 'custom.publish',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('permissions', [
        'name' => 'custom.publish',
    ]);
});

test('permission name must be in group.action format', function () {
    $user = User::factory()->create();
    $user->assignRole('Super Admin');
    $this->actingAs($user);

    $response = $this->post(route('admin.permissions.store'), [
        'name' => 'invalidpermissionname',
    ]);

    $response->assertSessionHasErrors(['name']);
});

test('super admin cannot delete core permissions', function () {
    $user = User::factory()->create();
    $user->assignRole('Super Admin');
    $this->actingAs($user);

    // Create a core permission
    $permission = Permission::firstOrCreate(['name' => 'products.view', 'guard_name' => 'web']);

    $response = $this->delete(route('admin.permissions.destroy', $permission->id));

    $response->assertRedirect();
    $response->assertSessionHas('error', 'Core system permissions cannot be deleted.');
    $this->assertDatabaseHas('permissions', [
        'id' => $permission->id,
    ]);
});

test('super admin can delete custom permissions', function () {
    $user = User::factory()->create();
    $user->assignRole('Super Admin');
    $this->actingAs($user);

    // Create a custom permission
    $permission = Permission::create(['name' => 'custom.action', 'guard_name' => 'web']);

    $response = $this->delete(route('admin.permissions.destroy', $permission->id));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    $this->assertDatabaseMissing('permissions', [
        'id' => $permission->id,
    ]);
});
