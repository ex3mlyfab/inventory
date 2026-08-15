<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only add indexes that don't already exist
        $reqIndexes = collect(\Illuminate\Support\Facades\Schema::getIndexes('requisitions'))->pluck('name')->toArray();
        
        if (!in_array('req_type_status_idx', $reqIndexes)) {
            Schema::table('requisitions', function (Blueprint $table) {
                $table->index(['type', 'status'], 'req_type_status_idx');
            });
        }
        
        if (!in_array('req_dept_status_idx', $reqIndexes)) {
            Schema::table('requisitions', function (Blueprint $table) {
                $table->index(['requesting_department_id', 'status'], 'req_dept_status_idx');
            });
        }

        $smIndexes = collect(\Illuminate\Support\Facades\Schema::getIndexes('stock_movements'))->pluck('name')->toArray();
        
        if (!in_array('sm_reference_idx', $smIndexes)) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->index(['reference_type', 'reference_id'], 'sm_reference_idx');
            });
        }
        
        if (!in_array('sm_requisition_item_idx', $smIndexes)) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->index(['requisition_item_id'], 'sm_requisition_item_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropIndex('req_type_status_idx');
            $table->dropIndex('req_dept_status_idx');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('sm_reference_idx');
            $table->dropIndex('sm_requisition_item_idx');
        });
    }
};
