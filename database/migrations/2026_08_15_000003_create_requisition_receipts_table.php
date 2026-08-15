<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requisition_receipts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('requisition_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('requisition_item_id')->constrained();
            $table->foreignUlid('received_by')->constrained('users');
            $table->foreignUlid('source_stock_movement_id')->constrained('stock_movements');
            $table->integer('quantity_received');
            $table->integer('quantity_short')->default(0);
            $table->string('shortage_reason')->nullable();
            $table->timestamps();

            $table->index(['requisition_id', 'created_at']);
            $table->index(['source_stock_movement_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisition_receipts');
    }
};
