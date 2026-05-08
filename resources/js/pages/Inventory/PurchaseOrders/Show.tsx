import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    ArrowLeft, Printer, ShoppingCart, Calendar,
    User, CheckCircle2, XCircle, AlertCircle,
    Building2, FileText, ClipboardCheck, MessageSquare, Receipt
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PurchaseOrder {
    id: string;
    po_number: string;
    total_amount: number;
    status: string;
    notes?: string;
    created_at: string;
    supplier: { id: string; name: string; code: string };
    creator: { name: string };
    requisition?: { id: string; reference: string };
    items: {
        id: string;
        product: { name: string; sku: string; unit_of_measure?: { abbreviation: string } };
        quantity: number;
        unit_price: number;
        total_price: number;
        quantity_received: number;
    }[];
    level1_approved_by?: string;
    level1_approver?: { name: string };
    level1_approved_at?: string;
    level1_notes?: string;
    level2_approved_by?: string;
    level2_approver?: { name: string };
    level2_approved_at?: string;
    level2_notes?: string;
}

interface Props {
    order: PurchaseOrder;
    canApproveL1: boolean;
    canApproveL2: boolean;
    canReject: boolean;
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

export default function PurchaseOrderShow({ order, canApproveL1, canApproveL2, canReject }: Props) {
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    
    const approveForm = useForm({ notes: '' });
    const rejectForm = useForm({ notes: '' });

    const handleApprove = () => {
        const url = canApproveL1 
            ? `/procurement/purchase-orders/${order.id}/approve/level1`
            : `/procurement/purchase-orders/${order.id}/approve/level2`;
        
        approveForm.post(url, {
            onSuccess: () => {
                setIsApproveOpen(false);
                approveForm.reset();
            }
        });
    };

    const handleReject = () => {
        rejectForm.post(`/procurement/purchase-orders/${order.id}/reject`, {
            onSuccess: () => {
                setIsRejectOpen(false);
                rejectForm.reset();
            }
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title={`Purchase Order ${order.po_number}`} />

            <div className="flex flex-col gap-4">
                <Link href="/procurement/purchase-orders" className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Orders
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <PageHeader
                        title={`Order ${order.po_number}`}
                        description={`Commitment to supply ${order.items.length} product(s) from ${order.supplier.name}.`}
                    >
                        <Badge variant="outline" className={`ml-4 text-xs font-bold uppercase py-1 px-3 ${STATUS_STYLES[order.status]}`}>
                            {order.status.replace('_', ' ').replace('level1', 'Supervisor').replace('level2', 'MD')}
                        </Badge>
                    </PageHeader>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-border text-text-secondary gap-2 h-10">
                            <Printer className="h-4 w-4" />
                            Print Order
                        </Button>
                        
                        {(canApproveL1 || canApproveL2) && (
                            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-success hover:bg-success/90 text-white shadow-lg gap-2 h-10 px-6">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve Order
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Finalize Approval</DialogTitle>
                                        <DialogDescription>
                                            {canApproveL1 ? 'Giving Level 1 approval as Procurement Supervisor.' : 'Giving Level 2 approval as Medical Director.'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Approval Notes (Optional)</Label>
                                            <textarea
                                                id="notes"
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
                                                value={approveForm.data.notes}
                                                onChange={(e) => approveForm.setData('notes', e.target.value)}
                                                placeholder="Comment on this approval..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                                        <Button disabled={approveForm.processing} onClick={handleApprove} className="bg-success hover:bg-success/90 text-white">
                                            {approveForm.processing ? 'Processing...' : 'Confirm Approval'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}

                        {canReject && (
                            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/5 gap-2 h-10">
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-destructive">Reject Purchase Order</DialogTitle>
                                        <DialogDescription>
                                            Please provide a reason for rejecting this commitment.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reject_notes">Reason for Rejection <span className="text-destructive">*</span></Label>
                                            <textarea
                                                id="reject_notes"
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
                                                value={rejectForm.data.notes}
                                                onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                                placeholder="Why is this order being rejected?"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                                        <Button disabled={rejectForm.processing || !rejectForm.data.notes} onClick={handleReject} className="bg-destructive text-white hover:bg-destructive/90">
                                            {rejectForm.processing ? 'Processing...' : 'Reject Order'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Items Table */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Order Items</h3>
                        </div>
                        <CardContent className="p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/10">
                                    <tr className="border-b border-border/30 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                                        <th className="px-6 py-3">Product Description</th>
                                        <th className="px-3 py-3 text-center">Ordered</th>
                                        <th className="px-3 py-3 text-center">Received</th>
                                        <th className="px-3 py-3 text-right">Unit Price</th>
                                        <th className="px-6 py-3 text-right">Ext. Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-text-primary">{item.product.name}</p>
                                                <p className="text-[10px] text-text-muted font-mono">{item.product.sku}</p>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="text-sm font-semibold">{item.quantity}</span>
                                                <span className="text-[10px] text-text-muted ml-1">{item.product.unit_of_measure?.abbreviation}</span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <Badge variant={item.quantity_received >= item.quantity ? 'outline' : 'outline'} className={cn(
                                                    "text-[10px] font-bold",
                                                    item.quantity_received >= item.quantity && "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                )}>
                                                    {item.quantity_received}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-4 text-right font-medium text-sm">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-sm text-text-primary">
                                                {formatCurrency(item.total_price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-muted/30">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-text-muted">Grand Total</td>
                                        <td className="px-6 py-4 text-right text-lg font-black text-brand">{formatCurrency(order.total_amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Timeline / Approvals */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Approval Workflow</h3>
                        </div>
                        <CardContent className="p-6">
                            <div className="relative pl-6 border-l-2 border-border/50 space-y-10 py-2">
                                {/* Level 1 */}
                                <div className="relative">
                                    <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 bg-white ${order.level1_approved_at ? 'border-success' : 'border-border'}`} />
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Level 1: Procurement Supervisor</p>
                                            {order.level1_approved_at ? (
                                                <Badge variant="outline" className="text-[9px] h-5 border-emerald-200 bg-emerald-50 text-emerald-700">Approved</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[9px] h-5 animate-pulse">Awaiting Action</Badge>
                                            )}
                                        </div>
                                        {order.level1_approved_at ? (
                                            <div className="mt-2 text-sm">
                                                <div className="flex items-center gap-2 text-text-primary font-semibold">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                                    {order.level1_approver?.name}
                                                </div>
                                                <p className="text-[10px] text-text-muted mt-0.5">{new Date(order.level1_approved_at).toLocaleString()}</p>
                                                {order.level1_notes && (
                                                    <div className="mt-2 p-2 bg-muted/30 rounded-lg text-xs italic text-text-secondary border-l-2 border-brand/20">
                                                        "{order.level1_notes}"
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-text-muted mt-1 italic">Pending review by Procurement Supervisor...</p>
                                        )}
                                    </div>
                                </div>

                                {/* Level 2 */}
                                <div className="relative">
                                    <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 bg-white ${order.level2_approved_at ? 'border-success' : 'border-border'}`} />
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Level 2: Medical Director</p>
                                            {order.level2_approved_at ? (
                                                <Badge variant="outline" className="text-[9px] h-5 border-emerald-200 bg-emerald-50 text-emerald-700">Approved</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[9px] h-5">Pending L1 Approval</Badge>
                                            )}
                                        </div>
                                        {order.level2_approved_at ? (
                                            <div className="mt-2 text-sm">
                                                <div className="flex items-center gap-2 text-text-primary font-semibold">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                                    {order.level2_approver?.name}
                                                </div>
                                                <p className="text-[10px] text-text-muted mt-0.5">{new Date(order.level2_approved_at).toLocaleString()}</p>
                                                {order.level2_notes && (
                                                    <div className="mt-2 p-2 bg-muted/30 rounded-lg text-xs italic text-text-secondary border-l-2 border-brand/20">
                                                        "{order.level2_notes}"
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-text-muted mt-1 italic">Pending review by Medical Director...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    {/* Supplier Information */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Supplier</h3>
                        </div>
                        <CardContent className="p-6">
                            <p className="text-lg font-bold text-text-primary leading-tight">{order.supplier.name}</p>
                            <p className="text-xs font-mono text-text-muted uppercase mt-1">Vendor Code: {order.supplier.code}</p>
                            
                            <div className="mt-6 pt-6 border-t border-border/30 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-text-muted shrink-0">
                                        <ShoppingCart className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Linked Requisition</p>
                                        {order.requisition ? (
                                            <Link href={`/procurement/requisitions/${order.requisition.id}`} className="text-sm font-bold text-brand hover:underline">
                                                {order.requisition.reference}
                                            </Link>
                                        ) : (
                                            <p className="text-sm font-medium text-text-secondary italic">Manual Direct Order</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-text-muted shrink-0">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Ordered By</p>
                                        <p className="text-sm font-bold text-text-primary">{order.creator?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-text-muted shrink-0">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Order Date</p>
                                        <p className="text-sm font-bold text-text-primary">{new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {order.notes && (
                        <Card className="border-border/50 shadow-sm overflow-hidden bg-muted/5">
                            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2 text-text-muted">
                                <MessageSquare className="h-4 w-4" />
                                <h3 className="text-[10px] font-bold uppercase tracking-widest">Order Notes</h3>
                            </div>
                            <CardContent className="p-6">
                                <p className="text-sm text-text-secondary italic leading-relaxed whitespace-pre-line">
                                    "{order.notes}"
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// @ts-ignore
PurchaseOrderShow.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Purchase Orders', href: '/procurement/purchase-orders' },
        { title: 'Order Details', href: '#' },
    ],
};
