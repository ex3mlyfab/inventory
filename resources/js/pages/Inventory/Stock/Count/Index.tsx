import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column, PaginationMeta } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    ClipboardList, Plus, Calendar, 
    ChevronRight, MapPin, Loader2, History, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Can } from '@/components/can';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StockTakeSession {
    id: string;
    status: 'draft' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
    completed_at?: string;
    location?: { name: string };
    starter?: { name: string };
    completer?: { name: string };
}

interface Props {
    sessions: {
        data: StockTakeSession[];
    } & PaginationMeta;
    locations: { id: string, name: string }[];
    userLocationId?: string;
}

export default function StockCountIndex({ sessions, locations, userLocationId }: Props) {
    const [isCreating, setIsCreating] = useState(false);
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(userLocationId || '');
    const { errors } = usePage().props;
    
    // Fail-safe: Always re-enable button if errors come back
    React.useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            setIsCreating(false);
        }
    }, [errors]);

    const startNewSession = () => {
        if (!selectedLocation && locations.length > 1) {
            setShowLocationDialog(true);
            return;
        }

        if (!selectedLocation && locations.length === 1) {
            submitSession(locations[0].id);
        } else if (selectedLocation) {
            submitSession(selectedLocation);
        } else {
            // No location assigned and none selectable
            console.error("No location available to start session");
        }
    };

    const submitSession = (locationId: string) => {
        if (!locationId) return;
        
        router.post('/inventory/stock-count', {
            storage_location_id: locationId
        }, {
            onStart: () => setIsCreating(true),
            onSuccess: () => {
                setShowLocationDialog(false);
                setSelectedLocation('');
            },
            onError: () => setIsCreating(false),
            onFinish: () => setIsCreating(false),
        });
    };

    const columns: Column<StockTakeSession>[] = [
        {
            header: 'Session ID',
            cell: (s) => (
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border",
                        s.status === 'draft' ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-400"
                    )}>
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            #{s.id.substring(0, 8)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-bold">
                                {new Date(s.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Store Location',
            cell: (s) => (
                <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-800">{s.location?.name || 'Central Store'}</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (s) => {
                const config = {
                    draft: { label: 'Active Draft', class: 'bg-amber-100/50 text-amber-700 border-amber-200', icon: Clock },
                    completed: { label: 'Finalized', class: 'bg-emerald-100/50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
                    cancelled: { label: 'Void', class: 'bg-slate-100 text-slate-500 border-slate-200', icon: History },
                }[s.status] || { label: s.status, class: '', icon: Clock };
                
                const Icon = config.icon;

                return (
                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase px-2 py-0.5 border flex items-center gap-1 w-fit", config.class)}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                    </Badge>
                );
            }
        },
        {
            header: 'Started By',
            cell: (s) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{s.starter?.name}</span>
                    {s.completer && (
                        <span className="text-[10px] text-slate-400">Finalized by {s.completer.name}</span>
                    )}
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right pr-4',
            cell: (s) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.get(`/inventory/stock-count/${s.id}`)}
                    className="h-8 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    {s.status === 'draft' ? 'Resume Count' : 'View Summary'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            )
        }
    ];

    return (
        <>
            <Head title="Physical Stock Counts" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <PageHeader 
                        title="Physical Inventory Audit" 
                        description="Conduct scheduled or clinical stock takes to ensure system quantities match shelf presence."
                    >
                    <Can permission="stock.count">
                        <Button 
                            className="bg-slate-900 hover:bg-black shadow-lg shadow-slate-200 px-6 font-bold" 
                            onClick={startNewSession}
                            disabled={isCreating}
                        >
                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Start Count Session
                        </Button>
                    </Can>
                    </PageHeader>

                    {errors.error && (
                        <Alert className="bg-rose-50 border-rose-200 text-rose-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-bold text-sm tracking-tight">Audit Initialization Failed</AlertTitle>
                            <AlertDescription className="text-xs font-medium">
                                {errors.error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/40">
                        <DataTable 
                            columns={columns}
                            data={sessions.data}
                            meta={sessions}
                            keyExtractor={(s) => s.id}
                            emptyMessage="No stock take history found. Start a new session to begin auditing."
                            headerBackground="bg-slate-50"
                        />
                    </div>
                </div>
            </div>

            <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-brand" />
                            Select Count Location
                        </DialogTitle>
                        <DialogDescription>
                            Identify the store or storage area being audited today.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Location</Label>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Choose a store..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowLocationDialog(false)}>Cancel</Button>
                        <Button 
                            className="bg-brand hover:bg-brand-dark px-8" 
                            disabled={!selectedLocation || isCreating}
                            onClick={() => submitSession(selectedLocation)}
                        >
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Initialize Count
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

StockCountIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory' , href: '#' },
        { title: 'Stock Operations' , href: '#' },
        { title: 'Physical Audit' , href: '#' }
    ],
};
