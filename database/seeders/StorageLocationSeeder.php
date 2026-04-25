<?php

namespace Database\Seeders;

use App\Models\StorageLocation;
use Illuminate\Database\Seeder;

class StorageLocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locations = [
            [
                'name' => 'Main Store',
                'code' => 'MAIN-ST',
                'type' => 'main_store',
                'address' => 'Ground Floor, Block A',
                'is_active' => true,
            ],
            [
                'name' => 'Central Pharmacy',
                'code' => 'PHARM-CENT',
                'type' => 'pharmacy',
                'address' => 'First Floor, OPD Building',
                'is_active' => true,
            ],
            [
                'name' => 'Laboratory Store',
                'code' => 'LAB-ST',
                'type' => 'laboratory',
                'address' => 'Basement, Diagnostics Wing',
                'is_active' => true,
            ],
            [
                'name' => 'Ward 1 Store',
                'code' => 'WARD-1-ST',
                'type' => 'ward_store',
                'address' => 'Second Floor, Ward 1',
                'is_active' => true,
            ],
        ];

        foreach ($locations as $location) {
            StorageLocation::firstOrCreate(['code' => $location['code']], $location);
        }
    }
}
