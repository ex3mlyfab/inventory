<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockBatch;
use App\Models\Product;
use App\Actions\Inventory\AdjustStockAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('stock.view');

        $query = StockAdjustment::with(['batch.product', 'performer', 'approver'])
            ->whereHas('batch') // Respects HasLocationScope on StockBatch
            ->latest();

        $stats = [
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'approved_today' => (clone $query)->where('status', 'approved')->whereDate('updated_at', today())->count(),
            'total_this_month' => (clone $query)->whereMonth('created_at', now()->month)->count(),
        ];

        $adjustments = $query->paginate(20);

        return Inertia::render('Inventory/Stock/Adjustments', [
            'adjustments' => $adjustments,
            'stats' => $stats,
        ]);
    }


    public function searchBatches(Request $request)
    {
        Gate::authorize('stock.view');

        $search = $request->input('search');

        if (empty($search)) {
            return response()->json([]);
        }

        // We want to return products that have ACTIVE batches in the user's scope.
        // The HasLocationScope trait on StockBatch will automatically handle the scoping.
        $products = Product::where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            })
            ->whereHas('stockBatches', function($q) {
                $q->where('status', 'active');
            })
            ->with(['stockBatches' => function($q) {
                $q->where('status', 'active')->with('storageLocation');
            }, 'unitOfMeasure'])
            ->limit(10)
            ->get();

        return response()->json($products);
    }

    public function store(Request $request, AdjustStockAction $action)
    {
        Gate::authorize('stock.adjust');

        $validated = $request->validate([
            'stock_batch_id' => 'required|exists:stock_batches,id',
            'quantity' => 'required|integer', // Can be positive or negative
            'reason' => 'required|string|in:cycle_count,damage,expiry,theft,correction,other',
            'notes' => 'nullable|string',
        ]);

        if ($validated['quantity'] == 0) {
            return back()->withErrors(['quantity' => 'Adjustment quantity cannot be zero.']);
        }

        // According to user requirement: Any adjustment requires approval.
        // We create the adjustment in 'pending' status.
        $adjustment = StockAdjustment::create([
            ...$validated,
            'performed_by' => auth()->id(),
            'status' => 'pending'
        ]);

        return back()->with('success', 'Stock adjustment requested successfully and is pending approval.');
    }

    public function approve(StockAdjustment $adjustment, AdjustStockAction $action)
    {
        Gate::authorize('stock.approve'); // Requires specific approval permission

        if ($adjustment->status !== 'pending') {
            return back()->with('error', 'Only pending adjustments can be approved.');
        }

        $action->execute($adjustment, auth()->id());

        return back()->with('success', 'Stock adjustment approved and applied.');
    }

    public function reject(StockAdjustment $adjustment)
    {
        Gate::authorize('stock.approve');

        if ($adjustment->status !== 'pending') {
            return back()->with('error', 'Only pending adjustments can be rejected.');
        }

        $adjustment->update([
            'status' => 'rejected',
            'approved_by' => auth()->id()
        ]);

        return back()->with('success', 'Stock adjustment rejected.');
    }
}
