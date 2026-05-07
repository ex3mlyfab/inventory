<?php

use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Inventory\InitialAllocationController;
use App\Http\Controllers\Inventory\HoldingsController;
use App\Http\Controllers\Inventory\RequisitionController;
use App\Http\Controllers\Inventory\StockAdjustmentController;
use App\Http\Controllers\Inventory\StockTakeController;
use App\Http\Controllers\Inventory\StockTransferController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Inertia\Inertia;


Route::any('up', fn () => response()->noContent());
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('auth/login', [
        'canResetPassword' => Features::enabled(Features::resetPasswords()),
        'canRegister' => Features::enabled(Features::registration()),
        'status' => session('status'),
    ]);
})->name('home');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // === ADMIN ===
    Route::prefix('admin')->name('admin.')->middleware('role:Super Admin')->group(function () {
        Route::resource('users', UserController::class)->except(['show']);
        Route::resource('roles', RoleController::class)->only(['index', 'store', 'edit', 'update']);
        Route::resource('departments', DepartmentController::class)->except(['show', 'create', 'edit']);
        Route::get('settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('settings.index');
        Route::post('settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('settings.update');
        Route::get('branding', [\App\Http\Controllers\Admin\BrandingController::class, 'index'])->name('branding.index');
        Route::post('branding', [\App\Http\Controllers\Admin\BrandingController::class, 'update'])->name('branding.update');
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
        Route::get('holdings', [HoldingsController::class, 'index'])->name('holdings.index');
        
        // Adjustments
        Route::get('stock-adjustments/search-batches', [StockAdjustmentController::class, 'searchBatches'])->name('stock-adjustments.search-batches');
        Route::resource('stock-adjustments', StockAdjustmentController::class)->except(['create', 'edit', 'show']);
        Route::post('stock-adjustments/{adjustment}/approve', [StockAdjustmentController::class, 'approve'])->name('stock-adjustments.approve');
        Route::post('stock-adjustments/{adjustment}/reject', [StockAdjustmentController::class, 'reject'])->name('stock-adjustments.reject');

        Route::get('initial-allocation', [InitialAllocationController::class, 'index'])->name('initial-allocation.index');
        Route::post('initial-allocation', [InitialAllocationController::class, 'store'])->name('initial-allocation.store');

        // Transfers
        Route::get('stock-transfers', [StockTransferController::class, 'index'])->name('stock-transfers.index');
        Route::post('stock-transfers', [StockTransferController::class, 'store'])->name('stock-transfers.store');

        // Stock Take (Count)
        Route::get('stock-count', [StockTakeController::class, 'index'])->name('stock-count.index');
        Route::post('stock-count', [StockTakeController::class, 'store'])->name('stock-count.store');
        Route::get('stock-count/{session}', [StockTakeController::class, 'show'])->name('stock-count.show');
        Route::post('stock-count/{session}/update', [StockTakeController::class, 'updateCounts'])->name('stock-count.update');
        Route::post('stock-count/{session}/complete', [StockTakeController::class, 'complete'])->name('stock-count.complete');

        // Movements
        Route::get('stock-movements', [\App\Http\Controllers\Inventory\StockMovementController::class, 'index'])->name('stock-movements.index');

        // Departmental Stores Oversight
        Route::get('departmental-stores', [\App\Http\Controllers\Inventory\DepartmentalStoreController::class, 'index'])->name('departmental-stores.index');

        // Suppliers
        Route::get('suppliers/dashboard', [\App\Http\Controllers\Inventory\SupplierController::class, 'dashboard'])->name('suppliers.dashboard');
        Route::resource('suppliers', \App\Http\Controllers\Inventory\SupplierController::class);
    });

    // === EQUIPMENT & ASSETS ===
    Route::prefix('equipment')->name('equipment.')->group(function () {
        Route::resource('assets', \App\Http\Controllers\Equipment\AssetController::class);
        Route::resource('maintenance', \App\Http\Controllers\Equipment\MaintenanceController::class)->only(['index', 'store', 'show']);
        Route::resource('work-orders', \App\Http\Controllers\Equipment\WorkOrderController::class)->only(['index', 'store', 'update', 'show']);
        Route::get('calibration', [\App\Http\Controllers\Equipment\MaintenanceController::class, 'index'])->name('calibration.index'); // Reusing maintenance for now
    });

    // === PROCUREMENT ===
    Route::prefix('procurement')->name('procurement.')->group(function () {

        // Goods Received Notes
        Route::get('grn', [\App\Http\Controllers\Inventory\GrnController::class, 'index'])->name('grn.index');
        Route::get('grn/create', [\App\Http\Controllers\Inventory\GrnController::class, 'create'])->name('grn.create');
        Route::post('grn', [\App\Http\Controllers\Inventory\GrnController::class, 'store'])->name('grn.store');
        Route::get('grn/{grn}', [\App\Http\Controllers\Inventory\GrnController::class, 'show'])->name('grn.show');

        // Requisitions
        Route::get('requisitions', [RequisitionController::class, 'index'])->name('requisitions.index');
        Route::get('requisitions/create', [RequisitionController::class, 'create'])->name('requisitions.create');
        Route::get('requisitions/check-stock', [RequisitionController::class, 'checkStock'])->name('requisitions.check-stock');
        Route::post('requisitions', [RequisitionController::class, 'store'])->name('requisitions.store');
        Route::get('requisitions/{requisition}', [RequisitionController::class, 'show'])->name('requisitions.show');
        Route::post('requisitions/{requisition}/issue', [RequisitionController::class, 'issue'])->name('requisitions.issue');
        Route::post('requisitions/{requisition}/receive', [RequisitionController::class, 'receive'])->name('requisitions.receive');
        Route::get('requisitions/{requisition}/print', [RequisitionController::class, 'printReleaseForm'])->name('requisitions.print');

        Route::post('requisitions/{requisition}/approve/level1', [RequisitionController::class, 'approveLevel1'])->name('requisitions.approve.l1');
        Route::post('requisitions/{requisition}/approve/level2', [RequisitionController::class, 'approveLevel2'])->name('requisitions.approve.l2');
        Route::post('requisitions/{requisition}/reject', [RequisitionController::class, 'reject'])->name('requisitions.reject');
        Route::post('requisitions/{requisition}/cancel', [RequisitionController::class, 'cancel'])->name('requisitions.cancel');

        // Purchase Orders
        Route::resource('purchase-orders', \App\Http\Controllers\Inventory\PurchaseOrderController::class);
        Route::post('purchase-orders/{purchase_order}/approve/level1', [\App\Http\Controllers\Inventory\PurchaseOrderController::class, 'approveLevel1'])->name('purchase-orders.approve.l1');
        Route::post('purchase-orders/{purchase_order}/approve/level2', [\App\Http\Controllers\Inventory\PurchaseOrderController::class, 'approveLevel2'])->name('purchase-orders.approve.l2');
        Route::post('purchase-orders/{purchase_order}/reject', [\App\Http\Controllers\Inventory\PurchaseOrderController::class, 'reject'])->name('purchase-orders.reject');
    });

    // === REPORTS & ANALYTICS ===
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Inventory\ReportController::class, 'index'])->name('index');
        Route::get('/viewer', [\App\Http\Controllers\Inventory\ReportController::class, 'viewer'])->name('viewer');
        Route::get('/export', [\App\Http\Controllers\Inventory\ReportController::class, 'exportCenter'])->name('export');
        Route::post('/export', [\App\Http\Controllers\Inventory\ReportController::class, 'export'])->name('export.generate');
        Route::get('/export-excel', [\App\Http\Controllers\Inventory\ReportController::class, 'exportExcel'])->name('export.excel');
        Route::post('/export/query', [\App\Http\Controllers\Inventory\ReportController::class, 'customQuery'])->name('export.query');
        Route::get('/audit-trail', [\App\Http\Controllers\Inventory\ReportController::class, 'auditTrail'])->name('audit-trail');
    });
});

require __DIR__.'/settings.php';
