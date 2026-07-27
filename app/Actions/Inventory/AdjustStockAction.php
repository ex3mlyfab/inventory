<?php

namespace App\Actions\Inventory;

use App\Models\StockAdjustment;
use App\Models\StockBatch;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class AdjustStockAction
{
    public function execute(StockAdjustment $adjustment, string $approverId): void
    {
        DB::transaction(function () use ($adjustment, $approverId) {
            // Re-acquire adjustment with a write lock and re-check status inside
            // the transaction boundary to prevent two simultaneous approvals
            // from double-applying the same quantity adjustment.
            $adjustment = StockAdjustment::lockForUpdate()->findOrFail($adjustment->id);

            if ($adjustment->status !== 'pending') {
                throw new \Exception('This adjustment has already been processed by another session.');
            }

            // Lock the batch row so no concurrent stock operation can read a
            // stale quantity_on_hand while this adjustment is being written.
            $batch = StockBatch::lockForUpdate()->findOrFail($adjustment->stock_batch_id);

            $balanceBefore = $batch->quantity_on_hand;
            $quantity      = $adjustment->quantity;
            $balanceAfter  = $balanceBefore + $quantity;

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
