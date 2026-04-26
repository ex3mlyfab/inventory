<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('stock.view');

        $user = auth()->user();
        $type = $request->input('type');
        $search = $request->input('search');
        $storeId = $request->input('store_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // Location scoping
        $locationIds = null;
        if ($storeId) {
            $locationIds = [$storeId];
        } elseif (!$user->hasRole('Super Admin') && $user->storage_location_id) {
            $locationIds = [$user->storage_location_id];
        }

        $query = StockMovement::with(['batch.product', 'batch.storageLocation', 'user'])
            ->when($type, function ($q, $type) {
                $q->where('type', $type);
            })
            ->when($search, function ($q, $search) {
                $q->whereHas('batch.product', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%")
                       ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($locationIds, function ($q, $locationIds) {
                $q->whereHas('batch', function ($bq) use ($locationIds) {
                    $bq->whereIn('storage_location_id', $locationIds);
                });
            })
            ->when($dateFrom, function ($q, $dateFrom) {
                $q->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($dateTo, function ($q, $dateTo) {
                $q->whereDate('created_at', '<=', $dateTo);
            });

        $movements = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Inventory/Stock/Movements', [
            'movements' => $movements,
            'locations' => StorageLocation::select('id', 'name')->get(),
            'filters' => $request->only(['search', 'type', 'store_id', 'date_from', 'date_to']),
        ]);
    }
}
