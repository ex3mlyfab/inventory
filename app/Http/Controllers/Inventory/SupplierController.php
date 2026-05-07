<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    public function dashboard()
    {
        Gate::authorize('suppliers.view');

        $stats = [
            'total' => Supplier::count(),
            'active' => Supplier::where('status', 'active')->count(),
            'by_category' => Supplier::selectRaw('category, count(*) as count')->groupBy('category')->get(),
            'recent' => Supplier::latest()->take(5)->get(),
        ];

        return Inertia::render('Inventory/Suppliers/Dashboard', [
            'stats' => $stats
        ]);
    }

    public function index(Request $request)
    {
        Gate::authorize('suppliers.view');

        $query = Supplier::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest();

        $suppliers = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'category', 'status']),
            'categories' => ['pharmaceutical', 'medical_equipment', 'surgical_supply', 'laboratory', 'general'],
            'statuses' => ['active', 'inactive', 'suspended'],
        ]);
    }

    public function create()
    {
        Gate::authorize('suppliers.create');

        return Inertia::render('Inventory/Suppliers/Create', [
            'categories' => ['pharmaceutical', 'medical_equipment', 'surgical_supply', 'laboratory', 'general'],
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('suppliers.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:suppliers,code',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:suppliers,email',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'category' => 'required|in:pharmaceutical,medical_equipment,surgical_supply,laboratory,general',
            'status' => 'required|in:active,inactive,suspended',
            'description' => 'nullable|string',
        ]);

        Supplier::create($validated);

        return redirect()->route('inventory.suppliers.index')
            ->with('success', 'Supplier created successfully.');
    }

    public function show(Supplier $supplier)
    {
        Gate::authorize('suppliers.view');

        return Inertia::render('Inventory/Suppliers/Show', [
            'supplier' => $supplier,
        ]);
    }

    public function edit(Supplier $supplier)
    {
        Gate::authorize('suppliers.edit');

        return Inertia::render('Inventory/Suppliers/Edit', [
            'supplier' => $supplier,
            'categories' => ['pharmaceutical', 'medical_equipment', 'surgical_supply', 'laboratory', 'general'],
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        Gate::authorize('suppliers.edit');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:suppliers,code,' . $supplier->id . ',id',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:suppliers,email,' . $supplier->id . ',id',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'category' => 'required|in:pharmaceutical,medical_equipment,surgical_supply,laboratory,general',
            'status' => 'required|in:active,inactive,suspended',
            'description' => 'nullable|string',
        ]);

        $supplier->update($validated);

        return redirect()->route('inventory.suppliers.index')
            ->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        Gate::authorize('suppliers.delete');

        $supplier->delete();

        return redirect()->route('inventory.suppliers.index')
            ->with('success', 'Supplier deleted successfully.');
    }
}
