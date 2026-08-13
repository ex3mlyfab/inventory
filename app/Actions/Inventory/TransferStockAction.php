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
            // Re-fetch with an exclusive row lock so two concurrent transfers
            // cannot both read the same quantity_on_hand and both pass the
            // sufficiency check, which would silently produce negative stock.
            $sourceBatch = StockBatch::lockForUpdate()->findOrFail($sourceBatch->id);
            $balanceBeforeSource = $sourceBatch->quantity_on_hand;
            $balanceAfterSource  = $balanceBeforeSource - $quantity;

            if ($balanceAfterSource < 0) {
                throw new \Exception("Insufficient stock in source batch.");
            }

            // 1. Deduct from Source Batch
            $sourceBatch->update([
                'quantity_on_hand' => $balanceAfterSource,
                'status' => $balanceAfterSource <= 0 ? 'exhausted' : $sourceBatch->status
            ]);

            // 2. Add/Create Target Batch
            $batchQuery = StockBatch::lockForUpdate()
                ->where('storage_location_id', $targetLocationId)
                ->where('product_id', $sourceBatch->product_id)
                ->where('batch_number', $sourceBatch->batch_number);

            if ($sourceBatch->expiry_date) {
                $batchQuery->where('expiry_date', $sourceBatch->expiry_date);
            } else {
                $batchQuery->whereNull('expiry_date');
            }

            $targetBatch = $batchQuery->first();

            if (! $targetBatch) {
                $targetBatch = StockBatch::create([
                    'storage_location_id' => $targetLocationId,
                    'product_id' => $sourceBatch->product_id,
                    'batch_number' => $sourceBatch->batch_number,
                    'expiry_date' => $sourceBatch->expiry_date,
                    'quantity_on_hand' => 0,
                    'quantity_received' => 0,
                    'unit_cost' => $sourceBatch->unit_cost,
                    'status' => 'active',
                ]);
            }

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
