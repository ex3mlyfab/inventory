import { usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import type { Auth } from '@/types';

/**
 * Hook to check the current user's roles and permissions.
 * Data is shared globally via HandleInertiaRequests middleware.
 */
export function usePermissions() {
    const { auth } = usePage<{ auth: Auth }>().props;

    const permissions = useMemo(() => new Set(auth.permissions), [auth.permissions]);
    const roles = useMemo(() => new Set(auth.roles), [auth.roles]);

    /** Check if the user has a specific permission */
    const can = useCallback(
        (permission: string): boolean => {
            // Super Admin bypasses all checks
            if (roles.has('Super Admin')) return true;
            return permissions.has(permission);
        },
        [permissions, roles],
    );

    /** Check if the user has ANY of the given permissions */
    const canAny = useCallback(
        (perms: string[]): boolean => {
            if (roles.has('Super Admin')) return true;
            return perms.some((p) => permissions.has(p));
        },
        [permissions, roles],
    );

    /** Check if the user has ALL of the given permissions */
    const canAll = useCallback(
        (perms: string[]): boolean => {
            if (roles.has('Super Admin')) return true;
            return perms.every((p) => permissions.has(p));
        },
        [permissions, roles],
    );

    /** Check if the user has a specific role */
    const hasRole = useCallback(
        (role: string): boolean => {
            return roles.has(role);
        },
        [roles],
    );

    /** Check if the user has ANY of the given roles */
    const hasAnyRole = useCallback(
        (roleList: string[]): boolean => {
            return roleList.some((r) => roles.has(r));
        },
        [roles],
    );

    /** Check if user is Super Admin */
    const isSuperAdmin = useMemo(() => roles.has('Super Admin'), [roles]);

    return {
        can,
        canAny,
        canAll,
        hasRole,
        hasAnyRole,
        isSuperAdmin,
        permissions: auth.permissions,
        roles: auth.roles,
    };
}
