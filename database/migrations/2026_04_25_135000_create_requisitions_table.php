<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requisitions', function (Blueprint $table) {
            $table->ulid('id')->primary();

            // Type discriminator
            $table->enum('type', ['internal', 'purchase'])->default('internal');

            // Reference number (auto-generated)
            $table->string('reference', 60)->unique()->index();

            // Requester (the person who raised it)
            $table->foreignUlid('requested_by')->constrained('users')->restrictOnDelete();

            // Approver (filled on approval/rejection)
            $table->foreignUlid('approved_by')->nullable()->constrained('users')->nullOnDelete();

            // ── Internal Requisition ──────────────────────────────────────
            // The store that is REQUESTING the stock
            $table->foreignUlid('requesting_location_id')
                  ->nullable()
                  ->constrained('storage_locations')
                  ->nullOnDelete();

            // The store that will ISSUE / supply the stock
            $table->foreignUlid('issuing_location_id')
                  ->nullable()
                  ->constrained('storage_locations')
                  ->nullOnDelete();

            // ── Purchase Requisition ──────────────────────────────────────
            // Optional: suggested supplier for a purchase requisition
            $table->foreignUlid('supplier_id')
                  ->nullable()
                  ->constrained('suppliers')
                  ->nullOnDelete();

            // Purpose / justification
            $table->text('purpose')->nullable();

            // Required by date
            $table->date('required_by')->nullable();

            // Workflow status
            $table->enum('status', [
                'draft',
                'submitted',
                'approved',
                'partially_issued',
                'issued',
                'rejected',
                'cancelled',
            ])->default('draft');

            // Rejection / approval notes
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('requisition_items', function (Blueprint $table) {
            $table->ulid('id')->primary();

            $table->foreignUlid('requisition_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained()->restrictOnDelete();

            $table->integer('quantity_requested');
            $table->integer('quantity_approved')->default(0);
            $table->integer('quantity_issued')->default(0);

            // Unit cost estimate (for purchase requisitions)
            $table->decimal('estimated_unit_cost', 10, 2)->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisition_items');
        Schema::dropIfExists('requisitions');
    }
};
