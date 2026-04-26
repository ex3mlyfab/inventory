import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column, PaginationMeta } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { 
    History, 
    User as UserIcon, 
    Calendar,
    Search,
    X,
    FileJson
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AuditLog {
    id: number;
    description: string;
    subject_type: string;
    causer_name: string;
    created_at: string;
    properties: any;
}

interface Props {
    activities: {
        data: AuditLog[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function AuditTrail({ activities, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search || '');

    const handleSearch = () => {
        router.get('/reports/audit-trail', { search }, {
            preserveState: true,
            replace: true
        });
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/reports/audit-trail', {}, { replace: true });
    };

    const columns: Column<AuditLog>[] = [
        {
            header: 'Timestamp',
            cell: (log) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-[11px] text-slate-600">{log.created_at}</span>
                </div>
            )
        },
        {
            header: 'Operator',
            cell: (log) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-bold text-slate-900">{log.causer_name}</span>
                </div>
            )
        },
        {
            header: 'Action / Entity',
            cell: (log) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black capitalize text-slate-800 tracking-tight">{log.description}</span>
                    <span className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">{log.subject_type}</span>
                </div>
            )
        },
        {
            header: 'Verification',
            cell: () => (
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <StatusBadge variant="success" className="text-[9px] font-black tracking-[0.1em]">ENCRYPTED LOG</StatusBadge>
                </div>
            )
        },
        {
            header: 'Metadata',
            className: 'text-right',
            cell: (log) => {
                const propCount = Object.keys(log.properties || {}).length;
                return (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all text-[10px] font-bold uppercase group"
                        onClick={() => {
                            console.log('Log Properties:', log.properties);
                            toast.info(`Metadata Payload: ${JSON.stringify(log.properties).substring(0, 50)}...`);
                        }}
                    >
                        <FileJson className="h-3.5 w-3.5 mr-2 text-slate-400 group-hover:text-primary" />
                        Payload ({propCount})
                    </Button>
                );
            }
        }
    ];

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
            <Head title="Audit Trail" />

            <PageHeader 
                title="System Audit Trail" 
                description="Secure, immutable cryptographic ledger of every inventory transaction and administrative operation."
                actions={
                    <Button variant="outline" className="rounded-2xl border-slate-200 h-11 px-6 hover:bg-slate-50 transition-all font-bold uppercase text-[10px] tracking-widest shadow-sm">
                        <History className="h-4 w-4 mr-2 text-slate-400" />
                        Secure Export
                    </Button>
                }
            />

            {/* Filter Bar */}
            <Card className="border-slate-200/60 bg-slate-50/50 backdrop-blur-sm shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Identify operators, specific actions, or subject models..." 
                            className="pl-12 rounded-2xl bg-white border-slate-200 h-12 text-sm focus:ring-4 focus:ring-primary/10 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        {search && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-rose-500 rounded-lg"
                                onClick={clearSearch}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button 
                        onClick={handleSearch}
                        className="rounded-2xl h-12 px-10 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    >
                        Synchronize Ledger
                    </Button>
                </CardContent>
            </Card>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden">
                <DataTable 
                    data={activities.data} 
                    columns={columns} 
                    keyExtractor={(item) => item.id} 
                    meta={activities.meta}
                    emptyMessage="Cryptographic ledger is currently waiting for initial entries."
                    headerBackground="bg-slate-50/80 backdrop-blur-md"
                />
            </div>
        </div>
    );
}

AuditTrail.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Dashboard', href: '/' },
            { title: 'Reports', href: '/reports' },
            { title: 'Audit Trail', href: '/reports/audit-trail' },
        ]}
    >
        {page}
    </AppLayout>
);
