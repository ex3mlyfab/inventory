import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared/page-header';
import type { Permission, Role } from '@/types';
import { ArrowLeft, Shield } from 'lucide-react';

interface Props {
    role: Role;
    rolePermissions: string[];
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

export default function EditRole({ role, rolePermissions, permissionGroups }: Props) {
    const { data, setData, put, processing } = useForm({
        permissions: rolePermissions as string[],
    });

    function togglePermission(perm: string) {
        setData('permissions', data.permissions.includes(perm)
            ? data.permissions.filter((p) => p !== perm)
            : [...data.permissions, perm],
        );
    }

    function toggleGroup(groupPerms: Permission[]) {
        const groupNames = groupPerms.map((p) => p.name);
        const allSelected = groupNames.every((n) => data.permissions.includes(n));

        if (allSelected) {
            setData('permissions', data.permissions.filter((p) => !groupNames.includes(p)));
        } else {
            const newPerms = new Set([...data.permissions, ...groupNames]);
            setData('permissions', Array.from(newPerms));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/roles/${role.id}`);
    }

    return (
        <>
            <Head title={`Edit Role — ${role.name}`} />
            <div className="mx-auto max-w-3xl space-y-5 p-5">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="text-[#008060] hover:bg-[#e0f4eb] hover:text-[#006e3c]">
                        <Link href="/admin/roles">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e3f2fd]">
                                <Shield className="h-3.5 w-3.5 text-[#1565c0]" />
                            </div>
                            <h1 className="text-2xl font-semibold text-[#181d1a]">
                                Edit: {role.name}
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-[#6D7175]">
                            {data.permissions.length} permission{data.permissions.length !== 1 ? 's' : ''} selected.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {Object.entries(permissionGroups).map(([group, permissions]) => (
                        <div key={group} className="rounded-lg border border-[#E1E3E5] bg-white">
                            <div className="flex items-center gap-3 border-b border-[#E1E3E5] px-4 py-3">
                                <Checkbox
                                    checked={permissions.every((p) => data.permissions.includes(p.name))}
                                    onCheckedChange={() => toggleGroup(permissions)}
                                />
                                <h3 className="text-sm font-semibold text-[#181d1a]">
                                    {moduleLabels[group] || group}
                                </h3>
                            </div>
                            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                {permissions.map((perm) => (
                                    <label
                                        key={perm.id}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-colors ${
                                            data.permissions.includes(perm.name)
                                                ? 'border-[#008060] bg-[#e0f4eb]'
                                                : 'border-[#E1E3E5] hover:bg-[#f6fbf6]'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={data.permissions.includes(perm.name)}
                                            onCheckedChange={() => togglePermission(perm.name)}
                                        />
                                        <span className="text-sm text-[#181d1a]">{perm.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" asChild className="border-[#babfc3]">
                            <Link href="/admin/roles">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-[#008060] hover:bg-[#006e52]">
                            {processing ? 'Saving...' : 'Save Permissions'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EditRole.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'Roles', href: '/admin/roles' },
        { title: 'Permissions', href: '#' },
    ],
};
