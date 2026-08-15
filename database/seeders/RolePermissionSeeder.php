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
            'locations.view',
            'locations.manage',

            'stock.view',
            'stock.allocate',
            'stock.adjust',
            'stock.approve',
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
            'requisitions.receive',
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.edit',
            'purchase-orders.cancel',
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

            // System / Access Control
            'super_admin',
            'locations.view_all',
            'locations.assign_users',
            'stock.view_valuation',
            'requisitions.view_all',
            'requisitions.issue_any_location',
            'requisitions.receive_any_location',
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
        $superAdmin = Role::where('name', 'Super Admin')->first();
        if ($superAdmin) {
            $superAdmin->syncPermissions(Permission::all()->pluck('name')->toArray());
        }

        // 2. Inventory Manager
        $inventoryManager = Role::firstOrCreate(['name' => 'Inventory Manager', 'guard_name' => 'web']);
        $inventoryManager->syncPermissions([
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'units.view', 'units.create', 'units.edit', 'units.delete',
            'locations.view', 'locations.manage', 'locations.view_all', 'locations.assign_users',
            'stock.view', 'stock.allocate', 'stock.adjust', 'stock.approve', 'stock.transfer', 'stock.count', 'stock.movements.view', 'stock.view_valuation',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel', 'requisitions.issue', 'requisitions.receive',
            'requisitions.view_all', 'requisitions.issue_any_location', 'requisitions.receive_any_location',
            'purchase-orders.view', 'purchase-orders.create', 'purchase-orders.edit', 'purchase-orders.cancel', 'purchase-orders.approve.l1',
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
            'locations.view', 'locations.view_all',
            'stock.view', 'stock.movements.view', 'stock.view_valuation',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete', 'suppliers.manage',
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel', 'requisitions.receive',
            'requisitions.view_all', 'requisitions.issue_any_location', 'requisitions.receive_any_location',
            'purchase-orders.view', 'purchase-orders.create', 'purchase-orders.edit', 'purchase-orders.cancel',
            'grn.view', 'grn.create', 'grn.approve',
            'assets.view',
            'reports.view', 'reports.export',
        ]);

        // 3b. Procurement Supervisor
        $procurementSupervisor = Role::firstOrCreate(['name' => 'Procurement Supervisor', 'guard_name' => 'web']);
        $procurementSupervisor->syncPermissions([
            'products.view',
            'locations.view', 'locations.view_all',
            'stock.view', 'stock.movements.view', 'stock.view_valuation',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete', 'suppliers.manage',
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel',
            'requisitions.view_all',
            'purchase-orders.view', 'purchase-orders.create', 'purchase-orders.edit', 'purchase-orders.cancel', 'purchase-orders.approve.l1',
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
            'requisitions.view', 'requisitions.create', 'requisitions.approve.l1', 'requisitions.cancel', 'requisitions.receive',

            'assets.view',
            'maintenance.view',
            'reports.view',
        ]);

        // 6. Store Officer
        $storeOfficer = Role::firstOrCreate(['name' => 'Store Officer', 'guard_name' => 'web']);
        $storeOfficer->syncPermissions([
            'products.view',
            'stock.view', 'stock.allocate', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'requisitions.view', 'requisitions.create', 'requisitions.cancel', 'requisitions.issue', 'requisitions.receive',
            'grn.view', 'grn.create',
            'reports.view',
        ]);

        // 6b. Main Store Officer (operates similar to Store Officer but specifically for main stores)
        $mainStoreOfficer = Role::firstOrCreate(['name' => 'Main Store Officer', 'guard_name' => 'web']);
        $mainStoreOfficer->syncPermissions([
            'products.view',
            'stock.view', 'stock.allocate', 'stock.adjust', 'stock.transfer', 'stock.count', 'stock.movements.view',
            'requisitions.view', 'requisitions.create', 'requisitions.cancel', 'requisitions.issue', 'requisitions.receive',
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
            'locations.view', 'locations.view_all',
            'stock.view', 'stock.movements.view', 'stock.view_valuation',
            'requisitions.view', 'requisitions.view_all',
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
            'locations.view', 'locations.view_all',
            'stock.view', 'stock.movements.view', 'stock.view_valuation',
            'requisitions.view', 'requisitions.approve.l2', 'requisitions.issue', 'requisitions.receive',
            'requisitions.view_all', 'requisitions.receive_any_location',
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
            'locations.view', 'locations.view_all',
            'stock.view', 'stock.allocate', 'stock.adjust', 'stock.approve', 'stock.transfer', 'stock.count', 'stock.movements.view', 'stock.view_valuation',
            'requisitions.view', 'requisitions.issue', 'requisitions.receive',
            'requisitions.view_all', 'requisitions.issue_any_location', 'requisitions.receive_any_location',
            'grn.view',
            'reports.view', 'reports.export',
            'audit-trail.view',
        ]);

        // 11. Location Manager — operates a single assigned store.
        // Approvals escalate to Store Manager; no system-wide location management.
        $locationManager = Role::firstOrCreate(['name' => 'Location Manager', 'guard_name' => 'web']);
        $locationManager->syncPermissions([
            'products.view',
            'locations.view',             // Sees own location (scoped by HasLocationScope)
            'stock.view',
            'stock.allocate',
            'stock.adjust',
            'stock.transfer',
            'stock.count',
            'stock.movements.view',
            'requisitions.view',
            'requisitions.create',
            'requisitions.cancel',
            'requisitions.issue',
            'requisitions.receive',
            'grn.view',
            'grn.create',
            'reports.view',
        ]);
    }
}
