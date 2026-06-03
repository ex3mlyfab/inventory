<?php
/**
 * Date: 2026-05-03 00:43:00
 * Description: Update stock_movements type enum to include requisition_fulfillment
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we need to use a raw query to change the enum or just change it to string then back to enum
        // However, standard Laravel way for simple string columns is more flexible.
        // Given this is an existing enum, we'll use DB::statement for precision.
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('in', 'out', 'transfer', 'adjustment', 'disposal', 'requisition_fulfillment', 'consumption') NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('in', 'out', 'transfer', 'adjustment', 'disposal') NOT NULL");
        }
    }
};
