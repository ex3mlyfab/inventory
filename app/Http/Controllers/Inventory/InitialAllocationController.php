<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class InitialAllocationController extends Controller
{
    /**
     * Display the initial allocation form.
     */
    public function index()
    {
        Gate::authorize('stock.allocate');

        $user = Auth::user();

        // Locations available to the user
        $locationsQuery = StorageLocation::where('is_active', true);
        if (!$user->hasRole('Super Admin') && $user->storage_location_id) {
            $locationsQuery->where('id', $user->storage_location_id);
        }
        $locations = $locationsQuery->get(['id', 'name', 'code']);

        $products = Product::where('status', 'active')
            ->with('unitOfMeasure')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'unit_of_measure_id']);

        return Inertia::render('Inventory/Stock/Allocation/Index', [
            'locations' => $locations,
            'products' => $products,
        ]);
    }

    /**
     * Process the initial stock allocation.
     */
    public function store(Request $request)
    {
        Gate::authorize('stock.allocate');

        $request->validate([
            'storage_location_id' => ['required', 'ulid', 'exists:storage_locations,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'ulid', 'exists:products,id'],
            'items.*.batch_number' => ['required', 'string', 'max:50'],
            'items.*.expiry_date' => ['nullable', 'date'],
            'items.*.quantity' => ['required', 'integer', 'min:0'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = Auth::user();

        DB::transaction(function () use ($request, $user) {
            foreach ($request->items as $item) {
                if ($item['quantity'] <= 0) continue;

                // 1. Create or Find Batch
                // For initial allocation, we usually create NEW batches even if same number exists, 
                // but checking for existing in THIS location is safer.
                $batch = StockBatch::firstOrCreate(
                    [
                        'storage_location_id' => $request->storage_location_id,
                        'product_id' => $item['product_id'],
                        'batch_number' => $item['batch_number'],
                        'expiry_date' => $item['expiry_date'] ?? null,
                    ],
                    [
                        'quantity_on_hand' => 0,
                        'unit_cost' => $item['unit_cost'] ?? 0,
                    ]
                );

                $quantityToAdd = (int) $item['quantity'];
                $balanceBefore = $batch->quantity_on_hand;
                $balanceAfter = $balanceBefore + $quantityToAdd;

                // 2. Update Batch Quantity
                $batch->increment('quantity_on_hand', $quantityToAdd);

                // 3. Log Movement
                StockMovement::create([
                    'stock_batch_id' => $batch->id,
                    'user_id' => $user->id,
                    'type' => 'in', // Using 'in' but with "Initial Allocation" notes
                    'quantity' => $quantityToAdd,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'notes' => 'Initial Stock Takeover / Opening Balance',
                    'reference_type' => 'initial_allocation',
                ]);
            }
        });

        return redirect()->route('inventory.stock.index')
            ->with('success', 'Initial stock allocation processed successfully.');
    }
}
