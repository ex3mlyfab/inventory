<?php

namespace App\Http\Controllers\Equipment;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Category;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $categoryId = $request->input('category_id');

        $query = Asset::with(['category', 'storageLocation'])
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('asset_tag', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%");
            })
            ->when($status, function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            });

        $assets = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Equipment/Asset/Index', [
            'assets' => $assets,
            'categories' => Category::select('id', 'name')->get(),
            'locations' => StorageLocation::select('id', 'name')->get(),
            'filters' => $request->only(['search', 'status', 'category_id']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Equipment/Asset/Create', [
            'categories' => Category::select('id', 'name')->get(),
            'locations' => StorageLocation::select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asset_tag' => 'required|string|unique:assets,asset_tag',
            'serial_number' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'model_number' => 'nullable|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric|min:0',
            'warranty_expiry' => 'nullable|date',
            'status' => 'required|in:functional,under_maintenance,decommissioned,lost,damaged',
            'storage_location_id' => 'nullable|exists:storage_locations,id',
            'notes' => 'nullable|string',
        ]);

        Asset::create($validated);

        return redirect()->route('equipment.assets.index')
            ->with('success', 'Asset created successfully.');
    }

    public function show(Asset $asset)
    {
        return Inertia::render('Equipment/Asset/Show', [
            'asset' => $asset->load(['category', 'storageLocation', 'maintenanceLogs', 'workOrders.requester']),
        ]);
    }
}
