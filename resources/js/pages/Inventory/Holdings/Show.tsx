import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Product, PaginationMeta } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
    ArrowLeft, ArrowUpRight, ArrowDownRight, Package, Box
} from 'lucide-react';

interface Movement {
    id: string;
    type: 'in' | 'out';
    quantity: number;
    reference_type: string;
    reference_id: string;
    notes: string | null;
    created_at: string;
    user?: {
        name: string;
    };
}

interface Props {
    product: Product & { current_stock: number };
    movements: {
        data: Movement[];
    } & PaginationMeta;
    stats: {
        total_collected: number;
        total_consumed: number;
    };
    department_name: string;
}

export default function HoldingsShow({ product, movements, stats, department_name }: Props) {
    const columns: Column<Movement>[] = [
        {
            header: 'Date',
            cell: (movement) => (
                <span className="text-sm font-medium text-slate-700">
                    {new Date(movement.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}
                </span>
            )
        },
        {
            header: 'Type',
            cell: (movement) => (
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${movement.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {movement.type === 'in' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${movement.type === 'in' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {movement.type === 'in' ? 'Collection' : 'Consumption'}
                    </span>
                </div>
            )
        },
        {
            header: 'Quantity',
            cell: (movement) => (
                <div className="flex items-baseline gap-1">
                    <span className={`text-sm font-black ${movement.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {movement.type === 'in' ? '+' : '-'}{Math.abs(movement.quantity)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {product.unit_of_measure?.abbreviation || 'Units'}
                    </span>
                </div>
            )
        },
        {
            header: 'User',
            cell: (movement) => (
                <span className="text-sm text-slate-600 font-medium">
                    {movement.user?.name || 'System'}
                </span>
            )
        },
        {
            header: 'Reference & Notes',
            cell: (movement) => (
                <div className="flex flex-col py-1 max-w-xs">
                    <span className="text-xs font-bold text-slate-700 capitalize">
                        {movement.reference_type || 'Manual'}
                    </span>
                    {movement.notes && (
                        <span className="text-[11px] text-slate-500 truncate" title={movement.notes}>
                            {movement.notes}
                        </span>
                    )}
                </div>
            )
        }
    ];

    return (
        <>
            <Head title={`${product.name} Details`} />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                    <PageHeader 
                        title={product.name} 
                        description={`Item Details • ${product.sku} • ${product.category?.name}`}
                    >
                        <Link href="/inventory/holdings">
                            <Button variant="outline" size="sm" className="h-9">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Holdings
                            </Button>
                        </Link>
                    </PageHeader>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Current Holding</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {product.current_stock ?? 0}
                                        <span className="text-sm font-medium text-slate-500 ml-1">{product.unit_of_measure?.abbreviation}</span>
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                    <Package className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Total Collection (All Time)</p>
                                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                                        {stats.total_collected.toLocaleString()}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Total Consumption (All Time)</p>
                                    <p className="text-2xl font-black text-red-600 tracking-tighter">
                                        {stats.total_consumed.toLocaleString()}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                    <ArrowDownRight className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/50">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                            <Box className="w-5 h-5 text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-800">Movement History</h3>
                        </div>
                        <DataTable 
                            columns={columns}
                            data={movements.data}
                            meta={movements}
                            keyExtractor={(m) => m.id}
                            emptyMessage="No collection or consumption history found for this item."
                            headerBackground="bg-slate-50/50"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

// @ts-ignore
HoldingsShow.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '#' },
        { title: 'My Holdings', href: '/inventory/holdings' },
        { title: 'Item Details', href: '#' }
    ]
};
