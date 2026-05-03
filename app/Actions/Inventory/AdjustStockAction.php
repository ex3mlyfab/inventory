<?php

namespace App\Actions\Inventory;

use App\Models\StockAdjustment;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class AdjustStockAction
{
    public function execute(StockAdjustment $adjustment, string $approverId): void
    {
        DB::transaction(function () use ($adjustment, $approverId) {
            $batch = $adjustment->batch;
            
            $balanceBefore = $batch->quantity_on_hand;
            $quantity = $adjustment->quantity;
            $balanceAfter = $balanceBefore + $quantity;

            // Apply to batch
            $batch->update([
                'quantity_on_hand' => $balanceAfter,
                'status' => $balanceAfter <= 0 ? 'exhausted' : $batch->status
            ]);

            // Create stock movement record
            StockMovement::create([
                'stock_batch_id' => $batch->id,
                'user_id' => $approverId,
                'type' => 'adjustment',
                'quantity' => $quantity,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference_type' => StockAdjustment::class,
                'reference_id' => $adjustment->id,
                'notes' => 'Adjustment (Reason: ' . $adjustment->reason . ')'
            ]);

            // Mark adjustment as approved
            $adjustment->update([
                'status' => 'approved',
                'approved_by' => $approverId
            ]);
        });
    }
}
