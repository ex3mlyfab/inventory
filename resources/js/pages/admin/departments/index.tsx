import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Department, PaginatedData, User } from '@/types';
import { Building2, Edit, Plus, Search, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

interface Props {
    departments: PaginatedData<Department & { users_count: number; head: User | null }>;
    users: User[];
    filters: { search?: string; type?: string };
}

const typeLabels: Record<string, string> = {
    ward: 'Ward',
    admin: 'Administrative',
    support: 'Support',
    clinical: 'Clinical',
    pharmacy: 'Pharmacy',
};

const typeVariants: Record<string, 'info' | 'success' | 'draft' | 'warning' | 'pending'> = {
    ward: 'info',
    admin: 'pending',
    support: 'draft',
    clinical: 'success',
    pharmacy: 'warning',
};

export default function DepartmentsIndex({ departments, users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<(Department & { users_count: number }) | null>(null);

    const form = useForm({
        name: '',
        code: '',
        head_user_id: '' as string,
        type: 'admin' as string,
        description: '',
        is_active: true,
    });

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/departments', { search }, { preserveState: true, preserveScroll: true });
    }

    function openCreateDialog() {
        setEditingDept(null);
        form.reset();
        setDialogOpen(true);
    }

    function openEditDialog(dept: Department & { users_count: number }) {
        setEditingDept(dept);
        form.setData({
            name: dept.name,
            code: dept.code,
            head_user_id: dept.head_user_id ? String(dept.head_user_id) : '',
            type: dept.type,
            description: dept.description || '',
            is_active: dept.is_active,
        });
        setDialogOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingDept) {
            form.put(`/admin/departments/${editingDept.id}`, {
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.post('/admin/departments', {
                onSuccess: () => setDialogOpen(false),
            });
        }
    }

    function handleDelete(dept: Department) {
        if (confirm(`Delete department "${dept.name}"? This action cannot be undone.`)) {
            router.delete(`/admin/departments/${dept.id}`);
        }
    }

    return (
        <>
            <Head title="Departments" />
            <div className="space-y-5 p-5">
                <PageHeader
                    title="Departments"
                    description="Manage hospital departments and wards."
                    actions={
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openCreateDialog} className="bg-[#008060] hover:bg-[#006e52]">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Department
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-xl border-[#E1E3E5]">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-semibold text-[#181d1a]">
                                        {editingDept ? 'Edit Department' : 'Create Department'}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="dept-name" className="text-xs font-medium text-[#202223]">Department Name *</Label>
                                        <Input id="dept-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                        {form.errors.name && <p className="text-xs text-[#D82C0D]">{form.errors.name}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="dept-code" className="text-xs font-medium text-[#202223]">Code *</Label>
                                            <Input id="dept-code" value={form.data.code} onChange={(e) => form.setData('code', e.target.value.toUpperCase())} placeholder="SURG" maxLength={20} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                            {form.errors.code && <p className="text-xs text-[#D82C0D]">{form.errors.code}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="dept-type" className="text-xs font-medium text-[#202223]">Type *</Label>
                                            <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                                <SelectTrigger id="dept-type" className="border-[#babfc3]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(typeLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="dept-head" className="text-xs font-medium text-[#202223]">Department Head</Label>
                                        <Select value={form.data.head_user_id} onValueChange={(v) => form.setData('head_user_id', v)}>
                                            <SelectTrigger id="dept-head" className="border-[#babfc3]">
                                                <SelectValue placeholder="Select head..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-end gap-3 border-t border-[#E1E3E5] pt-4">
                                        <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} className="border-[#babfc3]">Cancel</Button>
                                        <Button type="submit" disabled={form.processing} className="bg-[#008060] hover:bg-[#006e52]">
                                            {form.processing ? 'Saving...' : (editingDept ? 'Update' : 'Create')}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    }
                />

                {/* Filter Bar */}
                <div className="flex items-center gap-3">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6D7175]" />
                        <Input placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 border-[#babfc3] pl-9 focus-visible:ring-[#008060]" />
                    </form>
                    <Select value={filters.type || 'all'} onValueChange={(v) => router.get('/admin/departments', v === 'all' ? {} : { type: v }, { preserveState: true })}>
                        <SelectTrigger className="w-44 border-[#babfc3]">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(typeLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Polaris Resource Table */}
                <div className="overflow-hidden rounded-lg border border-[#E1E3E5] bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#f6f6f7] hover:bg-[#f6f6f7]">
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Department</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Code</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Type</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Head</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Users</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Status</TableHead>
                                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-[#6D7175]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-[#6D7175]">
                                        No departments found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                departments.data.map((dept) => (
                                    <TableRow key={dept.id} className="hover:bg-[#f6fbf6]">
                                        <TableCell className="font-medium text-[#181d1a]">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e0f4eb]">
                                                    <Building2 className="h-3.5 w-3.5 text-[#008060]" />
                                                </div>
                                                {dept.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="rounded bg-[#f0f5f0] px-1.5 py-0.5 text-xs text-[#3e4944]">{dept.code}</code>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={typeVariants[dept.type] || 'draft'}>
                                                {typeLabels[dept.type] || dept.type}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-[#3e4944]">{dept.head?.name || '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-[#3e4944]">
                                                <Users className="h-3.5 w-3.5 text-[#6D7175]" />
                                                {dept.users_count}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={dept.is_active ? 'success' : 'critical'}>
                                                {dept.is_active ? 'Active' : 'Inactive'}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(dept)}
                                                    className="text-[#008060] hover:bg-[#e0f4eb] hover:text-[#006e3c]"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {dept.users_count === 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[#D82C0D] hover:bg-[#fce4ec] hover:text-[#c62828]"
                                                        onClick={() => handleDelete(dept)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}

DepartmentsIndex.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'Departments', href: '/admin/departments' },
    ],
};
