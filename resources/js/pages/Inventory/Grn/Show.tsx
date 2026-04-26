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
} from 'lucide-react';

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
    active:      'bg-success/10 text-success border-success/20',
    quarantined: 'bg-warning/10 text-warning border-warning/20',
    exhausted:   'bg-muted text-text-muted border-border',
    expired:     'bg-destructive/10 text-destructive border-destructive/20',
};

export default function GrnShow({ batch }: Props) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

    const totalValue = batch.quantity_received * batch.unit_cost;

    const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="flex flex-col gap-0.5 py-3 border-b border-border/40 last:border-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
            <span className="text-sm font-semibold text-text-primary">{value ?? <span className="text-text-muted italic font-normal">—</span>}</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title={`GRN: ${batch.reference ?? batch.batch_number}`} />

            <div className="flex flex-col gap-4">
                <Link href="/procurement/grn" className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to GRN Register
                </Link>

                <PageHeader
                    title={`GRN: ${batch.reference ?? batch.batch_number}`}
                    description={`Received on ${new Date(batch.created_at).toLocaleDateString('en-NG', { dateStyle: 'full' })}`}
                >
                    <Badge variant="outline" className={`font-bold capitalize text-xs ${statusStyles[batch.status]}`}>
                        {batch.status}
                    </Badge>
                </PageHeader>
            </div>

            {/* Value Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { icon: Layers, label: 'Qty Received', value: batch.quantity_received.toLocaleString() },
                    { icon: TrendingUp, label: 'Qty On Hand', value: batch.quantity_on_hand.toLocaleString() },
                    { icon: Receipt, label: 'Unit Cost', value: formatCurrency(batch.unit_cost) },
                    { icon: Receipt, label: 'Batch Value', value: formatCurrency(totalValue) },
                ].map(({ icon: Icon, label, value }) => (
                    <Card key={label} className="border-border/50 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0">
                                <Icon className="h-5 w-5 text-brand" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
                                <p className="text-lg font-extrabold text-text-primary">{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left — GRN Details */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-brand" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Batch Record</CardTitle>
                        </div>
                        <CardContent className="px-6 pb-2">
                            <DetailRow label="GRN Reference" value={<span className="font-mono">{batch.reference}</span>} />
                            <DetailRow label="Batch Number" value={<span className="font-mono">{batch.batch_number}</span>} />
                            <DetailRow label="Manufacturing Date" value={batch.manufacturing_date
                                ? new Date(batch.manufacturing_date).toLocaleDateString('en-NG')
                                : null}
                            />
                            <DetailRow label="Expiry Date" value={batch.expiry_date
                                ? new Date(batch.expiry_date).toLocaleDateString('en-NG')
                                : null}
                            />
                        </CardContent>
                    </Card>

                    {/* Movement Log */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-brand" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Movement History</CardTitle>
                        </div>
                        <CardContent className="p-0">
                            {batch.movements && batch.movements.length > 0 ? (
                                <div className="flex flex-col divide-y divide-border/40">
                                    {batch.movements.map((mv) => (
                                        <div key={mv.id} className="px-6 py-4 flex items-center gap-4">
                                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold uppercase ${
                                                mv.type === 'in' ? 'bg-success/10 text-success' :
                                                mv.type === 'out' ? 'bg-destructive/10 text-destructive' :
                                                'bg-muted text-text-muted'
                                            }`}>
                                                {mv.type}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-text-primary">
                                                    {mv.quantity > 0 ? '+' : ''}{mv.quantity} units
                                                    <span className="ml-2 text-xs text-text-muted font-normal">
                                                        ({mv.balance_before} → {mv.balance_after})
                                                    </span>
                                                </p>
                                                {mv.notes && <p className="text-xs text-text-muted truncate mt-0.5">{mv.notes}</p>}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] text-text-muted">{new Date(mv.created_at).toLocaleDateString('en-NG')}</p>
                                                {mv.user && (
                                                    <p className="text-[10px] text-text-muted flex items-center justify-end gap-1 mt-0.5">
                                                        <User2 className="h-2.5 w-2.5" /> {mv.user.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-text-muted text-center py-8">No movement records found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Supplier & Location */}
                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-brand" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Supplier</CardTitle>
                        </div>
                        <CardContent className="px-6 pb-2">
                            {batch.supplier ? (
                                <>
                                    <DetailRow label="Vendor Name" value={batch.supplier.name} />
                                    <DetailRow label="Code" value={<span className="font-mono">{batch.supplier.code}</span>} />
                                    <DetailRow label="Category" value={batch.supplier.category?.replace('_', ' ')} />
                                    <DetailRow label="Contact" value={batch.supplier.contact_person} />
                                    {batch.supplier.email && (
                                        <DetailRow label="Email" value={
                                            <a href={`mailto:${batch.supplier.email}`} className="text-brand hover:underline">
                                                {batch.supplier.email}
                                            </a>
                                        } />
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-text-muted italic py-4 text-center">No supplier linked to this batch.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Package className="h-4 w-4 text-brand" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Product</CardTitle>
                        </div>
                        <CardContent className="px-6 pb-2">
                            {batch.product ? (
                                <>
                                    <DetailRow label="Product Name" value={batch.product.name} />
                                    <DetailRow label="SKU" value={<span className="font-mono">{batch.product.sku}</span>} />
                                    <DetailRow label="Category" value={batch.product.category?.name} />
                                </>
                            ) : (
                                <p className="text-sm text-text-muted italic py-4 text-center">Product info unavailable.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-brand" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Storage Location</CardTitle>
                        </div>
                        <CardContent className="px-6 pb-2">
                            <DetailRow
                                label="Location"
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
