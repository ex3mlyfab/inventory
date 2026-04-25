<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // =============================================
        // Define all permissions grouped by module
        // =============================================
        $permissions = [
            // Products & Catalog
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.delete',
            'units.view',
            'units.create',
            'units.edit',
            'units.delete',
            'locations.manage',

            // Stock & Inventory
            'stock.view',
            'stock.adjust',
            'stock.transfer',
            'stock.count',
            'stock.movements.view',

            // Procurement
            'suppliers.view',
            'suppliers.manage',
            'requisitions.create',
            'requisitions.approve',
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.approve',
            'grn.create',
            'grn.view',

            // Dispensing
            'dispensing.view',
            'dispensing.create',
            'ward-requisitions.create',
            'ward-requisitions.approve',
            'controlled-substances.manage',

            // Equipment & Assets
            'assets.view',
            'assets.manage',
            'maintenance.schedule',
            'maintenance.view',
            'work-orders.manage',
            'calibration.manage',

            // Administration & Reports
            'users.manage',
            'roles.manage',
            'settings.manage',
            'departments.manage',
            'reports.view',
            'reports.export',
            'audit-trail.view',
        ];

        // Create all permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // =============================================
        // Create Roles and Assign Permissions
        // =============================================

        // 1. Super Admin — Bypasses all checks via Gate::before()
        Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);

        // 2. Inventory Manager
        $inventoryManager = Role::firstOrCreate(['name' => 'Inventory Manager', 'guard_name' => 'web']);
        $inventoryManager->syncPermissions([
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'units.view', 'units.create', 'units.edit', 'units.delete',
            'locations.manage',
            'stock.view', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'suppliers.view',
            'requisitions.create', 'requisitions.approve',
            'purchase-orders.view', 'purchase-orders.approve',
            'grn.view',
            'dispensing.view',
            'ward-requisitions.approve',
            'assets.view', 'assets.manage',
            'maintenance.view',
            'reports.view', 'reports.export',
            'audit-trail.view',
        ]);

        // 3. Procurement Officer
        $procurementOfficer = Role::firstOrCreate(['name' => 'Procurement Officer', 'guard_name' => 'web']);
        $procurementOfficer->syncPermissions([
            'products.view',
            'stock.view', 'stock.movements.view',
            'suppliers.view', 'suppliers.manage',
            'requisitions.create', 'requisitions.approve',
            'purchase-orders.view', 'purchase-orders.create',
            'grn.create', 'grn.view',
            'assets.view',
            'reports.view', 'reports.export',
        ]);

        // 4. Pharmacist
        $pharmacist = Role::firstOrCreate(['name' => 'Pharmacist', 'guard_name' => 'web']);
        $pharmacist->syncPermissions([
            'products.view',
            'stock.view', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'requisitions.create',
            'dispensing.view', 'dispensing.create',
            'ward-requisitions.approve',
            'controlled-substances.manage',
            'reports.view',
        ]);

        // 5. Ward/Dept Head
        $wardHead = Role::firstOrCreate(['name' => 'Ward/Dept Head', 'guard_name' => 'web']);
        $wardHead->syncPermissions([
            'products.view',
            'stock.view', 'stock.movements.view',
            'requisitions.create',
            'dispensing.view',
            'ward-requisitions.create',
            'assets.view',
            'maintenance.view',
            'reports.view',
        ]);

        // 6. Store Officer
        $storeOfficer = Role::firstOrCreate(['name' => 'Store Officer', 'guard_name' => 'web']);
        $storeOfficer->syncPermissions([
            'products.view',
            'stock.view', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'requisitions.create',
            'grn.create', 'grn.view',
            'reports.view',
        ]);

        // 7. Biomedical Engineer
        $biomedicalEngineer = Role::firstOrCreate(['name' => 'Biomedical Engineer', 'guard_name' => 'web']);
        $biomedicalEngineer->syncPermissions([
            'requisitions.create',
            'assets.view', 'assets.manage',
            'maintenance.schedule', 'maintenance.view',
            'work-orders.manage',
            'calibration.manage',
            'reports.view',
        ]);

        // 8. Auditor
        $auditor = Role::firstOrCreate(['name' => 'Auditor', 'guard_name' => 'web']);
        $auditor->syncPermissions([
            'products.view',
            'stock.view', 'stock.movements.view',
            'suppliers.view',
            'purchase-orders.view',
            'grn.view',
            'dispensing.view',
            'assets.view',
            'maintenance.view',
            'reports.view', 'reports.export',
            'audit-trail.view',
        ]);
    }
}
