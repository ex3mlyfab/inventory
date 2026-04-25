import React from 'react';
import { Head, Link } from '@inertiajs/react';

import { PageHeader } from '@/Components/shared/page-header';
import { Product } from '@/types/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Edit, PackageOpen } from 'lucide-react';
import { ExpiryBadge } from '../Components/ExpiryBadge';
import { DataTable, Column } from '@/Components/shared/data-table';
import { Badge } from '@/Components/ui/badge';
import { StockLevelIndicator } from '../Components/StockLevelIndicator';
import { Can } from '@/Components/can';

interface Props {
    product: Product;
}

export default function ProductShow({ product }: Props) {
    const batchesColumns: Column<any>[] = [
        {
            header: 'Batch Number',
            accessorKey: 'batch_number'
        },
        {
            header: 'Location',
            accessorKey: 'location'
        },
        {
            header: 'In Stock',
            cell: (batch) => <span className="font-medium">{batch.quantity_on_hand}</span>
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
            <Head title={product.name} />

            <div className="flex flex-col gap-6">
                <PageHeader 
                    title={product.name} 
                    description={`Category: ${product.category?.name} | SKU: ${product.sku}`}
                >
                    <Can permission="products.edit">
                        <Link href={`/inventory/products/${product.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                            </Button>
                        </Link>
                    </Can>
                </PageHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <Card>
                            <CardHeader className="bg-surface-header border-b border-border py-4">
                                <CardTitle className="text-base">Product Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y divide-border sm:divide-y-0 sm:divide-x border-b border-border">
                                    <div className="p-4 flex flex-col gap-1">
                                        <dt className="text-sm font-medium text-text-secondary">Description</dt>
                                        <dd className="text-sm text-text-primary mt-1">{product.description || 'No description provided.'}</dd>
                                    </div>
                                    <div className="p-4 flex flex-col gap-3">
                                        <div>
                                            <dt className="text-sm font-medium text-text-secondary">Tags & Constraints</dt>
                                            <dd className="mt-2 flex gap-2 flex-wrap">
                                                {product.is_expirable && <Badge variant="secondary">Expirable</Badge>}
                                                {product.requires_prescription && <Badge variant="secondary" className="bg-info-bg text-info">Rx Required</Badge>}
                                                <Badge variant="outline" className="uppercase font-bold text-[10px]">{product.unit_of_measure?.abbreviation || 'Unit'}</Badge>
                                            </dd>
                                        </div>
                                    </div>
                                </dl>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-text-secondary">Reorder Level</dt>
                                        <dd className="text-sm mt-1">{product.reorder_level} {product.unit_of_measure?.abbreviation}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-text-secondary">Procurement Quantity</dt>
                                        <dd className="text-sm mt-1">{product.reorder_quantity} {product.unit_of_measure?.abbreviation}</dd>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text-primary">Stock Batches</h3>
                                <Link 
                                    href={`/inventory/stock/${product.id}/batches`}
                                    className="text-sm font-medium text-brand hover:underline"
                                >
                                    View Full History
                                </Link>
                            </div>
                            <DataTable 
                                columns={batchesColumns}
                                data={product.stock_batches || []}
                                keyExtractor={(b) => b.id}
                                emptyMessage="No active stock batches found."
                            />
                        </div>
                    </div>

                    <div className="md:col-span-1 flex flex-col gap-6">
                        {product.image_url && (
                            <Card className="overflow-hidden border-brand/10 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                                <img 
                                    src={product.image_url} 
                                    alt={product.name} 
                                    className="w-full h-56 object-cover"
                                />
                            </Card>
                        )}
                        <Card className="border-brand/10 shadow-sm">
                            <CardHeader className="bg-brand/5 border-b border-brand/10 py-4">
                                <CardTitle className="text-base text-brand font-bold tracking-tight">Inventory Status</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                                <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-2">
                                    <PackageOpen className="w-8 h-8" />
                                </div>
                                <h1 className="text-5xl font-black text-text-primary mt-1 tracking-tighter">
                                    {product.quantity_on_hand || 0}
                                </h1>
                                <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">
                                    {product.unit_of_measure?.name || 'Units'} AVAILABLE
                                </span>
                                <div className="mt-6 w-full px-2">
                                    <StockLevelIndicator 
                                        currentStock={product.quantity_on_hand || 0} 
                                        reorderLevel={product.reorder_level} 
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

ProductShow.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/products' },
        { title: 'Products', href: '/inventory/products' },
        { title: 'Product Details', href: '#' }
    ],
};
