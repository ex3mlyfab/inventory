import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { Product, StockBatch, PaginationMeta } from '@/types/inventory';
import { ExpiryBadge } from '../Components/ExpiryBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { 
    Package, History, MapPin, Calendar, 
    ArrowLeft, MoreVertical, ExternalLink, Settings2
} from 'lucide-react';
import { AdjustmentDialog } from './Partials/AdjustmentDialog';
import { Can } from '@/Components/can';

interface Props {
    product: Product;
    batches: {
        data: (StockBatch & { storage_location?: { name: string; id: string } })[];
    } & PaginationMeta;
}

export default function StockBatches({ product, batches }: Props) {
    const [selectedBatch, setSelectedBatch] = React.useState<StockBatch | null>(null);
    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = React.useState(false);

    const columns: Column<StockBatch>[] = [
        {
            header: 'Batch Information',
            cell: (batch) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-slate-900 leading-tight">{batch.batch_number}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded tracking-widest uppercase">
                            Ref: {batch.reference || 'N/A'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Storage Location',
            cell: (batch) => (
                <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">
                        {batch.storage_location?.name || batch.location || 'Unknown Store'}
                    </span>
                </div>
            )
        },
        {
            header: 'Stock Quantity',
            cell: (batch) => (
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-slate-900">{batch.quantity_on_hand}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">of {batch.quantity_received}</span>
                    </div>
                    <div className="w-24 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div 
                            className="h-full bg-brand rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (batch.quantity_on_hand / batch.quantity_received) * 100)}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            header: 'Expiry Tracking',
            cell: (batch) => (
                <div className="flex flex-col gap-1">
                    <ExpiryBadge expiryDate={batch.expiry_date} />
                    {batch.manufacturing_date && (
                        <span className="text-[9px] text-slate-400 font-medium px-1">
                            MFG: {new Date(batch.manufacturing_date).toLocaleDateString()}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Status',
            cell: (batch) => {
                const statusStyles = {
                    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    expired: 'bg-rose-50 text-rose-700 border-rose-100',
                    quarantined: 'bg-amber-50 text-amber-700 border-amber-100',
                    exhausted: 'bg-slate-50 text-slate-400 border-slate-100'
                };
                return (
                    <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest border px-2 py-0.5 ${statusStyles[batch.status] || ''}`}>
                        {batch.status}
                    </Badge>
                );
            }
        },
        {
            header: '',
            className: 'text-right pr-4',
            cell: (batch) => (
                <div className="flex justify-end gap-2">
                    <Can permission="stock.adjust">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-brand hover:bg-brand/5"
                            onClick={() => {
                                setSelectedBatch(batch);
                                setIsAdjustmentDialogOpen(true);
                            }}
                            title="Adjust Stock"
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </Can>
                    <Link href={`/inventory/stock-movements?batch_id=${batch.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-brand hover:bg-brand/5" title="View History">
                            <History className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title={`Batches - ${product.name}`} />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                <div className="flex flex-col gap-4">
                    <Link href="/inventory/stock" className="flex items-center text-sm font-bold text-slate-400 hover:text-brand transition-colors w-fit group">
                        <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                        Back to Inventory
                    </Link>

                    <PageHeader 
                        title="Batch Distribution" 
                        description={`Tracing all active and archived batches for ${product.name}.`}
                    >
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total System Stock</span>
                                <span className="text-lg font-black text-slate-900 tracking-tighter">
                                    {product.quantity_on_hand} <span className="text-xs text-slate-400 uppercase">{product.unit_of_measure?.abbreviation}</span>
                                </span>
                            </div>
                        </div>
                    </PageHeader>
                </div>

                {/* Product Summary Card */}
                <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="h-16 w-16 rounded-2xl bg-brand/5 flex items-center justify-center text-brand shrink-0 border border-brand/10 shadow-inner">
                                <Package className="h-8 w-8" />
                            </div>
                            <div className="flex-grow space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h2>
                                        <p className="text-sm text-slate-500 font-medium max-w-2xl">{product.description || 'No product description provided.'}</p>
                                    </div>
                                    <Badge className="bg-slate-900 text-white hover:bg-slate-900 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full">
                                        {product.sku}
                                    </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Category</p>
                                        <p className="text-sm font-bold text-slate-700">{product.category?.name || 'Uncategorized'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Base Unit</p>
                                        <p className="text-sm font-bold text-slate-700">{product.unit_of_measure?.name} ({product.unit_of_measure?.abbreviation})</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reorder Point</p>
                                        <p className="text-sm font-bold text-slate-700">{product.reorder_level} {product.unit_of_measure?.abbreviation}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Batches</p>
                                        <p className="text-sm font-bold text-slate-700">{batches.total}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Batch Ledger</h3>
                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-mono text-[10px] px-2">
                                {batches.total} entries
                            </Badge>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/40">
                        <DataTable 
                            columns={columns}
                            data={batches.data}
                            meta={batches}
                            keyExtractor={(b) => b.id}
                            emptyMessage="No historical or active batches found for this product."
                            headerBackground="bg-slate-50"
                        />
                    </div>
                </div>
            </div>
        </div>

        <AdjustmentDialog 
            isOpen={isAdjustmentDialogOpen}
            onClose={() => setIsAdjustmentDialogOpen(false)}
            initialProduct={product}
            initialBatch={selectedBatch || undefined}
        />
    </>
);
}

StockBatches.layout = {
    breadcrumbs: [
        { title: 'Inventory' , href: '#' },
        { title: 'Stock Levels', href: '/inventory/stock' },
        { title: 'Batch Tracking' , href: '#' }
    ],
};
