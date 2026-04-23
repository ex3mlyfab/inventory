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

        // Create Super Admin user
        $superAdmin = User::factory()->create([
            'name' => 'System Administrator',
            'email' => 'admin@fmc.gov.ng',
            'employee_id' => 'FMC-ADMIN-001',
            'is_active' => true,
        ]);
        $superAdmin->assignRole('Super Admin');

        // Create a test user for each role
        $testUsers = [
            ['name' => 'Inventory Manager', 'email' => 'inventory@fmc.gov.ng', 'employee_id' => 'FMC-INV-001', 'role' => 'Inventory Manager'],
            ['name' => 'Procurement Officer', 'email' => 'procurement@fmc.gov.ng', 'employee_id' => 'FMC-PROC-001', 'role' => 'Procurement Officer'],
            ['name' => 'Chief Pharmacist', 'email' => 'pharmacy@fmc.gov.ng', 'employee_id' => 'FMC-PHARM-001', 'role' => 'Pharmacist'],
            ['name' => 'Ward Head - Surgery', 'email' => 'ward.surgery@fmc.gov.ng', 'employee_id' => 'FMC-WARD-001', 'role' => 'Ward/Dept Head'],
            ['name' => 'Store Officer', 'email' => 'store@fmc.gov.ng', 'employee_id' => 'FMC-STORE-001', 'role' => 'Store Officer'],
            ['name' => 'Biomedical Engineer', 'email' => 'biomed@fmc.gov.ng', 'employee_id' => 'FMC-BIOMED-001', 'role' => 'Biomedical Engineer'],
            ['name' => 'Internal Auditor', 'email' => 'auditor@fmc.gov.ng', 'employee_id' => 'FMC-AUDIT-001', 'role' => 'Auditor'],
        ];

        foreach ($testUsers as $data) {
            $user = User::factory()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'employee_id' => $data['employee_id'],
                'is_active' => true,
            ]);
            $user->assignRole($data['role']);
        }
    }
}
