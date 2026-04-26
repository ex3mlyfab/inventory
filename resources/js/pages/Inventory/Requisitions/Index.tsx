import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Can, CanAny } from '@/components/can';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Requisition, PaginationMeta } from '@/types/inventory';
import {
    Plus, Search, MoreHorizontal, Eye,
    ClipboardList, ArrowRightLeft, ShoppingCart,
    Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    requisitions: { data: Requisition[] } & PaginationMeta;
    filters: { search?: string; type?: string; status?: string };
    stats: { total: number; pending_l1: number; pending_l2: number; internal: number; purchase: number };
}

const STATUS_STYLES: Record<string, string> = {
    draft:            'bg-muted text-text-muted border-border',
    submitted:        'bg-amber-50 text-amber-700 border-amber-200',
    level1_approved:  'bg-blue-50 text-blue-700 border-blue-200',
    approved:         'bg-success/10 text-success border-success/20',
    partially_issued: 'bg-blue-50 text-blue-700 border-blue-200',
    issued:           'bg-brand/10 text-brand border-brand/20',
    rejected:         'bg-destructive/10 text-destructive border-destructive/20',
    cancelled:        'bg-muted text-text-muted border-border',
};

const TYPE_ICONS = {
    internal: <ArrowRightLeft className="h-4 w-4 text-brand" />,
    purchase: <ShoppingCart className="h-4 w-4 text-amber-600" />,
};

