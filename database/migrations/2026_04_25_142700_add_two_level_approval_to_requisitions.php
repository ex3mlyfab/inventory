<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add level-1 and level-2 approval tracking columns
        Schema::table('requisitions', function (Blueprint $table) {
            $table->foreignUlid('level1_approved_by')
                  ->nullable()->after('approved_by')
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('level1_approved_at')->nullable()->after('level1_approved_by');
            $table->text('level1_notes')->nullable()->after('level1_approved_at');

            $table->foreignUlid('level2_approved_by')
                  ->nullable()->after('level1_notes')
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('level2_approved_at')->nullable()->after('level2_approved_by');
            $table->text('level2_notes')->nullable()->after('level2_approved_at');
        });

        // 2. Extend the status enum to include 'level1_approved'
        // MySQL requires ALTER COLUMN to change enum; we do it via raw SQL
        DB::statement("ALTER TABLE requisitions MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'level1_approved',
            'approved',
            'partially_issued',
            'issued',
            'rejected',
            'cancelled'
        ) NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\User::class, 'level1_approved_by');
            $table->dropColumn(['level1_approved_by', 'level1_approved_at', 'level1_notes']);
            $table->dropForeignIdFor(\App\Models\User::class, 'level2_approved_by');
            $table->dropColumn(['level2_approved_by', 'level2_approved_at', 'level2_notes']);
        });

        // Revert enum (drop level1_approved)
        DB::statement("ALTER TABLE requisitions MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'approved',
            'partially_issued',
            'issued',
            'rejected',
            'cancelled'
        ) NOT NULL DEFAULT 'draft'");
    }
};
