<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StorageLocation;
use App\Models\Department;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('stock.view');

        $user = auth()->user();
        $managementRoles = ['Super Admin', 'Inventory Manager', 'Medical Director', 'Store Manager', 'Procurement Supervisor'];
        $canViewValuation = $user->hasAnyRole($managementRoles);

        $storeId = $request->input('store_id');
        $departmentId = $request->input('department_id');
        $search = $request->input('search');

        // Initial location scoping
        $locationIds = null;
        if ($storeId) {
            $locationIds = [$storeId];
        } elseif ($departmentId) {
            $locationIds = StorageLocation::where('department_id', $departmentId)->pluck('id')->toArray();
        } elseif (!$user->hasRole('Super Admin') && $user->storage_location_id) {
            $locationIds = [$user->storage_location_id];
        }

        $query = Product::with(['category', 'unitOfMeasure'])
            ->when($search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            });

        // Add scoped stock sum
        $query->withSum(['stockBatches as current_stock' => function($q) use ($locationIds) {
            $q->where('status', 'active');
            if ($locationIds) {
                $q->whereIn('storage_location_id', $locationIds);
            }
        }], 'quantity_on_hand');

        $products = $query->paginate(15)->withQueryString();

        // Calculate Global Stats for the current scope
        $stats = [
            'total_items' => 0,
            'total_value' => 0,
            'low_stock_count' => 0,
            'expiring_soon' => 0,
        ];

        // We run a separate query for accurate totals across all products in scope
        $baseBatchQuery = \App\Models\StockBatch::where('status', 'active');
        if ($locationIds) {
            $baseBatchQuery->whereIn('storage_location_id', $locationIds);
        }

        $stats['total_items'] = (int) $baseBatchQuery->sum('quantity_on_hand');
        
        if ($canViewValuation) {
            $stats['total_value'] = (float) $baseBatchQuery->sum(DB::raw('quantity_on_hand * unit_cost'));
        }

        // Low stock count (Products where scoped stock < reorder_level)
        // This is a bit more complex, we might want to just count products
        $stats['low_stock_count'] = Product::whereHas('stockBatches', function($q) use ($locationIds) {
                $q->where('status', 'active');
                if ($locationIds) $q->whereIn('storage_location_id', $locationIds);
            })
            ->whereRaw('(SELECT SUM(quantity_on_hand) FROM stock_batches WHERE product_id = products.id AND status = "active" ' . 
                ($locationIds ? 'AND storage_location_id IN ("'.implode('","', $locationIds).'")' : '') . ') < products.reorder_level')
            ->count();

        // Expiring Soon (within 90 days)
        $stats['expiring_soon'] = (int) $baseBatchQuery->where('expiry_date', '<=', now()->addDays(90))
            ->whereNotNull('expiry_date')
            ->count();

        return Inertia::render('Inventory/Stock/Index', [
            'products' => $products,
            'stats' => $stats,
            'locations' => StorageLocation::select('id', 'name', 'code')->get(),
            'departments' => Department::select('id', 'name')->get(),
            'canViewValuation' => $canViewValuation,
            'filters' => $request->only(['search', 'store_id', 'department_id']),
        ]);
    }

    public function batches(Product $product)
    {
        Gate::authorize('stock.view');

        $product->load(['category']);
        $batches = $product->stockBatches()
            ->with(['movements.user', 'storageLocation'])
            ->latest('expiry_date')
            ->paginate(15);

        return Inertia::render('Inventory/Stock/Batches', [
            'product' => $product,
            'batches' => $batches,
        ]);
    }
}
