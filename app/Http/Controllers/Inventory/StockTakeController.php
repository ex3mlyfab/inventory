<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockBatch;
use App\Models\StockTakeItem;
use App\Models\StockTakeSession;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StockTakeController extends Controller
{
    /**
     * List all stock take sessions.
     */
    public function index()
    {
        Gate::authorize('stock.count');

        $user = Auth::user();

        $sessions = StockTakeSession::with(['location', 'starter', 'completer'])
            ->when(!$user->hasRole('Super Admin') && $user->storage_location_id, function($q) use ($user) {
                $q->where('storage_location_id', $user->storage_location_id);
            })
            ->latest()
            ->paginate(15);

        $locations = [];
        if ($user->hasAnyRole(['Super Admin', 'Inventory Manager', 'Store Manager'])) {
            $locations = StorageLocation::where('is_active', true)->get(['id', 'name']);
        } else {
            $locations = StorageLocation::where('id', $user->storage_location_id)->get(['id', 'name']);
        }

        return Inertia::render('Inventory/Stock/Count/Index', [
            'sessions' => $sessions,
            'locations' => $locations,
            'userLocationId' => $user->storage_location_id,
        ]);
    }

    /**
     * Start a new stock take session for the current location.
     */
    public function store(Request $request)
    {
        Gate::authorize('stock.count');

        $user = Auth::user();
        $locationId = $request->input('storage_location_id', $user->storage_location_id);

        if (!$locationId) {
            return back()->withErrors(['storage_location_id' => 'Please select a location for the stock take.']);
        }

        try {
            // Check for active draft session
            $existing = StockTakeSession::where('storage_location_id', $locationId)
                ->where('status', 'draft')
                ->exists();

            if ($existing) {
                return back()->withErrors(['error' => 'There is already an active stock take session for this location.']);
            }

            // Check if there's any active physical stock profile to count
            $hasStock = StockBatch::where('storage_location_id', $locationId)
                ->where('status', 'active')
                ->exists();

            if (!$hasStock) {
                return back()->withErrors(['error' => 'This location currently has no active stock records to count.']);
            }

            return DB::transaction(function() use ($locationId, $user) {
                $session = StockTakeSession::create([
                    'storage_location_id' => $locationId,
                    'started_by' => $user->id,
                    'status' => 'draft',
                ]);

                // Fetch all active batches in this location to snapshot them
                // We include 0 quantity batches so auditors can record "found" stock
                $batches = StockBatch::where('storage_location_id', $locationId)
                    ->where('status', 'active')
                    ->get();

                foreach ($batches as $batch) {
                    StockTakeItem::create([
                        'stock_take_session_id' => $session->id,
                        'product_id' => $batch->product_id,
                        'stock_batch_id' => $batch->id,
                        'system_quantity' => $batch->quantity_on_hand,
                        'counted_quantity' => $batch->quantity_on_hand, // Default to system to save time
                        'variance' => 0,
                    ]);
                }

                return redirect()->route('inventory.stock-count.show', $session)
                    ->with('success', 'Stock take session started.');
            });
        } catch (\Exception $e) {
            \Log::error('Stock Take Initialization Failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to initialize audit: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the counting interface for a session.
     */
    public function show(StockTakeSession $session)
    {
        Gate::authorize('stock.count');
        
        $session->load(['location', 'starter', 'items.product', 'items.batch']);

        return Inertia::render('Inventory/Stock/Count/Show', [
            'session' => $session,
        ]);
    }

    /**
     * Update counts for items in the session.
     */
    public function updateCounts(Request $request, StockTakeSession $session)
    {
        Gate::authorize('stock.count');

        if ($session->status !== 'draft') {
            abort(403, 'Cannot update a finalized session.');
        }

        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'ulid', 'exists:stock_take_items,id'],
            'items.*.counted_quantity' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function() use ($request) {
            foreach ($request->items as $itemData) {
                $item = StockTakeItem::findOrFail($itemData['id']);
                $item->update([
                    'counted_quantity' => $itemData['counted_quantity'],
                    'variance' => $itemData['counted_quantity'] - $item->system_quantity,
                ]);
            }
        });

        return back()->with('success', 'Counts updated.');
    }

    /**
     * Finalize the session and create adjustments for variances.
     */
    public function complete(Request $request, StockTakeSession $session)
    {
        Gate::authorize('stock.count');

        if ($session->status !== 'draft') {
            return back()->withErrors(['error' => 'Session already finalized.']);
        }

        $user = Auth::user();

        DB::transaction(function() use ($session, $user) {
            $session->load('items');

            foreach ($session->items as $item) {
                if ($item->variance == 0) continue;

                // Create a PENDING adjustment for the variance
                StockAdjustment::create([
                    'stock_batch_id' => $item->stock_batch_id,
                    'performed_by' => $user->id,
                    'quantity' => $item->variance,
                    'reason' => 'cycle_count',
                    'notes' => 'Generated from Stock Take #' . $session->id,
                    'status' => 'pending',
                ]);
            }

            $session->update([
                'status' => 'completed',
                'completed_by' => $user->id,
                'completed_at' => now(),
            ]);
        });

        return redirect()->route('inventory.stock-count.index')
            ->with('success', 'Stock take finalized. Variances have been sent for manager approval.');
    }
}
