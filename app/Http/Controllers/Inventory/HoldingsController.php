<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HoldingsController extends Controller
{
    /**
     * Display the inventory holdings for the user's department.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $search = $request->input('search');

        // Identify the locations assigned to this user's department
        $locationIds = [];
        if ($user->storage_location_id) {
            $locationIds = [$user->storage_location_id];
        } elseif ($user->department_id) {
            $locationIds = StorageLocation::where('department_id', $user->department_id)
                ->pluck('id')
                ->toArray();
        }

        if (empty($locationIds)) {
            return Inertia::render('Inventory/Holdings/Index', [
                'products' => ['data' => []],
                'stats' => [
                    'total_items' => 0,
                    'low_stock_count' => 0,
                ],
                'filters' => $request->only(['search']),
            ]);
        }

        $query = Product::with(['category', 'unitOfMeasure'])
            ->whereHas('stockBatches', function ($q) use ($locationIds) {
                $q->whereIn('storage_location_id', $locationIds);
            })
            ->when($search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            });

        // Add scoped stock sum for the department's locations
        $query->withSum(['stockBatches as current_stock' => function($q) use ($locationIds) {
            $q->where('status', 'active')
              ->whereIn('storage_location_id', $locationIds);
        }], 'quantity_on_hand');

        $products = $query->paginate(15)->withQueryString();

        // Calculate Department Stats
        $baseBatchQuery = \App\Models\StockBatch::where('status', 'active')
            ->whereIn('storage_location_id', $locationIds);

        $stats = [
            'total_items' => (int) $baseBatchQuery->sum('quantity_on_hand'),
            'low_stock_count' => Product::whereHas('stockBatches', function($q) use ($locationIds) {
                    $q->where('status', 'active')
                      ->whereIn('storage_location_id', $locationIds);
                })
                ->whereRaw('(SELECT SUM(quantity_on_hand) FROM stock_batches WHERE product_id = products.id AND status = "active" AND storage_location_id IN ("'.implode('","', $locationIds).'") ) < products.reorder_level')
                ->count(),
        ];

        return Inertia::render('Inventory/Holdings/Index', [
            'products' => $products,
            'stats' => $stats,
            'filters' => $request->only(['search']),
            'department_name' => $user->department?->name ?? 'Your Department',
        ]);
    }
}
