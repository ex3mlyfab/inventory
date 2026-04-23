export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    department_id: number | null;
    department?: Department;
    employee_id: string | null;
    phone: string | null;
    is_active: boolean;
    roles?: Role[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    roles: string[];
    permissions: string[];
};

export type Role = {
    id: number;
    name: string;
    guard_name: string;
    permissions?: Permission[];
    created_at: string;
    updated_at: string;
};

export type Permission = {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
};

export type Department = {
    id: number;
    name: string;
    code: string;
    head_user_id: number | null;
    head?: User;
    type: 'ward' | 'admin' | 'support' | 'clinical' | 'pharmacy';
    description: string | null;
    is_active: boolean;
    users_count?: number;
    created_at: string;
    updated_at: string;
};

export type StorageLocation = {
    id: number;
    name: string;
    code: string;
    type: 'main_store' | 'pharmacy' | 'satellite_pharmacy' | 'ward_store' | 'laboratory';
    department_id: number | null;
    department?: Department;
    address: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type UnitOfMeasure = {
    id: number;
    name: string;
    abbreviation: string;
    base_unit_id: number | null;
    base_unit?: UnitOfMeasure;
    conversion_factor: number;
    created_at: string;
    updated_at: string;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};

// Pagination
export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
};

// Flash messages
export type Flash = {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
};
