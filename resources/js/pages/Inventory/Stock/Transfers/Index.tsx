import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column, PaginationMeta } from '@/components/shared/data-table';
import { StockMovement, StorageLocationBasic } from '@/types/inventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    ArrowRightLeft, Plus, Calendar, 
    ArrowUpRight, ArrowDownLeft, MapPin, Package, User
} from 'lucide-react';
import { TransferDialog } from '../Partials/TransferDialog';
import { cn } from '@/lib/utils';

interface Props {
    transfers: {
        data: StockMovement[];
    } & PaginationMeta;
    locations: StorageLocationBasic[];
}

export default function StockTransfers({ transfers, locations }: Props) {
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

    const columns: Column<StockMovement>[] = [
        {
            header: 'Timestamp',
            cell: (m) => (
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-400">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">
                            {new Date(m.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium lowercase">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Product / Batch',
            cell: (m) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 leading-tight">
                        {m.batch?.product?.name || 'Unknown Item'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded tracking-wider uppercase">
                            {m.batch?.batch_number || 'N/A'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Nature of Transfer',
            cell: (m) => (
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-black px-2 py-0.5 border flex items-center gap-1",
                        m.quantity < 0 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    )}>
                        {m.quantity < 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {m.quantity < 0 ? 'Outflow' : 'Inflow'}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-medium italic">
                        {m.notes}
                    </span>
                </div>
            )
        },
        {
            header: 'Quantity',
            className: 'text-right',
            cell: (m) => (
                <div className="flex flex-col items-end pr-4">
                    <span className={cn(
                        "text-sm font-black tracking-tight",
                        m.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        Bal: {m.balance_after}
                    </span>
                </div>
            )
        },
        {
            header: 'Agent',
            cell: (m) => (
                <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{m.user?.name}</span>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Direct Stock Transfers" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <PageHeader 
                        title="Stock Transfers" 
                        description="Immediate internal movement of medical supplies between hospital stores and wards."
                    >
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" 
                            onClick={() => setIsTransferDialogOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Transfer
                        </Button>
                    </PageHeader>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/40">
                        <DataTable 
                            columns={columns}
                            data={transfers.data}
                            meta={transfers}
                            keyExtractor={(m) => m.id}
                            emptyMessage="No historical transfers found in this location's audit trail."
                            headerBackground="bg-slate-50"
                        />
                    </div>
                </div>
            </div>

            <TransferDialog 
                isOpen={isTransferDialogOpen}
                onClose={() => setIsTransferDialogOpen(false)}
                locations={locations}
            />
        </>
    );
}

StockTransfers.layout = {
    breadcrumbs: [
        { title: 'Inventory' , href: '#' },
        { title: 'Stock Operations' , href: '#' },
        { title: 'Internal Transfers' , href: '#' }
    ],
};
