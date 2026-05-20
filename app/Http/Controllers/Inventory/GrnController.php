<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class GrnController extends Controller
{
    /**
     * List all GRN-linked stock batch records.
     */
    public function index(Request $request)
    {
        Gate::authorize('grn.view');

        $query = StockBatch::with(['product.category', 'supplier', 'storageLocation'])
            ->when($request->search, fn($q, $s) =>
                $q->where('reference', 'like', "%{$s}%")
                  ->orWhere('batch_number', 'like', "%{$s}%")
                  ->orWhereHas('supplier', fn($sq) => $sq->where('name', 'like', "%{$s}%"))
                  ->orWhereHas('product', fn($pq) => $pq->where('name', 'like', "%{$s}%"))
            )
            ->when($request->supplier_id, fn($q, $id) => $q->where('supplier_id', $id))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $suppliers = Supplier::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Grn/Index', [
            'batches'   => $query,
            'suppliers' => $suppliers,
            'filters'   => $request->only(['search', 'supplier_id']),
        ]);
    }

    /**
     * Show GRN creation form.
     */
    public function create()
    {
        Gate::authorize('grn.create');

        $suppliers = Supplier::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'category']);

        $products = Product::with('unitOfMeasure')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'unit_of_measure_id', 'is_expirable']);

        $locations = StorageLocation::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'type']);

        $purchaseOrders = Requisition::where('type', 'purchase')
            ->whereIn('status', ['approved', 'po_created', 'partially_issued'])
            ->whereHas('items', function($query) {
                $query->whereColumn('quantity_issued', '<', 'quantity_approved');
            })
            ->with(['supplier', 'items.product.unitOfMeasure'])
            ->get();

        // Generate a unique GRN reference: GRN-YYYYMMDD-XXXX
        $today      = now()->format('Ymd');
        $sequence   = StockBatch::whereDate('created_at', today())->count() + 1;
        $grnRef     = 'GRN-' . $today . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Inventory/Grn/Create', [
            'suppliers'      => $suppliers,
            'products'       => $products,
            'locations'      => $locations,
            'defaultGrnRef'  => $grnRef,
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    /**
     * Store a new GRN (creates StockBatch + StockMovement).
     */
    public function store(Request $request)
    {
        Gate::authorize('grn.create');

        $validated = $request->validate([
            'reference'           => 'required|string|max:100',
            'supplier_id'         => 'required|ulid|exists:suppliers,id',
            'requisition_id'      => 'nullable|ulid|exists:requisitions,id',
            'storage_location_id' => 'required|ulid|exists:storage_locations,id',
            'notes'               => 'nullable|string|max:500',
            'items'               => 'required|array|min:1',
            'items.*.product_id'  => 'required|ulid|exists:products,id',
            'items.*.quantity_received' => 'required|integer|min:1',
            'items.*.unit_cost'   => 'required|numeric|min:0',
            'items.*.batch_number'=> 'nullable|string|max:100',
            'items.*.manufacturing_date' => 'nullable|date',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.requisition_item_id' => 'nullable|ulid|exists:requisition_items,id',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $itemData) {
                // 1. Create Stock Batch
                $batch = StockBatch::create([
                    'product_id'          => $itemData['product_id'],
                    'supplier_id'         => $validated['supplier_id'],
                    'storage_location_id' => $validated['storage_location_id'],
                    'batch_number'        => $itemData['batch_number'] ?? $validated['reference'],
                    'reference'           => $validated['reference'],
                    'quantity_received'   => $itemData['quantity_received'],
                    'quantity_on_hand'    => $itemData['quantity_received'],
                    'unit_cost'           => $itemData['unit_cost'],
                    'manufacturing_date'  => $itemData['manufacturing_date'] ?? null,
                    'expiry_date'         => $itemData['expiry_date'] ?? null,
                    'status'              => 'active',
                ]);

                // 2. Log the stock-in movement
                StockMovement::create([
                    'stock_batch_id' => $batch->id,
                    'user_id'        => Auth::id(),
                    'type'           => 'in',
                    'quantity'       => $itemData['quantity_received'],
                    'balance_before' => 0,
                    'balance_after'  => $itemData['quantity_received'],
                    'reference_type' => 'GRN',
                    'reference_id'   => $batch->id,
                    'notes'          => $validated['notes'] ?? 'Goods received via GRN: ' . $validated['reference'],
                ]);

                // 3. Update Requisition item if linked
                if (!empty($itemData['requisition_item_id'])) {
                    $reqItem = RequisitionItem::find($itemData['requisition_item_id']);
                    if ($reqItem) {
                        $reqItem->increment('quantity_issued', $itemData['quantity_received']);
                    }
                }
            }

            // 4. Update parent Requisition status
            if (!empty($validated['requisition_id'])) {
                $requisition = Requisition::with('items')->find($validated['requisition_id']);
                if ($requisition) {
                    $allReceived = $requisition->items->every(fn($item) => $item->quantity_issued >= $item->quantity_approved);
                    
                    if ($allReceived) {
                        $requisition->update(['status' => 'completed']);
                    } else {
                        $requisition->update(['status' => 'partially_issued']);
                    }
                }
            }
        });

        return redirect()->route('procurement.grn.index')
            ->with('success', 'GRN recorded successfully. ' . count($validated['items']) . ' items added to stock.');
    }

    /**
     * Show a single GRN batch record.
     */
    public function show(StockBatch $grn)
    {
        Gate::authorize('grn.view');

        $grn->load(['product.category', 'supplier', 'storageLocation', 'movements.user']);

        return Inertia::render('Inventory/Grn/Show', [
            'batch' => $grn,
        ]);
    }
}
