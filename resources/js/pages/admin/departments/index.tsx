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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Combobox } from '@/components/ui/combobox';
import type { Department, PaginatedData, User } from '@/types';
import { Building2, Edit, Plus, Search, Trash2, Users, UserCheck } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface Props {
    departments: PaginatedData<Department & { users_count: number; supervisor: User | null; parent: Department | null }>;
    allDepartments: Department[];
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

export default function DepartmentsIndex({ departments, allDepartments, users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<(Department & { users_count: number }) | null>(null);

    const form = useForm({
        name: '',
        code: '',
        parent_id: '' as string,
        head_user_id: '' as string,
        type: 'admin' as string,
        description: '',
        is_active: true,
    });

    const userOptions = useMemo(() => 
        users.map(u => ({ label: u.name, value: String(u.id) })),
        [users]
    );

    const deptOptions = useMemo(() => 
        allDepartments
            .filter(d => d.id !== editingDept?.id)
            .map(d => ({ label: d.name, value: String(d.id) })),
        [allDepartments, editingDept]
    );

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
            parent_id: dept.parent_id ? String(dept.parent_id) : '',
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
                onSuccess: () => {
                    setDialogOpen(false);
                    toast.success('Department updated');
                },
            });
        } else {
            form.post('/admin/departments', {
                onSuccess: () => {
                    setDialogOpen(false);
                    toast.success('Department created');
                },
            });
        }
    }

    function handleDelete(dept: Department) {
        if (confirm(`Delete department "${dept.name}"? This action cannot be undone.`)) {
            router.delete(`/admin/departments/${dept.id}`, {
                onSuccess: () => toast.success('Department deleted'),
            });
        }
    }

    return (
        <>
            <Head title="Departments" />
            <div className="min-h-screen space-y-6 bg-[#f9fafb] p-8">
                <PageHeader
                    title="Departments & Wards"
                    description="Configure organization structure and assign supervisors to clinical units."
                    actions={
                        <Button onClick={openCreateDialog} className="h-11 bg-[#008060] px-6 text-white hover:bg-[#006e52] shadow-sm transition-all hover:shadow-md">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Department
                        </Button>
                    }
                />

                {/* Filter and Search Bar */}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e1e3e5] bg-white p-4 shadow-sm">
                    <div className="flex flex-1 items-center gap-3">
                        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6D7175]" />
                            <Input 
                                placeholder="Search by name or code..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="h-10 border-[#babfc3] pl-10 focus-visible:ring-[#008060]" 
                            />
                        </form>
                        <Select 
                            value={filters.type || 'all'} 
                            onValueChange={(v) => router.get('/admin/departments', v === 'all' ? {} : { type: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-10 w-48 border-[#babfc3]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Department Types</SelectItem>
                                {Object.entries(typeLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Table */}
                <div className="overflow-hidden rounded-xl border border-[#E1E3E5] bg-white shadow-sm transition-all hover:shadow-md">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#f6f6f7] hover:bg-[#f6f6f7]">
                                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Organization Entity</TableHead>
                                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Parent Unit</TableHead>
                                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Identifier</TableHead>
                                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Classification</TableHead>
                                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Supervisor</TableHead>
                                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Staff Count</TableHead>
                                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Status</TableHead>
                                <TableHead className="py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6D7175]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center text-[#6D7175]">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 className="h-12 w-12 opacity-10" />
                                            <p className="text-lg font-medium">No results found</p>
                                            <p className="text-sm">Try adjusting your filters or search terms.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                departments.data.map((dept) => (
                                    <TableRow key={dept.id} className="group border-b border-[#f1f2f3] hover:bg-[#f9fafb]">
                                        <TableCell className="py-4 font-medium text-[#181d1a]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0f4eb] text-[#008060] transition-transform group-hover:scale-110">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold">{dept.name}</span>
                                                    <span className="text-xs text-[#6D7175] line-clamp-1">{dept.description || 'No description'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {dept.parent ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-[#008060]" />
                                                    <span className="text-sm text-[#3e4944]">{dept.parent.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[#BABFC3]">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <code className="rounded-md bg-[#f0f5f0] px-2 py-1 text-xs font-bold text-[#3e4944] ring-1 ring-inset ring-[#d0e5d0]">
                                                {dept.code}
                                            </code>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <StatusBadge variant={typeVariants[dept.type] || 'draft'}>
                                                {typeLabels[dept.type] || dept.type}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {dept.supervisor ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e3f2fd]">
                                                        <UserCheck className="h-3 w-3 text-[#1565c0]" />
                                                    </div>
                                                    <span className="text-sm text-[#3e4944]">{dept.supervisor.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-[#babfc3]">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-[#3e4944]">
                                                <Users className="h-4 w-4 text-[#6D7175]" />
                                                <span className="font-medium">{dept.users_count}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <StatusBadge variant={dept.is_active ? 'success' : 'critical'}>
                                                {dept.is_active ? 'Active' : 'Archived'}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(dept)}
                                                    className="h-8 w-8 text-[#008060] hover:bg-[#e0f4eb]"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {dept.users_count === 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-[#D82C0D] hover:bg-[#fce4ec]"
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

            {/* Create/Edit Modern Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg overflow-hidden rounded-2xl p-0 shadow-2xl transition-all">
                    <div className="bg-[#008060] p-6 text-white">
                        <DialogTitle className="text-xl font-bold">
                            {editingDept ? 'Update Department' : 'Establish New Department'}
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-[#e0f4eb]">
                            Define organizational units and assign supervisory oversight.
                        </DialogDescription>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-[#6D7175]">Department Name</Label>
                                <Input 
                                    value={form.data.name} 
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const slug = name.toUpperCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^A-Z0-9-]/g, '')
                                            .substring(0, 12);
                                            
                                        if (!editingDept) {
                                            form.setData({
                                                ...form.data,
                                                name,
                                                code: slug
                                            });
                                        } else {
                                            form.setData('name', name);
                                        }
                                    }} 
                                    placeholder="e.g. Surgical Ward A"
                                    className="h-12 border-[#babfc3] text-base focus-visible:ring-[#008060]" 
                                />
                                {form.errors.name && <p className="text-xs font-medium text-[#D82C0D]">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-[#6D7175]">Code / Shortname</Label>
                                <Input 
                                    value={form.data.code} 
                                    onChange={(e) => form.setData('code', e.target.value.toUpperCase())} 
                                    placeholder="SURG-A" 
                                    maxLength={20} 
                                    className="h-12 border-[#babfc3] text-base focus-visible:ring-[#008060]" 
                                />
                                {form.errors.code && <p className="text-xs font-medium text-[#D82C0D]">{form.errors.code}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-[#6D7175]">Classification</Label>
                                <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                    <SelectTrigger className="h-12 border-[#babfc3]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-[#6D7175]">Parent Department / Unit</Label>
                                <Combobox 
                                    options={deptOptions}
                                    value={form.data.parent_id}
                                    onChange={(v) => form.setData('parent_id', v)}
                                    placeholder="Select parent unit (optional)..."
                                    className="h-12 border-[#babfc3]"
                                />
                                <p className="text-[11px] text-[#6D7175]">Create a hierarchy by assigning this unit to a parent department.</p>
                                {form.errors.parent_id && <p className="text-xs font-medium text-[#D82C0D]">{form.errors.parent_id}</p>}
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-[#6D7175]">Department Supervisor</Label>
                                <Combobox 
                                    options={userOptions}
                                    value={form.data.head_user_id}
                                    onChange={(v) => form.setData('head_user_id', v)}
                                    placeholder="Search for a staff member..."
                                    className="h-12 border-[#babfc3]"
                                />
                                <p className="text-[11px] text-[#6D7175]">The supervisor will have oversight of all inventory activities within this unit.</p>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-[#6D7175]">Brief Description</Label>
                                <textarea 
                                    value={form.data.description} 
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-[#babfc3] bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008060] disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Optional details about this department's function..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#f1f2f3] pt-6">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium text-[#181d1a]">Status:</Label>
                                <Button 
                                    type="button"
                                    variant={form.data.is_active ? 'outline' : 'destructive'}
                                    size="sm"
                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                    className={form.data.is_active ? "border-[#008060] text-[#008060]" : ""}
                                >
                                    {form.data.is_active ? "Active" : "Archived"}
                                </Button>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} className="h-11 border-[#babfc3] px-6">Cancel</Button>
                                <Button type="submit" disabled={form.processing} className="h-11 bg-[#008060] px-8 text-white hover:bg-[#006e52]">
                                    {form.processing ? 'Syncing...' : (editingDept ? 'Update Details' : 'Create Entity')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

DepartmentsIndex.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'Departments', href: '/admin/departments' },
    ],
};
