<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StorageLocation;
use App\Models\Department;
use App\Models\User;
use App\Models\StockBatch;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StorageLocationController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('locations.manage');

        $locations = StorageLocation::with('department')->get();
        $departments = Department::all();

        return Inertia::render('Inventory/Locations/Index', [
            'locations' => $locations,
            'departments' => $departments,
        ]);
    }

    public function show(StorageLocation $location)
    {
        Gate::authorize('locations.manage');

        $location->load(['department', 'users']);

        // Current Inventory (Products in this store)
        $inventory = StockBatch::where('storage_location_id', $location->id)
            ->with(['product'])
            ->get()
            ->groupBy('product_id')
            ->map(function ($batches) {
                $firstBatch = $batches->first();
                return [
                    'product_id' => $firstBatch->product_id,
                    'product' => $firstBatch->product,
                    'total_quantity' => $batches->sum('quantity_on_hand'),
                    'batches_count' => $batches->count(),
                    'batches' => $batches
                ];
            })->values();

        // Stock History (Movements in this store)
        $history = StockMovement::whereHas('batch', function ($query) use ($location) {
            $query->where('storage_location_id', $location->id);
        })
        ->with(['batch.product', 'user'])
        ->latest()
        ->paginate(20);

        // Users available for assignment (Super Admin only can assign)
        $assignableUsers = [];
        if (auth()->user()->hasRole('Super Admin')) {
            $assignableUsers = User::where('is_active', true)
                ->where(function($q) use ($location) {
                    $q->whereNull('storage_location_id')
                      ->orWhere('storage_location_id', '!=', $location->id);
                })
                ->get(['id', 'name', 'email']);
        }

        return Inertia::render('Inventory/Locations/Show', [
            'location' => $location,
            'inventory' => $inventory,
            'history' => $history,
            'assignableUsers' => $assignableUsers,
            'isSuperAdmin' => auth()->user()->hasRole('Super Admin'),
        ]);
    }

    public function assignUsers(Request $request, StorageLocation $location)
    {
        Gate::authorize('locations.manage');
        
        if (!auth()->user()->hasRole('Super Admin')) {
            abort(403, 'Only Super Admins can assign users to stores.');
        }

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        User::whereIn('id', $validated['user_ids'])->update([
            'storage_location_id' => $location->id
        ]);

        return back()->with('success', count($validated['user_ids']) . ' user(s) assigned successfully.');
    }

    public function removeUser(Request $request, StorageLocation $location, User $user)
    {
        Gate::authorize('locations.manage');

        if (!auth()->user()->hasRole('Super Admin')) {
            abort(403, 'Only Super Admins can remove users from stores.');
        }

        if ($user->storage_location_id !== $location->id) {
            return back()->withErrors(['error' => 'User is not assigned to this location.']);
        }

        $user->update(['storage_location_id' => null]);

        return back()->with('success', "User '{$user->name}' removed from location.");
    }

    public function store(Request $request)
    {
        Gate::authorize('locations.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:storage_locations,code',
            'type' => 'required|in:main_store,pharmacy,satellite_pharmacy,ward_store,laboratory',
            'department_id' => 'nullable|exists:departments,id',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        StorageLocation::create($validated);

        return back()->with('success', 'Storage location created successfully.');
    }

    public function update(Request $request, StorageLocation $location)
    {
        Gate::authorize('locations.manage');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:storage_locations,code,' . $location->id,
            'type' => 'required|in:main_store,pharmacy,satellite_pharmacy,ward_store,laboratory',
            'department_id' => 'nullable|exists:departments,id',
            'address' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $location->update($validated);

        return back()->with('success', 'Storage location updated successfully.');
    }

    public function destroy(StorageLocation $location)
    {
        Gate::authorize('locations.manage');

        // Check if location has stock (matching by code string since migration uses string for location)
        if (\App\Models\StockBatch::where('location', $location->code)->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete location with existing stock batches.']);
        }

        $location->delete();

        return back()->with('success', 'Storage location deleted successfully.');
    }
}
