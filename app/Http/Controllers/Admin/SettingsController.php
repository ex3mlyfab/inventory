<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display the system settings page.
     */
    public function index(): Response
    {
        return Inertia::render('admin/settings/index', [
            'settings' => [
                'organization_name' => config('app.name'),
                'address' => 'FMC Abuja, Nigeria',
                'contact_email' => 'info@fmc.gov.ng',
                'contact_phone' => '+234 123 456 789',
                'currency' => 'NGN',
                'timezone' => config('app.timezone'),
                'inventory' => [
                    'low_stock_threshold' => 10,
                    'auto_approve_requisitions' => false,
                ]
            ]
        ]);
    }

    /**
     * Update the system settings.
     */
    public function update(Request $request)
    {
        // For now, we just return back with a success message
        // In a real app, we would save these to a database or config file
        return back()->with('success', 'System settings updated successfully.');
    }
}
