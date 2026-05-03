<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Http\Requests\Inventory\StoreProductRequest;
use App\Http\Requests\Inventory\UpdateProductRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('products.view');

        $query = Product::with(['category', 'unitOfMeasure', 'stockBatches' => function($q) {
            $q->where('status', 'active');
        }])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
            });

        $products = $query->paginate(20)->withQueryString();

        // Optimized stats calculation
        $stats = [
            'total' => Product::count(),
            'low_stock' => Product::whereRaw('(SELECT COALESCE(SUM(quantity_on_hand), 0) FROM stock_batches WHERE product_id = products.id AND status = "active") <= products.reorder_level')
                ->whereRaw('(SELECT COALESCE(SUM(quantity_on_hand), 0) FROM stock_batches WHERE product_id = products.id AND status = "active") > 0')
                ->count(),
            'out_of_stock' => Product::whereRaw('(SELECT COALESCE(SUM(quantity_on_hand), 0) FROM stock_batches WHERE product_id = products.id AND status = "active") <= 0')->count(),
        ];

        return Inertia::render('Inventory/Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search']),
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        Gate::authorize('products.create');

        $categories = Category::where('is_active', true)->get();
        $units = \App\Models\UnitOfMeasure::all();

        return Inertia::render('Inventory/Products/Create', [
            'categories' => $categories,
            'units' => $units,
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        Product::create($data);

        return redirect()->route('inventory.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function show(Product $product)
    {
        Gate::authorize('products.view');

        $product->load([
            'category', 
            'unitOfMeasure', 
            'stockBatches' => function($q) {
                $q->orderBy('expiry_date', 'asc');
            }
        ]);

        // Get recent movements across all batches of this product
        $recentMovements = \App\Models\StockMovement::whereIn('stock_batch_id', $product->stockBatches->pluck('id'))
            ->with(['user', 'batch'])
            ->latest()
            ->take(20)
            ->get();

        // Prepare chart data: Last 30 days of stock levels
        $chartData = \App\Models\StockMovement::whereIn('stock_batch_id', $product->stockBatches->pluck('id'))
            ->selectRaw('DATE(created_at) as date, SUM(CASE WHEN type IN ("in", "adjustment") AND quantity > 0 THEN quantity ELSE -ABS(quantity) END) as net_change')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'change' => (float)$item->net_change,
                ];
            });

        return Inertia::render('Inventory/Products/Show', [
            'product' => $product,
            'recentMovements' => $recentMovements,
            'chartData' => $chartData,
        ]);
    }

    public function edit(Product $product)
    {
        Gate::authorize('products.edit');

        $categories = Category::where('is_active', true)->get();
        $units = \App\Models\UnitOfMeasure::all();

        return Inertia::render('Inventory/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'units' => $units,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        Gate::authorize('products.edit');
        
        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        return redirect()->route('inventory.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        Gate::authorize('products.delete');

        // Check for active stock before deletion
        if ($product->quantity_on_hand > 0) {
            return back()->withErrors(['error' => 'Cannot delete product with remaining stock. Adjust stock to zero first.']);
        }

        // Check for existing batches (even if empty, they might have history)
        if ($product->stockBatches()->count() > 0) {
             return back()->withErrors(['error' => 'Cannot delete product with historical batch records. Consider deactivating it instead.']);
        }

        $product->delete();

        return redirect()->route('inventory.products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
