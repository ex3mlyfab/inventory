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
        Schema::table('requisitions', function (Blueprint $table) {
            $table->string('release_form_path')->nullable()->after('notes');
        });

        // Comprehensive status update
        if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE requisitions MODIFY COLUMN status ENUM(
                'draft',
                'submitted',
                'level1_approved',
                'approved',
                'in_transit',
                'po_created',
                'completed',
                'failed',
                'partially_issued',
                'issued',
                'rejected',
                'cancelled'
            ) NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropColumn('release_form_path');
        });

        // Revert to a safe subset if needed, though usually we don't reduce enums in down
    }
};
