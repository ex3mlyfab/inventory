import React, { useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Can } from '@/components/can';
import {
    Requisition, RequisitionItem, RequisitionStatus,
} from '@/types/inventory';
import { Auth } from '@/types/auth';
import {
    ArrowLeft, ArrowRightLeft, ShoppingCart, CheckCircle2,
    XCircle, Package, Building2, CalendarDays, User2,
    ClipboardList, Hash, AlertCircle, Clock,
    Printer, Upload, FileText, Download, Plus, TrendingUp,
    FileSpreadsheet, MapPin, BadgeCheck
} from 'lucide-react';
import { IssueItemsDialog } from './Partials/IssueItemsDialog';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ── Status config ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    draft:            'bg-muted text-text-muted border-border',
    submitted:        'bg-amber-50 text-amber-700 border-amber-200',
    level1_approved:  'bg-blue-50 text-blue-700 border-blue-200',
    approved:         'bg-success/10 text-success border-success/20',
    in_transit:       'bg-indigo-50 text-indigo-700 border-indigo-200',
    po_created:       'bg-blue-50 text-blue-700 border-blue-200',
    completed:        'bg-success/10 text-success border-success/20',
    failed:           'bg-destructive/10 text-destructive border-destructive/20',
    partially_issued: 'bg-blue-50 text-blue-700 border-blue-200',
    issued:           'bg-brand/10 text-brand border-brand/20',
    rejected:         'bg-destructive/10 text-destructive border-destructive/20',
    cancelled:        'bg-muted text-text-muted border-border',
};

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
    requisition: Requisition & { items: RequisitionItem[] };
    canApproveL1: boolean;
    canApproveL2: boolean;
    canReject: boolean;
    canUpload?: boolean;
}

