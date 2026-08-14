<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (DB::getDriverName() === 'sqlite') {
                $table->string('status')->default('draft')->change();
            } else {
                DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('draft', 'submitted', 'level1_approved', 'level2_approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'draft'");
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (DB::getDriverName() === 'sqlite') {
                $table->string('status')->default('draft')->change();
            } else {
                DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'draft'");
            }
        });
    }
};
