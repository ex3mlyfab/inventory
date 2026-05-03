<?php

namespace App\Http\Controllers\Equipment;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkOrderController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status');
        $priority = $request->input('priority');

        $query = WorkOrder::with(['asset', 'requester', 'assignedUser'])
            ->when($status, function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($priority, function ($q, $priority) {
                $q->where('priority', $priority);
            });

        $workOrders = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Equipment/WorkOrder/Index', [
            'workOrders' => $workOrders,
            'filters' => $request->only(['status', 'priority']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'description' => 'required|string',
        ]);

        $validated['requester_id'] = auth()->id();
        $validated['status'] = 'pending';

        WorkOrder::create($validated);

        return back()->with('success', 'Work order submitted successfully.');
    }
}
