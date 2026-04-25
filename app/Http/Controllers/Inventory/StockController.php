<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockBatch;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StockController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('stock.view');

        $query = Product::with(['category', 'stockBatches' => function($q) {
            $q->where('status', 'active');
        }])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
            });

        $products = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/Stock/Index', [
            'products' => $products,
            'filters' => $request->only(['search']),
        ]);
    }

    public function batches(Product $product)
    {
        Gate::authorize('stock.view');

        $product->load(['category']);
        $batches = $product->stockBatches()
            ->with(['movements.user'])
            ->latest('expiry_date')
            ->paginate(15);

        return Inertia::render('Inventory/Stock/Batches', [
            'product' => $product,
            'batches' => $batches,
        ]);
    }
}
