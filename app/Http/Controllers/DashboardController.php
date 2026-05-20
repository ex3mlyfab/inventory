<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Requisition;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');
        $locationId = $user->storage_location_id;
        
        $showGlobalStats = $user->hasAnyRole(['Store Officer', 'Medical Director', 'Procurement Officer', 'Super Admin']);

        $stats = [
            'totalProducts' => 0,
            'lowStockCount' => 0,
            'expiringSoonCount' => 0,
            'pendingRequisitionsCount' => 0,
        ];
        $movementTrend = [];
        $stockByCategory = [];
        $recentActivity = [];

        if ($showGlobalStats) {
            // 1. Total Products (Global Catalog)
            $stats['totalProducts'] = Product::count();

            // 2. Low Stock Items (Scoped via HasLocationScope on StockBatch)
            $stats['lowStockCount'] = Product::all()->filter(function ($product) {
                return $product->quantity_on_hand > 0 && $product->quantity_on_hand <= $product->reorder_level;
            })->count();

            // 3. Expiring Soon (Scoped via HasLocationScope on StockBatch)
            $stats['expiringSoonCount'] = StockBatch::where('status', 'active')
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<=', now()->addMonths(3))
                ->where('expiry_date', '>=', now())
                ->count();

            // 4. Pending Requisitions (Filtered by location if not Super Admin)
            $requisitionQuery = Requisition::whereIn('status', ['submitted', 'level1_approved']);
            if (!$isSuperAdmin && $locationId) {
                $requisitionQuery->where(function($q) use ($locationId) {
                    $q->where('requesting_location_id', $locationId)
                      ->orWhere('issuing_location_id', $locationId);
                });
            }
            $stats['pendingRequisitionsCount'] = $requisitionQuery->count();

            // 5. Stock Movement Trend (Scoped by joining with StockBatch if not Super Admin)
            $movementQuery = StockMovement::select(
                DB::raw('DATE(stock_movements.created_at) as date'),
                DB::raw('SUM(CASE WHEN type = "in" THEN quantity ELSE 0 END) as total_in'),
                DB::raw('SUM(CASE WHEN type = "out" THEN quantity ELSE 0 END) as total_out')
            );

            if (!$isSuperAdmin && $locationId) {
                $movementQuery->join('stock_batches', 'stock_movements.stock_batch_id', '=', 'stock_batches.id')
                    ->where('stock_batches.storage_location_id', $locationId);
            }

            $movementTrend = $movementQuery->where('stock_movements.created_at', '>=', now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // 6. Stock by Category (Scoped via HasLocationScope on StockBatch)
            $stockByCategory = Category::with(['products.stockBatches' => function($query) {
                $query->where('status', 'active');
            }])
            ->get()
            ->map(function ($category) {
                $totalStock = $category->products->sum(function ($product) {
                    return $product->stockBatches->sum('quantity_on_hand');
                });
                return [
                    'name' => $category->name,
                    'value' => (int) $totalStock,
                ];
            })
            ->filter(function ($item) {
                return $item['value'] > 0;
            })
            ->values();

            // 7. Recent Activity (Scoped by joining with StockBatch if not Super Admin)
            $activityQuery = StockMovement::with(['batch.product', 'user']);
            
            if (!$isSuperAdmin && $locationId) {
                $activityQuery->join('stock_batches', 'stock_movements.stock_batch_id', '=', 'stock_batches.id')
                    ->where('stock_batches.storage_location_id', $locationId)
                    ->select('stock_movements.*'); // Avoid column collision
            }

            $recentActivity = $activityQuery->latest('stock_movements.created_at')
                ->take(8)
                ->get()
                ->map(function ($movement) {
                    return [
                        'id' => $movement->id,
                        'type' => $movement->type,
                        'quantity' => $movement->quantity,
                        'product_name' => $movement->batch->product->name ?? 'Unknown Product',
                        'user_name' => $movement->user->name,
                        'created_at' => $movement->created_at->diffForHumans(),
                        'reference' => $movement->reference_id ?? $movement->reference,
                    ];
                });
        }

        // Calculate Department Holdings (Consumption and Collection)
        $departmentHoldings = null;
        $deptLocationIds = [];
        if ($user->storage_location_id) {
            $deptLocationIds = [$user->storage_location_id];
        } elseif ($user->department_id) {
            $deptLocationIds = \App\Models\StorageLocation::where('department_id', $user->department_id)
                ->pluck('id')
                ->toArray();
        }

        if (!empty($deptLocationIds)) {
            $currentHolding = StockBatch::where('status', 'active')
                ->whereIn('storage_location_id', $deptLocationIds)
                ->sum('quantity_on_hand');
                
            $consumptionThisMonth = StockMovement::where('type', 'out')
                ->whereIn('stock_batch_id', function ($query) use ($deptLocationIds) {
                    $query->select('id')->from('stock_batches')->whereIn('storage_location_id', $deptLocationIds);
                })
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('quantity');

            $collectionThisMonth = StockMovement::where('type', 'in')
                ->whereIn('stock_batch_id', function ($query) use ($deptLocationIds) {
                    $query->select('id')->from('stock_batches')->whereIn('storage_location_id', $deptLocationIds);
                })
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('quantity');

            $departmentHoldings = [
                'currentHolding' => (int) $currentHolding,
                'consumptionThisMonth' => (int) $consumptionThisMonth,
                'collectionThisMonth' => (int) $collectionThisMonth,
            ];
        }

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'movementTrend' => $movementTrend,
            'stockByCategory' => $stockByCategory,
            'recentActivity' => $recentActivity,
            'showGlobalStats' => $showGlobalStats,
            'departmentHoldings' => $departmentHoldings,
        ]);
    }
}
