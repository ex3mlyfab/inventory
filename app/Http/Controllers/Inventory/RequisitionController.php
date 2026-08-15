<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Inventory\IssueRequisitionAction;
use App\Actions\Inventory\ReceiveRequisitionAction;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Product;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\StorageLocation;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RequisitionController extends Controller
{
    private const STORE_TYPES = [
        'main_store',
        'pharmacy',
        'satellite_pharmacy',
    ];

    /**
     * Permission that allows viewing all requisitions regardless of scope.
     */
    private const FULL_ACCESS_PERMISSION = 'requisitions.view_all';

    /**
     * Auto-generate a unique requisition reference number.
     * Format: REQ-INT-YYYYMMDD-XXXXX  or  REQ-PUR-YYYYMMDD-XXXXX
     * Uses a ULID-derived suffix to avoid race conditions on the count-based sequence.
     */
    private function generateReference(string $type): string
    {
        $prefix = match ($type) {
            'internal' => 'REQ-INT',
            'purchase' => 'REQ-PUR',
            'departmental' => 'REQ-DEPT',
            default => 'REQ',
        };
        $today = now()->format('Ymd');

        return $prefix.'-'.$today.'-'.strtoupper(substr((string) \Illuminate\Support\Str::ulid(), -8));
    }

    /**
     * Build a scoped query for the authenticated user.
     */
    private function scopedQuery()
    {
        $user = Auth::user();

        $query = Requisition::with([
            'requester.department',
            'requestingLocation.department',
            'requestingDepartment',
            'issuingLocation',
            'supplier',
            'level1Approver',
            'level2Approver',
            'items',
        ]);

        // Full-access permission sees everything
        if ($user->hasPermissionTo(self::FULL_ACCESS_PERMISSION)) {
            return $query;
        }

        // Store Officer & Main Store Officer
        if ($user->hasRole('Store Officer') || $user->hasRole('Main Store Officer')) {
            return $query->where(function ($q) use ($user) {
                // See internal/purchase where their store is involved
                $q->whereIn('type', ['internal', 'purchase'])
                    ->where(function ($sub) use ($user) {
                        $sub->where('requesting_location_id', $user->storage_location_id)
                            ->orWhere('issuing_location_id', $user->storage_location_id);
                    });
            })->orWhere(function ($q) use ($user) {
                // See departmental only if their store is issuing
                $q->where('type', 'departmental')
                    ->where('issuing_location_id', $user->storage_location_id);
            })->orWhere('requested_by', $user->id);
        }

        // Ward/Dept Head: Only their own department's departmental requests
        if ($user->hasRole('Ward/Dept Head')) {
            // Find departments where this user is the head
            $deptIds = Department::where('head_user_id', $user->id)->pluck('id');

            // Add their own department to the list of departments they can manage
            if ($user->department_id && ! $deptIds->contains($user->department_id)) {
                $deptIds->push($user->department_id);
            }

            return $query->where('type', 'departmental')
                ->where(function ($q) use ($deptIds, $user) {
                    $q->whereIn('requesting_department_id', $deptIds)
                        ->orWhereHas('requestingLocation', function ($sub) use ($deptIds) {
                            $sub->whereIn('department_id', $deptIds);
                        })
                        ->orWhere('requested_by', $user->id);
                });
        }

        // Everyone else: only their own submissions
        return $query->where('requested_by', $user->id);
    }

    // ── Index ──────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        Gate::authorize('requisitions.view');

        $user = Auth::user();

        $query = $this->scopedQuery()
            ->when($request->search, fn ($q, $s) => $q->where('reference', 'like', "%{$s}%")
                ->orWhereHas('requester', fn ($u) => $u->where('name', 'like', "%{$s}%"))
            )
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->department, fn ($q, $d) => $q->where(function ($q2) use ($d) {
                $q2->where('requesting_department_id', $d)
                    ->orWhereHas('requestingLocation', function ($sub) use ($d) {
                        $sub->where('department_id', $d);
                    });
            })
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

        // Stats for scoped view
        $base = $this->scopedQuery();
        $stats = [
            'total' => (clone $base)->count(),
            'pending_l1' => (clone $base)->where('status', 'submitted')->count(),
            'pending_l2' => (clone $base)->where('status', 'level1_approved')->count(),
            'internal' => (clone $base)->where('type', 'internal')->count(),
            'departmental' => (clone $base)->where('type', 'departmental')->count(),
            'purchase' => (clone $base)->where('type', 'purchase')->count(),
        ];

        // Determine what roles the user can act as approver
        $canApproveL1 = $user->hasAnyRole(['Ward/Dept Head', 'Procurement Officer', 'Inventory Manager']);
        $canApproveL2 = $user->hasRole('Medical Director');

        return Inertia::render('Inventory/Requisitions/Index', [
            'requisitions' => $query,
            'filters' => $request->only(['search', 'type', 'status', 'department']),
            'stats' => $stats,
            'departments' => Department::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'canApproveL1' => $canApproveL1,
            'canApproveL2' => $canApproveL2,
        ]);
    }

    // ── Create ─────────────────────────────────────────────────────────

    public function create(Request $request)
    {
        Gate::authorize('requisitions.create');

        $user = Auth::user();
        $type = $request->query('type', 'internal');

        // RBAC: Store Officer/Manager for Internal/Purchase
        if (in_array($type, ['internal', 'purchase']) && ! $user->hasAnyRole(['Main Store Officer', 'Store Officer', 'Store Manager', 'Super Admin', 'Medical Director'])) {
            return redirect()->route('procurement.requisitions.create', ['type' => 'departmental'])
                ->with('error', 'Only store personnel can initiate Internal or Purchase requisitions.');
        }

        $locations = StorageLocation::withoutGlobalScope('location_access')
            ->where('is_active', true)
            ->with('department')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'type', 'department_id']);

        $products = Product::with('unitOfMeasure')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'unit_of_measure_id', 'is_expirable']);

        $suppliers = Supplier::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $defaultRef = $this->generateReference($type);

        $stores = $locations->filter(fn ($l) => in_array($l->type, self::STORE_TYPES))->values();
        $departmentalStores = $locations->reject(fn ($l) => in_array($l->type, self::STORE_TYPES))->values();

        return Inertia::render('Inventory/Requisitions/Create', [
            'type' => $type,
            'stores' => $stores,
            'departmentalStores' => $departmentalStores,
            'products' => $products,
            'suppliers' => $suppliers,
            'departments' => $departments,
            'defaultRef' => $defaultRef,
            'user' => [
                'id' => $user->id,
                'role' => $user->roles->first()?->name,
                'storage_location_id' => $user->storage_location_id,
                'department_id' => $user->department_id,
            ],
        ]);
    }

    /**
     * Check available stock for a product at a specific location.
     */
    public function checkStock(Request $request)
    {
        Gate::authorize('requisitions.view');

        $request->validate([
            'product_id' => ['required', 'ulid', 'exists:products,id'],
            'location_id' => ['required', 'ulid', 'exists:storage_locations,id'],
        ]);

        $stock = StockBatch::where('product_id', $request->product_id)
            ->where('storage_location_id', $request->location_id)
            ->where('status', 'active')
            ->sum('quantity_on_hand');

        return response()->json([
            'available' => (int) $stock,
        ]);
    }

    /**
     * Get all available stock for a specific location.
     */
    public function locationStock(Request $request)
    {
        Gate::authorize('requisitions.view');

        $request->validate([
            'location_id' => ['required', 'ulid', 'exists:storage_locations,id'],
        ]);

        $stocks = StockBatch::where('storage_location_id', $request->location_id)
            ->where('status', 'active')
            ->select('product_id', DB::raw('SUM(quantity_on_hand) as available'))
            ->groupBy('product_id')
            ->having('available', '>', 0)
            ->get();

        return response()->json([
            'data' => $stocks,
        ]);
    }

    // ── Store ──────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        Gate::authorize('requisitions.create');

        $user = Auth::user();

        $base = $request->validate([
            'type' => ['required', 'in:internal,purchase,departmental'],
            'status' => ['nullable', 'in:draft,submitted'],
            'sync_stock' => ['nullable', 'bool'],
            'purpose' => ['nullable', 'string', 'max:500'],
            'required_by' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'ulid', 'exists:products,id'],
            'items.*.quantity_requested' => ['required', 'integer', 'min:1'],
            'items.*.quantity_on_hand' => ['nullable', 'integer', 'min:0'],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
        ]);

        if ($base['type'] === 'purchase' && !$user->hasAnyRole(['Main Store Officer', 'Store Officer', 'Store Manager', 'Super Admin', 'Medical Director'])) {
            abort(403, 'Only store personnel can initiate Purchase requisitions.');
        }

        $status = $base['status'] ?? 'submitted';
        $syncStock = $base['sync_stock'] ?? false;

        $productIds = collect($base['items'])->pluck('product_id');
        if ($productIds->unique()->count() !== $productIds->count()) {
            return back()->withErrors(['error' => 'Duplicate products are not allowed in a single requisition. Please combine quantities for the same product.']);
        }

        if ($request->type === 'internal') {
            // RBAC: Store Officer can only request for their assigned store
            if (($user->hasRole('Store Officer') || $user->hasRole('Main Store Officer')) && $request->requesting_location_id !== $user->storage_location_id) {
                abort(403, 'A Store Officer can only raise internal requisitions for their assigned location.');
            }

            $request->validate([
                'requesting_location_id' => [
                    'required',
                    'ulid',
                    'exists:storage_locations,id',
                    function ($attribute, $value, $fail) {
                        $loc = StorageLocation::find($value);
                        if ($loc && ! in_array($loc->type, self::STORE_TYPES)) {
                            $fail('Internal requisitions must be requested by a Store.');
                        }
                    },
                ],
                'issuing_location_id' => [
                    'required',
                    'ulid',
                    'exists:storage_locations,id',
                    'different:requesting_location_id',
                    function ($attribute, $value, $fail) {
                        $loc = StorageLocation::find($value);
                        if ($loc && ! in_array($loc->type, self::STORE_TYPES)) {
                            $fail('Internal requisitions must be issued from a Store.');
                        }
                    },
                ],
            ]);
        } elseif ($request->type === 'departmental') {
            // RBAC: Ward Head can only request for their department
            if ($user->hasRole('Ward/Dept Head') && $request->requesting_department_id !== $user->department_id) {
                abort(403, 'A Department Head can only raise requisitions for their own department.');
            }

            $request->validate([
                'requesting_department_id' => ['required', 'ulid', 'exists:departments,id'],
                'issuing_location_id' => [
                    'required',
                    'ulid',
                    'exists:storage_locations,id',
                    function ($attribute, $value, $fail) {
                        $loc = StorageLocation::find($value);
                        if ($loc && ! in_array($loc->type, self::STORE_TYPES)) {
                            $fail('Departmental requisitions must be issued from a Store.');
                        }
                    },
                ],
            ]);
        } else {
            $request->validate([
                'supplier_id' => ['nullable', 'ulid', 'exists:suppliers,id'],
            ]);
        }

        DB::transaction(function () use ($request, $base, $status) {
            $req = Requisition::create([
                'type' => $base['type'],
                'reference' => $this->generateReference($base['type']),
                'requested_by' => Auth::id(),
                'requesting_location_id' => $request->requesting_location_id ?? null,
                'requesting_department_id' => $request->requesting_department_id ?? null,
                'issuing_location_id' => $request->issuing_location_id ?? null,
                'supplier_id' => $request->supplier_id ?? null,
                'purpose' => $base['purpose'] ?? null,
                'required_by' => $base['required_by'] ?? null,
                'notes' => $base['notes'] ?? null,
                'status' => $status,
            ]);

            // Determine location for auto-sync
            $syncLocationId = $request->requesting_location_id;
            if ($request->type === 'departmental' && ! $syncLocationId) {
                $syncLocationId = StorageLocation::withoutGlobalScope('location_access')
                    ->where('department_id', $request->requesting_department_id)
                    ->value('id');
            }

            foreach ($base['items'] as $item) {
                RequisitionItem::create([
                    'requisition_id' => $req->id,
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity_requested'],
                    'quantity_on_hand' => $item['quantity_on_hand'] ?? 0,
                    'estimated_unit_cost' => $item['estimated_unit_cost'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);

                // Auto-sync stock if quantity_on_hand was provided and sync_stock is enabled
                if ($syncStock && $syncLocationId && isset($item['quantity_on_hand'])) {
                    $used = $this->syncReportedStock($syncLocationId, $item['product_id'], (int) $item['quantity_on_hand']);

                    if ($used > 0) {
                        $req->items()->where('product_id', $item['product_id'])->update([
                            'quantity_used' => $used,
                        ]);
                    }
                }
            }
        });

        $message = $status === 'draft' ? 'Requisition saved as draft.' : 'Requisition submitted successfully.';

        return redirect()->route('procurement.requisitions.index')
            ->with('success', $message);
    }

    // ── Show ───────────────────────────────────────────────────────────

    public function show(Requisition $requisition)
    {
        Gate::authorize('requisitions.view');

        $user = Auth::user();

        // Enforce scoped visibility (non-whitelisted roles check dept ownership)
        if (! $user->hasPermissionTo(self::FULL_ACCESS_PERMISSION)) {
            if ($user->hasRole('Ward/Dept Head')) {
                $deptIds = Department::where('head_user_id', $user->id)->pluck('id');

                if ($user->department_id && ! $deptIds->contains($user->department_id)) {
                    $deptIds->push($user->department_id);
                }

                $locationInDept = StorageLocation::whereIn('department_id', $deptIds)
                    ->whereKey($requisition->requesting_location_id)
                    ->exists();

                $reqInDept = $deptIds->contains($requisition->requesting_department_id);

                abort_unless($locationInDept || $reqInDept || $requisition->requested_by === $user->id, 403);
            } elseif ($user->hasRole('Store Officer') || $user->hasRole('Main Store Officer')) {
                $storeInvolved = $requisition->requesting_location_id === $user->storage_location_id
                              || $requisition->issuing_location_id === $user->storage_location_id;
                abort_unless($storeInvolved || $requisition->requested_by === $user->id, 403);
            } else {
                abort_unless($requisition->requested_by === $user->id, 403);
            }
        }

        $requisition->load([
            'requester',
            'level1Approver',
            'level2Approver',
            'requestingLocation.department',
            'issuingLocation.department',
            'supplier',
            'items.product.unitOfMeasure',
        ]);

        // Determine what this viewer can do
        $canApproveL1 = $requisition->awaitingLevel1()
                        && $requisition->isExpectedLevel1Approver($user);

        $canApproveL2 = $requisition->awaitingLevel2()
                        && $requisition->isExpectedLevel2Approver($user);

        $canReject = ($requisition->awaitingLevel1() && $canApproveL1)
                  || ($requisition->awaitingLevel2() && $canApproveL2);

        return Inertia::render('Inventory/Requisitions/Show', [
            'requisition' => $requisition,
            'canApproveL1' => $canApproveL1,
            'canApproveL2' => $canApproveL2,
            'canReject' => $canReject,
            'canUpload' => $requisition->status === 'approved' && $requisition->requested_by === $user->id,
        ]);
    }

    /**
     * Print layout for the Release Form.
     */
    public function printReleaseForm(Requisition $requisition)
    {
        Gate::authorize('requisitions.view');

        $user = Auth::user();

        if (! $user->hasPermissionTo(self::FULL_ACCESS_PERMISSION)) {
            if ($user->hasRole('Store Officer') || $user->hasRole('Main Store Officer')) {
                $storeInvolved = $requisition->requesting_location_id === $user->storage_location_id
                              || $requisition->issuing_location_id === $user->storage_location_id;
                abort_unless($storeInvolved || $requisition->requested_by === $user->id, 403);
            } elseif ($user->hasRole('Ward/Dept Head')) {
                $deptIds = Department::where('head_user_id', $user->id)->pluck('id');

                if ($user->department_id && ! $deptIds->contains($user->department_id)) {
                    $deptIds->push($user->department_id);
                }

                $locationInDept = StorageLocation::whereIn('department_id', $deptIds)
                    ->whereKey($requisition->requesting_location_id)
                    ->exists();

                $reqInDept = $deptIds->contains($requisition->requesting_department_id);

                abort_unless($locationInDept || $reqInDept || $requisition->requested_by === $user->id, 403);
            } else {
                abort_unless($requisition->requested_by === $user->id, 403);
            }
        }

        $requisition->load([
            'requester',
            'level1Approver',
            'level2Approver',
            'requestingLocation',
            'requestingDepartment',
            'issuingLocation',
            'items.product.unitOfMeasure',
        ]);

        return Inertia::render('Inventory/Requisitions/PrintReleaseForm', [
            'requisition' => $requisition,
            'hospital_name' => config('app.name'),
        ]);
    }

    // ── Edit Draft ──────────────────────────────────────────────────────

    public function edit(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.view');

        $user = Auth::user();

        if ($requisition->status !== 'draft') {
            return redirect()->route('procurement.requisitions.show', $requisition)
                ->with('error', 'Only draft requisitions can be edited.');
        }

        if ($requisition->requested_by !== $user->id) {
            abort(403, 'You can only edit your own drafts.');
        }

        $locations = StorageLocation::withoutGlobalScope('location_access')
            ->where('is_active', true)
            ->with('department')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'type', 'department_id']);

        $products = Product::with('unitOfMeasure')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'unit_of_measure_id', 'is_expirable']);

        $suppliers = Supplier::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $stores = $locations->filter(fn ($l) => in_array($l->type, self::STORE_TYPES))->values();
        $departmentalStores = $locations->reject(fn ($l) => in_array($l->type, self::STORE_TYPES))->values();

        return Inertia::render('Inventory/Requisitions/Create', [
            'type' => $requisition->type,
            'stores' => $stores,
            'departmentalStores' => $departmentalStores,
            'products' => $products,
            'suppliers' => $suppliers,
            'departments' => $departments,
            'defaultRef' => $requisition->reference,
            'user' => [
                'id' => $user->id,
                'role' => $user->roles->first()?->name,
                'storage_location_id' => $user->storage_location_id,
                'department_id' => $user->department_id,
            ],
            'requisition' => [
                'id' => $requisition->id,
                'reference' => $requisition->reference,
                'purpose' => $requisition->purpose ?? '',
                'required_by' => $requisition->required_by ? $requisition->required_by->format('Y-m-d') : '',
                'notes' => $requisition->notes ?? '',
                'updated_at' => $requisition->updated_at?->toIso8601String(),
                'requesting_location_id' => $requisition->requesting_location_id,
                'requesting_department_id' => $requisition->requesting_department_id,
                'issuing_location_id' => $requisition->issuing_location_id,
                'supplier_id' => $requisition->supplier_id,
                'items' => $requisition->items->map(fn ($i) => [
                    'id' => $i->id,
                    'product_id' => $i->product_id,
                    'quantity_requested' => (string) $i->quantity_requested,
                    'quantity_on_hand' => (string) $i->quantity_on_hand,
                    'estimated_unit_cost' => (string) $i->estimated_unit_cost,
                ]),
            ],
        ]);
    }

    /**
     * Update a draft requisition.
     */
    public function update(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.view');

        $user = Auth::user();

        if ($requisition->status !== 'draft') {
            return redirect()->route('procurement.requisitions.show', $requisition)
                ->with('error', 'Only draft requisitions can be edited.');
        }

        if ($requisition->requested_by !== $user->id) {
            abort(403, 'You can only edit your own drafts.');
        }

        $base = $request->validate([
            'purpose' => ['nullable', 'string', 'max:500'],
            'required_by' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:500'],
            'updated_at' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'ulid', 'exists:products,id'],
            'items.*.quantity_requested' => ['required', 'integer', 'min:1'],
            'items.*.quantity_on_hand' => ['nullable', 'integer', 'min:0'],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:200'],
        ]);

        $productIds = collect($base['items'])->pluck('product_id');
        if ($productIds->unique()->count() !== $productIds->count()) {
            return back()->withErrors(['error' => 'Duplicate products are not allowed in a single requisition. Please combine quantities for the same product.']);
        }

        DB::transaction(function () use ($requisition, $base, $request) {
            $requisition = Requisition::lockForUpdate()->findOrFail($requisition->id);

            if ($requisition->status !== 'draft') {
                throw ValidationException::withMessages([
                    'error' => 'This requisition is no longer in draft status.',
                ]);
            }

            if ($base['updated_at'] && $requisition->updated_at->gt($base['updated_at'])) {
                throw ValidationException::withMessages([
                    'error' => 'This requisition was modified by another user. Please reload and try again.',
                ]);
            }

            $requisition->update([
                'purpose' => $base['purpose'] ?? null,
                'required_by' => $base['required_by'] ?? null,
                'notes' => $base['notes'] ?? null,
            ]);

            $requisition->items()->delete();

            foreach ($base['items'] as $item) {
                RequisitionItem::create([
                    'requisition_id' => $requisition->id,
                    'product_id' => $item['product_id'],
                    'quantity_requested' => $item['quantity_requested'],
                    'quantity_on_hand' => $item['quantity_on_hand'] ?? 0,
                    'estimated_unit_cost' => $item['estimated_unit_cost'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        });

        return redirect()->route('procurement.requisitions.show', $requisition)
            ->with('success', 'Draft requisition updated successfully.');
    }

    // ── Level 1 Approve ────────────────────────────────────────────────

    public function approveLevel1(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.approve.l1');

        // Preliminary guard (fast-fail before validation overhead)
        if (! $requisition->awaitingLevel1()) {
            return back()->withErrors(['status' => 'This requisition is not awaiting Level 1 approval.']);
        }

        if (! $requisition->isExpectedLevel1Approver(Auth::user())) {
            abort(403, 'You are not the designated Level 1 approver for this requisition.');
        }

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => [
                'required', 'ulid', 'exists:requisition_items,id',
                function ($attribute, $value, $fail) use ($requisition) {
                    if (! $requisition->items()->where('id', $value)->exists()) {
                        $fail('The selected item does not belong to this requisition.');
                    }
                },
            ],
            'items.*.quantity_requested' => ['required', 'integer', 'min:1'],
            'items.*.quantity_approved' => [
                'required', 'integer', 'min:0',
                function ($attribute, $value, $fail) {
                    $requested = request()->input("items.{$attribute}.quantity_requested");
                    if ($requested && $value > (int) $requested) {
                        $fail('Approved quantity cannot exceed requested quantity.');
                    }
                },
            ],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($requisition, $data) {
            // Race #2 — re-fetch with a row-lock so a second concurrent approval
            // request blocks here until this transaction commits, then re-reads
            // the already-updated status and correctly bounces.
            $requisition = Requisition::lockForUpdate()->findOrFail($requisition->id);

            if (! $requisition->awaitingLevel1()) {
                throw ValidationException::withMessages([
                    'status' => 'This requisition is not awaiting Level 1 approval.',
                ]);
            }

            foreach ($data['items'] as $itemData) {
                $requisition->items()->findOrFail($itemData['id'])
                    ->update([
                        'quantity_requested' => $itemData['quantity_requested'],
                        'quantity_approved' => $itemData['quantity_approved'],
                        'estimated_unit_cost' => $itemData['estimated_unit_cost'] ?? null,
                    ]);
            }

            $requisition->update([
                'status' => 'level1_approved',
                'level1_approved_by' => Auth::id(),
                'level1_approved_at' => now(),
                'level1_notes' => $data['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'Level 1 approval granted. Requisition is now pending Medical Director approval.');
    }

    // ── Level 2 Approve ────────────────────────────────────────────────

    public function approveLevel2(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.approve.l2');

        // Preliminary guard (fast-fail before validation overhead)
        if (! $requisition->awaitingLevel2()) {
            return back()->withErrors(['status' => 'This requisition is not awaiting Level 2 (Medical Director) approval.']);
        }

        if (! $requisition->isExpectedLevel2Approver(Auth::user())) {
            abort(403, 'Only the Medical Director can give Level 2 approval.');
        }

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => [
                'required', 'ulid', 'exists:requisition_items,id',
                function ($attribute, $value, $fail) use ($requisition) {
                    if (! $requisition->items()->where('id', $value)->exists()) {
                        $fail('The selected item does not belong to this requisition.');
                    }
                },
            ],
            'items.*.quantity_requested' => ['required', 'integer', 'min:1'],
            'items.*.quantity_approved' => [
                'required', 'integer', 'min:0',
                function ($attribute, $value, $fail) {
                    $requested = request()->input("items.{$attribute}.quantity_requested");
                    if ($requested && $value > (int) $requested) {
                        $fail('Approved quantity cannot exceed requested quantity.');
                    }
                },
            ],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($requisition, $data) {
            // Race #3 — re-fetch with a row-lock so a second concurrent approval
            // request blocks here until this transaction commits, then re-reads
            // the already-updated status and correctly bounces.
            $requisition = Requisition::lockForUpdate()->findOrFail($requisition->id);

            if (! $requisition->awaitingLevel2()) {
                throw ValidationException::withMessages([
                    'status' => 'This requisition is not awaiting Level 2 (Medical Director) approval.',
                ]);
            }

            foreach ($data['items'] as $itemData) {
                $requisition->items()->findOrFail($itemData['id'])
                    ->update([
                        'quantity_requested' => $itemData['quantity_requested'],
                        'quantity_approved' => $itemData['quantity_approved'],
                        'estimated_unit_cost' => $itemData['estimated_unit_cost'] ?? null,
                    ]);
            }

            $requisition->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),          // legacy field
                'level2_approved_by' => Auth::id(),
                'level2_approved_at' => now(),
                'level2_notes' => $data['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'Requisition fully approved by Medical Director.');
    }

    // ── Reject (works at either stage) ─────────────────────────────────

    public function reject(Request $request, Requisition $requisition)
    {
        $user = Auth::user();

        if ($requisition->awaitingLevel1()) {
            Gate::authorize('requisitions.approve.l1');

            if (! $requisition->isExpectedLevel1Approver($user)) {
                abort(403, 'You are not the designated Level 1 approver for this requisition.');
            }
        } elseif ($requisition->awaitingLevel2()) {
            Gate::authorize('requisitions.approve.l2');

            if (! $requisition->isExpectedLevel2Approver($user)) {
                abort(403, 'Only the Medical Director can reject at Level 2.');
            }
        } else {
            abort(403, 'This requisition is not in a state that allows rejection.');
        }

        $data = $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        $notesField = $requisition->awaitingLevel1() ? 'level1_notes' : 'level2_notes';

        DB::transaction(function () use ($requisition, $data, $user, $notesField) {
            $requisition = Requisition::lockForUpdate()->findOrFail($requisition->id);

            if ($requisition->awaitingLevel1()) {
                abort_if(! $requisition->isExpectedLevel1Approver($user), 403, 'You are not the designated Level 1 approver for this requisition.');
            } elseif ($requisition->awaitingLevel2()) {
                abort_if(! $requisition->isExpectedLevel2Approver($user), 403, 'Only the Medical Director can reject at Level 2.');
            } else {
                abort(403, 'This requisition is not in a state that allows rejection.');
            }

            $requisition->update([
                'status' => 'rejected',
                $notesField => $data['notes'],
            ]);
        });

        return back()->with('success', 'Requisition rejected.');
    }

    // ── Cancel ─────────────────────────────────────────────────────────

    public function cancel(Requisition $requisition)
    {
        Gate::authorize('requisitions.cancel');

        if ($requisition->requested_by !== Auth::id()) {
            abort(403, 'You can only cancel your own requisitions.');
        }

        // Preliminary guard (fast-fail)
        if (! $requisition->isPending()) {
            return back()->withErrors(['status' => 'Only pending requisitions can be cancelled.']);
        }

        // Race #5 — wrap in a transaction with a row-lock so two concurrent
        // cancel requests cannot both pass the isPending() check.
        DB::transaction(function () use ($requisition) {
            $requisition = Requisition::lockForUpdate()->findOrFail($requisition->id);

            if (! $requisition->isPending()) {
                throw ValidationException::withMessages([
                    'status' => 'Only pending requisitions can be cancelled.',
                ]);
            }

            $requisition->update(['status' => 'cancelled']);
        });

        return back()->with('success', 'Requisition cancelled.');
    }

    // ── Submit Draft ────────────────────────────────────────────────────

    public function submit(Requisition $requisition)
    {
        Gate::authorize('requisitions.create');

        if ($requisition->requested_by !== Auth::id()) {
            abort(403, 'You can only submit your own drafts.');
        }

        if ($requisition->status !== 'draft') {
            return back()->withErrors(['status' => 'Only draft requisitions can be submitted.']);
        }

        DB::transaction(function () use ($requisition) {
            $requisition = Requisition::lockForUpdate()->findOrFail($requisition->id);

            if ($requisition->status !== 'draft') {
                throw ValidationException::withMessages([
                    'status' => 'This requisition is no longer in draft status.',
                ]);
            }

            $requisition->update(['status' => 'submitted']);
        });

        return back()->with('success', 'Draft requisition submitted for approval.');
    }

    /**
     * Issue items for a requisition.
     */
    public function issue(Request $request, Requisition $requisition, IssueRequisitionAction $action)
    {
        Gate::authorize('requisitions.issue');

        $user = Auth::user();

        // Security: Must be assigned to the issuing location
        // Management roles (Store Manager, Inventory Manager, Procurement Officer, Medical Director)
        // can issue from any location as part of their oversight duties.
        $canIssueAnyLocation = $user->hasPermissionTo('requisitions.issue_any_location');

        if (! $canIssueAnyLocation && $requisition->issuing_location_id !== $user->storage_location_id) {
            abort(403, 'You can only issue items from your assigned storage location.');
        }

        if (! in_array($requisition->status, ['approved', 'partially_issued'])) {
            return back()->withErrors(['error' => 'This requisition is not in a state that allows issuance.']);
        }

        if ($requisition->type === 'purchase') {
            return back()->withErrors(['error' => 'Purchase requests cannot be issued from stock. They must be fulfilled via the Goods Received module.']);
        }

        $validated = $request->validate([
            'issuances' => ['required', 'array', 'min:1'],
            'issuances.*.requisition_item_id' => [
                'required', 'ulid', 'exists:requisition_items,id',
                function ($attribute, $value, $fail) use ($requisition) {
                    if (! $requisition->items()->where('id', $value)->exists()) {
                        $fail('The selected item does not belong to this requisition.');
                    }
                },
            ],
            'issuances.*.stock_batch_id' => [
                'required', 'ulid', 'exists:stock_batches,id',
                function ($attribute, $value, $fail) use ($requisition) {
                    $batch = StockBatch::find($value);
                    if ($batch && $batch->storage_location_id !== $requisition->issuing_location_id) {
                        $fail('Selected batch does not belong to the issuing location.');
                    }
                },
            ],
            'issuances.*.quantity' => ['required', 'integer', 'min:1', 'max:10000'],
            'collector_name' => ['required', 'string', 'max:100'],
            'collector_signature' => ['nullable', 'string'],
            'updated_at' => ['nullable', 'date'],
        ]);

        if ($validated['updated_at'] && $requisition->updated_at->gt($validated['updated_at'])) {
            return back()->withErrors(['error' => 'This requisition was modified by another user. Please reload and try again.']);
        }

        $validated['issuances'] = collect($validated['issuances'])
            ->unique(fn($i) => $i['requisition_item_id'].'-'.$i['stock_batch_id'])
            ->values()
            ->all();

        if (empty($validated['issuances'])) {
            return back()->withErrors(['error' => 'No valid issuances provided after deduplication.']);
        }

        if (! empty($validated['collector_signature']) && ! Storage::disk('public')->exists('/')) {
            return back()->withErrors(['error' => 'Signature storage is not configured. Please contact admin.']);
        }

        try {
            DB::transaction(function () use ($requisition, $validated, $action, $user) {
                $action->execute($requisition, $validated['issuances'], $user->id);

                // Fetch the updated status from the DB since the action modified it
                $requisition->refresh();

                $updateData = [
                    'collector_name' => $validated['collector_name'],
                    // Only mark as in transit if fully issued. Leave as partially_issued otherwise.
                    'status' => $requisition->status === 'issued' ? 'in_transit' : $requisition->status,
                ];

                if (! empty($validated['collector_signature'])) {
                    $signatureData = $validated['collector_signature'];
                    if (preg_match('/^data:image\/(\w+);base64,/', $signatureData, $type)) {
                        $signatureData = substr($signatureData, strpos($signatureData, ',') + 1);
                        $type = strtolower($type[1]); // jpg, png, gif

                        if (! in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                            throw new \Exception('invalid image type');
                        }

                        $signatureData = base64_decode($signatureData);

                        if ($signatureData === false) {
                            throw new \Exception('base64_decode failed');
                        }

                        // Size limit to prevent memory exhaustion attacks
                        if (strlen($signatureData) > 2_000_000) {
                            throw new \Exception('Signature image too large. Maximum 2MB allowed.');
                        }
                    } else {
                        throw new \Exception('did not match data URI with image data');
                    }

                    $fileName = 'sig_'.$requisition->id.'_'.time().'.'.$type;
                    $path = 'requisitions/signatures/'.$fileName;
                    Storage::disk('public')->put($path, $signatureData);

                    $updateData['collector_signature_path'] = $path;
                }

                $requisition->update($updateData);
            });

            return back()->with('success', 'Items issued successfully. Requisition is now IN TRANSIT.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Mark requisition as received and increment target stock.
     */
    public function receive(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.receive');

        $user = Auth::user();

        // Authorization check (same logic as before)
        $isRequester = $requisition->requested_by === $user->id;
        $isDeptHead = false;
        $isManager = false;

        if ($user->hasRole('Ward/Dept Head')) {
            $deptIds = Department::where('head_user_id', $user->id)->pluck('id');
            if ($user->department_id && ! $deptIds->contains($user->department_id)) {
                $deptIds->push($user->department_id);
            }
            $reqDeptId = $requisition->requesting_department_id;
            $locDeptId = $requisition->requestingLocation?->department_id;
            $isDeptHead = ($reqDeptId && $deptIds->contains($reqDeptId)) ||
                          ($locDeptId && $deptIds->contains($locDeptId));
        }
        $isManager = $user->hasPermissionTo('requisitions.receive_any_location');

        if (! $isRequester && ! $isDeptHead && ! $isManager) {
            abort(403, 'Only the requester, Department Head, or authorized Manager can confirm receipt.');
        }

        if (! in_array($requisition->status, ['in_transit', 'partially_received'])) {
            return back()->with('error', 'Only in-transit or partially-received requisitions can be received.');
        }

        $validated = $request->validate([
            'lines'                     => ['required', 'array', 'min:1'],
            'lines.*.item_id'           => ['required', 'ulid', 'exists:requisition_items,id'],
            'lines.*.quantity_received' => ['required', 'integer', 'min:0'],
            'lines.*.quantity_short'    => ['nullable', 'integer', 'min:0'],
            'lines.*.shortage_reason'   => ['nullable', 'in:damaged,missing,rejected'],
            'updated_at'                => ['nullable', 'date'],
        ]);

        if ($validated['updated_at'] && $requisition->updated_at->gt($validated['updated_at'])) {
            return back()->withErrors(['error' => 'This requisition was modified. Please refresh and try again.']);
        }

        try {
            app(ReceiveRequisitionAction::class)
                ->execute($requisition, $validated['lines'], $user->id);

            return back()->with('success', 'Receipt confirmed successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Upload a signed release form for a requisition.
     */
    public function uploadReleaseForm(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.view');

        $user = Auth::user();

        $isRequester = $requisition->requested_by === $user->id;
        $isManager = $user->hasAnyRole(['Super Admin', 'Store Manager', 'Inventory Manager', 'Procurement Officer', 'Medical Director']);

        if (! $isRequester && ! $isManager) {
            abort(403, 'Only the requester or a manager can upload release forms.');
        }

        $request->validate([
            'release_form' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $file = $request->file('release_form');
        $path = $file->storeAs('requisitions/release-forms', 'release_'.$requisition->id.'_'.time().'.pdf', 'public');

        $requisition->update(['release_form_path' => $path]);

        return back()->with('success', 'Release form uploaded successfully.');
    }

    /**
     * Helper to sync reported stock for a location.
     * Returns the quantity determined to be 'used' (consumption).
     */
    private function syncReportedStock(string $locationId, string $productId, int $reportedQty): int
    {
        $batches = StockBatch::lockForUpdate()
            ->where('storage_location_id', $locationId)
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->orderBy('created_at')
            ->get();

        $currentTotal = $batches->sum('quantity_on_hand');
        $difference = $reportedQty - $currentTotal;
        $quantityUsed = 0;

        if ($difference === 0) {
            return 0;
        }

        if ($batches->isNotEmpty()) {
            if ($difference > 0) {
                $batch = $batches->first();
                $oldQty = $batch->quantity_on_hand;
                $newQty = $oldQty + $difference;

                $batch->update([
                    'quantity_on_hand' => $newQty,
                    'status' => $newQty <= 0 ? 'exhausted' : $batch->status,
                ]);

                StockMovement::create([
                    'stock_batch_id' => $batch->id,
                    'user_id' => Auth::id(),
                    'type' => 'adjustment',
                    'quantity' => $difference,
                    'balance_before' => $oldQty,
                    'balance_after' => $newQty,
                    'notes' => 'Self-reported stock during requisition',
                ]);
            } elseif ($difference < 0) {
                $remaining = abs($difference);

                foreach ($batches as $batch) {
                    if ($remaining <= 0) {
                        break;
                    }

                    $oldQty = $batch->quantity_on_hand;
                    $deduct = min($remaining, $oldQty);
                    $newQty = $oldQty - $deduct;
                    $remaining -= $deduct;
                    $quantityUsed += $deduct;

                    $batch->update([
                        'quantity_on_hand' => $newQty,
                        'status' => $newQty <= 0 ? 'exhausted' : $batch->status,
                    ]);

                    StockMovement::create([
                        'stock_batch_id' => $batch->id,
                        'user_id' => Auth::id(),
                        'type' => 'consumption',
                        'quantity' => -$deduct,
                        'balance_before' => $oldQty,
                        'balance_after' => $newQty,
                        'notes' => 'Consumption recorded during requisition',
                    ]);
                }
            }
        } elseif ($reportedQty > 0) {
            StockBatch::create([
                'product_id' => $productId,
                'storage_location_id' => $locationId,
                'quantity_received' => $reportedQty,
                'quantity_on_hand' => $reportedQty,
                'batch_number' => 'OPEN-'.now()->format('Ymd'),
                'status' => 'active',
                'reference' => 'Initial Reported Balance',
            ]);
        }

        return $quantityUsed;
    }
}
