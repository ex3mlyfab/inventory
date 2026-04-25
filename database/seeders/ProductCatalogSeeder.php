<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockBatch;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProductCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Categories
        $pharmaceuticals = Category::create([
            'name' => 'Pharmaceuticals',
            'slug' => 'pharmaceuticals',
            'description' => 'Medicines and drugs',
            'is_active' => true,
        ]);

        $antibiotics = Category::create([
            'parent_id' => $pharmaceuticals->id,
            'name' => 'Antibiotics',
            'slug' => 'antibiotics',
            'description' => 'Antibacterial medication',
            'is_active' => true,
        ]);
        
        $analgesics = Category::create([
            'parent_id' => $pharmaceuticals->id,
            'name' => 'Analgesics',
            'slug' => 'analgesics',
            'description' => 'Pain relievers',
            'is_active' => true,
        ]);

        $consumables = Category::create([
            'name' => 'Medical Consumables',
            'slug' => 'medical-consumables',
            'description' => 'Single-use items and supplies',
            'is_active' => true,
        ]);

        $ppe = Category::create([
            'parent_id' => $consumables->id,
            'name' => 'Personal Protective Equipment',
            'slug' => 'ppe',
            'description' => 'Gloves, masks, gowns',
            'is_active' => true,
        ]);

        // 2. Seed Products
        $amx = Product::create([
            'category_id' => $antibiotics->id,
            'name' => 'Amoxicillin 500mg Capsules',
            'sku' => 'AMX-500-CAP',
            'barcode' => '8901234567890',
            'description' => 'Broad-spectrum antibiotic for bacterial infections.',
            'unit_of_measure' => 'pack',
            'reorder_level' => 20,
            'reorder_quantity' => 100,
            'is_expirable' => true,
            'requires_prescription' => true,
            'status' => 'active',
        ]);

        $pcm = Product::create([
            'category_id' => $analgesics->id,
            'name' => 'Paracetamol 500mg Tablets',
            'sku' => 'PCM-500-TAB',
            'barcode' => '8901234567891',
            'description' => 'Standard pain relief and fever reducer.',
            'unit_of_measure' => 'pack',
            'reorder_level' => 50,
            'reorder_quantity' => 200,
            'is_expirable' => true,
            'requires_prescription' => false,
            'status' => 'active',
        ]);

        $n95 = Product::create([
            'category_id' => $ppe->id,
            'name' => 'N95 Respirator Masks',
            'sku' => 'N95-MASK',
            'barcode' => '8901234567892',
            'description' => 'Filtration masks for airborne protection.',
            'unit_of_measure' => 'box',
            'reorder_level' => 10,
            'reorder_quantity' => 50,
            'is_expirable' => false,
            'requires_prescription' => false,
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $ppe->id,
            'name' => 'Surgical Gloves (Latex) Size M',
            'sku' => 'GLV-LTX-M',
            'barcode' => '8901234567893',
            'description' => 'Sterile surgical gloves size medium.',
            'unit_of_measure' => 'box',
            'reorder_level' => 30,
            'reorder_quantity' => 100,
            'is_expirable' => true,
            'requires_prescription' => false,
            'status' => 'active',
        ]);

        // 3. Seed initial Stock Batches
        StockBatch::create([
            'product_id' => $amx->id,
            'batch_number' => 'BCH-2023-A01',
            'quantity_received' => 150,
            'quantity_on_hand' => 120, // 30 consumed
            'unit_cost' => 1500.00,
            'manufacturing_date' => Carbon::now()->subMonths(6),
            'expiry_date' => Carbon::now()->addMonths(18),
            'location' => 'Main Pharmacy, Shelf A1',
            'status' => 'active',
        ]);

        StockBatch::create([
            'product_id' => $pcm->id,
            'batch_number' => 'BCH-2023-P01',
            'quantity_received' => 300,
            'quantity_on_hand' => 45, // very close to reorder level
            'unit_cost' => 500.00,
            'manufacturing_date' => Carbon::now()->subMonths(10),
            'expiry_date' => Carbon::now()->addMonths(2), // Expiring soon
            'location' => 'Outpatient Pharmacy',
            'status' => 'active',
        ]);

        StockBatch::create([
            'product_id' => $n95->id,
            'batch_number' => 'BCH-2024-N95',
            'quantity_received' => 200,
            'quantity_on_hand' => 200,
            'unit_cost' => 8500.00,
            'manufacturing_date' => Carbon::now()->subMonths(1),
            'expiry_date' => null, // non expirable
            'location' => 'Central Stores, Ward 3',
            'status' => 'active',
        ]);
    }
}
