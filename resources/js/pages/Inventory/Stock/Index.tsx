import React from 'react';
import { Head, Link } from '@inertiajs/react';

import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { Product, PaginationMeta } from '@/types/inventory';
import { ProductSearch } from '../Components/ProductSearch';
import { Button } from '@/Components/ui/button';
import { ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import { StockLevelIndicator } from '../Components/StockLevelIndicator';
import { Can } from '@/Components/can';

interface Props {
    products: {
        data: Product[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function StockIndex({ products, filters }: Props) {
    const columns: Column<Product>[] = [
        {
            header: 'Product',
            cell: (product) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-text-primary">{product.name}</span>
                    <span className="text-xs text-text-muted mt-0.5">{product.sku}</span>
                </div>
            )
        },
        {
            header: 'Total Quantity',
            cell: (product) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{product.quantity_on_hand || 0}</span>
                    <span className="text-xs text-text-muted uppercase">{product.unit_of_measure}</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (product) => <StockLevelIndicator currentStock={product.quantity_on_hand || 0} reorderLevel={product.reorder_level} />
        },
        {
            header: 'Active Batches',
            cell: (product) => (
                <span className="text-sm">
                    {product.stock_batches?.length || 0} batches
                </span>
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-4',
            cell: (product) => (
                <div className="flex justify-end pr-4">
                    <Link 
                        href={`/inventory/stock/${product.id}/batches`}
                        className="text-sm font-medium text-brand hover:underline"
                    >
                        View Batches
                    </Link>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Stock Levels" />

            <div className="flex flex-col gap-6">
                <PageHeader 
                    title="Stock Levels" 
                    description="Monitor current stock levels across all active products."
                >
                    <div className="flex items-center gap-3">
                        <Can permission="stock.view">
                            <Link href={'/inventory/stock-movements'}>
                                <Button variant="outline">
                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                    Movements
                                </Button>
                            </Link>
                        </Can>
                        <Can permission="stock.adjust">
                            <Link href={'/inventory/stock-adjustments'}>
                                <Button className="bg-brand hover:bg-brand-dark">
                                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                                    Adjustments
                                </Button>
                            </Link>
                        </Can>
                    </div>
                </PageHeader>

                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-card p-4 rounded-lg border border-border">
                    <ProductSearch initialSearch={filters.search} routePath='/inventory/stock' />
                </div>

                <DataTable 
                    columns={columns}
                    data={products.data}
                    meta={products.meta}
                    keyExtractor={(p) => p.id}
                    emptyMessage="No stock records found."
                />
            </div>
        </>
    );
}

StockIndex.layout = {
    breadcrumbs: [

                { title: 'Inventory' , href: '#' },
                { title: 'Stock Levels' , href: '#' }
            
    ],
};
