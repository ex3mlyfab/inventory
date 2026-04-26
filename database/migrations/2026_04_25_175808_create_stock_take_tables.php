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
        Schema::create('stock_take_sessions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('storage_location_id')->constrained();
            $table->foreignUlid('started_by')->constrained('users');
            $table->foreignUlid('completed_by')->nullable()->constrained('users');
            $table->string('status')->default('draft'); // draft, completed, cancelled
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_take_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('stock_take_session_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained();
            $table->foreignUlid('stock_batch_id')->constrained();
            $table->integer('system_quantity');
            $table->integer('counted_quantity');
            $table->integer('variance');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_take_items');
        Schema::dropIfExists('stock_take_sessions');
    }
};
