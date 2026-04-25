import React from 'react';
import { Head } from '@inertiajs/react';

import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { StockMovement, PaginationMeta } from '@/types/inventory';
import { Badge } from '@/Components/ui/badge';

interface Props {
    movements: {
        data: StockMovement[];
        meta: PaginationMeta;
    };
}

export default function StockMovements({ movements }: Props) {
    const columns: Column<StockMovement>[] = [
        {
            header: 'Date',
            cell: (m) => <span className="text-sm">{new Date(m.created_at).toLocaleString()}</span>
        },
        {
            header: 'Product / Batch',
            cell: (m) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-text-primary">{m.batch?.product?.name}</span>
                    <span className="text-xs text-text-muted mt-0.5">{m.batch?.batch_number}</span>
                </div>
            )
        },
        {
            header: 'Type',
            cell: (m) => (
                <Badge variant="outline" className="capitalize">
                    {m.type}
                </Badge>
            )
        },
        {
            header: 'Quantity',
            cell: (m) => (
                <span className={`font-semibold ${m.quantity > 0 ? 'text-brand' : 'text-critical'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                </span>
            )
        },
        {
            header: 'After',
            cell: (m) => m.balance_after
        },
        {
            header: 'Performed By',
            cell: (m) => m.user?.name || 'System'
        }
    ];

    return (
        <>
            <Head title="Stock Movements" />

            <div className="flex flex-col gap-6">
                <PageHeader 
                    title="Stock Movements" 
                    description="Audit trail of all inventory additions, deductions, and transfers."
                />

                <DataTable 
                    columns={columns}
                    data={movements.data}
                    meta={movements.meta}
                    keyExtractor={(m) => m.id}
                    emptyMessage="No stock movements recorded yet."
                />
            </div>
        </>
    );
}

StockMovements.layout = {
    breadcrumbs: [
{ title: 'Inventory' , href: '#' }, { title: 'Stock Movements' , href: '#' }
    ],
};
