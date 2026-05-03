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
    Printer, Upload, FileText, Download, Plus,
} from 'lucide-react';
import { IssueItemsDialog } from './Partials/IssueItemsDialog';
import { Separator } from '@/components/ui/separator';

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
    const [showApprovePanel, setShowApprovePanel] = useState(false);
    const [showRejectPanel, setShowRejectPanel]   = useState(false);
    const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);

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
        if (window.confirm('Are you sure you want to cancel this requisition?')) {
            router.post(`/procurement/requisitions/${requisition.id}/cancel`);
        }
    };

    const totalRequested = requisition.items.reduce((s, i) => s + i.quantity_requested, 0);
    const totalApproved  = requisition.items.reduce((s, i) => s + (i.quantity_approved || 0), 0);

    // ── Upload form ─────────────────────────────────────────────────────
    const uploadForm = useForm<{ release_form: File | null }>({
        release_form: null,
    });

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        uploadForm.post(`/procurement/requisitions/${requisition.id}/upload-release-form`, {
            forceFormData: true,
            onSuccess: () => uploadForm.reset(),
        });
    };

    const handleReceive = () => {
        if (window.confirm('Are you sure you have received these items? This will update your store/department inventory.')) {
            router.post(`/procurement/requisitions/${requisition.id}/receive`);
        }
    };

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title={`Requisition: ${requisition.reference}`} />

            {/* Breadcrumb back */}
            <div className="flex flex-col gap-4">
                <Link href="/procurement/requisitions" className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requisitions
                </Link>

                <PageHeader
                    title={requisition.reference}
                    description={`${isInternal ? 'Internal Transfer' : 'Purchase Request'} — ${new Date(requisition.created_at).toLocaleDateString('en-NG', { dateStyle: 'full' })}`}
                >
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-xs font-bold capitalize ${STATUS_STYLES[requisition.status]}`}>
                            {requisition.status.replace('_', ' ').replace('level1', 'Dept').replace('level2', 'MD')}
                        </Badge>
                        <Badge variant="outline" className={`text-xs font-bold gap-1.5 ${
                            isInternal ? 'bg-brand/10 text-brand border-brand/20' : 
                            isDepartmental ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            {isInternal ? <><ArrowRightLeft className="h-3 w-3" /> Internal</> :
                             isDepartmental ? <><Building2 className="h-3 w-3" /> Departmental</> :
                             <><ShoppingCart className="h-3 w-3" /> Purchase</>
                            }
                        </Badge>
                        {requisition.status === 'approved' && (
                            <div className="flex gap-2">
                                <Link href={`/procurement/requisitions/${requisition.id}/print`} target="_blank">
                                    <Button variant="outline" size="sm" className="gap-2 h-8 font-bold border-slate-200">
                                        <Printer className="h-3.5 w-3.5" />
                                        Print Release Form
                                    </Button>
                                </Link>
                                {(isInternal || isDepartmental) && requisition.status === 'approved' && !requisition.release_form_path && (
                                    <Badge className="bg-amber-100 text-amber-700 animate-pulse border-0 font-bold px-3">Awaiting Signed Form</Badge>
                                )}
                            </div>
                        )}

                        {/* Receipt Action for the requester */}
                        {requisition.status === 'issued' && requisition.requested_by === auth.user?.id && (
                            <Button 
                                className="bg-success hover:bg-success/90 shadow-md shadow-success/20 h-8 text-[11px] font-black uppercase tracking-wider" 
                                size="sm"
                                onClick={handleReceive}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Confirm Receipt
                            </Button>
                        )}

                        {/* Issuance Action for Store Officers at the issuing location */}
                        <Can permission="requisitions.issue">
                            {(requisition.status === 'approved' || requisition.status === 'partially_issued' || requisition.status === 'in_transit') && (
                                <Button 
                                    className="bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 h-8 text-[11px] font-black uppercase tracking-wider" 
                                    size="sm"
                                    onClick={() => setIsIssueDialogOpen(true)}
                                >
                                    <Package className="h-3.5 w-3.5 mr-1.5" />
                                    Issue Stock Items
                                </Button>
                            )}
                        </Can>
                    </div>
                </PageHeader>
            </div>

            {/* ── Summary KPIs ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Line Items',        value: requisition.items.length },
                    { label: 'Total Qty Requested', value: totalRequested },
                    { label: 'Total Approved',  value: totalApproved },
                    { label: 'Required By',         value: requisition.required_by
                        ? new Date(requisition.required_by).toLocaleDateString('en-NG')
                        : '—' },
                ].map(({ label, value }) => (
                    <Card key={label} className="border-border/50 shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
                            <p className="text-xl font-extrabold text-text-primary mt-1">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Left — Items Table + Action Panels ────────────────── */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Approval panel */}
                    {showApprovePanel && (
                        <Card className="border-success/30 bg-success/5 shadow-sm overflow-hidden ring-1 ring-success/20">
                            <div className="px-6 py-4 bg-success/10 border-b border-success/20 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-success">
                                        {currentLevel === 1 ? 'Level 1: Dept Approval' : 'Level 2: MD Final Approval'}
                                    </h3>
                                </div>
                                <Badge className="bg-success/20 text-success border-0">Stage {currentLevel}</Badge>
                            </div>
                            <form onSubmit={handleApprove}>
                                <CardContent className="p-6 space-y-4">
                                    <p className="text-xs text-text-muted font-medium">
                                        As the approving officer, you may modify the quantities approved for each item.
                                    </p>
                                    <div className="space-y-1">
                                        {approveForm.data.items.map((line, idx) => {
                                            const item = requisition.items[idx];
                                            return (
                                                <div key={line.id} className="flex flex-col gap-3 py-4 border-b border-border/30 last:border-0 hover:bg-success/5 px-3 rounded-xl transition-all duration-200">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-text-primary">{item.product?.name}</p>
                                                            <p className="text-[10px] text-text-muted font-mono uppercase tracking-tight">{item.product?.sku}</p>
                                                        </div>
                                                        <Badge variant="outline" className="bg-white text-[10px] font-bold h-5">
                                                            {item.product?.unit_of_measure?.abbreviation}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold uppercase text-text-muted mb-1 block">Requested Qty</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={line.quantity_requested}
                                                                onChange={(e) => {
                                                                    const updated = [...approveForm.data.items];
                                                                    updated[idx] = { ...updated[idx], quantity_requested: e.target.value };
                                                                    approveForm.setData('items', updated);
                                                                }}
                                                                className="h-9 bg-white border-border/50 focus-visible:ring-brand/20 font-bold"
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold uppercase text-brand mb-1 block">Approved Qty</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={line.quantity_approved}
                                                                onChange={(e) => {
                                                                    const updated = [...approveForm.data.items];
                                                                    updated[idx] = { ...updated[idx], quantity_approved: e.target.value };
                                                                    approveForm.setData('items', updated);
                                                                }}
                                                                className="h-9 bg-white border-success/30 focus-visible:ring-success/20 font-black text-success"
                                                            />
                                                        </div>

                                                        {isPurchase && (
                                                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                                                <Label className="text-[10px] font-bold uppercase text-text-muted mb-1 block">Est. Unit Cost (₦)</Label>
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
                                                                    className="h-9 bg-white border-border/50 focus-visible:ring-brand/20 font-bold"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">Approval Notes / Feedback</Label>
                                        <textarea
                                            value={approveForm.data.notes}
                                            onChange={(e) => approveForm.setData('notes', e.target.value)}
                                            placeholder="Add comments for the next stage or requester..."
                                            className="flex min-h-[80px] w-full rounded-md border border-success/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-success/20 transition-shadow"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button type="submit" className="flex-1 bg-success text-white hover:bg-success/90 h-11" disabled={approveForm.processing}>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            {approveForm.processing ? 'Processing...' : `Submit Stage ${currentLevel} Approval`}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => setShowApprovePanel(false)} className="h-11 px-6">Cancel</Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    )}

                    {/* Reject panel */}
                    {showRejectPanel && (
                        <Card className="border-destructive/30 bg-destructive/5 shadow-sm overflow-hidden ring-1 ring-destructive/20">
                            <div className="px-6 py-4 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-destructive" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-destructive">Reject Requisition</h3>
                            </div>
                            <form onSubmit={handleReject}>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                            Reason for Rejection <span className="text-destructive">*</span>
                                        </Label>
                                        <textarea
                                            value={rejectForm.data.notes}
                                            onChange={(e) => rejectForm.setData('notes', e.target.value)}
                                            placeholder="Explain why this requisition is being rejected. This will be sent back to the requester."
                                            className="flex min-h-[100px] w-full rounded-md border border-destructive/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/20 transition-shadow"
                                        />
                                        <InputError message={rejectForm.errors.notes} />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button type="submit" variant="destructive" className="flex-1 h-11" disabled={rejectForm.processing}>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            {rejectForm.processing ? 'Rejecting...' : 'Confirm Rejection'}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => setShowRejectPanel(false)} className="h-11 px-6">Cancel</Button>
                                    </div>
                                </CardContent>
                            </form>
                        </Card>
                    )}

                    {/* Line items table */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Package className="h-4 w-4 text-brand" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Requested Items</CardTitle>
                        </div>
                        <div className="grid grid-cols-12 px-6 py-3 bg-muted/20 border-b border-border/30 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                            <div className="col-span-4">Product</div>
                            <div className="col-span-2 text-center">Requested</div>
                            {(isInternal || isDepartmental) && <div className="col-span-2 text-center text-brand">On Hand</div>}
                            <div className="col-span-2 text-center">Stage 1 Appr.</div>
                            <div className="col-span-2 text-center">Final Appr.</div>
                        </div>
                        {requisition.items.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 items-center px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/5 transition-colors">
                                <div className="col-span-4">
                                    <p className="text-sm font-bold text-text-primary">{item.product?.name ?? '—'}</p>
                                    <p className="text-[10px] text-text-muted font-mono">{item.product?.sku}</p>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="text-sm font-extrabold text-text-primary">{item.quantity_requested}</span>
                                    <p className="text-[10px] text-text-muted">{item.product?.unit_of_measure?.abbreviation}</p>
                                </div>
                                {(isInternal || isDepartmental) && (
                                    <div className="col-span-2 text-center">
                                        <Badge variant="outline" className="bg-brand/5 text-brand border-brand/20 font-bold">
                                            {item.quantity_on_hand}
                                        </Badge>
                                    </div>
                                )}
                                <div className="col-span-2 text-center">
                                    <span className={`text-sm font-bold ${
                                        item.quantity_approved > 0 ? 'text-blue-600' : 'text-text-muted italic opacity-50'
                                    }`}>
                                        {item.quantity_approved || '—'}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={`text-sm font-extrabold ${
                                        requisition.status === 'approved' ? 'text-success' : 'text-text-muted italic opacity-50'
                                    }`}>
                                        {requisition.status === 'approved' ? item.quantity_approved : '—'}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Totals footer */}
                        <div className="grid grid-cols-12 px-6 py-3 bg-muted/20 border-t border-border/40 text-xs font-bold text-text-primary">
                            <div className="col-span-5 text-[10px] uppercase tracking-wider text-text-muted">Cumulative Totals</div>
                            <div className="col-span-2 text-center">{totalRequested}</div>
                            <div className="col-span-2 text-center">{totalApproved}</div>
                            <div className="col-span-2 text-center">
                                {requisition.status === 'approved' ? totalApproved : '—'}
                            </div>
                            <div className="col-span-1" />
                        </div>
                    </Card>

                    {/* Transit Confirmation / Proof of Movement */}
                    {requisition.release_form_path && (
                        <Card className="border-indigo-200 bg-indigo-50/30 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-indigo-900">Signed Release Form</p>
                                        <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">Proof of Transit Authorization</p>
                                    </div>
                                </div>
                                <a 
                                    href={`/storage/${requisition.release_form_path}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="outline" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2">
                                        <Download className="h-3.5 w-3.5" /> View Upload
                                    </Button>
                                </a>
                            </div>
                        </Card>
                    )}

                    {/* Timeline / Approval History */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                             <Clock className="h-4 w-4 text-brand" />
                             <CardTitle className="text-sm font-bold uppercase tracking-wider">Approval Journey</CardTitle>
                        </div>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {/* Stage 0: Submission */}
                                <div className="flex gap-4 p-6 border-b border-border/30">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center text-white ring-4 ring-success/10 shrink-0">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                        <div className="w-[2px] grow bg-border/50" />
                                    </div>
                                    <div className="pb-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Submission — {new Date(requisition.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
                                        <p className="text-sm font-bold text-text-primary mt-1">{requisition.requester?.name}</p>
                                        <p className="text-xs text-text-secondary mt-1">{requisition.purpose || 'No purpose specified'}</p>
                                    </div>
                                </div>

                                {/* Stage 1: L1 Approval */}
                                <div className="flex gap-4 p-6 border-b border-border/30">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                                            requisition.level1_approved_at ? 'bg-success ring-4 ring-success/10' : 'bg-muted text-text-muted/50'
                                        }`}>
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <div className="w-[2px] grow bg-border/50" />
                                    </div>
                                    <div className="pb-2 grow">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${requisition.level1_approved_at ? 'text-text-muted' : 'text-amber-600'}`}>
                                                Stage 1: { (isInternal || isDepartmental) ? 'Departmental Head' : 'Procurement Review' }
                                            </p>
                                            {requisition.level1_approved_at && (
                                                <Badge variant="outline" className="bg-success/10 text-success text-[10px] border-0">Approved</Badge>
                                            )}
                                        </div>
                                        {requisition.level1_approved_at ? (
                                            <>
                                                <p className="text-sm font-bold text-text-primary mt-1">{requisition.level1_approver?.name}</p>
                                                <p className="text-[10px] text-text-muted mt-0.5">{new Date(requisition.level1_approved_at).toLocaleString('en-NG')}</p>
                                                {requisition.level1_notes && (
                                                    <div className="mt-2 p-3 bg-blue-50/50 rounded-xl text-xs text-blue-700 italic border border-blue-100">
                                                        "{requisition.level1_notes}"
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm italic text-text-muted mt-1">
                                                {requisition.status === 'rejected' ? 'Approval cut short — Rejected' : 'Awaiting action...'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Stage 2: L2 Approval */}
                                <div className="flex gap-4 p-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                                            requisition.level2_approved_at ? 'bg-success ring-4 ring-success/10' : 'bg-muted text-text-muted/50'
                                        }`}>
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="pb-2 grow">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${requisition.level2_approved_at ? 'text-text-muted' : 'text-text-muted opacity-50'}`}>
                                                Stage 2: Medical Director
                                            </p>
                                            {requisition.level2_approved_at && (
                                                <Badge variant="outline" className="bg-success/10 text-success text-[10px] border-0">Fully Approved</Badge>
                                            )}
                                        </div>
                                        {requisition.level2_approved_at ? (
                                            <>
                                                <p className="text-sm font-bold text-text-primary mt-1">{requisition.level2_approver?.name}</p>
                                                <p className="text-[10px] text-text-muted mt-0.5">{new Date(requisition.level2_approved_at).toLocaleString('en-NG')}</p>
                                                {requisition.level2_notes && (
                                                    <div className="mt-2 p-3 bg-brand/5 rounded-xl text-xs text-brand italic border border-brand/10">
                                                        "{requisition.level2_notes}"
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm italic text-text-muted mt-1">
                                                {requisition.status === 'rejected' ? 'Rejected' : 'Pending Stage 1...'}
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
                        <Card className="border-brand/30 shadow-lg shadow-brand/10 bg-brand/5 animate-in slide-in-from-right-4 duration-300">
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-brand">Action Required</p>
                                    <p className="text-xs text-brand/70 font-medium leading-relaxed">
                                        {canApproveL1 ? 'Designated Stage 1 Approver' : 'Stage 2: Final approval required by MD Office'}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <Button
                                        className="w-full bg-brand text-brand-foreground hover:bg-brand-dark gap-2 h-11 shadow-md shadow-brand/20 transition-all active:scale-95"
                                        onClick={() => { setShowRejectPanel(false); setShowApprovePanel(true); }}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Start Approval
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 gap-2 h-11"
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
                                className="w-full text-text-muted hover:text-destructive hover:bg-destructive/5 text-[11px] gap-2"
                                onClick={handleCancel}
                            >
                                <XCircle className="h-3.5 w-3.5" /> Cancel My Requisition
                            </Button>
                         </div>
                    )}

                    {/* Upload Proof section */}
                    {canUpload && !requisition.release_form_path && (
                        <Card className="border-amber-200 shadow-md bg-amber-50 animate-in slide-in-from-bottom-4 duration-500">
                            <CardHeader className="pb-2 px-5 pt-5">
                                <CardTitle className="text-xs font-black uppercase text-amber-800 flex items-center gap-2">
                                    <Upload className="h-3.5 w-3.5" /> Confirm Goods Movement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-2 space-y-4">
                                <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                    Print the release form, gather the collector's signature, and upload a scan/photo here to mark as <span className="font-bold underline">IN TRANSIT</span>.
                                </p>
                                <form onSubmit={handleUpload} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-amber-900/60 uppercase">Signed Document (PDF/Image)</Label>
                                        <Input 
                                            type="file" 
                                            onChange={e => uploadForm.setData('release_form', e.target.files?.[0] || null)}
                                            className="h-9 bg-white border-amber-200 text-xs text-amber-800 file:text-xs file:bg-amber-100 file:border-0 file:rounded-md file:text-amber-800 file:mr-2 file:px-2"
                                            accept="image/*,.pdf"
                                        />
                                        <InputError message={uploadForm.errors.release_form} />
                                    </div>
                                    <Button 
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white h-10 gap-2 shadow-sm"
                                        disabled={uploadForm.processing || !uploadForm.data.release_form}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Finalize & Mark in Transit
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rejected status card */}
                    {requisition.status === 'rejected' && (
                        <Card className="border-destructive/30 bg-destructive/5">
                            <CardContent className="p-6 text-center space-y-3">
                                <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto ring-4 ring-destructive/10">
                                    <XCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">Requisition Rejected</p>
                                    <div className="mt-3 p-3 bg-white/50 rounded-xl text-xs text-text-secondary italic border border-destructive/10">
                                        "{requisition.notes || 'No reason provided'}"
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Route details */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            {isInternal
                                ? <ArrowRightLeft className="h-4 w-4 text-brand" />
                                : <ShoppingCart className="h-4 w-4 text-amber-600" />
                            }
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">
                                {isInternal ? 'Transfer Route' : isDepartmental ? 'Department Request' : 'Supply Source'}
                            </CardTitle>
                        </div>
                        <CardContent className="px-0 pb-2 divide-y divide-border/30">
                            {isInternal || isDepartmental ? (
                                <>
                                    <div className="px-6 py-4 hover:bg-muted/10 transition-colors">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                                            <div className="h-1 w-1 rounded-full bg-blue-500" /> 
                                            {isInternal ? 'Receiving Department' : 'Requesting Department'}
                                        </p>
                                        <p className="text-xs font-bold text-text-primary px-2.5">
                                            {isInternal 
                                                ? (requisition.requesting_location?.department?.name ?? '—') 
                                                : (requisition.requesting_department?.name ?? '—')
                                            }
                                        </p>
                                        <p className="text-[10px] text-text-muted px-2.5 font-medium mt-0.5">
                                            {isInternal ? `Store: ${requisition.requesting_location?.name}` : 'Direct Departmental Request'}
                                        </p>
                                    </div>
                                    <div className="px-6 py-4 hover:bg-muted/10 transition-colors">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
                                            <div className="h-1 w-1 rounded-full bg-brand" /> Issuing (Source) Store
                                        </p>
                                        <p className="text-xs font-bold text-text-primary px-2.5">
                                            {requisition.issuing_location?.name ?? '—'}
                                        </p>
                                        <p className="text-[9px] text-text-muted px-2.5 font-mono mt-0.5">{requisition.issuing_location?.code}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="px-6 py-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Preferred Supplier</p>
                                    <div className="flex flex-col gap-1.5 px-2">
                                        <p className="text-sm font-bold text-text-primary">
                                            {requisition.supplier?.name ?? <span className="italic font-normal text-text-muted">No preference</span>}
                                        </p>
                                        {requisition.supplier?.email && (
                                            <p className="text-[10px] text-text-muted">{requisition.supplier.email}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reference info */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-brand" />
                            <CardTitle className="text-sm font-bold uppercase tracking-wider">Identifiers</CardTitle>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            <div className="bg-muted px-3 py-2 rounded-lg">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Reference Number</p>
                                <p className="text-sm font-bold font-mono text-text-primary mt-1 tracking-tight">{requisition.reference}</p>
                            </div>
                            
                            {requisition.required_by && (
                                <div className="flex items-center gap-3 px-1">
                                    <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Date Required</p>
                                        <p className="text-xs font-bold text-text-primary mt-0.5">
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
