import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Permission, Role } from '@/types';
import { Shield, ShieldCheck } from 'lucide-react';

interface Props {
    roles: (Role & { permissions: Permission[] })[];
    permissionGroups: Record<string, Permission[]>;
}

const moduleLabels: Record<string, string> = {
    products: 'Products & Catalog',
    categories: 'Categories',
    locations: 'Storage Locations',
    stock: 'Stock & Inventory',
    suppliers: 'Suppliers',
    requisitions: 'Requisitions',
    'purchase-orders': 'Purchase Orders',
    grn: 'Goods Received',
    dispensing: 'Dispensing',
    'ward-requisitions': 'Ward Requisitions',
    'controlled-substances': 'Controlled Substances',
    assets: 'Equipment Assets',
    maintenance: 'Maintenance',
    'work-orders': 'Work Orders',
    calibration: 'Calibration',
    users: 'User Management',
    roles: 'Role Management',
    settings: 'System Settings',
    departments: 'Departments',
    reports: 'Reports',
    'audit-trail': 'Audit Trail',
};

export default function RolesIndex({ roles, permissionGroups }: Props) {
    return (
        <>
            <Head title="Roles & Permissions" />
            <div className="space-y-5 p-5">
                <PageHeader
                    title="Roles & Permissions"
                    description="View and manage role-based access control for the inventory system."
                />

                {/* Role Cards — 4-column grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="rounded-lg border border-[#E1E3E5] bg-white p-4"
                        >
                            <div className="flex items-center gap-2">
                                {role.name === 'Super Admin' ? (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff3cd]">
                                        <ShieldCheck className="h-4 w-4 text-[#856404]" />
                                    </div>
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e3f2fd]">
                                        <Shield className="h-4 w-4 text-[#1565c0]" />
                                    </div>
                                )}
                                <h3 className="text-sm font-semibold text-[#181d1a]">{role.name}</h3>
                            </div>
                            <p className="mt-3 text-xs text-[#6D7175]">
                                {role.name === 'Super Admin'
                                    ? 'Full system access — bypasses all permission checks'
                                    : `${role.permissions.length} permission${role.permissions.length !== 1 ? 's' : ''} assigned`}
                            </p>
                            {role.name !== 'Super Admin' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="mt-3 border-[#babfc3] text-xs"
                                >
                                    <Link href={`/admin/roles/${role.id}/edit`}>
                                        Edit Permissions
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Full Permission Matrix — Polaris Table */}
                <div className="overflow-hidden rounded-lg border border-[#E1E3E5] bg-white">
                    <div className="border-b border-[#E1E3E5] px-6 py-4">
                        <h3 className="text-base font-semibold text-[#181d1a]">Permission Matrix</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f6f6f7]">
                                    <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-[#6D7175]">
                                        Permission
                                    </th>
                                    {roles.filter((r) => r.name !== 'Super Admin').map((role) => (
                                        <th key={role.id} className="p-3 text-center text-xs font-medium uppercase tracking-wider text-[#6D7175]">
                                            {role.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(permissionGroups).map(([group, permissions]) => (
                                    <>
                                        <tr key={group} className="bg-[#f0f5f0]">
                                            <td colSpan={roles.length} className="p-3 text-xs font-semibold text-[#3e4944]">
                                                {moduleLabels[group] || group}
                                            </td>
                                        </tr>
                                        {permissions.map((perm) => (
                                            <tr key={perm.id} className="border-b border-[#E1E3E5] hover:bg-[#f6fbf6]">
                                                <td className="p-3 pl-6 text-sm text-[#6D7175]">{perm.name}</td>
                                                {roles.filter((r) => r.name !== 'Super Admin').map((role) => (
                                                    <td key={role.id} className="p-3 text-center">
                                                        {role.permissions.some((p) => p.name === perm.name) ? (
                                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e0f4eb] text-[10px] font-bold text-[#006e3c]">
                                                                ✓
                                                            </span>
                                                        ) : (
                                                            <span className="text-[#bdc9c2]">—</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'Roles & Permissions', href: '/admin/roles' },
    ],
};
