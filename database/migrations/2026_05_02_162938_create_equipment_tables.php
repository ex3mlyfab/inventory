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
        Schema::create('assets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('asset_tag')->unique();
            $table->string('serial_number')->nullable();
            $table->foreignUlid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('model_number')->nullable();
            $table->string('manufacturer')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_cost', 15, 2)->default(0.00);
            $table->date('warranty_expiry')->nullable();
            $table->enum('status', ['functional', 'under_maintenance', 'decommissioned', 'lost', 'damaged'])->default('functional');
            $table->foreignUlid('storage_location_id')->nullable()->constrained('storage_locations')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_maintenance_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('asset_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['routine', 'repair', 'calibration', 'upgrade', 'inspection'])->default('routine');
            $table->date('performed_at');
            $table->date('next_due_at')->nullable();
            $table->string('performed_by')->nullable();
            $table->decimal('cost', 12, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('completed');
            $table->timestamps();
        });

        Schema::create('work_orders', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('asset_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('requester_id')->constrained('users');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->text('description');
            $table->enum('status', ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->foreignUlid('assigned_to')->nullable()->constrained('users');
            $table->timestamp('completed_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_orders');
        Schema::dropIfExists('asset_maintenance_logs');
        Schema::dropIfExists('assets');
    }
};
