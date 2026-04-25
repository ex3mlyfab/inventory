<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockBatch;
use App\Actions\Inventory\AdjustStockAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('stock.view');

        $adjustments = StockAdjustment::with(['batch.product', 'performer', 'approver'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Inventory/Stock/Adjustments', [
            'adjustments' => $adjustments,
        ]);
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
