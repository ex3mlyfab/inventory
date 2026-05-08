<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\StorageLocation;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class RequisitionController extends Controller
{
    private const STORE_TYPES = [
        'main_store',
        'pharmacy',
        'satellite_pharmacy',
    ];

    /**
     * Roles that can see ALL requisitions regardless of department.
     */
    private const ALL_ACCESS_ROLES = [
        'Super Admin',
        'Medical Director',
        'Store Manager',
        'Store Officer',
        'Inventory Manager',
        'Procurement Officer',
    ];

    /**
     * Auto-generate a unique requisition reference number.
     * Format: REQ-INT-YYYYMMDD-XXXX  or  REQ-PUR-YYYYMMDD-XXXX
     */
    private function generateReference(string $type): string
    {
        $prefix = match($type) {
            'internal'     => 'REQ-INT',
            'purchase'     => 'REQ-PUR',
            'departmental' => 'REQ-DEPT',
            default        => 'REQ',
        };
        $today  = now()->format('Ymd');
        $count  = Requisition::whereDate('created_at', today())
                             ->where('type', $type)
                             ->count() + 1;

        return $prefix . '-' . $today . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
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

        // Full-access roles see everything
        if ($user->hasAnyRole(self::ALL_ACCESS_ROLES)) {
            return $query;
        }

        // Store Officer: Only their assigned store
        if ($user->hasRole('Store Officer')) {
            return $query->where('requesting_location_id', $user->storage_location_id)
                         ->orWhere('issuing_location_id', $user->storage_location_id)
                         ->orWhere('requested_by', $user->id);
        }

        // Ward/Dept Head: Only their own department's incoming or outgoing requests
        if ($user->hasRole('Ward/Dept Head')) {
            // Find departments where this user is the head
            $deptIds = \App\Models\Department::where('head_user_id', $user->id)->pluck('id');

            // Add their own department to the list of departments they can manage
            if ($user->department_id && !$deptIds->contains($user->department_id)) {
                $deptIds->push($user->department_id);
            }

            return $query->whereIn('requesting_department_id', $deptIds)
                         ->orWhereHas('requestingLocation', function ($q) use ($deptIds) {
                            $q->whereIn('department_id', $deptIds);
                         })
                         ->orWhere('requested_by', $user->id);
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
            ->when($request->search, fn($q, $s) =>
                $q->where('reference', 'like', "%{$s}%")
                  ->orWhereHas('requester', fn($u) => $u->where('name', 'like', "%{$s}%"))
            )
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        // Stats for scoped view
        $base = $this->scopedQuery();
        $stats = [
            'total'          => (clone $base)->count(),
            'pending_l1'     => (clone $base)->where('status', 'submitted')->count(),
            'pending_l2'     => (clone $base)->where('status', 'level1_approved')->count(),
            'internal'       => (clone $base)->where('type', 'internal')->count(),
            'departmental'   => (clone $base)->where('type', 'departmental')->count(),
            'purchase'       => (clone $base)->where('type', 'purchase')->count(),
        ];

        // Determine what roles the user can act as approver
        $canApproveL1 = $user->hasAnyRole(['Ward/Dept Head', 'Procurement Officer', 'Inventory Manager']);
        $canApproveL2 = $user->hasRole('Medical Director');

        return Inertia::render('Inventory/Requisitions/Index', [
            'requisitions'  => $query,
            'filters'       => $request->only(['search', 'type', 'status']),
            'stats'         => $stats,
            'canApproveL1'  => $canApproveL1,
            'canApproveL2'  => $canApproveL2,
        ]);
    }

    // ── Create ─────────────────────────────────────────────────────────

    public function create(Request $request)
    {
        Gate::authorize('requisitions.create');

        $user = Auth::user();
        $type = $request->query('type', 'internal');

        // RBAC: Store Officer/Manager for Internal/Purchase
        if (in_array($type, ['internal', 'purchase']) && ! $user->hasAnyRole(['Store Officer', 'Store Manager', 'Super Admin', 'Medical Director'])) {
            return redirect()->route('procurement.requisitions.create', ['type' => 'departmental'])
                ->with('error', 'Only store personnel can initiate Internal or Purchase requisitions.');
        }

        $locations = StorageLocation::where('is_active', true)
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
        
        $departments = \App\Models\Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $defaultRef = $this->generateReference($type);

        $stores = $locations->filter(fn($l) => in_array($l->type, self::STORE_TYPES))->values();
        $departmentalStores = $locations->reject(fn($l) => in_array($l->type, self::STORE_TYPES))->values();

        return Inertia::render('Inventory/Requisitions/Create', [
            'type'               => $type,
            'stores'             => $stores,
            'departmentalStores' => $departmentalStores,
            'products'           => $products,
            'suppliers'          => $suppliers,
            'departments'        => $departments,
            'defaultRef'         => $defaultRef,
            'user'               => [
                'id'                  => $user->id,
                'role'                => $user->roles->first()?->name,
                'storage_location_id' => $user->storage_location_id,
                'department_id'       => $user->department_id,
            ],
        ]);
    }

    /**
     * Check available stock for a product at a specific location.
     */
    public function checkStock(Request $request)
    {
        $request->validate([
            'product_id'  => ['required', 'ulid', 'exists:products,id'],
            'location_id' => ['required', 'ulid', 'exists:storage_locations,id'],
        ]);

        $stock = \App\Models\StockBatch::where('product_id', $request->product_id)
            ->where('storage_location_id', $request->location_id)
            ->where('status', 'active')
            ->sum('quantity_on_hand');

        return response()->json([
            'available' => (int) $stock,
        ]);
    }

    // ── Store ──────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        Gate::authorize('requisitions.create');

        $user = Auth::user();

        $base = $request->validate([
            'type'                        => ['required', 'in:internal,purchase,departmental'],
            'reference'                   => ['required', 'string', 'max:60', 'unique:requisitions,reference'],
            'purpose'                     => ['nullable', 'string', 'max:500'],
            'required_by'                 => ['nullable', 'date', 'after_or_equal:today'],
            'notes'                       => ['nullable', 'string', 'max:500'],
            'items'                       => ['required', 'array', 'min:1'],
            'items.*.product_id'          => ['required', 'ulid', 'exists:products,id'],
            'items.*.quantity_requested'  => ['required', 'integer', 'min:1'],
            'items.*.quantity_on_hand'    => ['nullable', 'integer', 'min:0'],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes'               => ['nullable', 'string', 'max:200'],
        ]);

        if ($request->type === 'internal') {
            // RBAC: Store Officer can only request for their assigned store
            if ($user->hasRole('Store Officer') && $request->requesting_location_id !== $user->storage_location_id) {
                abort(403, 'A Store Officer can only raise internal requisitions for their assigned location.');
            }

            $request->validate([
                'requesting_location_id' => [
                    'required', 
                    'ulid', 
                    'exists:storage_locations,id',
                    function ($attribute, $value, $fail) {
                        $loc = StorageLocation::find($value);
                        if ($loc && !in_array($loc->type, self::STORE_TYPES)) {
                            $fail('Internal requisitions must be requested by a Store.');
                        }
                    }
                ],
                'issuing_location_id'    => [
                    'required', 
                    'ulid', 
                    'exists:storage_locations,id',
                    'different:requesting_location_id',
                    function ($attribute, $value, $fail) {
                        $loc = StorageLocation::find($value);
                        if ($loc && !in_array($loc->type, self::STORE_TYPES)) {
                            $fail('Internal requisitions must be issued from a Store.');
                        }
                    }
                ],
            ]);
        } elseif ($request->type === 'departmental') {
            // RBAC: Ward Head can only request for their department
            if ($user->hasRole('Ward/Dept Head') && $request->requesting_department_id !== $user->department_id) {
                abort(403, 'A Department Head can only raise requisitions for their own department.');
            }

            $request->validate([
                'requesting_department_id' => ['required', 'ulid', 'exists:departments,id'],
                'issuing_location_id'      => [
                    'required', 
                    'ulid', 
                    'exists:storage_locations,id',
                    function ($attribute, $value, $fail) {
                        $loc = StorageLocation::find($value);
                        if ($loc && !in_array($loc->type, self::STORE_TYPES)) {
                            $fail('Departmental requisitions must be issued from a Store.');
                        }
                    }
                ],
            ]);
        } else {
            $request->validate([
                'supplier_id' => ['nullable', 'ulid', 'exists:suppliers,id'],
            ]);
        }

        DB::transaction(function () use ($request, $base) {
            $req = Requisition::create([
                'type'                     => $base['type'],
                'reference'                => $base['reference'],
                'requested_by'             => Auth::id(),
                'requesting_location_id'   => $request->requesting_location_id ?? null,
                'requesting_department_id' => $request->requesting_department_id ?? null,
                'issuing_location_id'      => $request->issuing_location_id ?? null,
                'supplier_id'              => $request->supplier_id ?? null,
                'purpose'                  => $base['purpose'] ?? null,
                'required_by'              => $base['required_by'] ?? null,
                'notes'                    => $base['notes'] ?? null,
                'status'                   => 'submitted',
            ]);

            // Determine location for auto-sync
            $syncLocationId = $request->requesting_location_id;
            if ($request->type === 'departmental' && !$syncLocationId) {
                $syncLocationId = StorageLocation::where('department_id', $request->requesting_department_id)->value('id');
            }

            foreach ($base['items'] as $item) {
                RequisitionItem::create([
                    'requisition_id'      => $req->id,
                    'product_id'          => $item['product_id'],
                    'quantity_requested'  => $item['quantity_requested'],
                    'quantity_on_hand'    => $item['quantity_on_hand'] ?? 0,
                    'estimated_unit_cost' => $item['estimated_unit_cost'] ?? null,
                    'notes'               => $item['notes'] ?? null,
                ]);

                // Auto-sync stock if quantity_on_hand was provided
                if ($syncLocationId && isset($item['quantity_on_hand'])) {
                    $used = $this->syncReportedStock($syncLocationId, $item['product_id'], (int) $item['quantity_on_hand']);
                    
                    if ($used > 0) {
                        $req->items()->where('product_id', $item['product_id'])->update([
                            'quantity_used' => $used
                        ]);
                    }
                }
            }
        });

        return redirect()->route('procurement.requisitions.index')
            ->with('success', 'Requisition submitted successfully.');
    }

    // ── Show ───────────────────────────────────────────────────────────

    public function show(Requisition $requisition)
    {
        Gate::authorize('requisitions.view');

        $user = Auth::user();

        // Enforce scoped visibility (non-whitelisted roles check dept ownership)
        if (! $user->hasAnyRole(self::ALL_ACCESS_ROLES)) {
            if ($user->hasRole('Ward/Dept Head')) {
                $deptIds = \App\Models\Department::where('head_user_id', $user->id)->pluck('id');
                
                if ($user->department_id && !$deptIds->contains($user->department_id)) {
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
            'requisition'  => $requisition,
            'canApproveL1' => $canApproveL1,
            'canApproveL2' => $canApproveL2,
            'canReject'    => $canReject,
            'canUpload'    => $requisition->status === 'approved' && ($requisition->requested_by === $user->id || $user->can('requisitions.issue')),
        ]);
    }

    /**
     * Print layout for the Release Form.
     */
    public function printReleaseForm(Requisition $requisition)
    {
        Gate::authorize('requisitions.view');

        $requisition->load([
            'requester',
            'level1Approver',
            'level2Approver',
            'requestingLocation',
            'requestingDepartment',
            'issuingLocation',
            'items.product',
        ]);

        return Inertia::render('Inventory/Requisitions/PrintReleaseForm', [
            'requisition' => $requisition,
            'hospital_name' => 'FMC Abuja', // Should ideally come from config
        ]);
    }



    // ── Level 1 Approve ────────────────────────────────────────────────

    public function approveLevel1(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.approve.l1');

        if (! $requisition->awaitingLevel1()) {
            return back()->withErrors(['status' => 'This requisition is not awaiting Level 1 approval.']);
        }

        if (! $requisition->isExpectedLevel1Approver(Auth::user())) {
            abort(403, 'You are not the designated Level 1 approver for this requisition.');
        }

        $data = $request->validate([
            'notes'                       => ['nullable', 'string', 'max:500'],
            'items'                       => ['required', 'array'],
            'items.*.id'                  => ['required', 'ulid', 'exists:requisition_items,id'],
            'items.*.quantity_requested'  => ['required', 'integer', 'min:1'],
            'items.*.quantity_approved'   => ['required', 'integer', 'min:0'],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($requisition, $data) {
            foreach ($data['items'] as $itemData) {
                $requisition->items()->findOrFail($itemData['id'])
                            ->update([
                                'quantity_requested'  => $itemData['quantity_requested'],
                                'quantity_approved'   => $itemData['quantity_approved'],
                                'estimated_unit_cost' => $itemData['estimated_unit_cost'] ?? null,
                            ]);
            }

            $requisition->update([
                'status'             => 'level1_approved',
                'level1_approved_by' => Auth::id(),
                'level1_approved_at' => now(),
                'level1_notes'       => $data['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'Level 1 approval granted. Requisition is now pending Medical Director approval.');
    }

    // ── Level 2 Approve ────────────────────────────────────────────────

    public function approveLevel2(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.approve.l2');

        if (! $requisition->awaitingLevel2()) {
            return back()->withErrors(['status' => 'This requisition is not awaiting Level 2 (Medical Director) approval.']);
        }

        if (! $requisition->isExpectedLevel2Approver(Auth::user())) {
            abort(403, 'Only the Medical Director can give Level 2 approval.');
        }

        $data = $request->validate([
            'notes'                       => ['nullable', 'string', 'max:500'],
            'items'                       => ['required', 'array'],
            'items.*.id'                  => ['required', 'ulid', 'exists:requisition_items,id'],
            'items.*.quantity_requested'  => ['required', 'integer', 'min:1'],
            'items.*.quantity_approved'   => ['required', 'integer', 'min:0'],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($requisition, $data) {
            foreach ($data['items'] as $itemData) {
                $requisition->items()->findOrFail($itemData['id'])
                            ->update([
                                'quantity_requested'  => $itemData['quantity_requested'],
                                'quantity_approved'   => $itemData['quantity_approved'],
                                'estimated_unit_cost' => $itemData['estimated_unit_cost'] ?? null,
                            ]);
            }

            $requisition->update([
                'status'             => 'approved',
                'approved_by'        => Auth::id(),          // legacy field
                'level2_approved_by' => Auth::id(),
                'level2_approved_at' => now(),
                'level2_notes'       => $data['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'Requisition fully approved by Medical Director.');
    }

    // ── Reject (works at either stage) ─────────────────────────────────

    public function reject(Request $request, Requisition $requisition)
    {
        $user = Auth::user();

        $canReject = ($requisition->awaitingLevel1() && $requisition->isExpectedLevel1Approver($user))
                  || ($requisition->awaitingLevel2() && $requisition->isExpectedLevel2Approver($user));

        if (! $canReject) {
            abort(403, 'You are not authorised to reject this requisition at its current stage.');
        }

        $data = $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        $requisition->update([
            'status'      => 'rejected',
            'approved_by' => $user->id,
            'notes'       => $data['notes'],
        ]);

        return back()->with('success', 'Requisition rejected.');
    }

    // ── Cancel ─────────────────────────────────────────────────────────

    public function cancel(Requisition $requisition)
    {
        Gate::authorize('requisitions.cancel');

        if ($requisition->requested_by !== Auth::id()) {
            abort(403, 'You can only cancel your own requisitions.');
        }

        if (! $requisition->isPending()) {
            return back()->withErrors(['status' => 'Only pending requisitions can be cancelled.']);
        }

        $requisition->update(['status' => 'cancelled']);

        return back()->with('success', 'Requisition cancelled.');
    }

    /**
     * Issue items for a requisition.
     */
    public function issue(Request $request, Requisition $requisition, \App\Actions\Inventory\IssueRequisitionAction $action)
    {
        Gate::authorize('requisitions.issue');

        $user = Auth::user();

        // Security: Must be assigned to the issuing location
        if (!$user->hasRole('Super Admin') && $requisition->issuing_location_id !== $user->storage_location_id) {
            abort(403, 'You can only issue items from your assigned storage location.');
        }

        if (!in_array($requisition->status, ['approved', 'partially_issued', 'in_transit'])) {
            return back()->withErrors(['error' => 'This requisition is not in a state that allows issuance.']);
        }

        $validated = $request->validate([
            'issuances'                       => ['required', 'array', 'min:1'],
            'issuances.*.requisition_item_id' => ['required', 'ulid', 'exists:requisition_items,id'],
            'issuances.*.stock_batch_id'      => ['required', 'ulid', 'exists:stock_batches,id'],
            'issuances.*.quantity'            => ['required', 'integer', 'min:1'],
            'collector_name'                  => ['required', 'string', 'max:100'],
            'collector_signature'             => ['nullable', 'string'], // base64 string
        ]);

        try {
            DB::transaction(function () use ($requisition, $validated, $action, $user) {
                $action->execute($requisition, $validated['issuances'], $user->id);

                $updateData = [
                    'collector_name' => $validated['collector_name'],
                    'status'         => 'in_transit', // Mark as in transit immediately after issuance
                ];

                if (!empty($validated['collector_signature'])) {
                    $signatureData = $validated['collector_signature'];
                    if (preg_match('/^data:image\/(\w+);base64,/', $signatureData, $type)) {
                        $signatureData = substr($signatureData, strpos($signatureData, ',') + 1);
                        $type = strtolower($type[1]); // jpg, png, gif

                        if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                            throw new \Exception('invalid image type');
                        }

                        $signatureData = base64_decode($signatureData);

                        if ($signatureData === false) {
                            throw new \Exception('base64_decode failed');
                        }
                    } else {
                        throw new \Exception('did not match data URI with image data');
                    }

                    $fileName = 'sig_' . $requisition->id . '_' . time() . '.' . $type;
                    $path = 'requisitions/signatures/' . $fileName;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($path, $signatureData);
                    
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
        Gate::authorize('requisitions.create');

        $user = Auth::user();
        
        $isRequester = $requisition->requested_by === $user->id;
        $isDeptHead = false;

        if ($user->hasRole('Ward/Dept Head')) {
            // Check if user is head of the requesting department or the department of the requesting location
            $deptIds = \App\Models\Department::where('head_user_id', $user->id)->pluck('id');
            
            if ($user->department_id && !$deptIds->contains($user->department_id)) {
                $deptIds->push($user->department_id);
            }

            $reqDeptId = $requisition->requesting_department_id;
            $locDeptId = $requisition->requestingLocation?->department_id;

            $isDeptHead = ($reqDeptId && $deptIds->contains($reqDeptId)) || 
                         ($locDeptId && $deptIds->contains($locDeptId));
        }

        if (!$isRequester && !$isDeptHead && !$user->hasRole('Super Admin')) {
            abort(403, 'Only the requester or the Department Head can confirm receipt.');
        }

        if (!in_array($requisition->status, ['issued', 'in_transit'])) {
            return back()->with('error', 'Only issued or in-transit requisitions can be marked as received.');
        }

        DB::transaction(function () use ($requisition) {
            // Identify target location for receiving
            $locationId = $requisition->requesting_location_id;
            if ($requisition->type === 'departmental' && !$locationId) {
                $locationId = StorageLocation::where('department_id', $requisition->requesting_department_id)->value('id');

                // Fallback: Auto-create a departmental store if none exists to prevent process failure
                if (!$locationId && $requisition->requesting_department_id) {
                    $dept = $requisition->requestingDepartment ?: \App\Models\Department::find($requisition->requesting_department_id);
                    if ($dept) {
                        $newLocation = StorageLocation::create([
                            'name'          => $dept->name . ' Store',
                            'code'          => 'DEPT-' . ($dept->code ?? strtoupper(substr($dept->id, -4))),
                            'type'          => 'ward_store',
                            'department_id' => $dept->id,
                            'is_active'     => true,
                            'description'   => 'Automatically created during requisition receipt.',
                        ]);
                        $locationId = $newLocation->id;
                    }
                }
            }

            if (!$locationId) {
                throw new \Exception("Could not identify or create a storage location for the requesting department. Please ensure the department exists.");
            }

            // Find all outflows recorded for this requisition
            $outflows = \App\Models\StockMovement::where('reference_type', Requisition::class)
                ->where('reference_id', $requisition->id)
                ->where('quantity', '<', 0)
                ->with('batch')
                ->get();

            foreach ($outflows as $outflow) {
                $sourceBatch = $outflow->batch;
                $qty = abs($outflow->quantity);

                $targetBatch = \App\Models\StockBatch::firstOrCreate(
                    [
                        'storage_location_id' => $locationId,
                        'product_id'          => $sourceBatch->product_id,
                        'batch_number'        => $sourceBatch->batch_number,
                        'expiry_date'         => $sourceBatch->expiry_date,
                    ],
                    [
                        'quantity_on_hand'  => 0,
                        'quantity_received' => 0,
                        'unit_cost'         => $sourceBatch->unit_cost,
                        'status'            => 'active',
                    ]
                );

                $balanceBefore = $targetBatch->quantity_on_hand;
                $targetBatch->increment('quantity_on_hand', $qty);
                $targetBatch->increment('quantity_received', $qty);

                if ($targetBatch->status !== 'active') {
                    $targetBatch->update(['status' => 'active']);
                }

                \App\Models\StockMovement::create([
                    'stock_batch_id' => $targetBatch->id,
                    'user_id'        => Auth::id(),
                    'type'           => 'requisition_fulfillment',
                    'quantity'       => $qty,
                    'balance_before' => $balanceBefore,
                    'balance_after'  => $balanceBefore + $qty,
                    'notes'          => "Received from {$requisition->issuingLocation?->name} (Req: {$requisition->reference})",
                    'reference_type' => Requisition::class,
                    'reference_id'   => $requisition->id,
                ]);
            }

            $requisition->update(['status' => 'completed']);
        });

        return back()->with('success', 'Requisition marked as RECEIVED. Your inventory has been updated.');
    }

    /**
     * Helper to sync reported stock for a location.
     * Returns the quantity determined to be 'used' (consumption).
     */
    private function syncReportedStock(string $locationId, string $productId, int $reportedQty): int
    {
        $batches = \App\Models\StockBatch::where('storage_location_id', $locationId)
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->get();

        $currentTotal = $batches->sum('quantity_on_hand');
        $difference = $reportedQty - $currentTotal;
        $quantityUsed = 0;

        if ($difference === 0) return 0;

        if ($batches->isNotEmpty()) {
            $batch = $batches->first();
            $oldQty = $batch->quantity_on_hand;
            $newQty = $oldQty + $difference;
            
            // If reported is less than system, the difference is recorded as 'used'
            if ($difference < 0) {
                $quantityUsed = abs($difference);
            }

            $batch->update([
                'quantity_on_hand' => max(0, $newQty),
                'status' => $newQty <= 0 ? 'exhausted' : $batch->status
            ]);

            \App\Models\StockMovement::create([
                'stock_batch_id' => $batch->id,
                'user_id'        => Auth::id(),
                'type'           => $difference < 0 ? 'consumption' : 'adjustment',
                'quantity'       => $difference,
                'balance_before' => $oldQty,
                'balance_after'  => max(0, $newQty),
                'notes'          => $difference < 0 
                                    ? 'Consumption recorded during requisition' 
                                    : 'Self-reported stock during requisition',
            ]);
        } elseif ($reportedQty > 0) {
            \App\Models\StockBatch::create([
                'product_id'          => $productId,
                'storage_location_id' => $locationId,
                'quantity_received'   => $reportedQty,
                'quantity_on_hand'    => $reportedQty,
                'batch_number'        => 'OPEN-' . now()->format('Ymd'),
                'status'              => 'active',
                'reference'           => 'Initial Reported Balance',
            ]);
        }

        return $quantityUsed;
    }
}
