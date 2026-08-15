<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            DELETE t1 FROM stock_batches t1
            INNER JOIN stock_batches t2
                ON t1.storage_location_id = t2.storage_location_id
                AND t1.product_id = t2.product_id
                AND t1.batch_number = t2.batch_number
                AND (
                    (t1.expiry_date IS NULL AND t2.expiry_date IS NULL)
                    OR t1.expiry_date = t2.expiry_date
                )
            WHERE t1.id > t2.id
        ");

        Schema::table('stock_batches', function (Blueprint $table) {
            $table->unique(
                ['storage_location_id', 'product_id', 'batch_number', 'expiry_date'],
                'stock_batches_location_product_batch_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropUnique('stock_batches_location_product_batch_unique');
        });
    }
};