import { Category, StorageLocationBasic } from './inventory';
import { User } from './auth';

export interface Asset {
    id: string;
    name: string;
    asset_tag: string;
    serial_number?: string;
    category_id?: string;
    category?: Category;
    model_number?: string;
    manufacturer?: string;
    purchase_date?: string;
    purchase_cost: number;
    warranty_expiry?: string;
    status: 'functional' | 'under_maintenance' | 'decommissioned' | 'lost' | 'damaged';
    storage_location_id?: string;
    storage_location?: StorageLocationBasic;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface AssetMaintenanceLog {
    id: string;
    asset_id: string;
    asset?: Asset;
    type: 'routine' | 'repair' | 'calibration' | 'upgrade' | 'inspection';
    performed_at: string;
    next_due_at?: string;
    performed_by?: string;
    cost: number;
    notes?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface WorkOrder {
    id: string;
    asset_id: string;
    asset?: Asset;
    requester_id: string;
    requester?: User;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    assigned_to?: string;
    assigned_user?: User;
    completed_at?: string;
    resolution_notes?: string;
    created_at: string;
    updated_at: string;
}
