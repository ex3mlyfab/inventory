<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(RolePermissionSeeder::class);

        // Seed Units of Measure
        $this->call(UnitOfMeasureSeeder::class);

        // Seed Storage Locations
        $this->call(StorageLocationSeeder::class);

        // Create Super Admin user
        $superAdmin = User::factory()->create([
            'name' => 'System Administrator',
            'username' => 'admin',
            'email' => 'admin@fmc.gov.ng',
            'employee_id' => 'FMC-ADMIN-001',
            'is_active' => true,
        ]);
        $superAdmin->assignRole('Super Admin');

        // Create a test user for each role
        $testUsers = [
            ['name' => 'Inventory Manager', 'username' => 'inventory', 'email' => 'inventory@fmc.gov.ng', 'employee_id' => 'FMC-INV-001', 'role' => 'Inventory Manager', 'location' => 'MAIN-ST'],
            ['name' => 'Procurement Officer', 'username' => 'procurement', 'email' => 'procurement@fmc.gov.ng', 'employee_id' => 'FMC-PROC-001', 'role' => 'Procurement Officer', 'location' => null],
            ['name' => 'Chief Pharmacist', 'username' => 'pharmacy', 'email' => 'pharmacy@fmc.gov.ng', 'employee_id' => 'FMC-PHARM-001', 'role' => 'Pharmacist', 'location' => 'PHARM-CENT'],
            ['name' => 'Ward Head - Surgery', 'username' => 'ward.surgery', 'email' => 'ward.surgery@fmc.gov.ng', 'employee_id' => 'FMC-WARD-001', 'role' => 'Ward/Dept Head', 'location' => 'WARD-1-ST'],
            ['name' => 'Store Officer', 'username' => 'store', 'email' => 'store@fmc.gov.ng', 'employee_id' => 'FMC-STORE-001', 'role' => 'Store Officer', 'location' => 'MAIN-ST'],
            ['name' => 'Biomedical Engineer', 'username' => 'biomed', 'email' => 'biomed@fmc.gov.ng', 'employee_id' => 'FMC-BIOMED-001', 'role' => 'Biomedical Engineer', 'location' => null],
            ['name' => 'Internal Auditor', 'username' => 'auditor', 'email' => 'auditor@fmc.gov.ng', 'employee_id' => 'FMC-AUDIT-001', 'role' => 'Auditor', 'location' => null],
        ];

        foreach ($testUsers as $data) {
            $locationId = null;
            if (isset($data['location'])) {
                $locationId = \App\Models\StorageLocation::where('code', $data['location'])->first()?->id;
            }

            $user = User::factory()->create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'employee_id' => $data['employee_id'],
                'storage_location_id' => $locationId,
                'is_active' => true,
            ]);
            $user->assignRole($data['role']);
        }

        // Seed initial products and stock
        $this->call(ProductCatalogSeeder::class);
    }
}
