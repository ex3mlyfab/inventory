<?php

namespace App\Actions\Inventory;

use App\Models\Requisition;
use App\Models\RequisitionReceipt;
use App\Models\StockBatch;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReceiveRequisitionAction
{
    /**
     * @param array $lines  [['item_id' => ..., 'quantity_received' => int,
     *                        'quantity_short' => int, 'shortage_reason' => ?string], ...]
     */
    public function execute(Requisition $requisition, array $lines, string $userId): Requisition
    {
        return DB::transaction(function () use ($requisition, $lines, $userId) {
            $requisition = Requisition::whereKey($requisition->id)->lockForUpdate()->firstOrFail();

            if (! in_array($requisition->status, ['in_transit', 'partially_received'])) {
                throw ValidationException::withMessages([
                    'status' => 'Requisition is not awaiting receipt.',
                ]);
            }

            $targetLocationId = $requisition->requestingDepartment
                ->storageLocations()
                ->where('is_active', true)
                ->orderBy('created_at')
                ->value('id');

            if (! $targetLocationId) {
                throw ValidationException::withMessages([
                    'location' => 'Department has no active storage location.',
                ]);
            }

            foreach ($lines as $line) {
                $item = $requisition->items()
                    ->whereKey($line['item_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $qty   = (int) ($line['quantity_received'] ?? 0);
                $short = (int) ($line['quantity_short'] ?? 0);

                if ($qty + $short > $item->quantity_in_transit) {
                    throw ValidationException::withMessages([
                        'quantity' => "Received + short exceeds in-transit for {$item->product->name}.",
                    ]);
                }

                if ($short > 0 && empty($line['shortage_reason'])) {
                    throw ValidationException::withMessages([
                        'shortage_reason' => 'Shortage reason required when reporting shortages.',
                    ]);
                }

                // FIFO: process outflows for this item (matched by product_id)
                $outflows = StockMovement::where('reference_type', Requisition::class)
                    ->where('reference_id', $requisition->id)
                    ->where('quantity', '<', 0)
                    ->where(function ($q) use ($item) {
                        $q->where('requisition_item_id', $item->id)
                          ->orWhereHas('batch', fn($b) => $b->where('product_id', $item->product_id));
                    })
                    ->orderBy('created_at')
                    ->lockForUpdate()
                    ->get();

                $remainingQty   = $qty;
                $remainingShort = $short;

                foreach ($outflows as $outflow) {
                    if ($remainingQty <= 0 && $remainingShort <= 0) break;

                    $alreadySettled = RequisitionReceipt::where('source_stock_movement_id', $outflow->id)
                        ->sum('quantity_received') +
                        RequisitionReceipt::where('source_stock_movement_id', $outflow->id)
                        ->sum('quantity_short');

                    $available = abs($outflow->quantity) - $alreadySettled;
                    if ($available <= 0) continue;

                    $receiveFromThis = min($remainingQty, $available);
                    $shortFromThis   = min($remainingShort, $available - $receiveFromThis);

                    if ($receiveFromThis > 0) {
                        $targetBatch = $this->resolveTargetBatch($outflow, $targetLocationId);
                        
                        $balanceBefore = $targetBatch->quantity_on_hand;
                        $targetBatch->increment('quantity_on_hand', $receiveFromThis);
                        $targetBatch->increment('quantity_received', $receiveFromThis);

                        if ($targetBatch->status !== 'active') {
                            $targetBatch->update(['status' => 'active']);
                        }

                        StockMovement::create([
                            'stock_batch_id'      => $targetBatch->id,
                            'user_id'             => $userId,
                            'type'                => 'requisition_fulfillment',
                            'quantity'            => $receiveFromThis,
                            'balance_before'      => $balanceBefore,
                            'balance_after'       => $balanceBefore + $receiveFromThis,
                            'notes'               => "Received from {$requisition->issuingLocation?->name}",
                            'reference_type'      => Requisition::class,
                            'reference_id'        => $requisition->id,
                            'requisition_id'      => $requisition->id,
                            'requisition_item_id' => $item->id,
                        ]);
                    }

                    if ($receiveFromThis > 0 || $shortFromThis > 0) {
                        RequisitionReceipt::create([
                            'requisition_id'           => $requisition->id,
                            'requisition_item_id'      => $item->id,
                            'received_by'              => $userId,
                            'source_stock_movement_id' => $outflow->id,
                            'quantity_received'        => $receiveFromThis,
                            'quantity_short'           => $shortFromThis,
                            'shortage_reason'          => $shortFromThis > 0 ? $line['shortage_reason'] : null,
                        ]);
                    }

                    $remainingQty   -= $receiveFromThis;
                    $remainingShort -= $shortFromThis;
                }

                $item->update([
                    'quantity_received'   => $item->quantity_received + $qty,
                    'quantity_in_transit' => $item->quantity_in_transit - $qty - $short,
                ]);
            }

            $anyInTransit = $requisition->items()->where('quantity_in_transit', '>', 0)->exists();
            $requisition->update([
                'status' => $anyInTransit ? 'partially_received' : 'completed',
            ]);

            return $requisition->fresh(['items', 'receipts']);
        });
    }

    private function resolveTargetBatch(StockMovement $movement, string $targetLocationId): StockBatch
    {
        $sourceBatch = $movement->batch;

        // Lineage-first match
        $targetBatch = StockBatch::withoutGlobalScope('location_access')
            ->where('storage_location_id', $targetLocationId)
            ->where('source_batch_id', $sourceBatch->id)
            ->lockForUpdate()
            ->first();

        if (! $targetBatch) {
            // Legacy fallback: product + batch_number + null-safe expiry
            $targetBatch = StockBatch::withoutGlobalScope('location_access')
                ->where('storage_location_id', $targetLocationId)
                ->where('product_id', $sourceBatch->product_id)
                ->where('batch_number', $sourceBatch->batch_number)
                ->when(
                    $sourceBatch->expiry_date,
                    fn ($q) => $q->whereDate('expiry_date', $sourceBatch->expiry_date),
                    fn ($q) => $q->whereNull('expiry_date')
                )
                ->lockForUpdate()
                ->first();
        }

        if (! $targetBatch) {
            $targetBatch = StockBatch::create([
                'product_id'          => $sourceBatch->product_id,
                'storage_location_id' => $targetLocationId,
                'source_batch_id'     => $sourceBatch->id,
                'batch_number'        => $sourceBatch->batch_number,
                'expiry_date'         => $sourceBatch->expiry_date,
                'manufacturing_date'  => $sourceBatch->manufacturing_date,
                'unit_cost'           => $sourceBatch->unit_cost,
                'supplier_id'         => $sourceBatch->supplier_id,
                'quantity_on_hand'    => 0,
                'quantity_received'   => 0,
                'status'              => 'active',
            ]);
        } elseif (! $targetBatch->source_batch_id) {
            $targetBatch->update(['source_batch_id' => $sourceBatch->id]);
        }

        return $targetBatch;
    }
}
