import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column, PaginationMeta } from '@/Components/shared/data-table';
import { StockMovement, MovementType, StorageLocationBasic } from '@/types/inventory';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/Components/ui/select';
import { 
    Search, Filter, X, ArrowUpRight, ArrowDownLeft, 
    ArrowRightLeft, Settings2, Calendar, MapPin, Package, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    movements: {
        data: StockMovement[];
    } & PaginationMeta;
    locations: StorageLocationBasic[];
    filters: {
        search?: string;
        type?: MovementType;
        store_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function StockMovements({ movements, locations, filters }: Props) {
    const handleFilterChange = (key: string, value: string) => {
        router.get('/inventory/stock-movements', { ...filters, [key]: value }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        router.get('/inventory/stock-movements', {}, { replace: true });
    };

    const getMovementIcon = (type: MovementType) => {
        switch (type) {
            case 'in': return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
            case 'out': return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
            case 'transfer': return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
            case 'adjustment': return <Settings2 className="w-4 h-4 text-amber-500" />;
            case 'disposal': return <X className="w-4 h-4 text-slate-500" />;
            default: return <Package className="w-4 h-4 text-slate-400" />;
        }
    };

    const getMovementBadge = (type: MovementType) => {
        const styles = {
            in: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            out: 'bg-rose-50 text-rose-700 border-rose-100',
            transfer: 'bg-blue-50 text-blue-700 border-blue-100',
            adjustment: 'bg-amber-50 text-amber-700 border-amber-100',
            disposal: 'bg-slate-50 text-slate-600 border-slate-200'
        };
        return (
            <Badge variant="outline" className={cn("text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border", styles[type])}>
                {type}
            </Badge>
        );
    };

    const columns: Column<StockMovement>[] = [
        {
            header: 'Timestamp',
            cell: (m) => (
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
                        <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">
                            {new Date(m.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">
                            {new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Product / Batch',
            cell: (m) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-slate-900 leading-tight">
                        {m.batch?.product?.name || 'Unknown Product'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded tracking-widest uppercase">
                            {m.batch?.batch_number || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <MapPin className="h-3 w-3" />
                            {m.batch?.storage_location?.name || 'Central Store'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Type',
            cell: (m) => (
                <div className="flex items-center gap-2">
                    {getMovementIcon(m.type)}
                    {getMovementBadge(m.type)}
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
            header: 'Responsible Agent',
            cell: (m) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center border border-brand/20">
                        <User className="h-3.5 w-3.5 text-brand" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{m.user?.name || 'System Auto'}</span>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Stock Audit Trail" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                    <PageHeader 
                        title="Stock Movements" 
                        description="Comprehensive audit trail of all inventory additions, deductions, and location transfers."
                    />

                    {/* Filter Bar */}
                    <Card className="border-slate-200 shadow-md">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="lg:col-span-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search product/batch..." 
                                        className="pl-10 h-10 border-slate-200/80 focus:ring-brand/20 transition-all font-medium"
                                        defaultValue={filters.search}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleFilterChange('search', (e.target as HTMLInputElement).value);
                                        }}
                                    />
                                </div>

                                <Select 
                                    value={filters.type || 'all'} 
                                    onValueChange={(v) => handleFilterChange('type', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="h-10 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600">
                                        <SelectValue placeholder="Movement Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Every Type</SelectItem>
                                        <SelectItem value="in">Restock (In)</SelectItem>
                                        <SelectItem value="out">Dispensed (Out)</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                        <SelectItem value="adjustment">Adjustment</SelectItem>
                                        <SelectItem value="disposal">Disposal</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select 
                                    value={filters.store_id || 'all'} 
                                    onValueChange={(v) => handleFilterChange('store_id', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="h-10 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-600">
                                        <SelectValue placeholder="Storage Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Storefronts</SelectItem>
                                        {locations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="grid grid-cols-2 gap-2 lg:col-span-1">
                                    <div className="relative">
                                        <Input 
                                            type="date"
                                            value={filters.date_from || ''}
                                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                            className="h-10 border-slate-200 text-xs px-2"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Input 
                                            type="date"
                                            value={filters.date_to || ''}
                                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                            className="h-10 border-slate-200 text-xs px-2"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {(filters.search || filters.type || filters.store_id || filters.date_from || filters.date_to) && (
                                        <Button 
                                            variant="ghost" 
                                            onClick={clearFilters}
                                            className="h-10 flex-grow text-rose-500 hover:bg-rose-50 border border-rose-100 font-bold text-xs uppercase tracking-widest"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/40">
                        <DataTable 
                            columns={columns}
                            data={movements.data}
                            meta={movements}
                            keyExtractor={(m) => m.id}
                            emptyMessage="No stock movements matching your audit parameters."
                            headerBackground="bg-slate-50"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

StockMovements.layout = {
    breadcrumbs: [
        { title: 'Inventory' , href: '#' },
        { title: 'Stock Logs' , href: '#' },
        { title: 'Audit Trail' , href: '#' }
    ],
};
