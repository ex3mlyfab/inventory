import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Can } from '@/components/can';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationMeta } from '@/types/inventory';
import {
    Plus, Search, MoreHorizontal, Eye,
    ShoppingCart, FileText,
    Clock, CheckCircle2, XCircle, AlertCircle,
    Building2, Receipt
} from 'lucide-react';

interface PurchaseOrder {
    id: string;
    po_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    supplier: { name: string };
    creator: { name: string };
    requisition?: { reference: string };
    items: any[];
}

interface Props {
    orders: { data: PurchaseOrder[]; meta: PaginationMeta };
    filters: { search?: string; status?: string };
    stats: { total: number; submitted: number; level1: number; approved: number };
}

const STATUS_STYLES: Record<string, string> = {
    draft:            'bg-muted text-text-muted border-border',
    submitted:        'bg-amber-50 text-amber-700 border-amber-200',
    level1_approved:  'bg-blue-50 text-blue-700 border-blue-200',
    level2_approved:  'bg-success/10 text-success border-success/20',
    partial:          'bg-blue-50 text-blue-700 border-blue-200',
    closed:           'bg-brand/10 text-brand border-brand/20',
    rejected:         'bg-destructive/10 text-destructive border-destructive/20',
    cancelled:        'bg-muted text-text-muted border-border',
};

export default function PurchaseOrdersIndex({ orders, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const filter = (updates: Record<string, string | undefined>) =>
        router.get('/procurement/purchase-orders', { ...filters, ...updates }, { preserveState: true });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title="Purchase Orders" />

            <PageHeader
                title="Purchase Orders"
                description="Manage procurement orders and supplier commitments."
            >
                <Can permission="purchase-orders.create">
                    <Link href="/procurement/purchase-orders/create">
                        <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md gap-2">
                            <Plus className="h-4 w-4" />
                            Create PO
                        </Button>
                    </Link>
                </Can>
            </PageHeader>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 shadow-sm border-l-4 border-l-brand">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Total Orders</p>
                            <p className="text-xl font-extrabold text-text-primary">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm border-l-4 border-l-amber-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Pending Supervisor</p>
                            <p className="text-xl font-extrabold text-text-primary">{stats.submitted}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Pending MD</p>
                            <p className="text-xl font-extrabold text-text-primary">{stats.level1}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm border-l-4 border-l-emerald-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <BadgeCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Fully Approved</p>
                            <p className="text-xl font-extrabold text-text-primary">{stats.approved}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <form onSubmit={(e) => { e.preventDefault(); filter({ search }); }} className="flex gap-2 flex-1 min-w-[220px] max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search PO number, supplier…"
                            className="pl-9 h-10 bg-muted/30 border-transparent focus-visible:ring-brand/20"
                        />
                    </div>
                    <Button type="submit" variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <Select value={filters.status ?? 'all'} onValueChange={(v) => filter({ status: v === 'all' ? undefined : v })}>
                    <SelectTrigger className="h-10 w-48 bg-muted/30 border-transparent">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="submitted">Pending Supervisor</SelectItem>
                        <SelectItem value="level1_approved">Pending MD</SelectItem>
                        <SelectItem value="level2_approved">Fully Approved</SelectItem>
                        <SelectItem value="partial">Partially Received</SelectItem>
                        <SelectItem value="closed">Closed/Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/30 px-6 py-3 border-b border-border/50 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    <div className="col-span-3">PO Number / Supplier</div>
                    <div className="col-span-2">Requisition</div>
                    <div className="col-span-2">Value</div>
                    <div className="col-span-2">Creator</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {orders.data.length > 0 ? (
                    <div className="flex flex-col divide-y divide-border/30">
                        {orders.data.map((po) => (
                            <div key={po.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-brand/[0.02] transition-colors group">
                                <div className="col-span-3">
                                    <Link href={`/procurement/purchase-orders/${po.id}`} className="block">
                                        <p className="text-sm font-bold font-mono text-text-primary group-hover:text-brand transition-colors">{po.po_number}</p>
                                        <p className="text-[11px] text-text-secondary font-medium mt-0.5">{po.supplier?.name}</p>
                                    </Link>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-[11px] font-mono text-text-muted uppercase tracking-tighter">
                                        {po.requisition?.reference ?? 'Manual PO'}
                                    </p>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-sm font-bold text-text-primary">{formatCurrency(po.total_amount)}</p>
                                    <p className="text-[10px] text-text-muted">{po.items.length} items</p>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-[13px] font-semibold text-text-primary">{po.creator?.name}</p>
                                    <p className="text-[10px] text-text-muted">{new Date(po.created_at).toLocaleDateString()}</p>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                    <Badge variant="outline" className={`text-[10px] font-bold capitalize whitespace-nowrap ${STATUS_STYLES[po.status]}`}>
                                        {po.status.replace('_', ' ').replace('level1', 'Supervisor').replace('level2', 'MD')}
                                    </Badge>
                                </div>

                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-brand bg-muted/5 group-hover:bg-brand/10">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/procurement/purchase-orders/${po.id}`} className="flex items-center gap-2 cursor-pointer">
                                                    <Eye className="h-3.5 w-3.5" /> View Order
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                                <FileText className="h-3.5 w-3.5" /> Print PDF
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-24 gap-6 text-center">
                        <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <ShoppingCart className="h-10 w-10 text-text-muted/30" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-text-primary">No purchase orders found</p>
                            <p className="text-sm text-text-muted mt-1 max-w-sm">Generate purchase orders from approved requisitions to commit to suppliers.</p>
                        </div>
                        <Can permission="purchase-orders.create">
                            <Link href="/procurement/purchase-orders/create">
                                <Button className="bg-brand text-brand-foreground h-11 px-6 shadow-lg shadow-brand/20">Generate New PO</Button>
                            </Link>
                        </Can>
                    </div>
                )}
            </div>
        </div>
    );
}

const BadgeCheck = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);

// @ts-ignore
PurchaseOrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Purchase Orders', href: '#' },
    ],
};
