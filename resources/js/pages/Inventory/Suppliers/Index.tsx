import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Supplier, PaginationMeta, SupplierStatus } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Eye, Edit2, Trash2, Building2, Phone, Mail, Search } from 'lucide-react';
import { Can } from '@/components/can';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    suppliers: {
        data: Supplier[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
    categories: string[];
    statuses: string[];
}

export default function SuppliersIndex({ suppliers, filters, categories, statuses }: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const { delete: destroy, processing: deleting } = useForm({});

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/suppliers', { ...filters, search }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get('/inventory/suppliers', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const openDelete = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (supplierToDelete) {
            destroy(`/inventory/suppliers/${supplierToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setSupplierToDelete(null);
                },
                preserveScroll: true
            });
        }
    };

    const columns: Column<Supplier>[] = [
        {
            header: 'Supplier Name',
            cell: (supplier) => (
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-brand/5 text-brand border border-brand/10 shrink-0">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-text-primary truncate">{supplier.name}</span>
                        <span className="text-[10px] font-mono text-text-muted tracking-tight uppercase">{supplier.code}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Contact Info',
            cell: (supplier) => (
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2 text-text-secondary">
                        <Phone className="h-3 w-3" />
                        <span>{supplier.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{supplier.email || 'N/A'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Category',
            cell: (supplier) => (
                <Badge variant="outline" className="capitalize text-[10px] h-5 px-2 border-border/50 text-text-muted">
                    {supplier.category.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: 'Status',
            cell: (supplier) => {
                const statusStyles: Record<SupplierStatus, string> = {
                    active: 'bg-success/10 text-success border-success/20',
                    inactive: 'bg-muted text-text-muted border-border',
                    suspended: 'bg-destructive/10 text-destructive border-destructive/20',
                    on_hold: 'bg-amber-50 text-amber-700 border-amber-200',
                    blacklisted: 'bg-rose-50 text-rose-700 border-rose-200',
                };
                return (
                    <Badge className={`capitalize text-[9px] font-bold ${statusStyles[supplier.status]}`}>
                        {supplier.status}
                    </Badge>
                );
            }
        },
        {
            header: '',
            id: 'actions',
            className: 'text-right min-w-[50px]',
            cell: (supplier) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/inventory/suppliers/${supplier.id}`} className="flex items-center cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <Can permission="suppliers.edit">
                            <DropdownMenuItem asChild>
                                <Link href={`/inventory/suppliers/${supplier.id}/edit`} className="flex items-center cursor-pointer">
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit Supplier
                                </Link>
                            </DropdownMenuItem>
                        </Can>
                        <DropdownMenuSeparator />
                        <Can permission="suppliers.delete">
                            <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={() => openDelete(supplier)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Supplier
                            </DropdownMenuItem>
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title="Supplier Directory" />

            <PageHeader 
                title="Supplier Directory" 
                description="Manage registered vendors, pharmaceutical distributors, and service providers."
            >
                <div className="flex items-center gap-3">
                    <Link href={'/inventory/suppliers/dashboard'}>
                        <Button variant="outline" className="border-brand/20 text-brand hover:bg-brand/5 transition-all">
                            View Dashboard
                        </Button>
                    </Link>
                    <Can permission="suppliers.create">
                        <Link href={'/inventory/suppliers/create'}>
                            <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md transition-all px-6">
                                <Plus className="w-4 h-4 mr-2" />
                                Register Supplier
                            </Button>
                        </Link>
                    </Can>
                </div>
            </PageHeader>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-5 rounded-2xl border border-border shadow-sm">
                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, code or email..." 
                            className="pl-10 bg-muted/30 border-none focus-visible:ring-brand/20"
                        />
                    </form>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select value={filters.category || 'all'} onValueChange={(v) => handleFilterChange('category', v)}>
                            <SelectTrigger className="w-[180px] bg-muted/30 border-none text-xs h-9">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.status || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
                            <SelectTrigger className="w-[140px] bg-muted/30 border-none text-xs h-9">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {statuses.map(s => (
                                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <DataTable 
                        columns={columns}
                        data={suppliers.data}
                        meta={suppliers.meta}
                        keyExtractor={(s) => s.id}
                        emptyMessage={
                            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-text-muted/30">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-text-primary">No suppliers found</p>
                                    <p className="text-sm text-text-muted mt-1">Try adjusting your filters or register a new supplier.</p>
                                </div>
                            </div>
                        }
                    />
                </div>
            </div>

            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setSupplierToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Supplier?"
                description={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete <span className="font-bold text-text-primary">{supplierToDelete?.name}</span>?</p>
                        <p className="text-xs text-text-muted">This action cannot be undone. Historical records linked to this supplier may be affected.</p>
                    </div>
                }
                confirmText={deleting ? "Deleting..." : "Delete Supplier"}
                variant="destructive"
                isLoading={deleting}
            />
        </div>
    );
}

// @ts-ignore
SuppliersIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Supplier Directory', href: '#' }
    ],
};
