import type { User } from './auth';

export interface PaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
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
    batch_number: string;
    reference: string | null;
    quantity_received: number;
    quantity_on_hand: number;
    unit_cost: number;
    manufacturing_date: string | null;
    expiry_date: string | null;
    location: string | null;
    status: BatchStatus;
    product?: Product;
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
