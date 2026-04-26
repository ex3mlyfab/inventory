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
    public function execute(Requisition $requisition, array $issuances, int $performerId): void
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

                // 2. Add to Target (Requesting Location)
                // If it's an internal requisition, move the stock to the requesting location.
                if ($requisition->type === 'internal') {
                    $targetBatch = StockBatch::firstOrCreate(
                        [
                            'storage_location_id' => $requisition->requesting_location_id,
                            'product_id' => $sourceBatch->product_id,
                            'batch_number' => $sourceBatch->batch_number,
                            'expiry_date' => $sourceBatch->expiry_date,
                        ],
                        [
                            'quantity_on_hand' => 0,
                            'unit_cost' => $sourceBatch->unit_cost,
                            'status' => 'active',
                        ]
                    );

                    $balanceBeforeTarget = $targetBatch->quantity_on_hand;
                    $balanceAfterTarget = $balanceBeforeTarget + $qty;
                    $targetBatch->increment('quantity_on_hand', $qty);

                    // Log Target Inflow
                    StockMovement::create([
                        'stock_batch_id' => $targetBatch->id,
                        'user_id' => $performerId,
                        'type' => 'requisition_fulfillment',
                        'quantity' => $qty,
                        'balance_before' => $balanceBeforeTarget,
                        'balance_after' => $balanceAfterTarget,
                        'notes' => "Received from {$requisition->issuingLocation?->name} (Req: {$requisition->reference})",
                        'reference_type' => Requisition::class,
                        'reference_id' => $requisition->id
                    ]);
                }

                // 3. Log Source Outflow
                StockMovement::create([
                    'stock_batch_id' => $sourceBatch->id,
                    'user_id' => $performerId,
                    'type' => 'requisition_fulfillment',
                    'quantity' => -$qty,
                    'balance_before' => $balanceBeforeSource,
                    'balance_after' => $balanceAfterSource,
                    'notes' => "Issued to {$requisition->requestingLocation?->name} (Req: {$requisition->reference})",
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
