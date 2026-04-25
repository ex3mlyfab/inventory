<?php

namespace App\Observers;

use App\Models\StockBatch;
use Illuminate\Support\Facades\Log;

class StockBatchObserver
{
    public function updated(StockBatch $stockBatch): void
    {
        if ($stockBatch->isDirty('quantity_on_hand')) {
            $product = $stockBatch->product;
            
            // Check reorder level
            if ($product->quantity_on_hand <= $product->reorder_level) {
                // Dispatch LowStockAlert to Inv Manager + Store Officer (mocked with log block for now)
                Log::info("Low stock alert for {$product->name}. Current: {$product->quantity_on_hand}");
            }
        }

        if ($stockBatch->isDirty('expiry_date') || $stockBatch->isDirty('quantity_on_hand')) {
            // Expiry logic check
            if ($stockBatch->expiry_date && $stockBatch->expiry_date->isPast() && $stockBatch->status !== 'expired') {
                $stockBatch->status = 'expired';
                $stockBatch->saveQuietly(); // Prevent infinite loop
            }
        }
    }
}
