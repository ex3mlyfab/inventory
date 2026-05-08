import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { 
    Search, 
    FileDown, 
    Calendar as CalendarIcon, 
    Filter, 
    ArrowRightLeft, 
    Package, 
    BarChart3, 
    Store,
    X,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    reportData: any;
    type: string;
    filters: any;
    categories: any[];
    locations: any[];
    departments: any[];
}

export default function ReportViewer({ reportData, type, filters, categories, locations, departments }: Props) {
    const [isExporting, setIsExporting] = useState(false);

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        if (key === 'period' && value) {
            delete newFilters.start_date;
            delete newFilters.end_date;
        }
        if (key === 'start_date' || key === 'end_date') {
            delete newFilters.period;
        }

        router.get('/reports/viewer', newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        router.get('/reports/viewer', { type }, { replace: true });
    };

    const handleExport = () => {
        setIsExporting(true);
        const queryParams = new URLSearchParams(filters).toString();
        window.location.href = `/reports/export-excel?${queryParams}`;
        setTimeout(() => setIsExporting(false), 2000);
    };

    const getColumns = (): Column<any>[] => {
        switch (type) {
            case 'products':
                return [
                    {
                        header: 'Product Details',
                        cell: (row) => (
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{row.name}</span>
                                <span className="text-[10px] font-mono text-slate-500 uppercase">{row.sku}</span>
                            </div>
                        )
                    },
                    { header: 'Category', cell: (row) => row.category?.name || 'Uncategorized' },
                    { 
                        header: 'Current Stock', 
                        cell: (row) => (
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900">{row.quantity_on_hand || 0}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{row.unit_of_measure?.abbreviation}</span>
                            </div>
                        )
                    },
                    { header: 'Reorder Level', accessorKey: 'reorder_level' },
                    { 
                        header: 'Status', 
                        cell: (row) => (
                            <Badge className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-0 px-2",
                                row.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}>
                                {row.status}
                            </Badge>
                        )
                    }
                ];
            case 'movements':
                return [
                    { header: 'Date', cell: (row) => format(new Date(row.created_at), 'MMM dd, yyyy HH:mm') },
                    { header: 'Product', cell: (row) => row.batch?.product?.name || 'Deleted Product' },
                    { header: 'Batch #', cell: (row) => <Badge variant="outline" className="font-mono text-[10px]">{row.batch?.batch_number}</Badge> },
                    { 
                        header: 'Type', 
                        cell: (row) => (
                            <Badge className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-0",
                                row.type === 'in' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                                {row.type}
                            </Badge>
                        )
                    },
                    { header: 'Qty', cell: (row) => <span className="font-black">{row.quantity}</span> },
                    { header: 'Performed By', cell: (row) => row.user?.name || 'System' }
                ];
            case 'consumption':
                return [
                    { header: 'Product Name', accessorKey: 'name' },
                    { header: 'SKU', accessorKey: 'sku' },
                    { header: 'Category', accessorKey: 'category_name' },
                    { 
                        header: 'Total Consumed', 
                        cell: (row) => (
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-rose-600">{row.total_consumed}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{row.uom_name}</span>
                            </div>
                        )
                    }
                ];
            case 'stores':
                return [
                    { header: 'Location', cell: (row) => row.storage_location?.name },
                    { header: 'Dept', cell: (row) => row.storage_location?.department?.name || 'Central Store' },
                    { header: 'Product', cell: (row) => row.product?.name },
                    { header: 'Batch #', cell: (row) => <span className="font-mono text-xs">{row.batch_number}</span> },
                    { header: 'Qty', cell: (row) => <span className="font-black text-brand">{row.quantity_on_hand}</span> },
                    { header: 'Expiry', cell: (row) => row.expiry_date ? format(new Date(row.expiry_date), 'MMM dd, yyyy') : 'N/A' }
                ];
            default:
                return [];
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
            <Head title="Report Viewer" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader 
                    title="Inventory Insights" 
                    description="Preview, filter, and export detailed operational reports."
                />
                
                <Button 
                    onClick={handleExport} 
                    disabled={isExporting}
                    className="bg-brand hover:bg-brand-dark h-11 px-6 shadow-xl shadow-brand/20 transition-all active:scale-95"
                >
                    {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Export to Excel
                </Button>
            </div>

            <Tabs value={type} onValueChange={(val) => router.get('/reports/viewer', { ...filters, type: val })}>
                <TabsList className="bg-slate-100 p-1 h-12 rounded-xl border border-slate-200">
                    <TabsTrigger value="products" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-black uppercase tracking-widest">
                        <Package className="h-4 w-4 mr-2" />
                        Products
                    </TabsTrigger>
                    <TabsTrigger value="movements" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-black uppercase tracking-widest">
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Movements
                    </TabsTrigger>
                    <TabsTrigger value="consumption" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-black uppercase tracking-widest">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Consumption
                    </TabsTrigger>
                    <TabsTrigger value="stores" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-black uppercase tracking-widest">
                        <Store className="h-4 w-4 mr-2" />
                        Stores
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Card className="border-slate-200/60 shadow-lg overflow-visible">
                <CardContent className="p-6 space-y-6">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search results..."
                                className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-xl"
                                defaultValue={filters.search}
                                onBlur={(e) => handleFilterChange('search', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange('search', (e.target as HTMLInputElement).value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                            <Select 
                                value={(filters.start_date && filters.end_date) ? 'custom' : (filters.period || 'all')} 
                                onValueChange={(val) => {
                                    if (val === 'custom') {
                                        const today = new Date().toISOString().split('T')[0];
                                        const newFilters = { ...filters, start_date: today, end_date: today };
                                        delete newFilters.period;
                                        router.get('/reports/viewer', newFilters, { preserveState: true, replace: true });
                                    } else {
                                        handleFilterChange('period', val === 'all' ? '' : val);
                                    }
                                }}
                            >
                                <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest">
                                    <SelectValue placeholder="Time Period" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="weekly">This Week</SelectItem>
                                    <SelectItem value="monthly">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="yearly">This Year</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(filters.start_date || filters.end_date) && (
                            <>
                                <div className="relative">
                                    <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black uppercase tracking-widest text-slate-400 z-10">From</label>
                                    <Input
                                        type="date"
                                        className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs"
                                        value={filters.start_date || ''}
                                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <label className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-black uppercase tracking-widest text-slate-400 z-10">To</label>
                                    <Input
                                        type="date"
                                        className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs"
                                        value={filters.end_date || ''}
                                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {type === 'products' && (
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                                <Select 
                                    value={filters.category_id || 'all'} 
                                    onValueChange={(val) => handleFilterChange('category_id', val === 'all' ? '' : val)}
                                >
                                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {type === 'stores' && (
                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-slate-400 shrink-0" />
                                <Select 
                                    value={filters.location_id || 'all'} 
                                    onValueChange={(val) => handleFilterChange('location_id', val === 'all' ? '' : val)}
                                >
                                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest">
                                        <SelectValue placeholder="All Locations" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="all">All Locations</SelectItem>
                                        {locations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                             {(filters.search || filters.period || filters.category_id || filters.location_id || filters.start_date) && (
                                <Button 
                                    variant="ghost" 
                                    onClick={clearFilters}
                                    className="h-11 px-4 text-rose-500 hover:bg-rose-50 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear Filters
                                </Button>
                             )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-inner bg-slate-50/10">
                        <DataTable 
                            columns={getColumns()}
                            data={reportData.data || reportData}
                            meta={reportData.data ? reportData : null}
                            keyExtractor={(row) => row.id || Math.random().toString()}
                            emptyMessage={`No ${type} data found for the selected criteria.`}
                            headerBackground="bg-slate-50/80 backdrop-blur-md"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

ReportViewer.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/' },
        { title: 'Reports', href: '/reports' },
        { title: 'Insights Viewer', href: '#' },
    ]
};
