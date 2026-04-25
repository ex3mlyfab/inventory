<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\UnitOfMeasure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class UnitOfMeasureController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('units.view');

        $query = UnitOfMeasure::with('baseUnit')
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('abbreviation', 'like', "%{$search}%");
            })
            ->orderBy('name');

        return Inertia::render('Inventory/Units/Index', [
            'units' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['search']),
            'base_units' => UnitOfMeasure::whereNull('base_unit_id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('units.create');

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units_of_measure,name',
            'abbreviation' => 'required|string|max:10|unique:units_of_measure,abbreviation',
            'base_unit_id' => 'nullable|exists:units_of_measure,id',
            'conversion_factor' => 'required|numeric|min:0.0001',
        ]);

        UnitOfMeasure::create($validated);

        return redirect()->route('inventory.units.index')
            ->with('success', 'Unit of measure created successfully.');
    }

    public function update(Request $request, UnitOfMeasure $unit)
    {
        Gate::authorize('units.edit');

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units_of_measure,name,' . $unit->id,
            'abbreviation' => 'required|string|max:10|unique:units_of_measure,abbreviation,' . $unit->id,
            'base_unit_id' => 'nullable|exists:units_of_measure,id|different:id',
            'conversion_factor' => 'required|numeric|min:0.0001',
        ]);

        $unit->update($validated);

        return redirect()->route('inventory.units.index')
            ->with('success', 'Unit of measure updated successfully.');
    }

    public function destroy(UnitOfMeasure $unit)
    {
        Gate::authorize('units.delete');

        // Check if it's being used by any products
        if (\App\Models\Product::where('unit_of_measure', $unit->abbreviation)->exists()) {
             return back()->withErrors(['error' => 'Cannot delete unit that is currently assigned to products.']);
        }

        // Check if it's a base unit for others
        if (UnitOfMeasure::where('base_unit_id', $unit->id)->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a base unit that has child units linked to it.']);
        }

        $unit->delete();

        return redirect()->route('inventory.units.index')
            ->with('success', 'Unit of measure deleted successfully.');
    }
}
