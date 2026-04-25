<?php

use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // === ADMIN ===
    Route::prefix('admin')->name('admin.')->middleware('role:Super Admin')->group(function () {
        Route::resource('users', UserController::class)->except(['show']);
        Route::resource('roles', RoleController::class)->only(['index', 'store', 'edit', 'update']);
        Route::resource('departments', DepartmentController::class)->except(['show', 'create', 'edit']);
        Route::get('settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('settings.index');
        Route::post('settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('settings.update');
    });

    // === INVENTORY ===
    Route::prefix('inventory')->name('inventory.')->group(function () {
        // Products
        Route::resource('products', \App\Http\Controllers\Inventory\ProductController::class);
        
        // Categories
        Route::resource('categories', \App\Http\Controllers\Inventory\CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
        
        // Units of Measure
        Route::resource('units', \App\Http\Controllers\Inventory\UnitOfMeasureController::class)->only(['index', 'store', 'update', 'destroy']);
        
        // Storage Locations
        Route::resource('locations', \App\Http\Controllers\Inventory\StorageLocationController::class);
        Route::post('locations/{location}/assign-users', [\App\Http\Controllers\Inventory\StorageLocationController::class, 'assignUsers'])->name('locations.assign-users');
        Route::delete('locations/{location}/users/{user}', [\App\Http\Controllers\Inventory\StorageLocationController::class, 'removeUser'])->name('locations.remove-user');
        
        // Stock
        Route::get('stock', [\App\Http\Controllers\Inventory\StockController::class, 'index'])->name('stock.index');
        Route::get('stock/{product}/batches', [\App\Http\Controllers\Inventory\StockController::class, 'batches'])->name('stock.batches');
        
        // Adjustments
        Route::get('stock-adjustments', [\App\Http\Controllers\Inventory\StockAdjustmentController::class, 'index'])->name('stock-adjustments.index');
        Route::post('stock-adjustments', [\App\Http\Controllers\Inventory\StockAdjustmentController::class, 'store'])->name('stock-adjustments.store');
        Route::post('stock-adjustments/{adjustment}/approve', [\App\Http\Controllers\Inventory\StockAdjustmentController::class, 'approve'])->name('stock-adjustments.approve');
        Route::post('stock-adjustments/{adjustment}/reject', [\App\Http\Controllers\Inventory\StockAdjustmentController::class, 'reject'])->name('stock-adjustments.reject');

        // Movements
        Route::get('stock-movements', [\App\Http\Controllers\Inventory\StockMovementController::class, 'index'])->name('stock-movements.index');
    });
});

require __DIR__.'/settings.php';
