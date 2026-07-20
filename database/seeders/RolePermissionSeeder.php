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
            'stock.allocate',
            'stock.adjust',
            'stock.transfer',
            'stock.count',
            'stock.movements.view',

            // Procurement
            'suppliers.view',
            'suppliers.create',
            'suppliers.edit',
            'suppliers.delete',
            'suppliers.manage',
            'requisitions.view',
            'requisitions.create',
            'requisitions.approve.l1',
            'requisitions.approve.l2',
            'requisitions.cancel',
            'requisitions.issue',
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.approve.l1',
            'purchase-orders.approve.l2',
            'grn.view',
            'grn.create',
            'grn.approve',



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
            'stock.view', 'stock.allocate', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel', 'requisitions.issue',
            'purchase-orders.view', 'purchase-orders.approve.l1',
            'grn.view', 'grn.create', 'grn.approve',

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
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete', 'suppliers.manage',
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel',
            'purchase-orders.view', 'purchase-orders.create',
            'grn.view', 'grn.create', 'grn.approve',
            'assets.view',
            'reports.view', 'reports.export',
        ]);

        // 3b. Procurement Supervisor
        $procurementSupervisor = Role::firstOrCreate(['name' => 'Procurement Supervisor', 'guard_name' => 'web']);
        $procurementSupervisor->syncPermissions([
            'products.view',
            'stock.view', 'stock.movements.view',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete', 'suppliers.manage',
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel',
            'purchase-orders.view', 'purchase-orders.create', 'purchase-orders.approve.l1',
            'grn.view', 'grn.create', 'grn.approve',
            'assets.view',
            'reports.view', 'reports.export',
        ]);

        // 4. Pharmacist
        $pharmacist = Role::firstOrCreate(['name' => 'Pharmacist', 'guard_name' => 'web']);
        $pharmacist->syncPermissions([
            'products.view',
            'stock.view', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'requisitions.view', 'requisitions.create', 'requisitions.cancel',

            'reports.view',
        ]);

        // 5. Ward/Dept Head
        $wardHead = Role::firstOrCreate(['name' => 'Ward/Dept Head', 'guard_name' => 'web']);
        $wardHead->syncPermissions([
            'products.view',
            'stock.view', 'stock.movements.view',
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel',

            'assets.view',
            'maintenance.view',
            'reports.view',
        ]);

        // 6. Store Officer
        $storeOfficer = Role::firstOrCreate(['name' => 'Store Officer', 'guard_name' => 'web']);
        $storeOfficer->syncPermissions([
            'products.view',
            'stock.view', 'stock.allocate', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'requisitions.view', 'requisitions.create', 'requisitions.cancel', 'requisitions.issue',
            'grn.view', 'grn.create',
            'reports.view',
        ]);

        // 7. Biomedical Engineer
        $biomedicalEngineer = Role::firstOrCreate(['name' => 'Biomedical Engineer', 'guard_name' => 'web']);
        $biomedicalEngineer->syncPermissions([
            'requisitions.view', 'requisitions.create', 'requisitions.cancel',
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
            'requisitions.view',
            'suppliers.view',
            'purchase-orders.view',
            'grn.view',

            'assets.view',
            'maintenance.view',
            'reports.view', 'reports.export',
            'audit-trail.view',
        ]);

        // 9. Medical Director
        $medicalDirector = Role::firstOrCreate(['name' => 'Medical Director', 'guard_name' => 'web']);
        $medicalDirector->syncPermissions([
            'products.view',
            'stock.view', 'stock.movements.view',
            'requisitions.view', 'requisitions.approve.l2',
            'suppliers.view',
            'purchase-orders.view', 'purchase-orders.approve.l2',
            'grn.view',
            'reports.view', 'reports.export',
            'audit-trail.view',
        ]);

        // 10. Store Manager
        $storeManager = Role::firstOrCreate(['name' => 'Store Manager', 'guard_name' => 'web']);
        $storeManager->syncPermissions([
            'products.view',
            'stock.view', 'stock.allocate', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'requisitions.view', 'requisitions.issue',
            'grn.view',
            'reports.view', 'reports.export',
            'audit-trail.view',
        ]);
    }
}
