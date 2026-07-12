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
                'name' => 'DNS OFFICE STORE',
                'code' => 'DNS-OFFICE-ST',
                'type' => 'office_store',
                'address' => 'First Floor, Admin Building',
                'is_active' => true,
            ],
            [
                'name' => 'CSSD Store',
                'code' => 'CSSD-ST',
                'type' => 'cssd_store',
                'address' => 'First Floor, CSSD Building',
                'is_active' => true,
            ],
            [
                'name' => 'Theatre Store',
                'code' => 'THEATRE-ST',
                'type' => 'theatre_store',
                'address' => 'First Floor, Theatre',
                'is_active' => true,
            ],
        ];

        foreach ($locations as $location) {
            StorageLocation::firstOrCreate(['code' => $location['code']], $location);
        }
    }
}
