import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { StockAdjustment, PaginationMeta } from '@/types/inventory';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Plus, Check, X } from 'lucide-react';
import { ConfirmationDialog } from '@/Components/shared/confirmation-dialog';
import { Can } from '@/Components/can';
import { AdjustmentDialog } from './Partials/AdjustmentDialog';
import { StatCard } from '@/Components/shared/stat-card';
import { Layers, History, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
    adjustments: {
        data: StockAdjustment[];
        meta: PaginationMeta;
    };
    stats: {
        pending: number;
        approved_today: number;
        total_this_month: number;
    };
}

export default function StockAdjustments({ adjustments, stats }: Props) {
    const [actionAdjustment, setActionAdjustment] = useState<StockAdjustment | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);

    const handleAction = () => {
        if (!actionAdjustment || !actionType) return;
        
        router.post(`/inventory/stock-adjustments/${actionAdjustment.id}/${actionType}`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setActionAdjustment(null);
                setActionType(null);
            }
        });
    };

    const columns: Column<StockAdjustment>[] = [
        {
            header: 'Product / Batch',
            cell: (adj) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-text-primary leading-tight">{adj.batch?.product?.name || 'Unknown'}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-text-muted bg-muted/30 px-1 rounded uppercase tracking-tight">
                            {adj.batch?.batch_number}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Adj. Qty',
            cell: (adj) => (
                <div className="flex flex-col">
                    <span className={`text-sm font-black ${adj.quantity > 0 ? 'text-brand' : 'text-critical'}`}>
                        {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase font-medium">
                        {adj.batch?.product?.unit_of_measure?.abbreviation || 'Units'}
                    </span>
                </div>
            )
        },
        {
            header: 'Reason',
            cell: (adj) => (
                <Badge variant="outline" className="capitalize text-[10px] font-bold border-border/50 text-text-secondary bg-slate-50">
                    {adj.reason.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: 'Requested By',
            cell: (adj) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">{adj.performer?.name || '-'}</span>
                    <span className="text-[10px] text-text-muted">
                        {new Date(adj.created_at).toLocaleDateString()}
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (adj) => (
                <Badge className={
                    adj.status === 'approved' ? 'bg-success-bg/10 text-brand border-brand/20 shadow-none' :
                    adj.status === 'rejected' ? 'bg-critical/10 text-critical border-critical/20 shadow-none' :
                    'bg-warning-bg/10 text-warning border-warning/20 shadow-none'
                }>
                    <span className="capitalize font-black text-[9px] tracking-widest">{adj.status}</span>
                </Badge>
            )
        },
        {
            header: '',
            id: 'actions',
            className: 'text-right min-w-[100px]',
            cell: (adj) => (
                <div className="flex justify-end gap-2 pr-4">
                    {adj.status === 'pending' && (
                        <Can permission="stock.approve">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] font-bold uppercase tracking-wider border-brand/50 text-brand hover:bg-brand/5"
                                onClick={() => {
                                    setActionAdjustment(adj);
                                    setActionType('approve');
                                }}
                            >
                                <Check className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] font-bold uppercase tracking-wider border-critical/50 text-critical hover:bg-critical/5"
                                onClick={() => {
                                    setActionAdjustment(adj);
                                    setActionType('reject');
                                }}
                            >
                                <X className="w-3 h-3 mr-1" /> Reject
                            </Button>
                        </Can>
                    )}
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Stock Adjustments" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <PageHeader 
                        title="Stock Adjustments" 
                        description="Approve and reject manual stock adjustments (Cycle counts, damages, etc)."
                    >
                        <Can permission="stock.adjust">
                            <Button 
                                className="bg-brand hover:bg-brand-dark text-white shadow-md hover:shadow-lg transition-all" 
                                onClick={() => setIsAdjustmentDialogOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Adjustment Request
                            </Button>
                        </Can>
                    </PageHeader>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            label="Pending Approvals" 
                            value={stats.pending} 
                            icon={AlertCircle}
                            className={stats.pending > 0 ? "border-amber-200 bg-amber-50/30" : ""}
                        />
                        <StatCard 
                            label="Approved Today" 
                            value={stats.approved_today} 
                            icon={CheckCircle2}
                            className="border-indigo-100"
                        />
                        <StatCard 
                            label="Adjustments (MTD)" 
                            value={stats.total_this_month} 
                            icon={History}
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <DataTable 
                            columns={columns}
                            data={adjustments.data}
                            meta={adjustments.meta}
                            keyExtractor={(a) => a.id}
                            emptyMessage={
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-text-muted/30">
                                        <Layers className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary">No stock adjustments found</p>
                                        <p className="text-sm text-text-muted mt-1">Adjustment history will appear here once requested.</p>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>

            <ConfirmationDialog 
                isOpen={!!actionAdjustment}
                onClose={() => setActionAdjustment(null)}
                onConfirm={handleAction}
                title={actionType === 'approve' ? 'Approve Adjustment' : 'Reject Adjustment'}
                description={<>
                    Are you sure you want to {actionType} this adjustment of 
                    <span className="font-bold"> {actionAdjustment?.quantity} </span>
                    units for <span className="font-bold">{actionAdjustment?.batch?.product?.name}</span>?
                </>}
                variant={actionType === 'reject' ? 'destructive' : 'default'}
                confirmText={actionType === 'approve' ? 'Approve' : 'Reject'}
            />

            <AdjustmentDialog 
                isOpen={isAdjustmentDialogOpen}
                onClose={() => setIsAdjustmentDialogOpen(false)}
            />
        </>
    );
}

StockAdjustments.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Stock Adjustments', href: '#' }
    ],
};
