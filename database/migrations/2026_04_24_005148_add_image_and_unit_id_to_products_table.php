<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'image_path')) {
                $table->string('image_path')->nullable()->after('barcode');
            }
            
            if (Schema::hasColumn('products', 'unit_of_measure')) {
                $table->dropColumn('unit_of_measure');
            }

            if (!Schema::hasColumn('products', 'unit_of_measure_id')) {
                $table->foreignUlid('unit_of_measure_id')->nullable()->after('description')->constrained('units_of_measure')->restrictOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['unit_of_measure_id']);
            $table->dropColumn(['image_path', 'unit_of_measure_id']);
            $table->string('unit_of_measure')->default('unit')->after('description');
        });
    }
};
