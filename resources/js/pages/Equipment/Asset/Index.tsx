import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import equipment from '@/routes/equipment';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
    Wrench, Plus, Search, Filter, X, 
    Monitor, ShieldCheck, AlertCircle, History 
} from 'lucide-react';
import { Asset } from '@/types/equipment';
import { Category, StorageLocationBasic, PaginationMeta } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface Props {
    assets: {
        data: Asset[];
    } & PaginationMeta;
    categories: Category[];
    locations: StorageLocationBasic[];
    filters: {
        search?: string;
        status?: string;
        category_id?: string;
    };
}

export default function AssetIndex({ assets, categories, locations, filters }: Props) {
    const handleFilterChange = (key: string, value: string) => {
        router.get(equipment.assets.index().url, { ...filters, [key]: value }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        router.get(equipment.assets.index().url, {}, { replace: true });
    };

    const statusColors = {
        functional: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        under_maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
        decommissioned: 'bg-slate-100 text-slate-700 border-slate-200',
        lost: 'bg-rose-100 text-rose-700 border-rose-200',
        damaged: 'bg-red-100 text-red-700 border-red-200',
    };

    const columns: Column<Asset>[] = [
        {
            header: 'Asset Info',
            cell: (asset) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-slate-900">{asset.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {asset.asset_tag}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {asset.category?.name}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Manufacturer / Model',
            cell: (asset) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{asset.manufacturer || 'N/A'}</span>
                    <span className="text-xs text-slate-400">{asset.model_number || 'No Model'}</span>
                </div>
            )
        },
        {
            header: 'Location',
            cell: (asset) => (
                <span className="text-sm text-slate-600 font-medium">
                    {asset.storage_location?.name || 'Unassigned'}
                </span>
            )
        },
        {
            header: 'Status',
            cell: (asset) => (
                <Badge variant="outline" className={cn("uppercase text-[10px] font-black tracking-widest px-2.5 py-0.5", statusColors[asset.status])}>
                    {asset.status.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-4',
            cell: (asset) => (
                <div className="flex justify-end gap-2 pr-4">
                    <Link href={equipment.assets.show(asset.id).url}>
                        <Button variant="ghost" size="sm" className="h-8 text-slate-600 hover:text-brand hover:bg-brand/5 font-bold text-xs uppercase tracking-wider">
                            Manage
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Equipment & Assets" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                    <PageHeader 
                        title="Equipment & Assets" 
                        description="Centralized tracking for medical equipment, infrastructure, and facility assets."
                    >
                        <Link href={equipment.assets.create().url}>
                            <Button size="sm" className="bg-brand hover:bg-brand-dark text-white h-9 shadow-md transition-all active:scale-95">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Asset
                            </Button>
                        </Link>
                    </PageHeader>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-emerald-100 bg-emerald-50/10 overflow-hidden group hover:border-emerald-300 transition-colors shadow-sm">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-500">Functional Assets</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {assets.data.filter(a => a.status === 'functional').length}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-100 bg-amber-50/10 overflow-hidden group hover:border-amber-300 transition-colors shadow-sm">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-500">In Service</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {assets.data.filter(a => a.status === 'under_maintenance').length}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                    <Wrench className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-rose-100 bg-rose-50/10 overflow-hidden group hover:border-rose-300 transition-colors shadow-sm">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-500">Damaged/Lost</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {assets.data.filter(a => ['damaged', 'lost'].includes(a.status)).length}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Bar */}
                    <Card className="border-slate-200/60 shadow-md">
                        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search assets by name, tag or SN..." 
                                    className="pl-10 h-10 border-slate-200/80 focus:ring-brand/20 transition-all font-medium text-slate-900"
                                    defaultValue={filters.search}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFilterChange('search', (e.target as HTMLInputElement).value);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:w-[400px]">
                                <Select 
                                    value={filters.status || 'all'} 
                                    onValueChange={(v) => handleFilterChange('status', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="h-10 border-slate-200/80 bg-slate-50/30 font-bold text-xs uppercase tracking-widest text-slate-600">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="functional">Functional</SelectItem>
                                        <SelectItem value="under_maintenance">Maintenance</SelectItem>
                                        <SelectItem value="damaged">Damaged</SelectItem>
                                        <SelectItem value="lost">Lost</SelectItem>
                                        <SelectItem value="decommissioned">Decommissioned</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select 
                                    value={filters.category_id || 'all'} 
                                    onValueChange={(v) => handleFilterChange('category_id', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="h-10 border-slate-200/80 bg-slate-50/30 font-bold text-xs uppercase tracking-widest text-slate-600">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {(filters.search || filters.status || filters.category_id) && (
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
                            data={assets.data}
                            meta={assets}
                            keyExtractor={(a) => a.id}
                            emptyMessage="No equipment found matching the criteria."
                            headerBackground="bg-slate-50/50"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

AssetIndex.layout = (page: React.ReactNode) => {
    // Note: In some versions of Inertia with this boilerplate, it might be an object or a function
    return page;
};

// Manually adding layout property if the above function doesn't work as expected in the specific template
(AssetIndex as any).layout = {
    breadcrumbs: [
        { title: 'Equipment' , href: '#' },
        { title: 'Assets' , href: '#' }
    ],
};
