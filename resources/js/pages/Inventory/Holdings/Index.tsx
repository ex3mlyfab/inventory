import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Product, PaginationMeta } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    AlertTriangle, Search, Filter, X, Package, ArrowRightLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Stats {
    total_items: number;
    low_stock_count: number;
}

interface Props {
    products: {
        data: (Product & { current_stock: number })[];
    } & PaginationMeta;
    stats: Stats;
    filters: {
        search?: string;
    };
    department_name: string;
    department_id: number | null;
}

export default function HoldingsIndex({ 
    products = { data: [], current_page: 1, from: null, last_page: 1, path: '', per_page: 15, to: null, total: 0, links: [] } as Props['products'], 
    stats = { total_items: 0, low_stock_count: 0 }, 
    filters, 
    department_name,
    department_id 
}: Props) {
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        router.get('/inventory/holdings', newFilters, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        router.get('/inventory/holdings', {}, { replace: true });
    };

    const columns: Column<Product & { current_stock: number }>[] = [
        {
            header: 'Product Details',
            cell: (product) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-slate-900 leading-tight">{product.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {product.sku}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {product.category?.name}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Available Stock',
            cell: (product) => (
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-slate-900">{product.current_stock ?? 0}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{product.unit_of_measure?.abbreviation || 'Units'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-4',
            cell: (product) => (
                <div className="flex justify-end gap-2 pr-4">
                    <Link href={`/inventory/holdings/${product.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-slate-600 hover:text-brand hover:bg-brand/5 font-bold text-xs uppercase tracking-wider">
                            Details
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title={`${department_name} Holdings`} />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                <PageHeader 
                    title={`${department_name} Inventory`} 
                    description="View and track stock levels currently held within your department."
                >
                    <div className="flex items-center gap-3">
                        <Link href={'/procurement/requisitions/create?type=departmental'}>
                            <Button size="sm" className="bg-brand hover:bg-brand-dark text-white h-9 shadow-md transition-all active:scale-95">
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Request Stock
                            </Button>
                        </Link>
                    </div>
                </PageHeader>

                <div className="grid grid-cols-1 gap-4">
                    <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:border-brand/40 transition-colors">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Total Items in Hand</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                    {stats.total_items.toLocaleString()}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Package className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-slate-200/60 shadow-md">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search department stock..." 
                                className="pl-10 h-10 border-slate-200/80 focus:ring-brand/20 transition-all font-medium text-slate-900"
                                defaultValue={filters.search}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilterChange('search', (e.target as HTMLInputElement).value);
                                }}
                            />
                        </div>

                        {filters.search && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={clearFilters}
                                className="h-10 w-10 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/50">
                    <DataTable 
                        columns={columns}
                        data={products.data}
                        meta={products}
                        keyExtractor={(p) => p.id}
                        emptyMessage="Your department has no recorded stock yet."
                        headerBackground="bg-slate-50/50"
                    />
                </div>
            </div>
        </div>
    </>
);
}

// @ts-ignore
HoldingsIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory' , href: '#' },
        { title: 'My Holdings' , href: '/inventory/holdings' }
    ]
};
