<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('stock.view');

        $movements = StockMovement::with(['batch.product', 'user'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Inventory/Stock/Movements', [
            'movements' => $movements,
        ]);
    }
}
