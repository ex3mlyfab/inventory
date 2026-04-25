<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('product_id')->constrained()->restrictOnDelete();
            $table->string('batch_number')->index();
            $table->string('reference')->nullable();
            $table->integer('quantity_received');
            $table->integer('quantity_on_hand');
            $table->decimal('unit_cost', 10, 2)->default(0.00);
            $table->date('manufacturing_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('location')->nullable();
            $table->enum('status', ['active', 'quarantined', 'exhausted', 'expired'])->default('active');
            $table->timestamps();
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('stock_batch_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('user_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['in', 'out', 'transfer', 'adjustment', 'disposal']);
            $table->integer('quantity'); // Positive or negative
            $table->integer('balance_before');
            $table->integer('balance_after');
            $table->string('reference_type')->nullable(); // e.g. Order, Adjustment
            $table->ulid('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('stock_batch_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('performed_by')->constrained('users');
            $table->foreignUlid('approved_by')->nullable()->constrained('users');
            $table->integer('quantity'); // Positive or negative
            $table->enum('reason', ['cycle_count', 'damage', 'expiry', 'theft', 'correction', 'other']);
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stock_batches');
    }
};
