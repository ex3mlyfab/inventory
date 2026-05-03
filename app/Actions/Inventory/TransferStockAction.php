<?php

namespace App\Actions\Inventory;

use App\Models\StockBatch;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class TransferStockAction
{
    public function execute(StockBatch $sourceBatch, string $targetLocationId, int $quantity, string $performerId): void
    {
        DB::transaction(function () use ($sourceBatch, $targetLocationId, $quantity, $performerId) {
            $balanceBeforeSource = $sourceBatch->quantity_on_hand;
            $balanceAfterSource = $balanceBeforeSource - $quantity;

            if ($balanceAfterSource < 0) {
                throw new \Exception("Insufficient stock in source batch.");
            }

            // 1. Deduct from Source Batch
            $sourceBatch->update([
                'quantity_on_hand' => $balanceAfterSource,
                'status' => $balanceAfterSource <= 0 ? 'exhausted' : $sourceBatch->status
            ]);

            // 2. Add/Create Target Batch
            $targetBatch = StockBatch::firstOrCreate(
                [
                    'storage_location_id' => $targetLocationId,
                    'product_id' => $sourceBatch->product_id,
                    'batch_number' => $sourceBatch->batch_number,
                    'expiry_date' => $sourceBatch->expiry_date,
                ],
                [
                    'quantity_on_hand' => 0,
                    'quantity_received' => 0,
                    'unit_cost' => $sourceBatch->unit_cost,
                    'status' => 'active',
                ]
            );

            $balanceBeforeTarget = $targetBatch->quantity_on_hand;
            $balanceAfterTarget = $balanceBeforeTarget + $quantity;
            $targetBatch->increment('quantity_on_hand', $quantity);
            $targetBatch->increment('quantity_received', $quantity);

            // 3. Log Source Movement (OUT)
            StockMovement::create([
                'stock_batch_id' => $sourceBatch->id,
                'user_id' => $performerId,
                'type' => 'transfer',
                'quantity' => -$quantity,
                'balance_before' => $balanceBeforeSource,
                'balance_after' => $balanceAfterSource,
                'notes' => 'Transfer OUT to ' . $targetBatch->storageLocation?->name,
                'reference_type' => 'stock_transfer',
            ]);

            // 4. Log Target Movement (IN)
            StockMovement::create([
                'stock_batch_id' => $targetBatch->id,
                'user_id' => $performerId,
                'type' => 'transfer',
                'quantity' => $quantity,
                'balance_before' => $balanceBeforeTarget,
                'balance_after' => $balanceAfterTarget,
                'notes' => 'Transfer IN from ' . $sourceBatch->storageLocation?->name,
                'reference_type' => 'stock_transfer',
            ]);
        });
    }
}
