<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\UnitOfMeasure;
use App\Models\StorageLocation;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProductCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // Fetch common Units of Measure
        // $pk10 = UnitOfMeasure::where('abbreviation', 'pk10')->first()?->id;
        // $pk30 = UnitOfMeasure::where('abbreviation', 'pk30')->first()?->id;
        // $bx50 = UnitOfMeasure::where('abbreviation', 'bx50')->first()?->id;
        // $tablet = UnitOfMeasure::where('abbreviation', 'tab')->first()?->id;

        // Fetch common Storage Locations
        // $mainStore = StorageLocation::where('code', 'MAIN-ST')->first()?->id;
        // $pharmacy = StorageLocation::where('code', 'PHARM-CENT')->first()?->id;

        // 1. Seed Categories
        $pharmaceuticals = Category::updateOrCreate(['slug' => 'pharmaceuticals'], [
            'name' => 'Pharmaceuticals',
            'description' => 'Medicines and drugs',
            'is_active' => true,
        ]);

        $antibiotics = Category::updateOrCreate(['slug' => 'antibiotics'], [
            'parent_id' => $pharmaceuticals->id,
            'name' => 'Antibiotics',
            'description' => 'Antibacterial medication',
            'is_active' => true,
        ]);
        
        $analgesics = Category::updateOrCreate(['slug' => 'analgesics'], [
            'parent_id' => $pharmaceuticals->id,
            'name' => 'Analgesics',
            'description' => 'Pain relievers',
            'is_active' => true,
        ]);

        $consumables = Category::updateOrCreate(['slug' => 'medical-consumables'], [
            'name' => 'Medical Consumables',
            'description' => 'Single-use items and supplies',
            'is_active' => true,
        ]);

        $ppe = Category::updateOrCreate(['slug' => 'ppe'], [
            'parent_id' => $consumables->id,
            'name' => 'Personal Protective Equipment',
            'description' => 'Gloves, masks, gowns',
            'is_active' => true,
        ]);

        // // 2. Seed Products
        // $amx = Product::updateOrCreate(['sku' => 'AMX-500-CAP'], [
        //     'category_id' => $antibiotics->id,
        //     'name' => 'Amoxicillin 500mg Capsules',
        //     'barcode' => '8901234567890',
        //     'description' => 'Broad-spectrum antibiotic for bacterial infections.',
        //     'unit_of_measure_id' => $pk10,
        //     'reorder_level' => 20,
        //     'reorder_quantity' => 100,
        //     'is_expirable' => true,
        //     'requires_prescription' => true,
        //     'status' => 'active',
        // ]);

        // $pcm = Product::updateOrCreate(['sku' => 'PCM-500-TAB'], [
        //     'category_id' => $analgesics->id,
        //     'name' => 'Paracetamol 500mg Tablets',
        //     'barcode' => '8901234567891',
        //     'description' => 'Standard pain relief and fever reducer.',
        //     'unit_of_measure_id' => $pk30,
        //     'reorder_level' => 50,
        //     'reorder_quantity' => 200,
        //     'is_expirable' => true,
        //     'requires_prescription' => false,
        //     'status' => 'active',
        // ]);

        // $n95 = Product::updateOrCreate(['sku' => 'N95-MASK'], [
        //     'category_id' => $ppe->id,
        //     'name' => 'N95 Respirator Masks',
        //     'barcode' => '8901234567892',
        //     'description' => 'Filtration masks for airborne protection.',
        //     'unit_of_measure_id' => $bx50,
        //     'reorder_level' => 10,
        //     'reorder_quantity' => 50,
        //     'is_expirable' => false,
        //     'requires_prescription' => false,
        //     'status' => 'active',
        // ]);

        // $gloves = Product::updateOrCreate(['sku' => 'GLV-LTX-M'], [
        //     'category_id' => $ppe->id,
        //     'name' => 'Surgical Gloves (Latex) Size M',
        //     'barcode' => '8901234567893',
        //     'description' => 'Sterile surgical gloves size medium.',
        //     'unit_of_measure_id' => $bx50,
        //     'reorder_level' => 30,
        //     'reorder_quantity' => 100,
        //     'is_expirable' => true,
        //     'requires_prescription' => false,
        //     'status' => 'active',
        // ]);

        // // 3. Seed initial Stock Batches
        // StockBatch::updateOrCreate(['batch_number' => 'BCH-2023-A01'], [
        //     'product_id' => $amx->id,
        //     'quantity_received' => 150,
        //     'quantity_on_hand' => 120, // 30 consumed
        //     'unit_cost' => 1500.00,
        //     'manufacturing_date' => Carbon::now()->subMonths(6),
        //     'expiry_date' => Carbon::now()->addMonths(18),
        //     'storage_location_id' => $pharmacy,
        //     'location' => 'Shelf A1',
        //     'status' => 'active',
        // ]);

        // StockBatch::updateOrCreate(['batch_number' => 'BCH-2023-P01'], [
        //     'product_id' => $pcm->id,
        //     'quantity_received' => 300,
        //     'quantity_on_hand' => 45, // very close to reorder level
        //     'unit_cost' => 500.00,
        //     'manufacturing_date' => Carbon::now()->subMonths(10),
        //     'expiry_date' => Carbon::now()->addMonths(2), // Expiring soon
        //     'storage_location_id' => $pharmacy,
        //     'location' => 'Counter B12',
        //     'status' => 'active',
        // ]);

        // StockBatch::updateOrCreate(['batch_number' => 'BCH-2024-N95'], [
        //     'product_id' => $n95->id,
        //     'quantity_received' => 200,
        //     'quantity_on_hand' => 200,
        //     'unit_cost' => 8500.00,
        //     'manufacturing_date' => Carbon::now()->subMonths(1),
        //     'expiry_date' => null, // non expirable
        //     'storage_location_id' => $mainStore,
        //     'location' => 'Medical Consumables Section',
        //     'status' => 'active',
        // ]);
    }
}
