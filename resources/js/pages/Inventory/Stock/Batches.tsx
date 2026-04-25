import React from 'react';
import { Head, Link } from '@inertiajs/react';

import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { Product, StockBatch, PaginationMeta } from '@/types/inventory';
import { ExpiryBadge } from '../Components/ExpiryBadge';
import { Badge } from '@/Components/ui/badge';
import { BatchInfoCard } from '../Components/BatchInfoCard';

interface Props {
    product: Product;
    batches: {
        data: StockBatch[];
        meta: PaginationMeta;
    };
}

export default function StockBatches({ product, batches }: Props) {
    const columns: Column<StockBatch>[] = [
        {
            header: 'Batch No.',
            accessorKey: 'batch_number'
        },
        {
            header: 'Location',
            accessorKey: 'location'
        },
        {
            header: 'Qty Received',
            cell: (batch) => <span className="text-text-secondary">{batch.quantity_received}</span>
        },
        {
            header: 'Qty On Hand',
            cell: (batch) => <span className="font-semibold text-text-primary">{batch.quantity_on_hand}</span>
        },
        {
            header: 'Expiry Date',
            cell: (batch) => <ExpiryBadge expiryDate={batch.expiry_date} />
        },
        {
            header: 'Status',
            cell: (batch) => (
                <Badge variant="outline" className={
                    batch.status === 'active' ? 'bg-success-bg text-brand' :
                    batch.status === 'expired' ? 'bg-critical text-white' :
                    'bg-surface-highest text-text-muted'
                }>
                    <span className="capitalize">{batch.status}</span>
                </Badge>
            )
        }
    ];

    return (
        <>
            <Head title={`Batches - ${product.name}`} />

            <div className="flex flex-col gap-6">
                <PageHeader 
                    title={`Batches: ${product.name}`} 
                    description="View all specific tracking batches for this product."
                />

                <div className="grid grid-cols-1 mb-2">
                    {/* Just displaying the latest active batch at the top if exists */}
                    {batches.data.length > 0 && batches.data[0].status === 'active' && (
                         <BatchInfoCard batch={batches.data[0]} />
                    )}
                </div>

                <DataTable 
                    columns={columns}
                    data={batches.data}
                    meta={batches.meta}
                    keyExtractor={(b) => b.id}
                    emptyMessage="No batches recorded for this product."
                />
            </div>
        </>
    );
}

StockBatches.layout = {
    breadcrumbs: [

                { title: 'Inventory' , href: '#' },
                { title: 'Stock Levels', href: '/inventory/stock' },
                { title: 'Product Details', href: '#' },
                { title: 'Batches' , href: '#' }
            
    ],
};
