<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Actions\Inventory\TransferStockAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    /**
     * Show the inventory transfer dashboard.
     */
    public function index(Request $request)
    {
        Gate::authorize('stock.transfer');

        $user = Auth::user();

        // Historical transfers
        $transfers = StockMovement::where('type', 'transfer')
            ->with(['batch.product', 'batch.storageLocation', 'user'])
            ->when(!$user->hasRole('Super Admin') && $user->storage_location_id, function($q) use ($user) {
                $q->whereHas('batch', function($bq) use ($user) {
                    $bq->where('storage_location_id', $user->storage_location_id);
                });
            })
            ->latest()
            ->paginate(15);

        // Targeted locations
        $locations = StorageLocation::where('is_active', true)
            ->where('id', '!=', $user->storage_location_id)
            ->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Stock/Transfers/Index', [
            'transfers' => $transfers,
            'locations' => $locations,
        ]);
    }

    /**
     * Process a direct stock transfer.
     */
    public function store(Request $request, TransferStockAction $action)
    {
        Gate::authorize('stock.transfer');

        $request->validate([
            'stock_batch_id' => ['required', 'ulid', 'exists:stock_batches,id'],
            'target_location_id' => ['required', 'ulid', 'exists:storage_locations,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $batch = StockBatch::findOrFail($request->stock_batch_id);

        // Security: Can only transfer FROM your own location if not super admin
        $user = Auth::user();
        if (!$user->hasRole('Super Admin') && $batch->storage_location_id !== $user->storage_location_id) {
            abort(403, 'You can only transfer stock from your assigned location.');
        }

        if ($batch->quantity_on_hand < $request->quantity) {
            return back()->withErrors(['quantity' => 'Insufficient stock in the selected batch.']);
        }

        try {
            $action->execute($batch, $request->target_location_id, $request->quantity, $user->id);
            return back()->with('success', 'Stock transfer completed successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
