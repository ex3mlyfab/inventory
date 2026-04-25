<?php

namespace App\Actions\Inventory;

use App\Models\StockBatch;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class TransferStockAction
{
    public function execute(StockBatch $sourceBatch, string $targetLocation, int $quantity, int $performerId): void
    {
        // Stub for transferring stock
        // To be fully implemented in a later phase when multiple warehouse/locations are modelled.
    }
}
