<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Product;
use App\Models\Requisition;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DepartmentalStoreController extends Controller
{
    public function index(Request $request)
    {
        $selectedDepartmentId = $request->input('department_id');
        $productId = $request->input('product_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $period = $request->input('period');

        // Handle predefined periods
        if ($period) {
            switch ($period) {
                case 'today':
                    $startDate = Carbon::today()->toDateString();
                    $endDate = Carbon::today()->toDateString();
                    break;
                case 'this_week':
                    $startDate = Carbon::now()->startOfWeek()->toDateString();
                    $endDate = Carbon::now()->endOfWeek()->toDateString();
                    break;
                case 'this_month':
                    $startDate = Carbon::now()->startOfMonth()->toDateString();
                    $endDate = Carbon::now()->endOfMonth()->toDateString();
                    break;
                case 'last_month':
                    $startDate = Carbon::now()->subMonth()->startOfMonth()->toDateString();
                    $endDate = Carbon::now()->subMonth()->endOfMonth()->toDateString();
                    break;
                case 'this_quarter':
                    $startDate = Carbon::now()->startOfQuarter()->toDateString();
                    $endDate = Carbon::now()->endOfQuarter()->toDateString();
                    break;
                case 'this_year':
                    $startDate = Carbon::now()->startOfYear()->toDateString();
                    $endDate = Carbon::now()->endOfYear()->toDateString();
                    break;
            }
        }

        $departments = Department::orderBy('name')->get();
        $products = Product::orderBy('name')->get(['id', 'name']);

        $data = [
            'current_stock' => [],
            'request_history' => [],
            'usage_history' => [],
        ];

        if ($selectedDepartmentId) {
            $locationIds = StorageLocation::where('department_id', $selectedDepartmentId)
                ->pluck('id')
                ->toArray();

            // 1. Current Stock
            $data['current_stock'] = Product::with(['category', 'unitOfMeasure'])
                ->whereHas('stockBatches', function ($query) use ($locationIds) {
                    $query->whereIn('storage_location_id', $locationIds)
                        ->where('status', 'active');
                })
                ->withSum(['stockBatches as quantity_on_hand' => function ($query) use ($locationIds) {
                    $query->whereIn('storage_location_id', $locationIds)
                        ->where('status', 'active');
                }], 'quantity_on_hand')
                ->when($productId, function ($query) use ($productId) {
                    $query->where('id', $productId);
                })
                ->get();

            // 2. Request History
            $data['request_history'] = Requisition::with(['requester', 'items.product'])
                ->where('requesting_department_id', $selectedDepartmentId)
                ->when($startDate, function ($query) use ($startDate) {
                    $query->whereDate('created_at', '>=', $startDate);
                })
                ->when($endDate, function ($query) use ($endDate) {
                    $query->whereDate('created_at', '<=', $endDate);
                })
                ->when($productId, function ($query) use ($productId) {
                    $query->whereHas('items', function ($q) use ($productId) {
                        $q->where('product_id', $productId);
                    });
                })
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            // 3. Usage History (Consumption)
            $data['usage_history'] = StockMovement::with(['batch.product', 'user'])
                ->where('type', 'consumption')
                ->whereHas('batch', function ($query) use ($locationIds, $productId) {
                    $query->whereIn('storage_location_id', $locationIds);
                    if ($productId) {
                        $query->where('product_id', $productId);
                    }
                })
                ->when($startDate, function ($query) use ($startDate) {
                    $query->whereDate('created_at', '>=', $startDate);
                })
                ->when($endDate, function ($query) use ($endDate) {
                    $query->whereDate('created_at', '<=', $endDate);
                })
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();
        }

        return Inertia::render('Inventory/DepartmentalStores/Index', [
            'departments' => $departments,
            'products' => $products,
            'selectedDepartmentId' => $selectedDepartmentId,
            'data' => $data,
            'filters' => [
                'department_id' => $selectedDepartmentId,
                'product_id' => $productId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'period' => $period,
            ],
        ]);
    }
}
