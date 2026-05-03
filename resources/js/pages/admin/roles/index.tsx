import React, { useState, Fragment } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Can } from '@/components/can';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Permission, Role } from '@/types';
import { Shield, ShieldCheck, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
    });

    function handleCreateRole(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/roles', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                toast.success('New role created successfully');
            },
        });
    }

    return (
        <>
            <Head title="Roles & Permissions" />
            <div className="space-y-5 p-5">
                <PageHeader
                    title="Roles & Permissions"
                    description="View and manage role-based access control for the inventory system."
                    actions={
                        <Can permission="roles.manage">
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-[#008060] hover:bg-[#006e52]">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create New Role
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <form onSubmit={handleCreateRole}>
                                        <DialogHeader>
                                            <DialogTitle>Create New Role</DialogTitle>
                                            <DialogDescription>
                                                Enter a unique name for the new administrative role.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Role Name</Label>
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="e.g. Finance Manager"
                                                    className={errors.name ? 'border-red-500' : ''}
                                                />
                                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={() => setIsCreateOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                className="bg-[#008060] hover:bg-[#006e52]"
                                                disabled={processing}
                                            >
                                                {processing ? 'Creating...' : 'Create Role'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </Can>
                    }
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
                                    : `${role.permissions?.length || 0} permission${role.permissions?.length !== 1 ? 's' : ''} assigned`}
                            </p>
                            {role.name !== 'Super Admin' && (
                                <Can permission="roles.manage">
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
                                </Can>
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
                                {Object.entries(permissionGroups || {}).map(([group, permissions]) => (
                                    <Fragment key={group}>
                                        <tr className="bg-[#f0f5f0]">
                                            <td colSpan={roles.length} className="p-3 text-xs font-semibold text-[#3e4944]">
                                                {moduleLabels[group] || group}
                                            </td>
                                        </tr>
                                        {permissions.map((perm) => (
                                            <tr key={perm.id} className="border-b border-[#E1E3E5] hover:bg-[#f6fbf6]">
                                                <td className="p-3 pl-6 text-sm text-[#6D7175]">{perm.name}</td>
                                                {roles.filter((r) => r.name !== 'Super Admin').map((role) => (
                                                    <td key={role.id} className="p-3 text-center">
                                                        {role.permissions?.some((p) => p.name === perm.name) ? (
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
                                    </Fragment>
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
        { title: 'Roles', href: '/admin/roles' },
    ],
};
