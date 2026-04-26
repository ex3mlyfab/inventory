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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('requisition_id')->nullable()->constrained('requisitions')->onDelete('set null');
            $table->foreignUlid('supplier_id')->constrained('suppliers');
            $table->string('po_number')->unique();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('draft'); // draft, submitted, level1_approved, level2_approved, rejected, cancelled, partial, closed
            $table->text('notes')->nullable();
            
            $table->foreignUlid('created_by')->constrained('users');
            
            // Level 1 Approval (Procurement Supervisor)
            $table->foreignUlid('level1_approved_by')->nullable()->constrained('users');
            $table->timestamp('level1_approved_at')->nullable();
            $table->text('level1_notes')->nullable();
            
            // Level 2 Approval (Medical Director)
            $table->foreignUlid('level2_approved_by')->nullable()->constrained('users');
            $table->timestamp('level2_approved_at')->nullable();
            $table->text('level2_notes')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
