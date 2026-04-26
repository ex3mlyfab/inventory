<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
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

        $purchaseOrders = PurchaseOrder::where('status', 'level2_approved')
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
            'supplier_id'        => ['nullable', 'ulid', 'exists:suppliers,id'],
            'product_id'         => ['required', 'ulid', 'exists:products,id'],
            'reference'          => ['required', 'string', 'max:100'],
            'batch_number'       => ['nullable', 'string', 'max:100'],
            'quantity_received'  => ['required', 'integer', 'min:1'],
            'unit_cost'          => ['required', 'numeric', 'min:0'],
            'manufacturing_date' => ['nullable', 'date'],
            'expiry_date'        => ['nullable', 'date', 'after_or_equal:today'],
            'storage_location_id'=> ['nullable', 'ulid', 'exists:storage_locations,id'],
            'notes'              => ['nullable', 'string', 'max:500'],
            'purchase_order_id'  => ['nullable', 'ulid', 'exists:purchase_orders,id'],
            'po_item_id'         => ['nullable', 'ulid', 'exists:purchase_order_items,id'],
        ]);

        // If batch_number is blank, fall back to the GRN reference
        if (empty($validated['batch_number'])) {
            $validated['batch_number'] = $validated['reference'];
        }

        DB::transaction(function () use ($validated) {
            $batch = StockBatch::create([
                'product_id'          => $validated['product_id'],
                'supplier_id'         => $validated['supplier_id'] ?? null,
                'batch_number'        => $validated['batch_number'],
                'reference'           => $validated['reference'],
                'quantity_received'   => $validated['quantity_received'],
                'quantity_on_hand'    => $validated['quantity_received'],
                'unit_cost'           => $validated['unit_cost'],
                'manufacturing_date'  => $validated['manufacturing_date'] ?? null,
                'expiry_date'         => $validated['expiry_date'] ?? null,
                'storage_location_id' => $validated['storage_location_id'] ?? null,
                'status'              => 'active',
            ]);

            // Log the stock-in movement
            StockMovement::create([
                'stock_batch_id' => $batch->id,
                'user_id'        => Auth::id(),
                'type'           => 'in',
                'quantity'       => $validated['quantity_received'],
                'balance_before' => 0,
                'balance_after'  => $validated['quantity_received'],
                'reference_type' => 'GRN',
                'reference_id'   => $batch->id,
                'notes'          => $validated['notes'] ?? 'Goods received via GRN: ' . $validated['reference'],
            ]);

            // Update PO item if linked
            if (!empty($validated['po_item_id'])) {
                $poItem = \App\Models\PurchaseOrderItem::find($validated['po_item_id']);
                if ($poItem) {
                    $poItem->increment('quantity_received', $validated['quantity_received']);
                    
                    // Optionally check if PO is fully received and update status
                    $po = $poItem->purchaseOrder;
                    $allReceived = $po->items->every(fn($item) => $item->quantity_received >= $item->quantity);
                    if ($allReceived) {
                        $po->update(['status' => 'closed']);
                    } else {
                        $po->update(['status' => 'partial']);
                    }
                }
            }
        });

        return redirect()->route('procurement.grn.index')
            ->with('success', 'GRN recorded successfully. Stock batch created.');
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
