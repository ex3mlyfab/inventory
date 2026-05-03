<?php

namespace App\Actions\Inventory;

use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\StockBatch;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class IssueRequisitionAction
{
    /**
     * Issue items for a requisition from a specific store.
     * $issuances: array of ['requisition_item_id' => '...', 'stock_batch_id' => '...', 'quantity' => 10]
     */
    public function execute(Requisition $requisition, array $issuances, string $performerId): void
    {
        DB::transaction(function () use ($requisition, $issuances, $performerId) {
            foreach ($issuances as $issuance) {
                $reqItem = RequisitionItem::findOrFail($issuance['requisition_item_id']);
                $sourceBatch = StockBatch::findOrFail($issuance['stock_batch_id']);
                $qty = $issuance['quantity'];

                if ($sourceBatch->quantity_on_hand < $qty) {
                    throw new \Exception("Insufficient stock in batch {$sourceBatch->batch_number} for product {$reqItem->product->name}.");
                }

                // 1. Deduct from Source (Issuing Location)
                $balanceBeforeSource = $sourceBatch->quantity_on_hand;
                $balanceAfterSource = $balanceBeforeSource - $qty;
                
                $sourceBatch->update([
                    'quantity_on_hand' => $balanceAfterSource,
                    'status' => $balanceAfterSource <= 0 ? 'exhausted' : $sourceBatch->status
                ]);

                // 3. Log Source Outflow
                StockMovement::create([
                    'stock_batch_id' => $sourceBatch->id,
                    'user_id' => $performerId,
                    'type' => 'requisition_fulfillment',
                    'quantity' => -$qty,
                    'balance_before' => $balanceBeforeSource,
                    'balance_after' => $balanceAfterSource,
                    'notes' => "Issued to " . ($requisition->requestingLocation?->name ?? $requisition->requestingDepartment?->name) . " (Req: {$requisition->reference})",
                    'reference_type' => Requisition::class,
                    'reference_id' => $requisition->id
                ]);

                // 4. Update Requisition Item
                $reqItem->increment('quantity_issued', $qty);
            }

            // 5. Update Requisition Status
            $allIssued = $requisition->items->every(fn($item) => $item->quantity_issued >= $item->quantity_approved);
            $requisition->update([
                'status' => $allIssued ? 'issued' : 'partially_issued'
            ]);
        });
    }
}
