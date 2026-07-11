import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
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
    Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight,
    Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    requisitions: { data: Requisition[] } & PaginationMeta;
    filters: { search?: string; type?: string; status?: string };
    stats: { total: number; pending_l1: number; pending_l2: number; internal: number; departmental: number; purchase: number };
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
    departmental: <Building2 className="h-4 w-4 text-blue-600" />,
    purchase: <ShoppingCart className="h-4 w-4 text-amber-600" />,
};

export default function RequisitionsIndex({ requisitions, filters, stats }: Props) {
    const { auth } = usePage<any>().props;
    const user = auth.user;
    const [search, setSearch] = useState(filters.search ?? '');

    const filter = (updates: Record<string, string | undefined>) =>
        router.get('/procurement/requisitions', { ...filters, ...updates }, { preserveState: true });

    const columns: Column<Requisition>[] = [
        {
            header: 'Type',
            cell: (req) => (
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    req.type === 'internal'
                        ? 'bg-brand/10 text-brand'
                        : req.type === 'departmental'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                }`}>
                    {TYPE_ICONS[req.type]}
                </div>
            )
        },
        {
            header: 'Reference / Purpose',
            cell: (req) => (
                <Link href={`/procurement/requisitions/${req.id}`} className="block group">
                    <p className="text-sm font-bold font-mono text-text-primary group-hover:text-brand transition-colors">{req.reference}</p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">{req.purpose ?? '—'}</p>
                </Link>
            )
        },
        {
            header: 'Route / Supplier',
            cell: (req) => (
                req.type === 'internal' ? (
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
                )
            )
        },
        {
            header: 'Requester',
            cell: (req) => {
                const deptName = req.requesting_department?.name 
                    || req.requesting_location?.department?.name 
                    || req.requester?.department?.name;
                
                return (
                    <div>
                        <p className="text-[13px] font-bold text-text-primary leading-tight">{req.requester?.name ?? '—'}</p>
                        {deptName && <p className="text-[10px] font-medium text-brand/80 mt-0.5">{deptName}</p>}
                        <p className="text-[10px] text-text-muted mt-0.5">{new Date(req.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
                    </div>
                );
            }
        },
        {
            header: 'Items',
            className: 'text-center',
            cell: (req) => (
                <div className="flex justify-center">
                    <span className="text-sm font-extrabold text-text-primary bg-muted/30 px-2.5 py-1 rounded-full">{req.items?.length ?? 0}</span>
                </div>
            )
        },
        {
            header: 'Status',
            className: 'text-center',
            cell: (req) => (
                <div className="flex justify-center">
                    <Badge variant="outline" className={`text-[10px] font-bold capitalize whitespace-nowrap ${STATUS_STYLES[req.status]}`}>
                        {req.status.replace('_', ' ').replace('level1', 'Dept').replace('level2', 'MD')}
                    </Badge>
                </div>
            )
        },
        {
            header: '',
            className: 'text-right min-w-[50px]',
            cell: (req) => (
                <div className="flex justify-end">
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
            )
        }
    ];

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
            <Head title="Requisition Register" />

            <PageHeader
                title="Requisition Management"
                description="Manage internal store transfers and external purchase requests."
            >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <Can permission="requisitions.create">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-brand-foreground shadow-md gap-2 h-10">
                                    <Plus className="h-4 w-4" />
                                    New Requisition
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {user.role !== 'Ward/Dept Head' && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/procurement/requisitions/create?type=internal" className="flex items-center gap-3 cursor-pointer py-2">
                                                <div className="h-7 w-7 rounded-md bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[13px] leading-none">Internal Transfer</span>
                                                    <span className="text-[10px] text-text-muted mt-1">Store-to-store</span>
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/procurement/requisitions/create?type=purchase" className="flex items-center gap-3 cursor-pointer py-2">
                                                <div className="h-7 w-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                                    <ShoppingCart className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[13px] leading-none">Purchase Request</span>
                                                    <span className="text-[10px] text-text-muted mt-1">External procurement</span>
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link href="/procurement/requisitions/create?type=departmental" className="flex items-center gap-3 cursor-pointer py-2">
                                        <div className="h-7 w-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                            <Building2 className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[13px] leading-none">Departmental Issue</span>
                                            <span className="text-[10px] text-text-muted mt-1">Unit supply</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </Can>
                </div>
            </PageHeader>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Requests', value: stats.total, icon: ClipboardList, color: 'text-slate-600 bg-slate-50', border: 'border-l-slate-400' },
                    { label: 'Pending Dept', value: stats.pending_l1, icon: Clock, color: 'text-amber-600 bg-amber-50', border: 'border-l-amber-500' },
                    { label: 'Pending MD', value: stats.pending_l2, icon: AlertCircle, color: 'text-blue-600 bg-blue-50', border: 'border-l-blue-500' },
                    { label: 'Dept. Issues', value: stats.departmental, icon: Building2, color: 'text-indigo-600 bg-indigo-50', border: 'border-l-indigo-500' },
                    { label: 'Purchases', value: stats.purchase, icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50', border: 'border-l-emerald-500' },
                ].map((s) => (
                    <Card key={s.label} className={cn("border-border/50 shadow-sm border-l-4 overflow-hidden", s.border)}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted truncate">{s.label}</p>
                                <p className="text-xl font-extrabold text-text-primary tracking-tight">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <form onSubmit={(e) => { e.preventDefault(); filter({ search }); }} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search reference, requester…"
                            className="pl-9 h-11 bg-muted/30 border-transparent focus-visible:ring-brand/20"
                        />
                    </div>
                    <Button type="submit" variant="outline" size="icon" className="h-11 w-11 shrink-0">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={filters.type ?? 'all'} onValueChange={(v) => filter({ type: v === 'all' ? undefined : v })}>
                        <SelectTrigger className="h-11 w-full sm:w-44 bg-muted/30 border-transparent">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="internal">Internal Transfer</SelectItem>
                            <SelectItem value="departmental">Departmental Issue</SelectItem>
                            <SelectItem value="purchase">Purchase Request</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.status ?? 'all'} onValueChange={(v) => filter({ status: v === 'all' ? undefined : v })}>
                        <SelectTrigger className="h-11 w-full sm:w-48 bg-muted/30 border-transparent">
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
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="hidden md:block">
                    <DataTable 
                        columns={columns}
                        data={requisitions.data}
                        meta={requisitions}
                        keyExtractor={(r) => String(r.id)}
                        emptyMessage="No requisitions found."
                    />
                </div>

                {/* Mobile List View */}
                <div className="md:hidden flex flex-col divide-y divide-border/30">
                    {requisitions.data.map((req) => (
                        <Link 
                            key={req.id} 
                            href={`/procurement/requisitions/${req.id}`}
                            className="p-5 hover:bg-muted/5 transition-colors active:bg-muted/10 flex flex-col gap-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                        req.type === 'internal' ? 'bg-brand/10 text-brand' : 
                                        req.type === 'departmental' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    )}>
                                        {TYPE_ICONS[req.type]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-text-primary leading-tight font-mono truncate">{req.reference}</p>
                                        <p className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-widest">
                                            {req.type.replace('_', ' ')} Requisition
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase whitespace-nowrap shadow-sm border-transparent px-2 py-0.5", STATUS_STYLES[req.status])}>
                                    {req.status.replace('_', ' ').replace('level1', 'Dept').replace('level2', 'MD')}
                                </Badge>
                            </div>

                            <div className="p-3 bg-muted/20 rounded-2xl border border-border/30">
                                <p className="text-[11px] text-text-secondary font-medium line-clamp-2 italic leading-relaxed">
                                    "{req.purpose ?? 'Stock replenishment request'}"
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center text-[10px] font-black text-text-muted">
                                        {req.requester?.name?.charAt(0) ?? '?'}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-text-primary leading-tight">{req.requester?.name ?? '—'}</p>
                                        <p className="text-[9px] text-text-muted mt-0.5">{new Date(req.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Items</p>
                                    <p className="text-sm font-black text-text-primary">{req.items?.length ?? 0}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                
                {requisitions.data.length === 0 && (
                    <div className="flex flex-col items-center py-24 gap-6 text-center border-t border-border">
                        <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <ClipboardList className="h-10 w-10 text-text-muted/30" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-text-primary">No requisitions found</p>
                            <p className="text-sm text-text-muted mt-1 max-w-sm">Create an internal transfer or purchase request to stock up your location.</p>
                        </div>
                        <Can permission="requisitions.create">
                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                {user.role !== 'Ward/Dept Head' && (
                                    <>
                                        <Link href="/procurement/requisitions/create?type=internal">
                                            <Button variant="outline" className="h-11 px-6 border-brand/20 text-brand hover:bg-brand/5 gap-2">
                                                <ArrowRightLeft className="h-4 w-4" />
                                                Internal Request
                                            </Button>
                                        </Link>
                                        <Link href="/procurement/requisitions/create?type=purchase">
                                            <Button className="bg-brand text-brand-foreground h-11 px-6 shadow-lg shadow-brand/20 hover:bg-brand-dark gap-2">
                                                <ShoppingCart className="h-4 w-4" />
                                                Purchase Request
                                            </Button>
                                        </Link>
                                    </>
                                )}
                                <Link href="/procurement/requisitions/create?type=departmental">
                                    <Button variant="outline" className="h-11 px-6 border-blue-500/20 text-blue-700 hover:bg-blue-50 gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Departmental Request
                                    </Button>
                                </Link>
                            </div>
                        </Can>
                    </div>
                )}
            </div>
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