export default function RequisitionShow({ requisition, canApproveL1, canApproveL2, canReject, canUpload }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isInternal     = requisition.type === 'internal';
    const isDepartmental = requisition.type === 'departmental';
    const isPurchase     = requisition.type === 'purchase';
    const typeLabel      = isInternal ? 'Internal Transfer' : isDepartmental ? 'Departmental Request' : 'Purchase Request';

    const [showApprovePanel, setShowApprovePanel] = useState(false);
    const [showRejectPanel, setShowRejectPanel]   = useState(false);
    const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
    const [actionProcessing, setActionProcessing] = useState(false);

    const currentLevel = canApproveL1 ? 1 : canApproveL2 ? 2 : 0;

    // ── Approve form ────────────────────────────────────────────────────
    const approveForm = useForm<{
        notes: string;
        items: { id: string; quantity_requested: string; quantity_approved: string; estimated_unit_cost: string }[];
    }>({
        notes: '',
        items: requisition.items.map((i) => ({
            id: i.id,
            quantity_requested: String(i.quantity_requested),
            quantity_approved: String(i.quantity_approved || i.quantity_requested),
            estimated_unit_cost: String(i.estimated_unit_cost || ''),
        })),
    });

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        const url = currentLevel === 1 
            ? `/procurement/requisitions/${requisition.id}/approve/level1`
            : `/procurement/requisitions/${requisition.id}/approve/level2`;

        approveForm.post(url, {
            onSuccess: () => setShowApprovePanel(false),
        });
    };

    // ── Reject form ─────────────────────────────────────────────────────
    const rejectForm = useForm({ notes: '' });
    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        rejectForm.post(`/procurement/requisitions/${requisition.id}/reject`, {
            onSuccess: () => setShowRejectPanel(false),
        });
    };

    // ── Cancel ──────────────────────────────────────────────────────────
    const handleCancel = () => {
        setActionProcessing(true);
        router.post(`/procurement/requisitions/${requisition.id}/cancel`, {}, {
            onFinish: () => {
                setActionProcessing(false);
                setIsCancelDialogOpen(false);
            },
        });
    };

    const totalRequested = requisition.items.reduce((s, i) => s + i.quantity_requested, 0);
    const totalApproved  = requisition.items.reduce((s, i) => s + (i.quantity_approved || 0), 0);



    const handleReceive = () => {
        setActionProcessing(true);
        router.post(`/procurement/requisitions/${requisition.id}/receive`, {}, {
            onFinish: () => {
                setActionProcessing(false);
                setIsReceiveDialogOpen(false);
            },
        });
    };

    return (
        <div className="flex flex-col gap-6 py-6 sm:py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <Head title={`${typeLabel}: ${requisition.reference}`} />

            {/* Breadcrumb back */}
            <div className="flex flex-col gap-4">
                <Link href="/procurement/requisitions" className="flex items-center text-xs font-black uppercase tracking-widest text-text-muted hover:text-brand transition-colors w-fit group">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Register
                </Link>

                <PageHeader
                    title={`${typeLabel}: ${requisition.reference}`}
                    description={
                        <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex items-center gap-2 text-text-primary">
                                <Building2 className="h-4.5 w-4.5 text-brand" />
                                <span className="text-base font-black uppercase tracking-tight">
                                    {isInternal 
                                        ? (requisition.requesting_location?.department?.name ?? '—') 
                                        : (requisition.requesting_department?.name ?? '—')
                                    }
                                </span>
                            </div>
                            <p className="text-xs text-text-muted font-medium">
                                {isInternal ? 'Internal Transfer' : isDepartmental ? 'Departmental Request' : 'Purchase Request'} — Requested on {new Date(requisition.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                            </p>
                        </div>
                    }
                    className="pb-2"
                >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-transparent shadow-sm", STATUS_STYLES[requisition.status])}>
                            {requisition.status.replace('_', ' ').replace('level1', 'Dept').replace('level2', 'MD')}
                        </Badge>
                        <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-widest gap-1.5 px-2 py-0.5 shadow-sm",
                            isInternal ? 'bg-brand/5 text-brand border-brand/10' : 
                            isDepartmental ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                            {isInternal ? <><ArrowRightLeft className="h-3 w-3" /> Internal</> :
                             isDepartmental ? <><Building2 className="h-3 w-3" /> Departmental</> :
                             <><ShoppingCart className="h-3 w-3" /> Purchase</>
                            }
                        </Badge>
                        
                        {requisition.status === 'approved' && (
                            <div className="flex flex-wrap gap-2">
                                <Link href={`/procurement/requisitions/${requisition.id}/print`} target="_blank">
                                    <Button variant="outline" size="sm" className="gap-2 h-8 font-bold text-[10px] uppercase tracking-wider border-border/50 hover:bg-muted/50 transition-all">
                                        <Printer className="h-3.5 w-3.5" />
                                        Print Form
                                    </Button>
                                </Link>
                                {(isInternal || isDepartmental) && !requisition.collector_name && (
                                    <Badge className="bg-amber-100 text-amber-700 animate-pulse border-0 font-black text-[9px] uppercase tracking-widest px-3">Ready for Collection</Badge>
                                )}
                            </div>
                        )}

                        {/* Receipt Action */}
                        {(() => {
                            const isRequester = requisition.requested_by === auth.user?.id;
                            const isDeptHead = auth.roles?.includes('Ward/Dept Head') && (
                                (requisition.requesting_department_id === auth.user?.department_id) ||
                                (requisition.requesting_location?.department_id === auth.user?.department_id)
                            );
                            const isSuperAdmin = auth.roles?.includes('Super Admin');
                            
                            const canReceive = (requisition.status === 'issued' || requisition.status === 'in_transit') && 
                                              (isRequester || isDeptHead || isSuperAdmin);

                            if (!canReceive) return null;

                            return (
                                <Button 
                                    className="bg-brand hover:bg-brand-dark shadow-lg shadow-brand/10 h-8 text-[10px] font-black uppercase tracking-widest px-4 w-full sm:w-auto" 
                                    size="sm"
                                    onClick={() => setIsReceiveDialogOpen(true)}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    Confirm Receipt
                                </Button>
                            );
                        })()}

                        {/* Issuance Action */}
                        <Can permission="requisitions.issue">
                            {(requisition.status === 'approved' || requisition.status === 'partially_issued' || requisition.status === 'in_transit') && !isPurchase && (
                                <Button 
                                    className="bg-brand hover:bg-brand-dark shadow-lg shadow-brand/10 h-8 text-[10px] font-black uppercase tracking-widest px-4 w-full sm:w-auto" 
                                    size="sm"
                                    onClick={() => setIsIssueDialogOpen(true)}
                                >
                                    <Package className="h-3.5 w-3.5 mr-1.5" />
                                    Issue Stock
                                </Button>
                            )}
                        </Can>
                    </div>
                </PageHeader>
            </div>

            {/* ── Summary KPIs ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Line Items', value: requisition.items.length, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Requested Qty', value: totalRequested, icon: ShoppingCart, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Approved Qty', value: totalApproved, icon: BadgeCheck, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Required Date', value: requisition.required_by
                        ? new Date(requisition.required_by).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
                        : '—', icon: CalendarDays, color: 'text-purple-600 bg-purple-50' },
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* ── Left — Items Table + Action Panels ────────────────── */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Approval panel */}
                    {showApprovePanel && (
                        <Card className="border-emerald-500/20 bg-emerald-500/[0.02] shadow-xl overflow-hidden ring-1 ring-emerald-500/10 animate-in zoom-in-95 duration-300">
                            <div className="px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/10 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">
                                        {currentLevel === 1 ? 'Level 1: Departmental Approval' : 'Level 2: Medical Director Final Review'}
                                    </h3>
                                </div>
                                <Badge className="bg-emerald-600 text-white border-0 text-[10px] font-black uppercase px-3">Stage {currentLevel}</Badge>
                            </div>
                            <form onSubmit={handleApprove}>
                                <CardContent className="p-6 space-y-6">
                                    <div className="p-4 bg-white/60 rounded-2xl border border-emerald-200/50 flex gap-3 items-start">
                                        <AlertCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                                            As the authorizing officer, please review and adjust the quantities for each item as necessary. 
                                            Final approval will commit stock movements or initiate procurement.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {approveForm.data.items.map((line, idx) => {
                                            const item = requisition.items[idx];
                                            return (
                                                <div key={line.id} className="p-4 bg-white rounded-2xl border border-border/50 hover:border-emerald-500/30 transition-all duration-300 group">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                                                                <Package className="h-4 w-4 text-text-muted" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-text-primary truncate">{item.product?.name}</p>
                                                                <p className="text-[10px] text-text-muted font-mono uppercase tracking-tight">{item.product?.sku}</p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:flex sm:items-center gap-4 w-full">
                                                            <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 flex-1">
                                                                <div className="space-y-1.5 min-w-[80px]">
                                                                    <Label className="text-[9px] font-black uppercase text-text-muted tracking-widest">Requested</Label>
                                                                    <div className="h-10 px-3 bg-muted/20 border border-transparent rounded-xl flex items-center text-sm font-bold text-text-secondary">
                                                                        {line.quantity_requested} <span className="ml-1 text-[10px] font-normal">{item.product?.unit_of_measure?.abbreviation}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5 min-w-[100px]">
                                                                    <Label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Approve</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={line.quantity_approved}
                                                                        onChange={(e) => {
                                                                            const updated = [...approveForm.data.items];
                                                                            updated[idx] = { ...updated[idx], quantity_approved: e.target.value };
                                                                            approveForm.setData('items', updated);
                                                                        }}
                                                                        className="h-10 bg-white border-emerald-500/20 focus:ring-emerald-500/5 focus:border-emerald-500/40 rounded-xl font-black text-emerald-700"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {isPurchase && (
                                                                <div className="space-y-1.5 w-full sm:min-w-[140px]">
                                                                    <Label className="text-[9px] font-black uppercase text-text-muted tracking-widest">Est. Unit Cost (₦)</Label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">₦</span>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={line.estimated_unit_cost}
                                                                            onChange={(e) => {
                                                                                const updated = [...approveForm.data.items];
                                                                                updated[idx] = { ...updated[idx], estimated_unit_cost: e.target.value };
                                                                                approveForm.setData('items', updated);
                                                                            }}
                                                                            className="h-10 pl-7 bg-white border-border rounded-xl font-bold"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Approval Notes / Feedback</Label>
                                        <textarea
                                            value={approveForm.data.notes}
                                            onChange={(e) => approveForm.setData('notes', e.target.value)}
                                            placeholder="Add comments for the next stage or requester..."
                                            className="flex min-h-[100px] w-full rounded-2xl border border-border/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all resize-none shadow-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <Button type="submit" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20" disabled={approveForm.processing}>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            {approveForm.processing ? 'Processing...' : `Submit Final Approval`}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => setShowApprovePanel(false)} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-text-muted hover:bg-muted/50 transition-all">Cancel</Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    )}

                    {/* Reject panel */}
                    {showRejectPanel && (
                        <Card className="border-rose-500/20 bg-rose-500/[0.02] shadow-xl overflow-hidden ring-1 ring-rose-500/10 animate-in zoom-in-95 duration-300">
                            <div className="px-6 py-4 bg-rose-500/10 border-b border-rose-500/10 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-rose-600" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-rose-700">Reject Requisition</h3>
                            </div>
                            <form onSubmit={handleReject}>
                                <CardContent className="p-6 space-y-6">
                                    <div className="p-4 bg-white/60 rounded-2xl border border-rose-200/50 flex gap-3 items-start">
                                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium text-rose-800 leading-relaxed">
                                            Please provide a clear reason for rejecting this request. This feedback will be visible to the requester.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            Reason for Rejection <span className="text-rose-600">*</span>
                                        </Label>
                                        <textarea
                                            value={rejectForm.data.notes}
                                            onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                            placeholder="Explain why this requisition is being rejected..."
                                            className="flex min-h-[120px] w-full rounded-2xl border border-border/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/30 transition-all resize-none shadow-sm"
                                        />
                                        <InputError message={rejectForm.errors.notes} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <Button type="submit" variant="destructive" className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20" disabled={rejectForm.processing}>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            {rejectForm.processing ? 'Rejecting...' : 'Confirm Rejection'}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => setShowRejectPanel(false)} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-text-muted hover:bg-muted/50 transition-all">Cancel</Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    )}

                    {/* Line items table */}
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-white rounded-2xl">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-brand/5 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-brand" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Requested Items</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white border-border/50 px-3 py-1">
                                {requisition.items.length} Total
                            </Badge>
                        </div>

                        {/* Desktop Header */}
                        <div className="hidden lg:grid grid-cols-12 px-6 py-4 bg-muted/10 border-b border-border/30 text-[10px] font-black uppercase tracking-widest text-text-muted">
                            <div className="col-span-4">Item Details</div>
                            <div className="col-span-2 text-center">Requested</div>
                            {(isInternal || isDepartmental) && <div className="col-span-2 text-center text-brand">Stock Level</div>}
                            <div className="col-span-2 text-center">Approved</div>
                            <div className="col-span-2 text-right">Status</div>
                        </div>

                        <div className="flex flex-col divide-y divide-border/30">
                            {requisition.items.map((item) => (
                                <div key={item.id} className="group transition-all duration-200">
                                    {/* Desktop Row */}
                                    <div className="hidden lg:grid grid-cols-12 items-center px-6 py-5 hover:bg-brand/[0.01]">
                                        <div className="col-span-4 flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-2xl bg-muted/40 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                                                <Package className="h-5 w-5 text-text-muted" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-text-primary truncate tracking-tight">{item.product?.name ?? '—'}</p>
                                                <p className="text-[10px] font-bold text-text-muted mt-1 uppercase font-mono">{item.product?.sku}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <p className="text-sm font-black text-text-primary">{item.quantity_requested}</p>
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{item.product?.unit_of_measure?.abbreviation}</p>
                                        </div>
                                        {(isInternal || isDepartmental) && (
                                            <div className="col-span-2 text-center">
                                                <Badge variant="outline" className={cn(
                                                    "font-black text-[10px] uppercase px-3 py-0.5 shadow-sm border-transparent",
                                                    item.quantity_on_hand > item.quantity_requested ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                )}>
                                                    {item.quantity_on_hand}
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="col-span-2 text-center">
                                            <p className={cn(
                                                "text-sm font-black",
                                                item.quantity_approved > 0 ? 'text-blue-600' : 'text-text-muted/30 italic'
                                            )}>
                                                {item.quantity_approved || '—'}
                                            </p>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-black uppercase border-transparent px-2",
                                                requisition.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {requisition.status === 'approved' ? 'Confirmed' : requisition.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="lg:hidden p-5 flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                                                    <Package className="h-5 w-5 text-text-muted" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary leading-tight">{item.product?.name ?? '—'}</p>
                                                    <p className="text-[10px] text-text-muted font-mono mt-0.5">{item.product?.sku}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-black uppercase border-transparent px-2 shadow-sm shrink-0",
                                                requisition.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {requisition.status === 'approved' ? 'Confirmed' : requisition.status}
                                            </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/20 rounded-2xl border border-border/30">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Req.</p>
                                                <p className="text-sm font-black text-text-primary">{item.quantity_requested}</p>
                                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">{item.product?.unit_of_measure?.abbreviation}</p>
                                            </div>
                                            
                                            {(isInternal || isDepartmental) ? (
                                                <div className="text-center border-x border-border/30 px-2">
                                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">On Hand</p>
                                                    <Badge variant="outline" className={cn(
                                                        "font-black text-[10px] uppercase px-2 py-0 shadow-sm border-transparent",
                                                        item.quantity_on_hand > item.quantity_requested ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    )}>
                                                        {item.quantity_on_hand}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <div className="text-center border-x border-border/30 px-2">
                                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Cost</p>
                                                    <p className="text-xs font-bold text-text-primary">₦{item.estimated_unit_cost || '0'}</p>
                                                </div>
                                            )}
                                            
                                            <div className="text-center">
                                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Approved</p>
                                                <p className={cn(
                                                    "text-sm font-black",
                                                    item.quantity_approved > 0 ? 'text-blue-600' : 'text-text-muted/30 italic'
                                                )}>
                                                    {item.quantity_approved || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals footer */}
                        <div className="hidden lg:grid grid-cols-12 px-6 py-4 bg-muted/20 border-t border-border/40">
                            <div className="col-span-4 text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5" /> Cumulative Summary
                            </div>
                            <div className="col-span-2 text-center">
                                <p className="text-xs font-black text-text-primary">{totalRequested}</p>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Total Units</p>
                            </div>
                            {(isInternal || isDepartmental) && <div className="col-span-2" />}
                            <div className="col-span-2 text-center">
                                <p className="text-xs font-black text-emerald-600">{totalApproved}</p>
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Approved Total</p>
                            </div>
                            <div className="col-span-2 text-right">
                                <p className="text-[10px] font-black uppercase text-brand tracking-widest">Post-Review</p>
                            </div>
                        </div>
                    </Card>

                    {/* Collector Details / Proof of Movement */}
                    {(requisition.collector_name || requisition.collector_signature_path) && (
                        <Card className="border-indigo-500/20 bg-indigo-500/[0.02] overflow-hidden shadow-sm rounded-2xl ring-1 ring-indigo-500/10">
                            <div className="px-6 py-5 border-b border-indigo-500/10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                                        <BadgeCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Verified Movement Proof</p>
                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Stock collected by <span className="text-indigo-900 underline underline-offset-2">{requisition.collector_name}</span></p>
                                    </div>
                                </div>
                                {requisition.release_form_path && (
                                    <a 
                                        href={`/storage/${requisition.release_form_path}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="shrink-0"
                                    >
                                        <Button size="sm" variant="outline" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2 h-8 px-3 rounded-lg font-bold text-[9px] uppercase tracking-wider">
                                            <Download className="h-3.5 w-3.5" /> Release Form
                                        </Button>
                                    </a>
                                )}
                            </div>
                            {requisition.collector_signature_path && (
                                <CardContent className="p-6 bg-white/40 flex flex-col items-center gap-4">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Digital Signature</p>
                                    <div className="bg-white border-2 border-dashed border-indigo-200/50 rounded-2xl p-4 shadow-inner max-w-sm w-full transition-transform hover:scale-[1.02]">
                                        <img 
                                            src={`/storage/${requisition.collector_signature_path}`} 
                                            alt="Collector Signature" 
                                            className="max-h-24 w-full object-contain mix-blend-multiply opacity-80"
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Timeline / Approval History */}
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-white rounded-2xl">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center gap-3">
                             <div className="h-8 w-8 rounded-xl bg-brand/5 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-brand" />
                             </div>
                             <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Approval Journey</h3>
                        </div>
                        <CardContent className="p-0">
                            <div className="flex flex-col relative">
                                {/* Vertical progress line */}
                                <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-muted-foreground/10" />

                                {/* Stage 0: Submission */}
                                <div className="flex gap-6 p-6 relative">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white ring-8 ring-emerald-500/10 shrink-0 z-10 shadow-lg">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Origin: Submission</p>
                                            <p className="text-[10px] font-bold text-text-muted font-mono">{new Date(requisition.created_at).toLocaleDateString('en-NG')} • {new Date(requisition.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-sm font-bold text-text-primary mt-1.5">{requisition.requester?.name}</p>
                                        <div className="mt-2 p-3 bg-muted/30 rounded-2xl border border-border/50">
                                            <p className="text-xs text-text-secondary leading-relaxed italic">"{requisition.purpose || 'Stock replenishment request'}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stage 1: L1 Approval */}
                                <div className="flex gap-6 p-6 relative">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 z-10 shadow-md transition-all duration-500",
                                        requisition.level1_approved_at ? 'bg-emerald-500 ring-8 ring-emerald-500/10' : 'bg-muted text-text-muted/30'
                                    )}>
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                requisition.level1_approved_at ? 'text-blue-600' : 'text-amber-600'
                                            )}>
                                                Stage 1: { (isInternal || isDepartmental) ? 'Unit Head Review' : 'Procurement Review' }
                                            </p>
                                            {requisition.level1_approved_at && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-transparent text-[9px] font-black uppercase px-2 py-0">Approved</Badge>
                                            )}
                                        </div>
                                        {requisition.level1_approved_at ? (
                                            <div className="animate-in fade-in slide-in-from-left-2">
                                                <p className="text-sm font-bold text-text-primary mt-1.5">{requisition.level1_approver?.name}</p>
                                                <p className="text-[10px] text-text-muted mt-0.5 font-mono">{new Date(requisition.level1_approved_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                {requisition.level1_notes && (
                                                    <div className="mt-2 p-3 bg-blue-50/50 rounded-2xl text-xs text-blue-800 italic border border-blue-100/50">
                                                        "{requisition.level1_notes}"
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs italic text-text-muted mt-2 font-medium">
                                                {requisition.status === 'rejected' ? 'Approval flow terminated' : 'Pending verification...'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Stage 2: L2 Approval */}
                                <div className="flex gap-6 p-6 relative">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 z-10 shadow-md transition-all duration-500",
                                        requisition.level2_approved_at ? 'bg-emerald-500 ring-8 ring-emerald-500/10' : 'bg-muted text-text-muted/30'
                                    )}>
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                requisition.level2_approved_at ? 'text-brand' : 'text-text-muted/50'
                                            )}>
                                                Stage 2: Final Executive Approval
                                            </p>
                                            {requisition.level2_approved_at && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-transparent text-[9px] font-black uppercase px-2 py-0">Fully Authorized</Badge>
                                            )}
                                        </div>
                                        {requisition.level2_approved_at ? (
                                            <div className="animate-in fade-in slide-in-from-left-2">
                                                <p className="text-sm font-bold text-text-primary mt-1.5">{requisition.level2_approver?.name}</p>
                                                <p className="text-[10px] text-text-muted mt-0.5 font-mono">{new Date(requisition.level2_approved_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                {requisition.level2_notes && (
                                                    <div className="mt-2 p-3 bg-brand/[0.03] rounded-2xl text-xs text-brand italic border border-brand/10">
                                                        "{requisition.level2_notes}"
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs italic text-text-muted mt-2 font-medium">
                                                {requisition.status === 'rejected' ? 'Rejected at Stage 1' : 'Awaiting Stage 1 confirmation...'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right Sidebar ─────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* Smart Action Buttons */}
                    {(canApproveL1 || canApproveL2) && !showApprovePanel && !showRejectPanel && (
                        <Card className="border-brand/30 shadow-xl shadow-brand/10 bg-brand/[0.02] border-dashed rounded-2xl animate-in slide-in-from-right-4 duration-500">
                            <CardContent className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand">Action Required</p>
                                    </div>
                                    <p className="text-xs text-text-secondary font-semibold leading-relaxed">
                                        {canApproveL1 ? 'You are required to provide Unit-level clearance for this requisition.' : 'This request is pending Final Executive Authorization (MD Office).'}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        className="w-full bg-brand text-brand-foreground hover:bg-brand-dark gap-3 h-12 rounded-xl shadow-lg shadow-brand/20 transition-all font-black uppercase tracking-widest text-[10px]"
                                        onClick={() => { setShowRejectPanel(false); setShowApprovePanel(true); }}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Start Approval
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 gap-3 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                                        onClick={() => { setShowApprovePanel(false); setShowRejectPanel(true); }}
                                    >
                                        <XCircle className="h-4 w-4" /> Reject Request
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cancellation for requester */}
                    {requisition.status === 'submitted' && requisition.requested_by === auth.user?.id && (
                         <div className="px-2">
                             <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-text-muted hover:text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest gap-2 h-10 rounded-xl transition-all"
                                 onClick={() => setIsCancelDialogOpen(true)}
                            >
                                <XCircle className="h-4 w-4" /> Cancel Requisition
                            </Button>
                         </div>
                    )}



                    {/* Rejected status card */}
                    {requisition.status === 'rejected' && (
                        <Card className="border-rose-500/20 bg-rose-500/[0.02] rounded-2xl shadow-sm overflow-hidden ring-1 ring-rose-500/10">
                            <CardContent className="p-6 text-center space-y-4">
                                <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                                    <XCircle className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-rose-600">Requisition Rejected</p>
                                    <div className="mt-4 p-4 bg-white rounded-2xl text-xs text-text-secondary italic border border-rose-100 leading-relaxed font-medium">
                                        "{requisition.notes || 'No specific reason provided'}"
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Route details */}
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-white rounded-2xl">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-brand/5 flex items-center justify-center">
                                {isInternal ? <ArrowRightLeft className="h-4 w-4 text-brand" /> : <ShoppingCart className="h-4 w-4 text-amber-600" />}
                            </div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-text-primary">
                                {isInternal ? 'Logistics Route' : 'Fulfillment Source'}
                            </CardTitle>
                        </div>
                        <CardContent className="px-0 pb-2 divide-y divide-border/30">
                            {isInternal || isDepartmental ? (
                                <>
                                    <div className="px-6 py-5 hover:bg-muted/5 transition-all">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Target Destination
                                        </p>
                                        <p className="text-xs font-black text-text-primary px-3 leading-snug">
                                            {isInternal 
                                                ? (requisition.requesting_location?.department?.name ?? '—') 
                                                : (requisition.requesting_department?.name ?? '—')
                                            }
                                        </p>
                                        <p className="text-[10px] text-text-muted px-3 font-bold mt-1 uppercase flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3" />
                                            {isInternal ? `Store: ${requisition.requesting_location?.name}` : 'Direct Unit Allocation'}
                                        </p>
                                    </div>
                                    <div className="px-6 py-5 hover:bg-muted/5 transition-all">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-brand" /> Issuing Store
                                        </p>
                                        <p className="text-xs font-black text-text-primary px-3 leading-snug">
                                            {requisition.issuing_location?.name ?? '—'}
                                        </p>
                                        <p className="text-[10px] font-bold text-text-muted px-3 font-mono mt-1.5 uppercase tracking-widest">{requisition.issuing_location?.code}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="px-6 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-3">Proposed Supplier</p>
                                    <div className="flex flex-col gap-2 px-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mb-1">
                                            <Building2 className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <p className="text-sm font-black text-text-primary leading-tight">
                                            {requisition.supplier?.name ?? <span className="italic font-bold text-text-muted/50">Market Procurement</span>}
                                        </p>
                                        {requisition.supplier?.email && (
                                            <p className="text-[10px] font-bold text-text-muted font-mono truncate">{requisition.supplier.email}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reference info */}
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-white rounded-2xl">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-muted/40 flex items-center justify-center">
                                <Hash className="h-4 w-4 text-text-muted" />
                            </div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-text-primary">System Ref</CardTitle>
                        </div>
                        <CardContent className="p-5 space-y-5">
                            <div className="bg-muted/30 px-4 py-3 rounded-2xl border border-border/40">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Reference ID</p>
                                <p className="text-sm font-black font-mono text-text-primary tracking-tight">{requisition.reference}</p>
                            </div>
                            
                            {requisition.required_by && (
                                <div className="flex items-center gap-4 px-1">
                                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm shrink-0">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Need-By Date</p>
                                        <p className="text-xs font-black text-text-primary mt-0.5 truncate">
                                            {new Date(requisition.required_by).toLocaleDateString('en-NG', { dateStyle: 'long' })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <IssueItemsDialog 
                isOpen={isIssueDialogOpen}
                onClose={() => setIsIssueDialogOpen(false)}
                requisition={requisition}
            />

            {/* Cancel Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={isCancelDialogOpen}
                onClose={() => setIsCancelDialogOpen(false)}
                onConfirm={handleCancel}
                title="Cancel Requisition?"
                description={
                    <div className="space-y-3">
                        <p className="text-sm text-text-secondary">Are you sure you want to cancel requisition <span className="font-bold text-text-primary">{requisition.reference}</span>?</p>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2 items-start">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <p>This action cannot be undone. The requisition will be permanently marked as cancelled.</p>
                        </div>
                    </div>
                }
                confirmText={actionProcessing ? 'Cancelling...' : 'Yes, Cancel Requisition'}
                variant="destructive"
                isLoading={actionProcessing}
            />

            {/* Receive Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={isReceiveDialogOpen}
                onClose={() => setIsReceiveDialogOpen(false)}
                onConfirm={handleReceive}
                title="Confirm Receipt of Items?"
                description={
                    <div className="space-y-3">
                        <p className="text-sm text-text-secondary">Confirm that you have received all items for requisition <span className="font-bold text-text-primary">{requisition.reference}</span>.</p>
                        <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl text-xs text-brand flex gap-2 items-start">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <p>This will update your store/department inventory and mark the requisition as completed.</p>
                        </div>
                    </div>
                }
                confirmText={actionProcessing ? 'Processing...' : 'Confirm Receipt'}
                isLoading={actionProcessing}
            />
        </div>
    );
}

// @ts-ignore
RequisitionShow.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Requisitions', href: '/procurement/requisitions' },
        { title: 'Requisition Detail', href: '#' },
    ],
};

