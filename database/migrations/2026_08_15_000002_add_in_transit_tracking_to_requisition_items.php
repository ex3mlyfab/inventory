<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requisition_items', function (Blueprint $table) {
            $table->integer('quantity_in_transit')->default(0)->after('quantity_issued');
            $table->integer('quantity_received')->default(0)->after('quantity_in_transit');
        });
    }

    public function down(): void
    {
        Schema::table('requisition_items', function (Blueprint $table) {
            $table->dropColumn(['quantity_in_transit', 'quantity_received']);
        });
    }
};
