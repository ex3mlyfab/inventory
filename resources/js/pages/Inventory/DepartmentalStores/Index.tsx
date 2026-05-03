import React from 'react';
import { Head, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Building2, Store, Search, Filter, X, 
    Package, History, TrendingUp, Calendar,
    ArrowRightLeft, ClipboardList
} from 'lucide-react';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { StockLevelIndicator } from '../Components/StockLevelIndicator';

interface Props {
    departments: any[];
    products: any[];
    selectedDepartmentId: string;
    data: {
        current_stock: any[];
        request_history: any[];
        usage_history: any[];
    };
    filters: {
        department_id?: string;
        product_id?: string;
        start_date?: string;
        end_date?: string;
        period?: string;
    };
}

export default function DepartmentalStoreOversight({ 
    departments, 
    products, 
    selectedDepartmentId, 
    data, 
    filters 
}: Props) {
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        router.get('/inventory/departmental-stores', newFilters, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        router.get('/inventory/departmental-stores', { department_id: selectedDepartmentId }, { replace: true });
    };

    const currentStockColumns: Column<any>[] = [
        {
            header: 'Product',
            cell: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-slate-900 leading-tight">{item.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">{item.category?.name}</span>
                        <StockLevelIndicator 
                            currentStock={item.quantity_on_hand ?? 0} 
                            reorderLevel={item.reorder_level} 
                        />
                    </div>
                </div>
            )
        },
        {
            header: 'Current Stock',
            cell: (item) => (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-900">{item.quantity_on_hand ?? 0}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.unit_of_measure?.abbreviation || 'Units'}
                    </span>
                </div>
            )
        }
    ];

    const requestHistoryColumns: Column<any>[] = [
        {
            header: 'Date',
            cell: (item) => (
                <div className="text-xs font-medium text-slate-600">
                    {new Date(item.created_at).toLocaleDateString()}
                </div>
            )
        },
        {
            header: 'Reference',
            cell: (item) => (
                <div className="font-mono text-[11px] font-bold text-brand">
                    {item.reference}
                </div>
            )
        },
        {
            header: 'Status',
            cell: (item) => (
                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {item.status.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: 'Items',
            cell: (item) => (
                <div className="text-[11px] text-slate-500">
                    {item.items?.length || 0} items
                </div>
            )
        }
    ];

    const usageHistoryColumns: Column<any>[] = [
        {
            header: 'Date',
            cell: (item) => (
                <div className="text-xs font-medium text-slate-600">
                    {new Date(item.created_at).toLocaleString()}
                </div>
            )
        },
        {
            header: 'Product',
            cell: (item) => (
                <div className="text-xs font-bold text-slate-900">
                    {item.batch?.product?.name}
                </div>
            )
        },
        {
            header: 'Quantity',
            cell: (item) => (
                <div className="text-sm font-black text-rose-600">
                    -{item.quantity}
                </div>
            )
        },
        {
            header: 'By',
            cell: (item) => (
                <div className="text-[11px] text-slate-500">
                    {item.user?.name}
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Departmental Store Oversight" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6">
                    <PageHeader 
                        title="Departmental Store Oversight" 
                        description="Monitor stock levels, requests, and usage across all departments."
                    />

                    {/* Department Selection Card */}
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex items-center gap-4 flex-grow">
                                    <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div className="flex-grow space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Departmental Store</label>
                                        <Select 
                                            value={selectedDepartmentId || ''} 
                                            onValueChange={(v) => handleFilterChange('department_id', v)}
                                        >
                                            <SelectTrigger className="h-12 border-slate-200 font-bold text-lg text-slate-900 bg-white">
                                                <SelectValue placeholder="Choose a department..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(dept => (
                                                    <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedDepartmentId ? (
                        <>
                            {/* Filters Bar */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex-grow">
                                    <div className="flex items-center gap-2 pl-2">
                                        <Package className="h-4 w-4 text-slate-400" />
                                        <Select 
                                            value={filters.product_id || 'all'} 
                                            onValueChange={(v) => handleFilterChange('product_id', v === 'all' ? '' : v)}
                                        >
                                            <SelectTrigger className="w-[200px] border-0 focus:ring-0 font-bold text-xs uppercase tracking-tight text-slate-600 h-8">
                                                <SelectValue placeholder="All Products" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Products</SelectItem>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200" />
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <Select 
                                            value={filters.period || 'all'} 
                                            onValueChange={(v) => handleFilterChange('period', v === 'all' ? '' : v)}
                                        >
                                            <SelectTrigger className="w-[150px] border-0 focus:ring-0 font-bold text-xs uppercase tracking-tight text-slate-600 h-8">
                                                <SelectValue placeholder="All Time" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Time</SelectItem>
                                                <SelectItem value="today">Today</SelectItem>
                                                <SelectItem value="this_week">This Week</SelectItem>
                                                <SelectItem value="this_month">This Month</SelectItem>
                                                <SelectItem value="last_month">Last Month</SelectItem>
                                                <SelectItem value="this_quarter">This Quarter</SelectItem>
                                                <SelectItem value="this_year">This Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {(filters.product_id || filters.period) && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={clearFilters}
                                            className="h-8 w-8 text-rose-500 ml-auto"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Main Content Tabs */}
                            <Tabs defaultValue="stock" className="w-full">
                                <TabsList className="grid grid-cols-3 w-full max-w-md h-12 p-1 bg-slate-100 rounded-xl mb-6">
                                    <TabsTrigger value="stock" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
                                        <Store className="w-4 h-4 mr-2" />
                                        Current Stock
                                    </TabsTrigger>
                                    <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
                                        <ClipboardList className="w-4 h-4 mr-2" />
                                        Requests
                                    </TabsTrigger>
                                    <TabsTrigger value="usage" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        Usage
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="stock" className="space-y-4">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <DataTable 
                                            columns={currentStockColumns}
                                            data={data.current_stock}
                                            keyExtractor={(item) => item.id}
                                            emptyMessage="No stock found for this department."
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="requests" className="space-y-4">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <DataTable 
                                            columns={requestHistoryColumns}
                                            data={data.request_history}
                                            keyExtractor={(item) => item.id}
                                            emptyMessage="No request history found."
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="usage" className="space-y-4">
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <DataTable 
                                            columns={usageHistoryColumns}
                                            data={data.usage_history}
                                            keyExtractor={(item) => item.id}
                                            emptyMessage="No usage history found."
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                                <Building2 className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Department Selected</h3>
                            <p className="text-slate-500 max-w-sm text-center">
                                Please select a departmental store above to view its stock levels, request history, and usage patterns.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

DepartmentalStoreOversight.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '#' },
        { title: 'Departmental Stores', href: '#' }
    ],
};
