<?php

namespace App\Http\Controllers\Equipment;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetMaintenanceLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MaintenanceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $type = $request->input('type');

        // If accessed via calibration route, force type to calibration
        if ($request->routeIs('equipment.calibration.index')) {
            $type = 'calibration';
        }

        $query = AssetMaintenanceLog::with(['asset'])
            ->when($search, function ($q, $search) {
                $q->whereHas('asset', function ($aq) use ($search) {
                    $aq->where('name', 'like', "%{$search}%")
                       ->orWhere('asset_tag', 'like', "%{$search}%");
                });
            })
            ->when($type, function ($q, $type) {
                $q->where('type', $type);
            });

        $logs = $query->latest('performed_at')->paginate(15)->withQueryString();

        return Inertia::render('Equipment/Maintenance/Index', [
            'logs' => $logs,
            'filters' => array_merge($request->only(['search', 'type']), ['type' => $type]),
            'isCalibrationPage' => $request->routeIs('equipment.calibration.index'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'type' => 'required|in:routine,repair,calibration,upgrade,inspection',
            'performed_at' => 'required|date',
            'next_due_at' => 'nullable|date|after:performed_at',
            'performed_by' => 'nullable|string|max:255',
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
        ]);

        AssetMaintenanceLog::create($validated);

        return back()->with('success', 'Maintenance log added successfully.');
    }
}
