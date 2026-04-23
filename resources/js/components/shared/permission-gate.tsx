import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
    /** Single permission required */
    permission?: string;
    /** Multiple permissions — user must have ANY of them */
    anyPermission?: string[];
    /** Multiple permissions — user must have ALL of them */
    allPermissions?: string[];
    /** Role required */
    role?: string;
    /** Content to render if authorized */
    children: ReactNode;
    /** Content to render if NOT authorized (optional) */
    fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user permissions/roles.
 *
 * Usage:
 *   <PermissionGate permission="products.create">
 *     <Button>Add Product</Button>
 *   </PermissionGate>
 *
 *   <PermissionGate anyPermission={['stock.view', 'stock.adjust']}>
 *     <StockPanel />
 *   </PermissionGate>
 */
export function PermissionGate({ permission, anyPermission, allPermissions, role, children, fallback = null }: PermissionGateProps) {
    const { can, canAny, canAll, hasRole } = usePermissions();

    let authorized = true;

    if (permission) {
        authorized = can(permission);
    } else if (anyPermission) {
        authorized = canAny(anyPermission);
    } else if (allPermissions) {
        authorized = canAll(allPermissions);
    } else if (role) {
        authorized = hasRole(role);
    }

    return authorized ? <>{children}</> : <>{fallback}</>;
}
