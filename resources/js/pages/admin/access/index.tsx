import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Department, PaginatedData, Permission, Role, User } from '@/types';
import { 
    Search, 
    Plus, 
    UserCog, 
    Shield, 
    Mail, 
    ChevronRight, 
    Save, 
    RotateCcw,
    LayoutGrid,
    Users as UsersIcon,
    ShieldCheck,
    Download
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
    users: PaginatedData<User & { roles: Role[]; department: Department | null }>;
    roles: (Role & { permissions: Permission[] })[];
    permissionGroups: Record<string, Permission[]>;
    departments: Department[];
    filters: { search?: string; role?: string; active?: string };
}

const moduleLabels: Record<string, string> = {
    products: 'Inventory Management',
    categories: 'Categories & Taxonomy',
    locations: 'Storage & Logistics',
    stock: 'Stock Operations',
    procurement: 'Financial / Procurement',

    users: 'User Management',
    roles: 'Security & Access',
    reports: 'Reporting & Analytics',
    settings: 'System Configuration',
    departments: 'Organizational Structure',
};

const moduleIcons: Record<string, React.ReactNode> = {
    products: <LayoutGrid className="h-4 w-4" />,
    procurement: <Download className="h-4 w-4" />,
    users: <UsersIcon className="h-4 w-4" />,
    reports: <LayoutGrid className="h-4 w-4" />, // Placeholder
};

