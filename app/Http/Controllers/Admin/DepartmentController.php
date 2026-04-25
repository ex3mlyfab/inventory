<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index(Request $request): Response
    {
        $departments = Department::query()
            ->withCount('users')
            ->with(['supervisor:id,name', 'parent:id,name'])
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            })
            ->when($request->type, function ($q, $type) {
                $q->where('type', $type);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/departments/index', [
            'departments' => $departments,
            'allDepartments' => Department::where('is_active', true)->get(['id', 'name']),
            'users' => User::where('is_active', true)->get(['id', 'name']),
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20', 'unique:departments,code'],
            'parent_id' => ['nullable', 'exists:departments,id'],
            'head_user_id' => ['nullable', 'exists:users,id'],
            'type' => ['required', 'in:ward,admin,support,clinical,pharmacy'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        Department::create($validated);

        return redirect()->route('admin.departments.index')
            ->with('success', "Department '{$validated['name']}' created successfully.");
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20', "unique:departments,code,{$department->id}"],
            'parent_id' => ['nullable', 'exists:departments,id', 'different:id'],
            'head_user_id' => ['nullable', 'exists:users,id'],
            'type' => ['required', 'in:ward,admin,support,clinical,pharmacy'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        // Prevent circular reference: ensure parent_id is not one of its children
        if ($validated['parent_id'] && $this->isDescendant($department, $validated['parent_id'])) {
            return back()->withErrors(['parent_id' => 'A department cannot be a child of its own descendant.']);
        }

        $department->update($validated);

        return redirect()->route('admin.departments.index')
            ->with('success', "Department '{$department->name}' updated successfully.");
    }

    /**
     * Helper to check if a department is a descendant of another.
     */
    protected function isDescendant($department, $potentialParentId)
    {
        $descendants = $department->children;
        foreach ($descendants as $descendant) {
            if ($descendant->id === $potentialParentId) {
                return true;
            }
            if ($this->isDescendant($descendant, $potentialParentId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Remove the specified department (soft delete).
     */
    public function destroy(Department $department)
    {
        if ($department->users()->count() > 0) {
            return back()->with('error', 'Cannot delete a department that has users assigned to it.');
        }

        if ($department->children()->count() > 0) {
            return back()->with('error', 'Cannot delete a department that has child departments.');
        }

        $department->delete();

        return redirect()->route('admin.departments.index')
            ->with('success', "Department '{$department->name}' deleted successfully.");
    }
}
