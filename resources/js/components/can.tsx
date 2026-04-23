import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface CanProps {
    /** Single permission to check */
    permission: string;
    /** Content to render when permission is granted */
    children: ReactNode;
    /** Optional fallback when permission is denied */
    fallback?: ReactNode;
}

/**
 * Renders children only if the current user has the specified permission.
 * Super Admin always passes.
 *
 * @example
 * <Can permission="products.view">
 *   <ProductList />
 * </Can>
 */
export function Can({ permission, children, fallback = null }: CanProps) {
    const { can } = usePermissions();

    if (!can(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface CanAnyProps {
    /** List of permissions — at least ONE must be granted */
    permissions: string[];
    /** Content to render when at least one permission is granted */
    children: ReactNode;
    /** Optional fallback when no permissions match */
    fallback?: ReactNode;
}

/**
 * Renders children if the current user has ANY of the listed permissions.
 * Super Admin always passes.
 *
 * @example
 * <CanAny permissions={['products.view', 'stock.view']}>
 *   <InventorySection />
 * </CanAny>
 */
export function CanAny({ permissions, children, fallback = null }: CanAnyProps) {
    const { canAny } = usePermissions();

    if (!canAny(permissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
