<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update the 'type' enum in requisitions table
        // We use raw SQL because MySQL enum mutation is tricky with Laravel Blueprint
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE requisitions MODIFY COLUMN type ENUM('internal', 'purchase', 'departmental') NOT NULL DEFAULT 'internal'");
        }

        // 2. Add requesting_department_id to requisitions table
        Schema::table('requisitions', function (Blueprint $table) {
            $table->foreignUlid('requesting_department_id')
                  ->nullable()
                  ->after('requesting_location_id')
                  ->constrained('departments')
                  ->nullOnDelete();
        });

        // 3. Add quantity_on_hand to requisition_items table
        Schema::table('requisition_items', function (Blueprint $table) {
            $table->integer('quantity_on_hand')
                  ->default(0)
                  ->after('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requisition_items', function (Blueprint $table) {
            $table->dropColumn('quantity_on_hand');
        });

        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropForeign(['requesting_department_id']);
            $table->dropColumn('requesting_department_id');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE requisitions MODIFY COLUMN type ENUM('internal', 'purchase') NOT NULL DEFAULT 'internal'");
        }
    }
};
