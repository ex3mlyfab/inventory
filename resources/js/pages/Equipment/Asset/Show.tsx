import React from 'react';
import { Head, Link } from '@inertiajs/react';
import equipment from '@/routes/equipment';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Wrench, Calendar, History, ShieldCheck, 
    Info, MapPin, Tag, Barcode, DollarSign,
    Plus, ArrowLeft, MoreHorizontal, FileText
} from 'lucide-react';
import { Asset, AssetMaintenanceLog } from '@/types/equipment';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    asset: Asset & {
        maintenance_logs: AssetMaintenanceLog[];
    };
}

export default function AssetShow({ asset }: Props) {
    const statusColors = {
        functional: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        under_maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
        decommissioned: 'bg-slate-100 text-slate-700 border-slate-200',
        lost: 'bg-rose-100 text-rose-700 border-rose-200',
        damaged: 'bg-red-100 text-red-700 border-red-200',
    };

    const logColumns: Column<AssetMaintenanceLog>[] = [
        {
            header: 'Date',
            cell: (log) => format(new Date(log.performed_at), 'MMM d, yyyy')
        },
        {
            header: 'Type',
            cell: (log) => (
                <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest px-2 py-0">
                    {log.type}
                </Badge>
            )
        },
        {
            header: 'Status',
            cell: (log) => <span className="text-xs font-bold capitalize text-slate-600">{log.status}</span>
        },
        {
            header: 'Performed By',
            cell: (log) => <span className="text-sm text-slate-600">{log.performed_by}</span>
        },
        {
            header: 'Cost',
            className: 'text-right',
            cell: (log) => <span className="font-bold">₦{Number(log.cost).toLocaleString()}</span>
        }
    ];

    return (
        <>
            <Head title={`Asset: ${asset.name}`} />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
                <div className="flex items-center gap-2 mb-2">
                    <Link href={equipment.assets.index().url} className="text-slate-400 hover:text-brand transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asset Details</span>
                </div>

                <PageHeader 
                    title={asset.name} 
                    description={`${asset.manufacturer || ''} ${asset.model_number || ''}`}
                >
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 font-bold text-xs uppercase tracking-widest text-slate-600">
                            Edit Asset
                        </Button>
                        <Button size="sm" className="bg-brand hover:bg-brand-dark text-white h-9 shadow-md transition-all active:scale-95">
                            <Plus className="w-4 h-4 mr-2" />
                            Log Service
                        </Button>
                    </div>
                </PageHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Card */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-200 flex flex-row items-center justify-between py-3 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5" /> Technical Specifications
                                </CardTitle>
                                <Badge className={cn("uppercase text-[10px] font-black tracking-widest px-2.5 py-0.5", statusColors[asset.status])}>
                                    {asset.status.replace('_', ' ')}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Tag className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Asset Tag</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">{asset.asset_tag}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Barcode className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Serial Number</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 font-mono">{asset.serial_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Primary Location</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{asset.storage_location?.name || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6 bg-slate-50/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Purchase Date</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">
                                                {asset.purchase_date ? format(new Date(asset.purchase_date), 'PPP') : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Warranty Expiry</span>
                                            </div>
                                            <span className={cn("text-sm font-bold", asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date() ? "text-rose-500" : "text-emerald-600")}>
                                                {asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'PPP') : 'No Warranty'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <DollarSign className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Purchase Cost</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">₦{Number(asset.purchase_cost).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Maintenance History */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <History className="h-4 w-4" /> Maintenance History
                                </h3>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/50">
                                <DataTable 
                                    columns={logColumns}
                                    data={asset.maintenance_logs || []}
                                    keyExtractor={(l) => l.id}
                                    emptyMessage="No maintenance records found for this asset."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Notes & Stats */}
                    <div className="space-y-8">
                        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" /> Additional Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    {asset.notes || 'No additional notes provided for this asset.'}
                                </p>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-slate-900 rounded-2xl shadow-2xl space-y-6 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                                <Wrench className="h-24 w-24 text-white" />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand">Service Overview</p>
                                <p className="text-2xl font-black text-white tracking-tighter">Maintenance Metrics</p>
                            </div>
                            <div className="relative z-10 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Services</p>
                                    <p className="text-xl font-black text-white">{asset.maintenance_logs?.length || 0}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lifetime Cost</p>
                                    <p className="text-xl font-black text-white">₦{asset.maintenance_logs?.reduce((acc, log) => acc + Number(log.cost), 0).toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

(AssetShow as any).layout = {
    breadcrumbs: [
        { title: 'Equipment', href: equipment.assets.index().url },
        { title: 'Assets', href: equipment.assets.index().url },
        { title: 'Details' , href: '#' }
    ],
};
