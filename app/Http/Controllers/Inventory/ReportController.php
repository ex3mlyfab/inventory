<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\StorageLocation;
use App\Models\Department;
use App\Exports\InventoryReportExport;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index()
    {
        Gate::authorize('reports.view');

        $user = auth()->user();
        $managementRoles = ['Super Admin', 'Inventory Manager', 'Medical Director', 'Store Manager', 'Procurement Supervisor'];
        $canViewValuation = $user->hasAnyRole($managementRoles);

        // Stats
        $stats = [
            'total_products' => Product::count(),
            'total_inventory_value' => $canViewValuation ? (float) StockBatch::where('status', 'active')->sum(DB::raw('quantity_on_hand * unit_cost')) : null,
            'low_stock_items' => Product::whereHas('stockBatches', function ($q) {
                $q->where('status', 'active');
            })->whereRaw('(SELECT SUM(quantity_on_hand) FROM stock_batches WHERE product_id = products.id AND status = "active") < products.reorder_level')->count(),
            'expiring_soon' => StockBatch::where('status', 'active')
                ->where('expiry_date', '<=', now()->addDays(90))
                ->whereNotNull('expiry_date')
                ->count(),
        ];

        // Chart Data: Inventory Movement (Last 7 Days)
        $movementData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $movementData[] = [
                'date' => now()->subDays($i)->format('M d'),
                'in' => (int) StockMovement::whereDate('created_at', $date)->whereIn('type', ['in', 'adjustment_up', 'transfer_in'])->sum('quantity'),
                'out' => (int) StockMovement::whereDate('created_at', $date)->whereIn('type', ['out', 'adjustment_down', 'transfer_out'])->sum('quantity'),
            ];
        }

        // Chart Data: Stock by Category
        $categoryData = Category::withCount(['products' => function($q) {
            $q->whereHas('stockBatches', function($sq) {
                $sq->where('status', 'active');
            });
        }])->get()->map(fn($cat) => [
            'name' => $cat->name,
            'value' => $cat->products_count
        ])->values();

        return Inertia::render('Inventory/Reports/Index', [
            'stats' => $stats,
            'movementData' => $movementData,
            'categoryData' => $categoryData,
            'canViewValuation' => $canViewValuation,
        ]);
    }

    public function export(Request $request)
    {
         Gate::authorize('reports.export');

        $request->validate([
            'type' => 'required|string',
            'format' => 'required|in:pdf,excel',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $type = $request->input('type');
        $format = $request->input('format');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        switch ($type) {
            case 'stock_valuation':
                return $this->exportStockValuation($format, $startDate, $endDate);
            case 'expiry_report':
                return $this->exportExpiryReport($format, $startDate, $endDate);
            default:
                return back()->with('error', 'Report type not implemented yet.');
        }
    }

    public function customQuery(Request $request)
    {
        Gate::authorize('reports.view');

        $request->validate([
            'model' => 'required|string|in:StockBatch,StockMovement,Product,Supplier',
            'format' => 'required|in:pdf,csv',
        ]);

        $modelName = "App\\Models\\" . $request->input('model');
        $query = $modelName::query();

        // Basic date filtering if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        $data = $query->latest()->take(1000)->get();

        if ($data->isEmpty()) {
            return back()->with('error', 'No data found for the selected query.');
        }

        $filename = strtolower($request->input('model')) . "_export_" . now()->format('YmdHis');

        if ($request->input('format') === 'pdf') {
            $pdf = Pdf::loadView('reports.generic', ['data' => $data, 'title' => $request->input('model') . ' Export']);
            return $pdf->download($filename . '.pdf');
        }

        return response()->streamDownload(function() use ($data) {
            $first = $data->first()->toArray();
            echo implode(',', array_keys($first)) . "\n";
            foreach ($data as $row) {
                echo implode(',', array_map(fn($v) => is_array($v) ? json_encode($v) : $v, $row->toArray())) . "\n";
            }
        }, $filename . '.csv');
    }

    private function exportStockValuation($format, $startDate = null, $endDate = null)
    {
        $query = StockBatch::with(['product', 'storageLocation'])
            ->where('status', 'active')
            ->where('quantity_on_hand', '>', 0);

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        $data = $query->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.stock-valuation', compact('data', 'startDate', 'endDate'));
            return $pdf->download('stock-valuation-report.pdf');
        }

        return response()->streamDownload(function() use ($data) {
            echo "SKU,Product,Location,Batch,Expiry,Quantity,Unit Cost,Total Value\n";
            foreach ($data as $item) {
                $total = $item->quantity_on_hand * $item->unit_cost;
                echo "{$item->product->sku},{$item->product->name},{$item->storageLocation?->name},{$item->batch_number},{$item->expiry_date?->format('Y-m-d')},{$item->quantity_on_hand},{$item->unit_cost},{$total}\n";
            }
        }, 'stock-valuation.csv');
    }

    private function exportExpiryReport($format, $startDate = null, $endDate = null)
    {
        $query = StockBatch::with(['product', 'storageLocation'])
            ->where('status', 'active')
            ->whereNotNull('expiry_date');

        if ($startDate && $endDate) {
            $query->whereBetween('expiry_date', [$startDate, $endDate]);
        }

        $data = $query->orderBy('expiry_date')->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.expiry-report', compact('data', 'startDate', 'endDate'));
            return $pdf->download('expiry-schedule.pdf');
        }

        return response()->streamDownload(function() use ($data) {
            echo "Expiry Date,Product,Batch,Location,Quantity\n";
            foreach ($data as $item) {
                echo "{$item->expiry_date->format('Y-m-d')},{$item->product->name},{$item->batch_number},{$item->storageLocation?->name},{$item->quantity_on_hand}\n";
            }
        }, 'expiry-schedule.csv');
    }

    public function exportCenter()
    {
        Gate::authorize('reports.export');
        
        return Inertia::render('Inventory/Reports/Export', [
            'reportTypes' => [
                ['id' => 'stock_valuation', 'name' => 'Stock Valuation Report', 'description' => 'Detailed breakdown of current stock value and quantities.'],
                ['id' => 'expiry_report', 'name' => 'Expiry Schedule', 'description' => 'List of items approaching expiry or already expired.'],
                ['id' => 'consumption', 'name' => 'Consumption Analysis', 'description' => 'Usage patterns across different departments and locations.'],
                ['id' => 'reorder', 'name' => 'Reorder Summary', 'description' => 'List of items below critical reorder levels.'],
            ]
        ]);
    }

    public function auditTrail(Request $request)
    {
        Gate::authorize('audit-trail.view');

        $query = Activity::with('causer')->latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('subject_type', 'like', "%{$search}%");
            });
        }

        $activities = $query->paginate(20)
            ->withQueryString()
            ->through(fn($activity) => [
                'id' => $activity->id,
                'description' => $activity->description,
                'subject_type' => class_basename($activity->subject_type),
                'causer_name' => $activity->causer?->name ?? 'System',
                'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
                'properties' => $activity->properties,
            ]);

        return Inertia::render('Inventory/Reports/AuditTrail', [
            'activities' => $activities,
            'filters' => $request->only(['search'])
        ]);
    }

    public function viewer(Request $request)
    {
        Gate::authorize('reports.view');

        $type = $request->input('type', 'products');
        $filters = $request->all();

        $data = match ($type) {
            'movements' => $this->getMovementsData($filters),
            'consumption' => $this->getConsumptionData($filters),
            'stores' => $this->getStoresData($filters),
            default => $this->getProductsData($filters),
        };

        return Inertia::render('Inventory/Reports/ReportViewer', [
            'reportData' => $data,
            'type' => $type,
            'filters' => $filters,
            'categories' => Category::all(['id', 'name']),
            'locations' => StorageLocation::all(['id', 'name']),
            'departments' => Department::all(['id', 'name']),
        ]);
    }

    public function exportExcel(Request $request)
    {
        Gate::authorize('reports.export');

        $type = $request->input('type', 'products');
        $filters = $request->all();

        $data = match ($type) {
            'movements' => $this->getMovementsData($filters, false),
            'consumption' => $this->getConsumptionData($filters, false),
            'stores' => $this->getStoresData($filters, false),
            default => $this->getProductsData($filters, false),
        };

        $filename = "{$type}_report_" . now()->format('Ymd_His') . ".xlsx";

        return Excel::download(new InventoryReportExport($data, $type), $filename);
    }

    private function applyDateFilters($query, $filters, $column = 'created_at')
    {
        if (!empty($filters['period'])) {
            $query->whereBetween($column, match ($filters['period']) {
                'today' => [now()->startOfDay(), now()->endOfDay()],
                'weekly' => [now()->startOfWeek(), now()->endOfWeek()],
                'monthly' => [now()->startOfMonth(), now()->endOfMonth()],
                'last_month' => [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()],
                'yearly' => [now()->startOfYear(), now()->endOfYear()],
                default => [now()->startOfDay(), now()->endOfDay()],
            });
        } elseif (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween($column, [
                $filters['start_date'] . ' 00:00:00',
                $filters['end_date'] . ' 23:59:59'
            ]);
        }

        return $query;
    }

    private function getProductsData($filters, $paginate = true)
    {
        $query = Product::with(['category', 'unitOfMeasure'])
            ->withSum(['stockBatches as quantity_on_hand' => function($q) {
                $q->where('status', 'active');
            }], 'quantity_on_hand');

        $query = $this->applyDateFilters($query, $filters);

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('sku', 'like', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        return $paginate ? $query->paginate(25)->withQueryString() : $query->get();
    }

    private function getMovementsData($filters, $paginate = true)
    {
        $query = StockMovement::with(['batch.product', 'user'])->latest();

        $query = $this->applyDateFilters($query, $filters);

        if (!empty($filters['search'])) {
            $query->whereHas('batch.product', function($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%");
            });
        }

        return $paginate ? $query->paginate(25)->withQueryString() : $query->get();
    }

    private function getConsumptionData($filters, $paginate = true)
    {
        // For consumption, we aggregate 'out' movements or fulfillments
        $query = DB::table('stock_movements')
            ->join('stock_batches', 'stock_movements.stock_batch_id', '=', 'stock_batches.id')
            ->join('products', 'stock_batches.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->join('units_of_measure', 'products.unit_of_measure_id', '=', 'units_of_measure.id')
            ->where('stock_movements.type', 'out')
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                'categories.name as category_name',
                'units_of_measure.abbreviation as uom_name',
                DB::raw('SUM(stock_movements.quantity) as total_consumed')
            )
            ->groupBy('products.id', 'products.name', 'products.sku', 'categories.name', 'units_of_measure.abbreviation');

        if (!empty($filters['period']) || (!empty($filters['start_date']) && !empty($filters['end_date']))) {
            $this->applyDateFilters($query, $filters, 'stock_movements.created_at');
        }

        if (!empty($filters['search'])) {
            $query->where('products.name', 'like', "%{$filters['search']}%");
        }

        return $paginate ? $query->paginate(25)->withQueryString() : $query->get();
    }

    private function getStoresData($filters, $paginate = true)
    {
        $query = StockBatch::with(['product', 'storageLocation.department'])
            ->where('quantity_on_hand', '>', 0)
            ->where('status', 'active');

        $query = $this->applyDateFilters($query, $filters);

        if (!empty($filters['location_id'])) {
            $query->where('storage_location_id', $filters['location_id']);
        }

        if (!empty($filters['search'])) {
            $query->whereHas('product', function($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%");
            });
        }

        return $paginate ? $query->paginate(25)->withQueryString() : $query->get();
    }
}
