import { Head, Link, router } from '@inertiajs/react';
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
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Department, PaginatedData, Role, User } from '@/types';
import { Plus, Search, UserCog } from 'lucide-react';
import { useState } from 'react';

interface Props {
    users: PaginatedData<User & { roles: Role[]; department: Department | null }>;
    roles: Role[];
    departments: Department[];
    filters: { search?: string; role?: string; department?: string; active?: string };
}

export default function UsersIndex({ users, roles, departments, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/users', { search }, { preserveState: true, preserveScroll: true });
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
            <Head title="User Management" />
            <div className="space-y-5 p-5">
                {/* Header */}
                <PageHeader
                    title="User Management"
                    description="Manage system users, roles, and access."
                    actions={
                        <Button asChild className="bg-[#008060] hover:bg-[#006e52]">
                            <Link href="/admin/users/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Link>
                        </Button>
                    }
                />

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6D7175]" />
                            <Input
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64 border-[#babfc3] pl-9 focus-visible:ring-[#008060]"
                            />
                        </div>
                    </form>
                    <Select
                        value={filters.role || 'all'}
                        onValueChange={(v) => handleFilterChange('role', v)}
                    >
                        <SelectTrigger className="w-44 border-[#babfc3]">
                            <SelectValue placeholder="Filter by Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.department || 'all'}
                        onValueChange={(v) => handleFilterChange('department', v)}
                    >
                        <SelectTrigger className="w-44 border-[#babfc3]">
                            <SelectValue placeholder="Filter by Dept" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={String(dept.id)}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Polaris Resource Table */}
                <div className="overflow-hidden rounded-lg border border-[#E1E3E5] bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#f6f6f7] hover:bg-[#f6f6f7]">
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Name</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Email</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Employee ID</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Department</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Roles</TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-[#6D7175]">Status</TableHead>
                                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-[#6D7175]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-sm text-[#6D7175]">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-[#f6fbf6]">
                                        <TableCell className="font-medium text-[#181d1a]">{user.name}</TableCell>
                                        <TableCell className="text-[#3e4944]">{user.email}</TableCell>
                                        <TableCell>
                                            <code className="rounded bg-[#f0f5f0] px-1.5 py-0.5 text-xs text-[#3e4944]">
                                                {user.employee_id || '—'}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-[#3e4944]">{user.department?.name || '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.map((role) => (
                                                    <StatusBadge key={role.id} variant="info">
                                                        {role.name}
                                                    </StatusBadge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={user.is_active ? 'success' : 'critical'}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                                className="text-[#008060] hover:bg-[#e0f4eb] hover:text-[#006e3c]"
                                            >
                                                <Link href={`/admin/users/${user.id}/edit`}>
                                                    <UserCog className="mr-1 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-[#6D7175]">
                            Showing {users.from} to {users.to} of {users.total} users
                        </p>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={!!link.url}
                                    className={link.active ? 'bg-[#008060] hover:bg-[#006e52]' : 'border-[#E1E3E5]'}
                                >
                                    {link.url ? (
                                        <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'Users', href: '/admin/users' },
    ],
};
