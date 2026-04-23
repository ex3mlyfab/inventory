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
        // Departments & Wards
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->foreignId('head_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['ward', 'admin', 'support', 'clinical', 'pharmacy'])->default('admin');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Storage Locations (Main Store, Pharmacy, Satellite, Ward Store)
        Schema::create('storage_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->enum('type', ['main_store', 'pharmacy', 'satellite_pharmacy', 'ward_store', 'laboratory'])->default('main_store');
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('address')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Units of Measure with conversion hierarchy
        Schema::create('units_of_measure', function (Blueprint $table) {
            $table->id();
            $table->string('name');              // e.g., "Tablet", "Pack of 10", "Case of 100"
            $table->string('abbreviation', 10);  // e.g., "tab", "pk10", "cs100"
            $table->foreignId('base_unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
            $table->decimal('conversion_factor', 12, 4)->default(1.0000); // e.g., 1 pack = 10 tablets => 10.0
            $table->timestamps();
        });

        // Add department_id, employee_id, and is_active to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('password')->constrained()->nullOnDelete();
            $table->string('employee_id', 30)->nullable()->unique()->after('department_id');
            $table->string('phone', 20)->nullable()->after('employee_id');
            $table->boolean('is_active')->default(true)->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn(['department_id', 'employee_id', 'phone', 'is_active']);
        });

        Schema::dropIfExists('units_of_measure');
        Schema::dropIfExists('storage_locations');
        Schema::dropIfExists('departments');
    }
};
