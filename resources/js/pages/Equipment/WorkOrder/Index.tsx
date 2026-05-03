import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
    ClipboardList, AlertCircle, Clock, 
    CheckCircle2, User, Hammer, Plus 
} from 'lucide-react';
import { WorkOrder } from '@/types/equipment';
import { PaginationMeta } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
    workOrders: {
        data: WorkOrder[];
    } & PaginationMeta;
    filters: {
        status?: string;
        priority?: string;
    };
}

export default function WorkOrderIndex({ workOrders, filters }: Props) {
    const priorityColors = {
        low: 'bg-slate-100 text-slate-700',
        medium: 'bg-blue-100 text-blue-700',
        high: 'bg-amber-100 text-amber-700',
        urgent: 'bg-rose-100 text-rose-700 animate-pulse',
    };

    const statusColors = {
        pending: 'bg-slate-100 text-slate-600',
        assigned: 'bg-blue-50 text-blue-600',
        in_progress: 'bg-amber-50 text-amber-600',
        completed: 'bg-emerald-50 text-emerald-600',
        cancelled: 'bg-slate-100 text-slate-400',
    };

    const columns: Column<WorkOrder>[] = [
        {
            header: 'Order Details',
            cell: (wo) => (
                <div className="flex flex-col py-1">
                    <span className="font-bold text-slate-900 line-clamp-1">{wo.description}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        Asset: {wo.asset?.name} ({wo.asset?.asset_tag})
                    </span>
                </div>
            )
        },
        {
            header: 'Priority',
            cell: (wo) => (
                <Badge variant="outline" className={cn("uppercase text-[9px] font-black tracking-widest px-2 py-0 border-0", priorityColors[wo.priority])}>
                    {wo.priority}
                </Badge>
            )
        },
        {
            header: 'Status',
            cell: (wo) => (
                <Badge variant="outline" className={cn("capitalize text-[10px] font-bold px-2 py-0", statusColors[wo.status])}>
                    {wo.status.replace('_', ' ')}
                </Badge>
            )
        },
        {
            header: 'Requester',
            cell: (wo) => (
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-slate-400" />
                    </div>
                    <span className="text-xs text-slate-600">{wo.requester?.name}</span>
                </div>
            )
        },
        {
            header: 'Requested On',
            cell: (wo) => <span className="text-sm text-slate-500">{format(new Date(wo.created_at), 'MMM d, h:mm a')}</span>
        },
        {
            header: 'Actions',
            className: 'text-right pr-4',
            cell: (wo) => (
                <div className="flex justify-end pr-4">
                    <Button variant="ghost" size="sm" className="h-8 font-bold text-xs uppercase tracking-wider text-brand">
                        Update
                    </Button>
                </div>
            )
        }
    ];

    return (
        <>
            <Head title="Work Orders" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 pb-12">
                    <PageHeader 
                        title="Maintenance Work Orders" 
                        description="Repair requests, technical issues, and facility maintenance tickets."
                    >
                        <Button size="sm" className="bg-brand hover:bg-brand-dark text-white h-9 shadow-md transition-all active:scale-95">
                            <Plus className="w-4 h-4 mr-2" />
                            New Request
                        </Button>
                    </PageHeader>

                    {/* Kanban-style Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {['pending', 'in_progress', 'completed', 'urgent'].map((stat) => (
                            <Card key={stat} className="border-slate-200/60 shadow-sm">
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{stat.replace('_', ' ')}</p>
                                    <p className="text-2xl font-black text-slate-900">
                                        {stat === 'urgent' 
                                            ? workOrders.data.filter(w => w.priority === 'urgent').length
                                            : workOrders.data.filter(w => w.status === stat).length
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/50">
                        <DataTable 
                            columns={columns}
                            data={workOrders.data}
                            meta={workOrders}
                            keyExtractor={(w) => w.id}
                            emptyMessage="No work orders found."
                            headerBackground="bg-slate-50/50"
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

(WorkOrderIndex as any).layout = {
    breadcrumbs: [
        { title: 'Equipment' , href: '#' },
        { title: 'Work Orders' , href: '#' }
    ],
};
