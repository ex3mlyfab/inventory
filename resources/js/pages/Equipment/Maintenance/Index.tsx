import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Calendar, Wrench, History, CheckCircle2, 
    Clock, AlertTriangle, Hammer, Plus 
} from 'lucide-react';
import { AssetMaintenanceLog } from '@/types/equipment';
import { PaginationMeta } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    logs: {
        data: AssetMaintenanceLog[];
    } & PaginationMeta;
    filters: {
        search?: string;
        type?: string;
    };
    isCalibrationPage: boolean;
}

export default function MaintenanceIndex({ logs, filters, isCalibrationPage }: Props) {
    const pageTitle = isCalibrationPage ? 'Equipment Calibration' : 'Maintenance History';
    const pageDescription = isCalibrationPage 
        ? 'Monitor and record accuracy checks and calibration cycles for precision medical equipment.'
        : 'Track service logs, repairs, and maintenance activities for all assets.';

    const typeColors = {
        routine: 'bg-blue-100 text-blue-700 border-blue-200',
        repair: 'bg-rose-100 text-rose-700 border-rose-200',
        calibration: 'bg-purple-100 text-purple-700 border-purple-200',
        upgrade: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        inspection: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    const statusIcons = {
        completed: <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />,
        in_progress: <Clock className="w-3 h-3 mr-1 text-amber-500" />,
        scheduled: <Calendar className="w-3 h-3 mr-1 text-blue-500" />,
        cancelled: <AlertTriangle className="w-3 h-3 mr-1 text-slate-500" />,
    };

    const columns: Column<AssetMaintenanceLog>[] = [
        {
            header: 'Asset',
            cell: (log) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-slate-900">{log.asset?.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{log.asset?.asset_tag}</span>
                </div>
            )
        },
        {
            header: 'Service Type',
            cell: (log) => (
                <Badge variant="outline" className={cn("uppercase text-[9px] font-black tracking-widest px-2 py-0", typeColors[log.type])}>
                    {log.type}
                </Badge>
            )
        },
        {
            header: 'Date Performed',
            cell: (log) => (
                <div className="flex flex-col">
                    <span className="text-sm text-slate-700 font-medium">
                        {format(new Date(log.performed_at), 'PPP')}
                    </span>
                    {log.next_due_at && (
                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">
                            Next Due: {format(new Date(log.next_due_at), 'MMM d, yyyy')}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Performed By',
            cell: (log) => <span className="text-sm text-slate-600">{log.performed_by || 'Unknown'}</span>
        },
        {
            header: 'Status',
            cell: (log) => (
                <div className="flex items-center">
                    {statusIcons[log.status]}
                    <span className="text-xs font-bold text-slate-600 capitalize">{log.status.replace('_', ' ')}</span>
                </div>
            )
        },
        {
            header: 'Cost',
            className: 'text-right',
            cell: (log) => (
                <span className="font-bold text-slate-900">
                    ₦{Number(log.cost).toLocaleString()}
                </span>
            )
        }
    ];

    return (
        <>
            <Head title={pageTitle} />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                    <PageHeader 
                        title={pageTitle} 
                        description={pageDescription}
                    >
                        <Button size="sm" className="bg-brand hover:bg-brand-dark text-white h-9 shadow-md transition-all active:scale-95">
                            <Plus className="w-4 h-4 mr-2" />
                            {isCalibrationPage ? 'Log Calibration' : 'Log Service'}
                        </Button>
                    </PageHeader>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-blue-100 shadow-sm group hover:border-blue-300 transition-all">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-blue-400">Total Logs</p>
                                    <p className="text-xl font-black text-slate-900">{logs.data.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                        {/* More stats could go here */}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/50">
                        <DataTable 
                            columns={columns}
                            data={logs.data}
                            meta={logs}
                            keyExtractor={(l) => l.id}
                            emptyMessage="No maintenance records found."
                            headerBackground="bg-slate-50/50"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

(MaintenanceIndex as any).layout = (page: any) => {
    return page;
};

(MaintenanceIndex as any).layoutProps = (props: any) => ({
    breadcrumbs: [
        { title: 'Equipment' , href: '#' },
        { title: props.isCalibrationPage ? 'Calibration' : 'Maintenance' , href: '#' }
    ],
});
