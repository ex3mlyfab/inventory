import type { User } from './auth';

export interface PaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface Category {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    parent?: Category | null;
    children?: Category[];
    created_at: string;
    updated_at: string;
}

export interface UnitOfMeasure {
    id: string;
    name: string;
    abbreviation: string;
    base_unit_id: string | null;
    conversion_factor: number;
    base_unit?: UnitOfMeasure | null;
    created_at: string;
    updated_at: string;
}

export interface Department {
    id: string;
    parent_id: string | null;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    head_user_id: string | null;
    created_at: string;
    updated_at: string;
}

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface Product {
    id: string;
    category_id: string;
    name: string;
    sku: string;
    barcode: string | null;
    description: string | null;
    unit_of_measure_id: string;
    unit_of_measure?: UnitOfMeasure;
    image_url: string | null;
    reorder_level: number;
    reorder_quantity: number;
    is_expirable: boolean;
    requires_prescription: boolean;
    status: ProductStatus;
    category?: Category;
    stock_batches?: StockBatch[];
    quantity_on_hand?: number; // Computed metric
    created_at: string;
    updated_at: string;
}

export type BatchStatus = 'active' | 'quarantined' | 'exhausted' | 'expired';

export interface StockBatch {
    id: string;
    product_id: string;
    supplier_id: string | null;
    batch_number: string;
    reference: string | null;
    quantity_received: number;
    quantity_on_hand: number;
    unit_cost: number;
    manufacturing_date: string | null;
    expiry_date: string | null;
    location: string | null;
    storage_location_id: string | null;
    status: BatchStatus;
    product?: Product;
    supplier?: Supplier;
    storage_location?: StorageLocationBasic;
    created_at: string;
    updated_at: string;
}

export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment' | 'disposal';

export interface StockMovement {
    id: string;
    stock_batch_id: string;
    user_id: string;
    type: MovementType;
    quantity: number;
    balance_before: number;
    balance_after: number;
    reference_type: string | null;
    reference_id: string | null;
    notes: string | null;
    batch?: StockBatch;
    user?: User;
    created_at: string;
    updated_at: string;
}

export type AdjustmentReason = 'cycle_count' | 'damage' | 'expiry' | 'theft' | 'correction' | 'other';
export type AdjustmentStatus = 'pending' | 'approved' | 'rejected';

export interface StockAdjustment {
    id: string;
    stock_batch_id: string;
    performed_by: string;
    approved_by: string | null;
    quantity: number; // positive or negative
    reason: AdjustmentReason;
    notes: string | null;
    status: AdjustmentStatus;
    batch?: StockBatch;
    performer?: User;
    approver?: User | null;
    created_at: string;
    updated_at: string;
}

export type SupplierCategory = 'pharmaceutical' | 'medical_equipment' | 'surgical_supply' | 'laboratory' | 'general';
export type SupplierStatus = 'active' | 'on_hold' | 'inactive' | 'blacklisted';

export interface Supplier {
    id: string;
    name: string;
    code: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    tax_id: string | null;
    category: SupplierCategory;
    status: SupplierStatus;
    description: string | null;
    created_at: string;
    updated_at: string;
}

// ── Requisitions ─────────────────────────────────────────────────────────

export type RequisitionType   = 'internal' | 'purchase' | 'departmental';
export type RequisitionStatus =
    | 'draft'
    | 'submitted'
    | 'level1_approved'
    | 'approved'
    | 'partially_issued'
    | 'issued'
    | 'in_transit'
    | 'rejected'
    | 'cancelled';

export interface RequisitionItem {
    id: string;
    requisition_id: string;
    product_id: string;
    quantity_requested: number;
    quantity_on_hand: number;
    quantity_approved: number;
    quantity_issued: number;
    estimated_unit_cost: number | null;
    notes: string | null;
    product?: Product;
    created_at: string;
    updated_at: string;
}

export interface StorageLocationBasic {
    id: string;
    name: string;
    code: string;
    type: string;
    department_id?: string | null;
}

export interface Requisition {
    id: string;
    type: RequisitionType;
    reference: string;
    requested_by: string;
    requesting_location_id: string | null;
    requesting_department_id: string | null;
    issuing_location_id: string | null;
    supplier_id: string | null;
    purpose: string | null;
    required_by: string | null;
    status: RequisitionStatus;
    notes: string | null;
    
    // Approval info
    level1_approved_by: string | null;
    level1_approved_at: string | null;
    level1_notes: string | null;
    level2_approved_by: string | null;
    level2_approved_at: string | null;
    level2_notes: string | null;

    // Movement Tracking
    release_form_path: string | null;
    collector_name: string | null;
    collector_signature_path: string | null;

    // Legacy/Sync field
    approved_by: string | null;

    // Relations
    requester?: { id: string; name: string; department?: { id: string; name: string } | null };
    approver?: { id: string; name: string } | null; // mirrors level2
    level1_approver?: { id: string; name: string } | null;
    level2_approver?: { id: string; name: string } | null;
    requesting_location?: StorageLocationBasic | null;
    requesting_department?: Department | null;
    issuing_location?: StorageLocationBasic | null;
    supplier?: Supplier | null;
    items?: RequisitionItem[];
    created_at: string;
    updated_at: string;
}