export default function RequisitionsIndex({ requisitions, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const filter = (updates: Record<string, string | undefined>) =>
        router.get('/procurement/requisitions', { ...filters, ...updates }, { preserveState: true });

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title="Requisitions" />

            <PageHeader
                title="Requisition Management"
                description="Manage internal store transfers and external purchase requests."
            >
                <div className="flex items-center gap-3">
                    <Can permission="requisitions.create">
                        <Link href="/procurement/requisitions/create?type=internal">
                            <Button variant="outline" className="border-brand/20 text-brand hover:bg-brand/5 gap-2">
                                <ArrowRightLeft className="h-4 w-4" />
                                Internal Request
                            </Button>
                        </Link>
                        <Link href="/procurement/requisitions/create?type=purchase">
                            <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Purchase Request
                            </Button>
                        </Link>
                    </Can>
                </div>
            </PageHeader>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 shadow-sm border-l-4 border-l-brand">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Total Requests</p>
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Pending L1 (Dept)</p>
                            <p className="text-xl font-extrabold text-text-primary">{stats.pending_l1}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Pending L2 (MD)</p>
                            <p className="text-xl font-extrabold text-text-primary">{stats.pending_l2}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-sm border-l-4 border-l-emerald-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Purchase Req</p>
                            <p className="text-xl font-extrabold text-text-primary">{stats.purchase}</p>
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
                            placeholder="Search reference, requester…"
                            className="pl-9 h-10 bg-muted/30 border-transparent focus-visible:ring-brand/20"
                        />
                    </div>
                    <Button type="submit" variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <Select value={filters.type ?? 'all'} onValueChange={(v) => filter({ type: v === 'all' ? undefined : v })}>
                    <SelectTrigger className="h-10 w-44 bg-muted/30 border-transparent">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="internal">Internal Transfer</SelectItem>
                        <SelectItem value="purchase">Purchase Request</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filters.status ?? 'all'} onValueChange={(v) => filter({ status: v === 'all' ? undefined : v })}>
                    <SelectTrigger className="h-10 w-48 bg-muted/30 border-transparent">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="submitted">Pending Dept (L1)</SelectItem>
                        <SelectItem value="level1_approved">Pending MD (L2)</SelectItem>
                        <SelectItem value="approved">Fully Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/30 px-6 py-3 border-b border-border/50 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    <div className="col-span-1">Type</div>
                    <div className="col-span-3">Reference / Purpose</div>
                    <div className="col-span-3">Route / Supplier</div>
                    <div className="col-span-2">Requester</div>
                    <div className="col-span-1 text-center">Items</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {requisitions.data.length > 0 ? (
                    <div className="flex flex-col divide-y divide-border/30">
                        {requisitions.data.map((req) => (
                            <div key={req.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-brand/[0.02] transition-colors group">

                                {/* Type badge */}
                                <div className="col-span-1">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                        req.type === 'internal'
                                            ? 'bg-brand/10 text-brand'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {TYPE_ICONS[req.type]}
                                    </div>
                                </div>

                                {/* Ref */}
                                <div className="col-span-3">
                                    <Link href={`/procurement/requisitions/${req.id}`} className="block">
                                        <p className="text-sm font-bold font-mono text-text-primary group-hover:text-brand transition-colors">{req.reference}</p>
                                        <p className="text-[11px] text-text-muted truncate mt-0.5">{req.purpose ?? '—'}</p>
                                    </Link>
                                </div>

                                {/* Route (internal) / Supplier (purchase) */}
                                <div className="col-span-3 text-sm">
                                    {req.type === 'internal' ? (
                                        <div className="flex items-center gap-1.5 text-text-secondary">
                                            <span className="truncate font-semibold text-[11px] bg-muted/50 px-1.5 py-0.5 rounded" title={req.requesting_location?.name}>
                                                {req.requesting_location?.name ?? '—'}
                                            </span>
                                            <ArrowRightLeft className="h-3 w-3 text-text-muted shrink-0" />
                                            <span className="truncate text-[11px] bg-muted/20 px-1.5 py-0.5 rounded" title={req.issuing_location?.name}>
                                                {req.issuing_location?.name ?? '—'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-text-secondary font-medium">{req.supplier?.name ?? <em className="text-text-muted italic font-normal">Preferred Supplier: None</em>}</span>
                                    )}
                                </div>

                                {/* Requester */}
                                <div className="col-span-2">
                                    <p className="text-[13px] font-semibold text-text-primary">{req.requester?.name ?? '—'}</p>
                                    <p className="text-[10px] text-text-muted">{new Date(req.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
                                </div>

                                {/* Items count */}
                                <div className="col-span-1 text-center">
                                    <span className="text-sm font-extrabold text-text-primary bg-muted/30 px-2.5 py-1 rounded-full">{req.items?.length ?? 0}</span>
                                </div>

                                {/* Status */}
                                <div className="col-span-1 flex justify-center">
                                    <Badge variant="outline" className={`text-[10px] font-bold capitalize whitespace-nowrap ${STATUS_STYLES[req.status]}`}>
                                        {req.status.replace('_', ' ').replace('level1', 'Dept').replace('level2', 'MD')}
                                    </Badge>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-brand bg-muted/5 group-hover:bg-brand/10">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/procurement/requisitions/${req.id}`} className="flex items-center gap-2 cursor-pointer">
                                                    <Eye className="h-3.5 w-3.5" /> View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            
                                            {(req.status === 'submitted' || req.status === 'level1_approved') && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <CanAny permissions={['requisitions.approve.l1', 'requisitions.approve.l2']}>
                                                            <Link href={`/procurement/requisitions/${req.id}`} className="flex items-center gap-2 cursor-pointer text-success font-semibold">
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Review Approval
                                                            </Link>
                                                        </CanAny>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-24 gap-6 text-center">
                        <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <ClipboardList className="h-10 w-10 text-text-muted/30" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-text-primary">No requisitions found</p>
                            <p className="text-sm text-text-muted mt-1 max-w-sm">Create an internal transfer or purchase request to stock up your location.</p>
                        </div>
                        <Can permission="requisitions.create">
                            <div className="flex gap-4">
                                <Link href="/procurement/requisitions/create?type=internal">
                                    <Button variant="outline" className="h-11 px-6">Internal Request</Button>
                                </Link>
                                <Link href="/procurement/requisitions/create?type=purchase">
                                    <Button className="bg-brand text-brand-foreground h-11 px-6 shadow-lg shadow-brand/20">Purchase Request</Button>
                                </Link>
                            </div>
                        </Can>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {requisitions.last_page > 1 && (
                <div className="flex items-center justify-between py-4 select-none">
                    <div className="text-sm text-text-muted">
                        Showing <span className="font-medium text-text-primary">{requisitions.from}</span> to{' '}
                        <span className="font-medium text-text-primary">{requisitions.to}</span> of{' '}
                        <span className="font-medium text-text-primary">{requisitions.total}</span> results
                    </div>
                    <div className="flex items-center gap-1">
                        {requisitions.links.map((link, index) => {
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
RequisitionsIndex.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Requisitions', href: '#' },
    ],
};
