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
    Package, Building2, CalendarDays, Hash, ChevronLeft, ChevronRight
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
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title="Goods Received Notes" />

            <PageHeader
                title="Goods Received Notes"
                description="Track all stock received from suppliers with full batch traceability."
            >
                <Can permission="grn.create">
                    <Link href="/procurement/grn/create">
                        <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Receive Goods
                        </Button>
                    </Link>
                </Can>
            </PageHeader>

            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total GRNs', value: batches.total },
                    { label: 'Batch Value', value: formatCurrency(totalValue) },
                    { label: 'Active Suppliers', value: suppliers.length },
                    { label: 'This Page', value: batches.data.length },
                ].map((s) => (
                    <Card key={s.label} className="border-border/50 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{s.label}</p>
                            <p className="text-2xl font-extrabold text-text-primary mt-1">{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[220px] max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search reference, batch, supplier…"
                            className="pl-9 h-10 bg-muted/30 border-transparent focus:border-brand/30"
                        />
                    </div>
                    <Button type="submit" variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <Select
                    value={filters.supplier_id ?? 'all'}
                    onValueChange={handleSupplierFilter}
                >
                    <SelectTrigger className="h-10 w-52 bg-muted/30 border-transparent">
                        <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/30 px-6 py-3 border-b border-border/50 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    <div className="col-span-3">GRN Reference</div>
                    <div className="col-span-3">Product</div>
                    <div className="col-span-2">Supplier</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-1 text-right">Unit Cost</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {batches.data.length > 0 ? (
                    <div className="flex flex-col divide-y divide-border/30">
                        {batches.data.map((batch) => (
                            <div key={batch.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-brand/[0.02] transition-colors">
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0">
                                        <Hash className="h-4 w-4 text-brand" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary font-mono">{batch.reference ?? batch.batch_number}</p>
                                        <p className="text-[10px] text-text-muted mt-0.5">
                                            <CalendarDays className="inline h-2.5 w-2.5 mr-1" />
                                            {new Date(batch.created_at).toLocaleDateString('en-NG')}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-3 flex items-center gap-2 min-w-0">
                                    <Package className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                    <div className="truncate">
                                        <p className="text-sm font-semibold text-text-primary truncate">{batch.product?.name}</p>
                                        <p className="text-[10px] text-text-muted font-mono">{batch.product?.sku}</p>
                                    </div>
                                </div>

                                <div className="col-span-2 flex items-center gap-2 min-w-0">
                                    <Building2 className="h-3.5 w-3.5 text-text-muted shrink-0" />
                                    <p className="text-sm text-text-secondary truncate">
                                        {batch.supplier?.name ?? <span className="text-text-muted italic">Unlinked</span>}
                                    </p>
                                </div>

                                <div className="col-span-1 text-right">
                                    <span className="text-sm font-bold text-text-primary">{batch.quantity_on_hand}</span>
                                    <span className="text-[10px] text-text-muted block">/ {batch.quantity_received} rcvd</span>
                                </div>

                                <div className="col-span-1 text-right">
                                    <span className="text-xs text-text-secondary">{formatCurrency(batch.unit_cost)}</span>
                                </div>

                                <div className="col-span-1 flex justify-center">
                                    <Badge variant="outline" className={
                                        batch.status === 'active' ? 'bg-success/10 text-success border-success/20' :
                                        batch.status === 'expired' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                        'bg-muted text-text-muted border-border'
                                    }>
                                        <span className="capitalize text-[10px] font-bold">{batch.status}</span>
                                    </Badge>
                                </div>

                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-brand">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/procurement/grn/${batch.id}`} className="flex items-center gap-2 cursor-pointer">
                                                    <Eye className="h-3.5 w-3.5" /> View GRN
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-20 gap-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                            <Package className="h-8 w-8 text-text-muted/50" />
                        </div>
                        <div>
                            <p className="font-bold text-text-primary">No GRN records found</p>
                            <p className="text-sm text-text-muted mt-1">All goods received from suppliers will appear here.</p>
                        </div>
                        <Can permission="grn.create">
                            <Link href="/procurement/grn/create">
                                <Button variant="outline">Record First GRN</Button>
                            </Link>
                        </Can>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {batches.last_page > 1 && (
                <div className="flex items-center justify-between py-4 select-none">
                    <div className="text-sm text-text-muted">
                        Showing <span className="font-medium text-text-primary">{batches.from}</span> to{' '}
                        <span className="font-medium text-text-primary">{batches.to}</span> of{' '}
                        <span className="font-medium text-text-primary">{batches.total}</span> results
                    </div>
                    <div className="flex items-center gap-1">
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
                                        className="h-9 px-3 flex items-center justify-center rounded-xl border border-border text-xs font-bold uppercase tracking-wider text-text-muted bg-muted/30 cursor-not-allowed opacity-50"
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
                                        'h-9 min-w-[36px] px-3 flex items-center justify-center rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                                        link.active
                                            ? 'bg-brand text-brand-foreground shadow-md'
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
