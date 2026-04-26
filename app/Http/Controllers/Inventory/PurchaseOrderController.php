<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Requisition;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    /**
     * Build a scoped query (optionally scoped in future, for now mostly administrative).
     */
    private function scopedQuery()
    {
        return PurchaseOrder::with(['creator', 'supplier', 'requisition', 'level1Approver', 'level2Approver', 'items.product.unitOfMeasure']);
    }

    /**
     * Auto-generate a unique PO reference number.
     * Format: PO-YYYYMMDD-XXXX
     */
    private function generateReference(): string
    {
        $today = now()->format('Ymd');
        $count = PurchaseOrder::whereDate('created_at', today())->count() + 1;
        return 'PO-' . $today . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    // ── Index ──────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        Gate::authorize('purchase-orders.view');

        $query = $this->scopedQuery()
            ->when($request->search, fn($q, $s) =>
                $q->where('po_number', 'like', "%{$s}%")
                  ->orWhereHas('supplier', fn($sq) => $sq->where('name', 'like', "%{$s}%"))
            )
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Inventory/PurchaseOrders/Index', [
            'orders'  => $query,
            'filters' => $request->only(['search', 'status']),
            'stats'   => [
                'total'      => PurchaseOrder::count(),
                'submitted'  => PurchaseOrder::where('status', 'submitted')->count(),
                'level1'     => PurchaseOrder::where('status', 'level1_approved')->count(),
                'approved'   => PurchaseOrder::where('status', 'level2_approved')->count(),
            ],
        ]);
    }

    // ── Create ─────────────────────────────────────────────────────────

    public function create(Request $request)
    {
        Gate::authorize('purchase-orders.create');

        $requisition = null;
        if ($request->has('requisition_id')) {
            $requisition = Requisition::with('items.product.unitOfMeasure', 'supplier')
                ->where('type', 'purchase')
                ->findOrFail($request->requisition_id);
            
            // Check if PR is already processed
            if (in_array($requisition->status, ['po_created', 'completed'])) {
                return redirect()->route('procurement.requisitions.show', $requisition)
                    ->with('error', 'A Purchase Order has already been generated for this requisition.');
            }
        }

        $suppliers = Supplier::where('status', 'active')->orderBy('name')->get(['id', 'name', 'code']);
        $products  = Product::with('unitOfMeasure')->where('status', 'active')->orderBy('name')->get(['id', 'name', 'sku', 'unit_of_measure_id']);

        return Inertia::render('Inventory/PurchaseOrders/Create', [
            'requisition' => $requisition,
            'suppliers'   => $suppliers,
            'products'    => $products,
            'defaultRef'  => $this->generateReference(),
        ]);
    }

    // ── Store ──────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        Gate::authorize('purchase-orders.create');

        $validated = $request->validate([
            'requisition_id'      => ['nullable', 'ulid', 'exists:requisitions,id'],
            'supplier_id'         => ['required', 'ulid', 'exists:suppliers,id'],
            'po_number'           => ['required', 'string', 'max:50', 'unique:purchase_orders,po_number'],
            'notes'               => ['nullable', 'string', 'max:500'],
            'items'               => ['required', 'array', 'min:1'],
            'items.*.product_id'  => ['required', 'ulid', 'exists:products,id'],
            'items.*.quantity'    => ['required', 'integer', 'min:1'],
            'items.*.unit_price'  => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $totalAmount = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);

            $po = PurchaseOrder::create([
                'requisition_id' => $validated['requisition_id'],
                'supplier_id'    => $validated['supplier_id'],
                'po_number'      => $validated['po_number'],
                'total_amount'   => $totalAmount,
                'status'         => 'submitted',
                'notes'          => $validated['notes'],
                'created_by'     => Auth::id(),
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id'        => $item['product_id'],
                    'quantity'          => $item['quantity'],
                    'unit_price'        => $item['unit_price'],
                    'total_price'       => $item['quantity'] * $item['unit_price'],
                ]);
            }

            // Update Requisition status if linked
            if ($validated['requisition_id']) {
                Requisition::where('id', $validated['requisition_id'])->update([
                    'status' => 'po_created'
                ]);
            }
        });

        return redirect()->route('procurement.purchase-orders.index')
            ->with('success', 'Purchase Order created and submitted for approval.');
    }

    // ── Show ───────────────────────────────────────────────────────────

    public function show(PurchaseOrder $purchaseOrder)
    {
        Gate::authorize('purchase-orders.view');

        $purchaseOrder->load(['creator', 'supplier', 'requisition', 'items.product.unitOfMeasure', 'level1Approver', 'level2Approver']);

        $user = Auth::user();
        $canApproveL1 = $purchaseOrder->awaitingLevel1() && $purchaseOrder->isExpectedLevel1Approver($user);
        $canApproveL2 = $purchaseOrder->awaitingLevel2() && $purchaseOrder->isExpectedLevel2Approver($user);
        $canReject    = ($purchaseOrder->awaitingLevel1() && $canApproveL1) || ($purchaseOrder->awaitingLevel2() && $canApproveL2);

        return Inertia::render('Inventory/PurchaseOrders/Show', [
            'order'        => $purchaseOrder,
            'canApproveL1' => $canApproveL1,
            'canApproveL2' => $canApproveL2,
            'canReject'    => $canReject,
        ]);
    }

    // ── Edit ───────────────────────────────────────────────────────────

    public function edit(PurchaseOrder $purchaseOrder)
    {
        Gate::authorize('purchase-orders.create');

        if (!in_array($purchaseOrder->status, ['draft', 'submitted'])) {
            return back()->with('error', 'Only draft or submitted POs can be edited.');
        }

        $purchaseOrder->load('items.product.unitOfMeasure');
        $suppliers = Supplier::all();
        $products  = Product::with('unitOfMeasure')->get();

        return Inertia::render('Inventory/PurchaseOrders/Edit', [
            'order'     => $purchaseOrder,
            'suppliers' => $suppliers,
            'products'  => $products,
        ]);
    }

    // ── Update ─────────────────────────────────────────────────────────

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        Gate::authorize('purchase-orders.create');

        if (!in_array($purchaseOrder->status, ['draft', 'submitted'])) {
            return back()->with('error', 'Only draft or submitted POs can be updated.');
        }

        $validated = $request->validate([
            'supplier_id'         => ['required', 'ulid', 'exists:suppliers,id'],
            'notes'               => ['nullable', 'string', 'max:500'],
            'items'               => ['required', 'array', 'min:1'],
            'items.*.product_id'  => ['required', 'ulid', 'exists:products,id'],
            'items.*.quantity'    => ['required', 'integer', 'min:1'],
            'items.*.unit_price'  => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder) {
            $totalAmount = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);

            $purchaseOrder->update([
                'supplier_id'  => $validated['supplier_id'],
                'total_amount' => $totalAmount,
                'notes'        => $validated['notes'],
            ]);

            $purchaseOrder->items()->delete();
            foreach ($validated['items'] as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id'        => $item['product_id'],
                    'quantity'          => $item['quantity'],
                    'unit_price'        => $item['unit_price'],
                    'total_price'       => $item['quantity'] * $item['unit_price'],
                ]);
            }
        });

        return redirect()->route('procurement.purchase-orders.show', $purchaseOrder)
            ->with('success', 'Purchase Order updated successfully.');
    }

    // ── Level 1 Approve ────────────────────────────────────────────────

    public function approveLevel1(Request $request, PurchaseOrder $purchaseOrder)
    {
        Gate::authorize('purchase-orders.approve.l1');

        if (!$purchaseOrder->awaitingLevel1()) {
            return back()->with('error', 'PO is not awaiting Level 1 approval.');
        }

        if (!$purchaseOrder->isExpectedLevel1Approver(Auth::user())) {
            abort(403, 'You are not the designated Level 1 approver.');
        }

        $purchaseOrder->update([
            'status'             => 'level1_approved',
            'level1_approved_by' => Auth::id(),
            'level1_approved_at' => now(),
            'level1_notes'       => $request->notes,
        ]);

        return back()->with('success', 'Level 1 approval granted.');
    }

    // ── Level 2 Approve ────────────────────────────────────────────────

    public function approveLevel2(Request $request, PurchaseOrder $purchaseOrder)
    {
        Gate::authorize('purchase-orders.approve.l2');

        if (!$purchaseOrder->awaitingLevel2()) {
            return back()->with('error', 'PO is not awaiting Level 2 approval.');
        }

        if (!$purchaseOrder->isExpectedLevel2Approver(Auth::user())) {
            abort(403, 'Only the Medical Director can give Level 2 approval.');
        }

        DB::transaction(function () use ($purchaseOrder, $request) {
            $purchaseOrder->update([
                'status'             => 'level2_approved',
                'level2_approved_by' => Auth::id(),
                'level2_approved_at' => now(),
                'level2_notes'       => $request->notes,
            ]);

            // If success, PR status to completed
            if ($purchaseOrder->requisition_id) {
                Requisition::where('id', $purchaseOrder->requisition_id)->update([
                    'status' => 'completed'
                ]);
            }
        });

        return back()->with('success', 'Purchase Order fully approved and closed for requisition.');
    }

    // ── Reject ─────────────────────────────────────────────────────────

    public function reject(Request $request, PurchaseOrder $purchaseOrder)
    {
        $user = Auth::user();
        $canReject = ($purchaseOrder->awaitingLevel1() && $purchaseOrder->isExpectedLevel1Approver($user))
                  || ($purchaseOrder->awaitingLevel2() && $purchaseOrder->isExpectedLevel2Approver($user));

        if (!$canReject) {
            abort(403, 'Unauthorized to reject.');
        }

        $request->validate(['notes' => 'required|string|max:500']);

        DB::transaction(function () use ($purchaseOrder, $request) {
            $purchaseOrder->update([
                'status' => 'rejected',
                'notes'  => $request->notes,
            ]);

            // If PO fails, PR status to failed
            if ($purchaseOrder->requisition_id) {
                Requisition::where('id', $purchaseOrder->requisition_id)->update([
                    'status' => 'failed'
                ]);
            }
        });

        return back()->with('success', 'Purchase Order rejected.');
    }
}
