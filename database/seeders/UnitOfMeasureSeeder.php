<?php

namespace Database\Seeders;

use App\Models\UnitOfMeasure;
use Illuminate\Database\Seeder;

class UnitOfMeasureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Base Units
        $tablet = UnitOfMeasure::create([
            'name' => 'Tablet',
            'abbreviation' => 'tab',
            'base_unit_id' => null,
            'conversion_factor' => 1.0000,
        ]);

        $capsule = UnitOfMeasure::create([
            'name' => 'Capsule',
            'abbreviation' => 'cap',
            'base_unit_id' => null,
            'conversion_factor' => 1.0000,
        ]);

        $vial = UnitOfMeasure::create([
            'name' => 'Vial',
            'abbreviation' => 'vl',
            'base_unit_id' => null,
            'conversion_factor' => 1.0000,
        ]);

        $ampoule = UnitOfMeasure::create([
            'name' => 'Ampoule',
            'abbreviation' => 'amp',
            'base_unit_id' => null,
            'conversion_factor' => 1.0000,
        ]);

        $bottle = UnitOfMeasure::create([
            'name' => 'Bottle',
            'abbreviation' => 'btl',
            'base_unit_id' => null,
            'conversion_factor' => 1.0000,
        ]);

        $piece = UnitOfMeasure::create([
            'name' => 'Piece',
            'abbreviation' => 'pc',
            'base_unit_id' => null,
            'conversion_factor' => 1.0000,
        ]);

        // Hierarchical Units (Tablets)
        UnitOfMeasure::create([
            'name' => 'Pack of 10',
            'abbreviation' => 'pk10',
            'base_unit_id' => $tablet->id,
            'conversion_factor' => 10.0000,
        ]);

        UnitOfMeasure::create([
            'name' => 'Pack of 30',
            'abbreviation' => 'pk30',
            'base_unit_id' => $tablet->id,
            'conversion_factor' => 30.0000,
        ]);

        UnitOfMeasure::create([
            'name' => 'Box of 100',
            'abbreviation' => 'bx100',
            'base_unit_id' => $tablet->id,
            'conversion_factor' => 100.0000,
        ]);

        // Hierarchical Units (Pieces)
        UnitOfMeasure::create([
            'name' => 'Box of 50',
            'abbreviation' => 'bx50',
            'base_unit_id' => $piece->id,
            'conversion_factor' => 50.0000,
        ]);

        UnitOfMeasure::create([
            'name' => 'Carton of 12',
            'abbreviation' => 'ctn12',
            'base_unit_id' => $bottle->id,
            'conversion_factor' => 12.0000,
        ]);
    }
}
