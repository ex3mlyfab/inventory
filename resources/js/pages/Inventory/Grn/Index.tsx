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
    DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StockBatch, Supplier, PaginationMeta } from '@/types/inventory';
import {
    Plus, Search, MoreHorizontal, Eye,
    Package, Building2, CalendarDays, Hash, ChevronLeft, ChevronRight,
    TrendingUp, Filter, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    batches: { data: StockBatch[] } & PaginationMeta;
    suppliers: Pick<Supplier, 'id' | 'name' | 'code'>[];
    filters: { search?: string; supplier_id?: string };
}

export default function GrnIndex({ batches, suppliers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/procurement/grn', { ...filters, search }, { preserveState: true });
    };

    const handleSupplierFilter = (value: string) => {
        router.get('/procurement/grn', {
            ...filters,
            supplier_id: value === 'all' ? undefined : value,
        }, { preserveState: true });
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);

    const totalValue = batches.data.reduce(
        (sum, b) => sum + b.quantity_received * b.unit_cost, 0
    );

    return (
        <div className="flex flex-col gap-6 py-6 sm:py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <Head title="Goods Received Notes" />

            <PageHeader
                title="GRN Register"
                description="Track all inbound stock deliveries and batch history."
                className="pb-2"
            >
                <Can permission="grn.create">
                    <Link href="/procurement/grn/create">
                        <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-lg transition-all group h-10 px-6">
                            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                            Receive Goods
                        </Button>
                    </Link>
                </Can>
            </PageHeader>

            {/* Summary Cards - Responsive grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Total GRNs', value: batches.total, icon: Hash, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Inventory Value', value: formatCurrency(totalValue), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Active Vendors', value: suppliers.length, icon: Building2, color: 'text-amber-600 bg-amber-50' },
                    { label: 'This Page', value: batches.data.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
                ].map((s) => (
                    <Card key={s.label} className="border-border/50 shadow-sm group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                            <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", s.color)}>
                                <s.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-0.5">{s.label}</p>
                                <p className="text-lg sm:text-xl font-extrabold text-text-primary truncate tracking-tight">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-border/50 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
                    <form onSubmit={handleSearch} className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-brand transition-colors" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by ref, batch, product..."
                            className="pl-10 h-11 bg-muted/30 border-transparent focus:border-brand/20 focus:ring-brand/5 transition-all rounded-xl"
                        />
                    </form>

                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-text-muted ml-2" />
                        <Select
                            value={filters.supplier_id ?? 'all'}
                            onValueChange={handleSupplierFilter}
                        >
                            <SelectTrigger className="h-11 w-full sm:w-56 bg-muted/30 border-transparent rounded-xl focus:ring-brand/5">
                                <SelectValue placeholder="All Suppliers" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50 shadow-xl">
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Responsive Table / Card List */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden lg:grid grid-cols-12 bg-muted/40 px-6 py-4 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <div className="col-span-3">Inbound Delivery</div>
                    <div className="col-span-3">Item Details</div>
                    <div className="col-span-2">Source Vendor</div>
                    <div className="col-span-2 text-center">Batch Status</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-1 text-right px-2">Actions</div>
                </div>

                {batches.data.length > 0 ? (
                    <div className="flex flex-col divide-y divide-border/30">
                        {batches.data.map((batch) => (
                            <div key={batch.id} className="group transition-all duration-200">
                                {/* Desktop Row */}
                                <div className="hidden lg:grid grid-cols-12 items-center px-6 py-4 hover:bg-brand/[0.02]">
                                    <div className="col-span-3 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <Hash className="h-5 w-5 text-brand" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-text-primary font-mono tracking-tight truncate">
                                                {batch.reference ?? batch.batch_number}
                                            </p>
                                            <p className="text-[10px] font-bold text-text-muted mt-1 uppercase flex items-center">
                                                <CalendarDays className="inline h-3 w-3 mr-1" />
                                                {new Date(batch.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                            <Package className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-bold text-text-primary truncate">{batch.product?.name}</p>
                                            <p className="text-[10px] font-bold text-text-muted mt-0.5 font-mono">{batch.product?.sku}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                                        <Building2 className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                        <p className="text-xs font-semibold text-text-secondary truncate">
                                            {batch.supplier?.name ?? <span className="text-text-muted italic font-normal">Unlinked</span>}
                                        </p>
                                    </div>

                                    <div className="col-span-2 flex justify-center">
                                        <Badge variant="outline" className={cn(
                                            "font-black text-[9px] uppercase tracking-tighter px-2 py-0.5 border-transparent shadow-sm",
                                            batch.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                            batch.status === 'expired' ? 'bg-rose-50 text-rose-700' :
                                            'bg-slate-100 text-slate-600'
                                        )}>
                                            {batch.status}
                                        </Badge>
                                    </div>

                                    <div className="col-span-1 text-right">
                                        <p className="text-sm font-black text-text-primary">{batch.quantity_on_hand.toLocaleString()}</p>
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Units Left</p>
                                    </div>

                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-brand hover:bg-brand/5 rounded-lg">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/50 shadow-xl">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/procurement/grn/${batch.id}`} className="flex items-center gap-2 cursor-pointer py-2.5">
                                                        <Eye className="h-4 w-4" /> View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="lg:hidden p-4 flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0">
                                                <Hash className="h-5 w-5 text-brand" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-primary font-mono">{batch.reference ?? batch.batch_number}</p>
                                                <p className="text-[10px] text-text-muted font-bold uppercase">{new Date(batch.created_at).toLocaleDateString('en-NG')}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "font-black text-[9px] uppercase px-2 py-0.5",
                                            batch.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                            batch.status === 'expired' ? 'bg-rose-50 text-rose-700' :
                                            'bg-slate-100 text-slate-600'
                                        )}>
                                            {batch.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/30">
                                        <div>
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Product</p>
                                            <p className="text-xs font-bold text-text-primary truncate">{batch.product?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Vendor</p>
                                            <p className="text-xs font-bold text-text-secondary truncate">{batch.supplier?.name ?? '—'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-text-primary">{batch.quantity_on_hand.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-text-muted uppercase">on hand</span>
                                        </div>
                                        <Link href={`/procurement/grn/${batch.id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 text-brand font-bold text-xs">
                                                View Details <Eye className="ml-1.5 h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-24 gap-4 text-center px-4">
                        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center animate-pulse">
                            <Package className="h-10 w-10 text-text-muted/30" />
                        </div>
                        <div className="max-w-xs">
                            <p className="font-bold text-text-primary text-lg">No GRN Records</p>
                            <p className="text-sm text-text-muted mt-1 font-medium">Start tracking your inbound stock deliveries by recording your first GRN.</p>
                        </div>
                        <Can permission="grn.create">
                            <Link href="/procurement/grn/create">
                                <Button className="mt-2 bg-brand/10 text-brand hover:bg-brand hover:text-white border-transparent shadow-none h-11 px-8 rounded-xl">
                                    Receive First Delivery
                                </Button>
                            </Link>
                        </Can>
                    </div>
                )}
            </div>

            {/* Pagination - Premium Design */}
            {batches.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border/30 px-2">
                    <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        Showing <span className="text-text-primary">{batches.from}</span> - <span className="text-text-primary">{batches.to}</span> of <span className="text-text-primary">{batches.total}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {batches.links.map((link, index) => {
                            const isPrev = link.label.includes('Previous');
                            const isNext = link.label.includes('Next');

                            let label = link.label;
                            if (isPrev) label = '←';
                            if (isNext) label = '→';

                            if (!link.url) {
                                return (
                                    <div
                                        key={index}
                                        className="h-9 min-w-[36px] flex items-center justify-center rounded-xl border border-border/30 text-[10px] font-black uppercase tracking-wider text-text-muted bg-muted/20 cursor-not-allowed opacity-50"
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: label }} />
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={cn(
                                        'h-9 min-w-[36px] px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300',
                                        link.active
                                            ? 'bg-brand text-brand-foreground shadow-lg shadow-brand/20 scale-110 z-10'
                                            : 'bg-white text-text-primary border border-border/50 hover:bg-brand/5 hover:border-brand/30'
                                    )}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: label }} />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// @ts-ignore
GrnIndex.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Goods Received Notes', href: '#' },
    ],
};

