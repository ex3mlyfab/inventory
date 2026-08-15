<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->foreignUlid('source_batch_id')
                ->nullable()
                ->after('storage_location_id')
                ->constrained('stock_batches')
                ->nullOnDelete();

            // Plain index for now; promote to unique AFTER legacy dedupe.
            $table->index(['storage_location_id', 'source_batch_id'], 'sb_location_source_idx');
        });
    }

    public function down(): void
    {
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropIndex('sb_location_source_idx');
            $table->dropConstrainedForeignId('source_batch_id');
        });
    }
};