export default function AccessManagement({ users, roles, permissionGroups, departments, filters }: Props) {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(users.data[0]?.id ? String(users.data[0].id) : null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const selectedUser = useMemo(() => 
        users.data.find(u => String(u.id) === selectedUserId) || users.data[0],
        [selectedUserId, users.data]
    );

    const activeRole = useMemo(() => {
        if (selectedRoleId) return roles.find(r => String(r.id) === selectedRoleId);
        if (selectedUser?.roles?.[0]) return roles.find(r => r.id === selectedUser.roles[0].id);
        return roles[0];
    }, [selectedRoleId, selectedUser, roles]);

    const { data, setData, put, processing, reset, isDirty } = useForm({
        permissions: [] as string[],
    });

    useEffect(() => {
        if (activeRole) {
            setData('permissions', activeRole.permissions.map(p => p.name));
        }
    }, [activeRole]);

    function handleSavePermissions() {
        if (!activeRole) return;
        put(`/admin/roles/${activeRole.id}`, {
            onSuccess: () => toast.success(`Permissions updated for ${activeRole.name}`),
            preserveScroll: true
        });
    }

    function togglePermission(permName: string) {
        const current = [...data.permissions];
        const index = current.indexOf(permName);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(permName);
        }
        setData('permissions', current);
    }

    function handleFilterChange(key: string, value: string) {
        const params: Record<string, string> = { ...filters };
        if (value === 'all') {
            delete params[key];
        } else {
            params[key] = value;
        }
        router.get('/admin/users', params, { preserveState: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="Users & Permissions" />
            <div className="min-h-screen bg-[#f3f6f9] p-6 lg:p-10">
                <div className="mx-auto max-w-[1600px] space-y-8">
                    <PageHeader
                        title="Users & Permissions"
                        description="Manage staff access levels, organizational roles, and authentication security."
                        actions={
                            <div className="flex gap-3">
                                <Button variant="outline" className="h-11 bg-white border-[#e1e3e5] text-[#1a1c1d]">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export List
                                </Button>
                                <Button asChild className="h-11 bg-[#008060] px-6 hover:bg-[#006e52]">
                                    <Link href="/admin/users/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Invite New User
                                    </Link>
                                </Button>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* LEFT COLUMN: User Directory */}
                        <div className="lg:col-span-7 space-y-6">
                            <Card className="overflow-hidden border-[#e1e3e5] shadow-sm">
                                <div className="border-b border-[#f1f2f3] bg-white p-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6D7175]" />
                                            <Input
                                                placeholder="Filter users..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="h-11 border-[#babfc3] pl-10 focus-visible:ring-[#008060]"
                                            />
                                        </div>
                                        <Select 
                                            value={filters.role || 'all'} 
                                            onValueChange={(v) => handleFilterChange('role', v)}
                                        >
                                            <SelectTrigger className="h-11 w-40 border-[#babfc3]">
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Roles</SelectItem>
                                                {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select 
                                            value={filters.active || 'all'}
                                            onValueChange={(v) => handleFilterChange('active', v)}
                                        >
                                            <SelectTrigger className="h-11 w-32 border-[#babfc3]">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="1">Active</SelectItem>
                                                <SelectItem value="0">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb]">
                                                <TableHead className="w-[40px] px-4"><Checkbox /></TableHead>
                                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6D7175]">NAME & EMAIL</TableHead>
                                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6D7175]">ROLE</TableHead>
                                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-[#6D7175]">STATUS</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.data.map((user) => (
                                                <TableRow 
                                                    key={user.id} 
                                                    className={cn(
                                                        "group cursor-pointer transition-colors hover:bg-[#f3f9f6]",
                                                        selectedUserId === String(user.id) ? "bg-[#f3f9f6]" : ""
                                                    )}
                                                    onClick={() => setSelectedUserId(String(user.id))}
                                                >
                                                    <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox checked={selectedUserId === String(user.id)} />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 border border-[#e1e3e5]">
                                                                <AvatarImage src={user.avatar} />
                                                                <AvatarFallback className="bg-gradient-to-br from-[#008060] to-[#00b087] text-[10px] text-white">
                                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-[#1a1c1d]">{user.name}</span>
                                                                <span className="flex items-center text-[11px] text-[#6D7175]">
                                                                    <Mail className="mr-1 h-3 w-3" />
                                                                    {user.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-xs font-medium text-[#454749]">
                                                            {user.roles?.[0]?.name || 'No Role'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <StatusBadge variant={user.is_active ? 'success' : 'pending'}>
                                                            {user.is_active ? 'Active' : 'Pending'}
                                                        </StatusBadge>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right">
                                                        <ChevronRight className={cn(
                                                            "h-4 w-4 transition-transform text-[#babfc3]",
                                                            selectedUserId === String(user.id) ? "translate-x-1 text-[#008060]" : ""
                                                        )} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex items-center justify-between border-t border-[#f1f2f3] bg-white p-4">
                                    <span className="text-xs text-[#6D7175]">Showing {users.from} to {users.to} of {users.total} users</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={!users.links[0].url} className="h-8 w-8 p-0">
                                            <ChevronRight className="h-4 w-4 rotate-180" />
                                        </Button>
                                        <Button variant="outline" size="sm" disabled={!users.links[users.links.length - 1].url} className="h-8 w-8 p-0">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <div className="rounded-xl border border-[#008060]/20 bg-[#008060]/5 p-5 flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#008060] text-white">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-[#003d2b]">Security Audit Recommended</h4>
                                    <p className="text-xs text-[#006e52]">
                                        There are {users.data.filter(u => !u.two_factor_enabled).length} users who haven't enabled Two-Factor Authentication. It is recommended to enforce this for 'System Admin' roles.
                                    </p>
                                    <Button variant="link" className="h-auto p-0 text-xs font-bold text-[#008060] decoration-2 underline-offset-4">
                                        REVIEW SECURITY POLICY
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Permission Detail */}
                        <div className="lg:col-span-5">
                            <Card className="sticky top-10 border-[#e1e3e5] shadow-lg">
                                <div className="border-b border-[#f1f2f3] bg-white p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f2fd] text-[#1565c0]">
                                                <ShieldCheck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[#1a1c1d]">Role Permissions</h3>
                                                <p className="text-xs text-[#6D7175]">Customizing: <span className="font-semibold text-[#1a1c1d]">{selectedUser?.name || 'James Miller'}</span></p>
                                            </div>
                                        </div>
                                        <StatusBadge variant="success">SECURE</StatusBadge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6D7175]">GLOBAL ROLE PRESETS</label>
                                            <Select 
                                                 value={String(activeRole?.id)} 
                                                 onValueChange={(v) => setSelectedRoleId(v)}
                                            >
                                                <SelectTrigger className="h-12 border-[#babfc3] bg-[#f9fafb]">
                                                    <SelectValue placeholder="Quick apply a template..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map(r => (
                                                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] italic text-[#6D7175]">Applying a preset will overwrite current selections below.</p>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-0">
                                    <div className="p-6">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6D7175]">PERMISSIONS MATRIX</label>
                                        <div className="mt-4 space-y-3">
                                            <Accordion type="multiple" className="w-full space-y-3">
                                                {Object.entries(permissionGroups).map(([group, perms]) => (
                                                    <AccordionItem 
                                                        key={group} 
                                                        value={group}
                                                        className="border border-[#e1e3e5] rounded-xl overflow-hidden px-4 hover:border-[#008060]/30 transition-colors"
                                                    >
                                                        <AccordionTrigger className="hover:no-underline py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                                                    perms.every(p => data.permissions.includes(p.name)) ? "bg-[#e0f4eb] text-[#008060]" : "bg-[#f3f6f9] text-[#6D7175]"
                                                                )}>
                                                                    {moduleIcons[group] || <LayoutGrid className="h-4 w-4" />}
                                                                </div>
                                                                <span className="text-sm font-semibold text-[#1a1c1d]">{moduleLabels[group] || group}</span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pb-4 pt-2">
                                                            <div className="grid grid-cols-1 gap-4 pl-11">
                                                                {perms.map(p => (
                                                                    <div key={p.id} className="flex items-center justify-between py-1 group">
                                                                        <label 
                                                                            htmlFor={`perm-${p.id}`}
                                                                            className="text-sm text-[#454749] cursor-pointer group-hover:text-[#1a1c1d] transition-colors"
                                                                        >
                                                                            {p.name.split('.').slice(1).join(' ').replace(/-/g, ' ')}
                                                                        </label>
                                                                        <Checkbox 
                                                                            id={`perm-${p.id}`}
                                                                            checked={data.permissions.includes(p.name)}
                                                                            onCheckedChange={() => togglePermission(p.name)}
                                                                            disabled={activeRole?.name === 'Super Admin'}
                                                                            className="data-[state=checked]:bg-[#008060] data-[state=checked]:border-[#008060]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </div>
                                    </div>
                                </CardContent>

                                <div className="p-6 border-t border-[#f1f2f3] space-y-3 bg-[#fcfdfe]">
                                    <Button 
                                        className="w-full h-12 bg-[#008060] hover:bg-[#006e52] text-white font-bold tracking-wide shadow-md"
                                        disabled={processing || !isDirty || activeRole?.name === 'Super Admin'}
                                        onClick={handleSavePermissions}
                                    >
                                        {processing ? 'Saving...' : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Permission Changes
                                            </>
                                        )}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className="w-full h-10 text-[#6D7175] hover:text-[#1a1c1d] font-semibold"
                                        onClick={() => reset()}
                                        disabled={!isDirty}
                                    >
                                        Discard Changes
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AccessManagement.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'Access Management', href: '/admin/access' },
    ],
};
