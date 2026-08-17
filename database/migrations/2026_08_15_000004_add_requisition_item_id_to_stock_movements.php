<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('stock_movements', 'requisition_item_id')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->foreignUlid('requisition_item_id')->nullable()->after('stock_batch_id')->constrained('requisition_items')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('requisition_item_id');
        });
    }
};