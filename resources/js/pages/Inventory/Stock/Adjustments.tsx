import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';

import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { StockAdjustment, PaginationMeta } from '@/types/inventory';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Plus, Check, X } from 'lucide-react';
import { ConfirmationDialog } from '@/Components/shared/confirmation-dialog';
import { Can } from '@/Components/can';

interface Props {
    adjustments: {
        data: StockAdjustment[];
        meta: PaginationMeta;
    };
}

export default function StockAdjustments({ adjustments }: Props) {
    const [actionAdjustment, setActionAdjustment] = useState<StockAdjustment | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

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
                <div className="flex flex-col">
                    <span className="font-semibold text-text-primary">{adj.batch?.product?.name || 'Unknown'}</span>
                    <span className="text-xs text-text-muted mt-0.5">{adj.batch?.batch_number}</span>
                </div>
            )
        },
        {
            header: 'Adj. Qty',
            cell: (adj) => (
                <span className={`font-semibold ${adj.quantity > 0 ? 'text-brand' : 'text-critical'}`}>
                    {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                </span>
            )
        },
        {
            header: 'Reason',
            cell: (adj) => <span className="capitalize">{adj.reason.replace('_', ' ')}</span>
        },
        {
            header: 'Requested By',
            cell: (adj) => adj.performer?.name || '-'
        },
        {
            header: 'Status',
            cell: (adj) => (
                <Badge variant="outline" className={
                    adj.status === 'approved' ? 'bg-success-bg text-brand' :
                    adj.status === 'rejected' ? 'bg-critical text-white' :
                    'bg-warning-bg text-warning'
                }>
                    <span className="capitalize">{adj.status}</span>
                </Badge>
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-4',
            cell: (adj) => (
                <div className="flex justify-end gap-2 pr-4">
                    {adj.status === 'pending' && (
                        <Can permission="stock.approve">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-brand border-brand hover:bg-success-bg"
                                onClick={() => {
                                    setActionAdjustment(adj);
                                    setActionType('approve');
                                }}
                            >
                                <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-critical border-critical hover:bg-critical-bg"
                                onClick={() => {
                                    setActionAdjustment(adj);
                                    setActionType('reject');
                                }}
                            >
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
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

            <div className="flex flex-col gap-6">
                <PageHeader 
                    title="Stock Adjustments" 
                    description="Approve and reject manual stock adjustments (Cycle counts, damages, etc)."
                >
                    <Can permission="stock.adjust">
                        {/* A real implementation would open a modal dialog to create a request, avoiding making a whole new file for it. */}
                        <Button className="bg-brand hover:bg-brand-dark" onClick={() => alert('New Adjustment Dialog would open here. Mapped to ff0b9beed87d43efad18607141aefd6b UI.')}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Request
                        </Button>
                    </Can>
                </PageHeader>

                <DataTable 
                    columns={columns}
                    data={adjustments.data}
                    meta={adjustments.meta}
                    keyExtractor={(a) => a.id}
                    emptyMessage="No stock adjustments found."
                />
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
        </>
    );
}

StockAdjustments.layout = {
    breadcrumbs: [
{ title: 'Inventory' , href: '#' }, { title: 'Stock Adjustments' , href: '#' }
    ],
};
