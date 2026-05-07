import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockBatch } from '@/types/inventory';
import {
    ArrowLeft, Building2, Package, Hash, MapPin,
    CalendarDays, Layers, TrendingUp, Receipt, User2,
    Printer, Download, History, Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    batch: StockBatch & {
        movements?: Array<{
            id: string;
            type: string;
            quantity: number;
            balance_before: number;
            balance_after: number;
            notes: string | null;
            created_at: string;
            user?: { name: string };
        }>;
    };
}

const statusStyles: Record<string, string> = {
    active:      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    quarantined: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    exhausted:   'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
    expired:     'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
};

export default function GrnShow({ batch }: Props) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const totalValue = batch.quantity_received * batch.unit_cost;

    const DetailRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode, icon?: any }) => (
        <div className="flex items-start gap-3 py-3.5 border-b border-border/40 last:border-0 group">
            {Icon && <Icon className="h-4 w-4 mt-0.5 text-text-muted group-hover:text-brand transition-colors" />}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted leading-none">{label}</span>
                <span className="text-sm font-semibold text-text-primary truncate">
                    {value ?? <span className="text-text-muted italic font-normal">—</span>}
                </span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 py-6 sm:py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <Head title={`GRN: ${batch.reference ?? batch.batch_number}`} />

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Link 
                        href="/procurement/grn" 
                        className="flex items-center text-xs font-bold uppercase tracking-wider text-text-muted hover:text-brand transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                        Back to Register
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold uppercase tracking-wider" onClick={() => window.print()}>
                            <Printer className="mr-2 h-3.5 w-3.5" />
                            Print
                        </Button>
                    </div>
                </div>

                <PageHeader
                    title={batch.reference ?? batch.batch_number}
                    description={`Received on ${formatDate(batch.created_at)}`}
                    className="pb-2"
                >
                    <Badge variant="outline" className={cn("font-bold capitalize text-[10px] px-2.5 py-0.5 shadow-sm", statusStyles[batch.status])}>
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                        {batch.status}
                    </Badge>
                </PageHeader>
            </div>

            {/* Value Banner - More responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { icon: Boxes, label: 'Qty Received', value: batch.quantity_received.toLocaleString(), color: 'bg-blue-50 text-blue-600' },
                    { icon: TrendingUp, label: 'Qty On Hand', value: batch.quantity_on_hand.toLocaleString(), color: 'bg-emerald-50 text-emerald-600' },
                    { icon: Receipt, label: 'Unit Cost', value: formatCurrency(batch.unit_cost), color: 'bg-amber-50 text-amber-600' },
                    { icon: Receipt, label: 'Total Value', value: formatCurrency(totalValue), color: 'bg-purple-50 text-purple-600' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <Card key={label} className="border-border/50 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300", color)}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-0.5">{label}</p>
                                <p className="text-xl font-extrabold text-text-primary tracking-tight truncate">{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left — Details & History */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="px-6 py-4 bg-muted/20 border-b border-border/50 space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <Hash className="h-4 w-4 text-brand" />
                                </div>
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Batch Identity</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-12">
                            <DetailRow label="GRN Reference" value={<span className="font-mono text-xs">{batch.reference}</span>} />
                            <DetailRow label="Batch Number" value={<span className="font-mono text-xs">{batch.batch_number}</span>} />
                            <DetailRow label="Manufacturing Date" value={formatDate(batch.manufacturing_date)} />
                            <DetailRow label="Expiry Date" value={formatDate(batch.expiry_date)} />
                        </CardContent>
                    </Card>

                    {/* Movement Log */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="px-6 py-4 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <History className="h-4 w-4 text-brand" />
                                </div>
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Activity Log</CardTitle>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                {batch.movements?.length ?? 0} Events
                            </span>
                        </CardHeader>
                        <CardContent className="p-0">
                            {batch.movements && batch.movements.length > 0 ? (
                                <div className="flex flex-col">
                                    {batch.movements.map((mv, idx) => (
                                        <div key={mv.id} className={cn(
                                            "px-6 py-4 flex items-center gap-4 hover:bg-muted/10 transition-colors",
                                            idx !== batch.movements!.length - 1 && "border-b border-border/40"
                                        )}>
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 text-[10px] font-black uppercase shadow-sm",
                                                mv.type === 'in' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                mv.type === 'out' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                'bg-slate-50 text-slate-600 border border-slate-100'
                                            )}>
                                                {mv.type}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-sm font-bold text-text-primary">
                                                        {mv.quantity > 0 ? '+' : ''}{mv.quantity.toLocaleString()} units
                                                    </p>
                                                    <span className="text-[10px] text-text-muted font-medium bg-muted/50 px-1.5 py-0.5 rounded">
                                                        {mv.balance_before} → {mv.balance_after}
                                                    </span>
                                                </div>
                                                {mv.notes && <p className="text-xs text-text-muted line-clamp-1 mt-0.5 italic">{mv.notes}</p>}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] font-bold text-text-secondary uppercase">{formatDate(mv.created_at)}</p>
                                                {mv.user && (
                                                    <div className="flex items-center justify-end gap-1.5 mt-1">
                                                        <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                                                            <User2 className="h-2.5 w-2.5 text-text-muted" />
                                                        </div>
                                                        <p className="text-[10px] text-text-muted font-medium">{mv.user.name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-12 gap-3 text-center">
                                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                                        <History className="h-6 w-6 text-text-muted/30" />
                                    </div>
                                    <p className="text-sm text-text-muted font-medium italic">No movement records found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Sidebar Info */}
                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="px-6 py-4 bg-muted/20 border-b border-border/50 space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-brand" />
                                </div>
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Source Vendor</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-2">
                            {batch.supplier ? (
                                <>
                                    <DetailRow label="Vendor Name" value={batch.supplier.name} />
                                    <DetailRow label="Code" value={<span className="font-mono">{batch.supplier.code}</span>} />
                                    <DetailRow label="Category" value={batch.supplier.category?.replace('_', ' ')} />
                                    <DetailRow label="Contact Person" value={batch.supplier.contact_person} />
                                    {batch.supplier.email && (
                                        <DetailRow label="Email Address" value={
                                            <a href={`mailto:${batch.supplier.email}`} className="text-brand hover:underline">
                                                {batch.supplier.email}
                                            </a>
                                        } />
                                    )}
                                </>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-xs text-text-muted italic">No supplier linked.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="px-6 py-4 bg-muted/20 border-b border-border/50 space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-brand" />
                                </div>
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Product Info</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-2">
                            {batch.product ? (
                                <>
                                    <DetailRow label="Name" value={batch.product.name} />
                                    <DetailRow label="SKU / ID" value={<span className="font-mono">{batch.product.sku}</span>} />
                                    <DetailRow label="Category" value={batch.product.category?.name} />
                                </>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-xs text-text-muted italic">Product info unavailable.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="px-6 py-4 bg-muted/20 border-b border-border/50 space-y-0">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-brand" />
                                </div>
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Storage</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-2">
                            <DetailRow
                                label="Target Location"
                                icon={MapPin}
                                value={(batch as any).storage_location?.name ?? 'Not assigned'}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// @ts-ignore
GrnShow.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'GRN Register', href: '/procurement/grn' },
        { title: 'GRN Detail', href: '#' },
    ],
};

