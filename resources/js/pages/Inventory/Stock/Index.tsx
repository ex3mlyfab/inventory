import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { Product, PaginationMeta, StorageLocationBasic, Department } from '@/types/inventory';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { 
    ArrowRightLeft, SlidersHorizontal, Package, 
    AlertTriangle, Calendar, TrendingUp, Search,
    Filter, X, Building2, Store, BarChart3
} from 'lucide-react';
import { StockLevelIndicator } from '../Components/StockLevelIndicator';
import { Can } from '@/Components/can';
import { Input } from '@/Components/ui/input';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/Components/ui/select';

interface Stats {
    total_items: number;
    total_value: number;
    low_stock_count: number;
    expiring_soon: number;
}

interface Props {
    products: {
        data: (Product & { current_stock: number })[];
    } & PaginationMeta;
    stats: Stats;
    locations: StorageLocationBasic[];
    departments: Department[];
    canViewValuation: boolean;
    filters: {
        search?: string;
        store_id?: string;
        department_id?: string;
    };
}

export default function StockIndex({ products, stats, locations, departments, canViewValuation, filters }: Props) {
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (key === 'department_id' && value !== filters.department_id) {
            delete newFilters.store_id; // Clear store if department changes
        }
        router.get('/inventory/stock', newFilters, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        router.get('/inventory/stock', {}, { replace: true });
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
            header: 'Inventory Health',
            cell: (product) => (
                <div className="flex items-center gap-3">
                    <StockLevelIndicator 
                        currentStock={product.current_stock ?? 0} 
                        reorderLevel={product.reorder_level} 
                    />
                    {product.current_stock <= product.reorder_level && product.current_stock > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 text-[9px] border-0 px-2 uppercase font-black tracking-widest shrink-0">Low</Badge>
                    )}
                    {product.current_stock === 0 && (
                        <Badge variant="destructive" className="text-[9px] px-2 uppercase font-black tracking-widest shrink-0">Out</Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-4',
            cell: (product) => (
                <div className="flex justify-end gap-2 pr-4">
                    <Link href={`/inventory/stock/${product.id}/batches`}>
                        <Button variant="ghost" size="sm" className="h-8 text-slate-600 hover:text-brand hover:bg-brand/5 font-bold text-xs uppercase tracking-wider">
                            Breakdown
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(val);
    };

    return (
        <>
            <Head title="Stock Inventory" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                <PageHeader 
                    title="Stock Inventory" 
                    description="Real-time multi-location stock tracking and valuation."
                >
                    <div className="flex items-center gap-3">
                        <Can permission="stock.view">
                            <Link href={'/inventory/stock-movements'}>
                                <Button variant="outline" size="sm" className="h-9 shadow-sm">
                                    <ArrowRightLeft className="w-4 h-4 mr-2 text-slate-500" />
                                    Movements
                                </Button>
                            </Link>
                        </Can>
                        <Can permission="stock.adjust">
                            <Link href={'/inventory/stock-adjustments'}>
                                <Button size="sm" className="bg-brand hover:bg-brand-dark text-white h-9 shadow-md transition-all active:scale-95">
                                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                                    Adjustments
                                </Button>
                            </Link>
                        </Can>
                    </div>
                </PageHeader>

                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-slate-200/60 shadow-sm overflow-hidden group hover:border-brand/40 transition-colors">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 group-hover:text-brand/70 transition-colors">Total Items</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                    {stats.total_items.toLocaleString()}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-all">
                                <Package className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    {canViewValuation && (
                        <Card className="border-indigo-100 shadow-sm overflow-hidden group hover:border-indigo-300 transition-colors">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-400">Inventory Value</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {formatCurrency(stats.total_value)}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-indigo-50/50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-100 transition-all">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className={`border-amber-100 shadow-sm overflow-hidden group hover:border-amber-300 transition-colors ${stats.low_stock_count > 0 ? 'bg-amber-50/20' : ''}`}>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-500">Low Stock Alerts</p>
                                <p className={`text-2xl font-black tracking-tighter ${stats.low_stock_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {stats.low_stock_count}
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${stats.low_stock_count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-rose-100 shadow-sm overflow-hidden group hover:border-rose-300 transition-colors ${stats.expiring_soon > 0 ? 'bg-rose-50/20' : ''}`}>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-500">Expiring Soon</p>
                                <p className={`text-2xl font-black tracking-tighter ${stats.expiring_soon > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                    {stats.expiring_soon}
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${stats.expiring_soon > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                <Calendar className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Enhanced Filter Bar */}
                <Card className="border-slate-200/60 shadow-md">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search products by name or SKU..." 
                                className="pl-10 h-10 border-slate-200/80 focus:ring-brand/20 transition-all font-medium text-slate-900"
                                defaultValue={filters.search}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilterChange('search', (e.target as HTMLInputElement).value);
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:w-[480px]">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                                <Select 
                                    value={filters.department_id || 'all'} 
                                    onValueChange={(v) => handleFilterChange('department_id', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="h-10 border-slate-200/80 bg-slate-50/30 font-bold text-xs uppercase tracking-widest text-slate-600">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-slate-400 shrink-0" />
                                <Select 
                                    value={filters.store_id || 'all'} 
                                    onValueChange={(v) => handleFilterChange('store_id', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="h-10 border-slate-200/80 bg-slate-50/30 font-bold text-xs uppercase tracking-widest text-slate-600">
                                        <SelectValue placeholder="All Stores" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Stores</SelectItem>
                                        {locations
                                            .filter(loc => !filters.department_id || loc.department_id === filters.department_id)
                                            .map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {(filters.search || filters.store_id || filters.department_id) && (
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
                        emptyMessage="No inventory found in the selected scope. Try adjusting filters."
                        headerBackground="bg-slate-50/50"
                    />
                </div>
            </div>
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
