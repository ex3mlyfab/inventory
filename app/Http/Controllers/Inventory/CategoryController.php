<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('categories.view');

        $categories = Category::with(['parent', 'children.children'])
            ->whereNull('parent_id') // Top level
            ->get();

        return Inertia::render('Inventory/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('categories.create');

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validated['parent_id']) {
            $parent = Category::find($validated['parent_id']);
            if ($parent->parent_id && Category::find($parent->parent_id)->parent_id) {
                return back()->withErrors(['parent_id' => 'Maximum nesting depth is 3 levels.']);
            }
        }

        Category::create($validated);

        return back()->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category)
    {
        Gate::authorize('categories.edit');

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validated['parent_id'] && $validated['parent_id'] !== $category->id) {
            $parent = Category::find($validated['parent_id']);
            if ($parent->parent_id && Category::find($parent->parent_id)->parent_id) {
                return back()->withErrors(['parent_id' => 'Maximum nesting depth is 3 levels.']);
            }
        }

        $category->update($validated);

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        Gate::authorize('categories.delete');

        // Check if category has children
        if ($category->children()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete category with sub-categories.']);
        }

        // Check if category has products
        if ($category->products()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete category with assigned products.']);
        }

        $category->delete();

        return back()->with('success', 'Category deleted successfully.');
    }
}
