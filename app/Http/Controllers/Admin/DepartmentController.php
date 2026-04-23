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
            ->with('head:id,name')
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
            'head_user_id' => ['nullable', 'exists:users,id'],
            'type' => ['required', 'in:ward,admin,support,clinical,pharmacy'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        $department->update($validated);

        return redirect()->route('admin.departments.index')
            ->with('success', "Department '{$department->name}' updated successfully.");
    }

    /**
     * Remove the specified department (soft delete).
     */
    public function destroy(Department $department)
    {
        if ($department->users()->count() > 0) {
            return back()->with('error', 'Cannot delete a department that has users assigned to it.');
        }

        $department->delete();

        return redirect()->route('admin.departments.index')
            ->with('success', "Department '{$department->name}' deleted successfully.");
    }
}
