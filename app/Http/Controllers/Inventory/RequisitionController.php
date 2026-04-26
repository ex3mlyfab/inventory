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
            'requester',
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

        return Inertia::render('Inventory/Requisitions/Create', [
            'type'        => $type,
            'locations'   => $locations,
            'products'    => $products,
            'suppliers'   => $suppliers,
            'departments' => $departments,
            'defaultRef'  => $defaultRef,
            'user'        => [
                'id'                  => $user->id,
                'role'                => $user->roles->first()?->name,
                'storage_location_id' => $user->storage_location_id,
                'department_id'       => $user->department_id,
            ],
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
                'requesting_location_id' => ['required', 'ulid', 'exists:storage_locations,id'],
                'issuing_location_id'    => ['required', 'ulid', 'exists:storage_locations,id',
                                             'different:requesting_location_id'],
            ]);
        } elseif ($request->type === 'departmental') {
            // RBAC: Ward Head can only request for their department
            if ($user->hasRole('Ward/Dept Head') && $request->requesting_department_id !== $user->department_id) {
                abort(403, 'A Department Head can only raise requisitions for their own department.');
            }

            $request->validate([
                'requesting_department_id' => ['required', 'ulid', 'exists:departments,id'],
                'issuing_location_id'      => ['required', 'ulid', 'exists:storage_locations,id'],
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

            foreach ($base['items'] as $item) {
                RequisitionItem::create([
                    'requisition_id'      => $req->id,
                    'product_id'          => $item['product_id'],
                    'quantity_requested'  => $item['quantity_requested'],
                    'quantity_on_hand'    => $item['quantity_on_hand'] ?? 0,
                    'estimated_unit_cost' => $item['estimated_unit_cost'] ?? null,
                    'notes'               => $item['notes'] ?? null,
                ]);
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
                $locationInDept = StorageLocation::whereIn('department_id', $deptIds)
                    ->whereKey($requisition->requesting_location_id)
                    ->exists();
                abort_unless($locationInDept, 403);
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
            'canUpload'    => $requisition->status === 'approved' && $requisition->requested_by === $user->id,
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

    /**
     * Upload the signed release form and mark as in transit.
     */
    public function uploadReleaseForm(Request $request, Requisition $requisition)
    {
        Gate::authorize('requisitions.create');

        if ($requisition->requested_by !== Auth::id()) {
            abort(403, 'Only the requester can upload the signed release form.');
        }

        if ($requisition->status !== 'approved') {
            return back()->with('error', 'Only approved requisitions can be marked as in transit.');
        }

        $request->validate([
            'release_form' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        if ($request->hasFile('release_form')) {
            $path = $request->file('release_form')->store('requisitions/release-forms', 'public');
            
            $requisition->update([
                'release_form_path' => $path,
                'status'            => 'in_transit',
            ]);

            return back()->with('success', 'Signed release form uploaded. Requisition is now marked as IN TRANSIT.');
        }

        return back()->with('error', 'File upload failed.');
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
            'notes'                     => ['nullable', 'string', 'max:500'],
            'items'                     => ['required', 'array'],
            'items.*.id'                => ['required', 'ulid', 'exists:requisition_items,id'],
            'items.*.quantity_approved' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($requisition, $data) {
            foreach ($data['items'] as $itemData) {
                $requisition->items()->findOrFail($itemData['id'])
                            ->update(['quantity_approved' => $itemData['quantity_approved']]);
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
            'notes'                     => ['nullable', 'string', 'max:500'],
            'items'                     => ['required', 'array'],
            'items.*.id'                => ['required', 'ulid', 'exists:requisition_items,id'],
            'items.*.quantity_approved' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($requisition, $data) {
            foreach ($data['items'] as $itemData) {
                $requisition->items()->findOrFail($itemData['id'])
                            ->update(['quantity_approved' => $itemData['quantity_approved']]);
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
            'issuances' => ['required', 'array', 'min:1'],
            'issuances.*.requisition_item_id' => ['required', 'ulid', 'exists:requisition_items,id'],
            'issuances.*.stock_batch_id' => ['required', 'ulid', 'exists:stock_batches,id'],
            'issuances.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $action->execute($requisition, $validated['issuances'], $user->id);
            return back()->with('success', 'Items issued successfully. Recipient inventory has been updated.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
