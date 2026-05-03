<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandingController extends Controller
{
    /**
     * Display the branding settings page.
     */
    public function index(): Response
    {
        return Inertia::render('admin/branding/index', [
            'branding' => [
                'app_name' => Setting::get('app_name', config('app.name')),
                'app_tagline' => Setting::get('app_tagline', 'Modern Inventory Management'),
                'app_logo' => Setting::get('app_logo') ? asset('storage/' . Setting::get('app_logo')) : null,
            ]
        ]);
    }

    /**
     * Update the branding settings.
     */
    public function update(Request $request)
    {
        $request->validate([
            'app_name' => 'required|string|max:255',
            'app_tagline' => 'nullable|string|max:255',
            'app_logo_file' => 'nullable|image|max:2048', // 2MB Max
        ]);

        Setting::set('app_name', $request->app_name);
        Setting::set('app_tagline', $request->app_tagline);

        if ($request->hasFile('app_logo_file')) {
            // Delete old logo if exists
            $oldLogo = Setting::get('app_logo');
            if ($oldLogo) {
                Storage::disk('public')->delete($oldLogo);
            }

            $path = $request->file('app_logo_file')->store('branding', 'public');
            Setting::set('app_logo', $path);
        }

        return back()->with('success', 'Branding settings updated successfully.');
    }
}
