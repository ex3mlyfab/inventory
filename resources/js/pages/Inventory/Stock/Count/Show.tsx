import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { PageHeader } from '@/Components/shared/page-header';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { 
    Save, CheckCircle2, ArrowLeft, Package, 
    AlertTriangle, Search, Filter, Hash, Calculator, AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/Components/ui/badge';

const Separator = ({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) => (
    <div className={cn("bg-slate-200", orientation === 'horizontal' ? "h-[1px] w-full" : "w-[1px] h-full", className)} />
);

interface StockTakeItem {
    id: string;
    system_quantity: number;
    counted_quantity: number;
    variance: number;
    product: { name: string; sku: string };
    batch: { batch_number: string; expiry_date: string };
}

interface StockTakeSession {
    id: string;
    status: 'draft' | 'completed';
    created_at: string;
    location?: { name: string };
    starter?: { name: string };
    items: StockTakeItem[];
}

interface Props {
    session: StockTakeSession;
}

export default function StockCountShow({ session }: Props) {
    const { errors } = usePage().props;
    const [search, setSearch] = useState('');
    
    const { data, setData, post, processing } = useForm({
        items: (session.items || []).map(item => ({
            id: item.id,
            counted_quantity: item.counted_quantity
        }))
    });

    // Reset form when props change (after save/refresh)
    useEffect(() => {
        setData('items', (session.items || []).map(item => ({
            id: item.id,
            counted_quantity: item.counted_quantity
        })));
    }, [session.items]);

    const updateItemCount = (id: string, value: string) => {
        const qty = parseInt(value) || 0;
        setData('items', data.items.map(item => 
            item.id === id ? { ...item, counted_quantity: qty } : item
        ));
    };

    const saveDraft = () => {
        post(`/inventory/stock-count/${session.id}/update`, {
            preserveScroll: true
        });
    };

    const finalize = () => {
        if (confirm('Are you sure you want to finalize this stock take? Variances will generate adjustment requests.')) {
            router.post(`/inventory/stock-count/${session.id}/complete`);
        }
    };

    const filteredItems = (session.items || []).filter(item => 
        item.product.name.toLowerCase().includes(search.toLowerCase()) ||
        item.batch.batch_number.toLowerCase().includes(search.toLowerCase())
    );

    const totalVariance = data.items.reduce((acc, curr) => {
        const original = (session.items || []).find(i => i.id === curr.id);
        return acc + (curr.counted_quantity - (original?.system_quantity || 0));
    }, 0);

    return (
        <>
            <Head title={`Stock Take - #${session.id.substring(0, 8)}`} />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="h-8 transition-all hover:bg-slate-100">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to List
                        </Button>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            Audit Session ID: {session.id}
                        </span>
                    </div>

                    <PageHeader 
                        title={`Auditing: ${session.location?.name || 'Central Store'}`} 
                        description={`Started on ${new Date(session.created_at).toLocaleString()} by ${session.starter?.name}`}
                    >
                        {session.status === 'draft' && (
                            <div className="flex items-center gap-3">
                                <Button variant="outline" onClick={saveDraft} disabled={processing} className="h-10 border-slate-200 font-bold">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Draft
                                </Button>
                                <Button onClick={finalize} disabled={processing} className="h-10 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Finalize Audit
                                </Button>
                            </div>
                        )}
                    </PageHeader>

                    {errors && Object.keys(errors).length > 0 && (
                        <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-bold">Audit Error</AlertTitle>
                            <AlertDescription className="text-xs font-medium">
                                {Object.values(errors).join(', ')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {session.status === 'draft' && (
                        <Alert className="bg-amber-50 border-amber-200">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800 font-bold">Live Counting Session</AlertTitle>
                            <AlertDescription className="text-amber-700 text-xs">
                                Enter the physical quantity found on the shelves. Discrepancies will be highlighted automatically. 
                                <strong> TIP:</strong> Use Save Draft frequently if you have many items.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-4">
                        {/* Summary Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50 border-b pb-4">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Calculator className="h-4 w-4" />
                                        Audit Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                                        <span className="text-xs text-slate-500 font-bold">Total Batches</span>
                                        <span className="text-sm font-black">{session.items?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                                        <span className="text-xs text-slate-500 font-bold">Net Variance</span>
                                        <span className={cn(
                                            "text-sm font-black",
                                            totalVariance === 0 ? "text-slate-900" : (totalVariance > 0 ? "text-emerald-600" : "text-rose-600")
                                        )}>
                                            {totalVariance > 0 ? '+' : ''}{totalVariance}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs text-slate-500 font-bold">Discrepancies</span>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-black">
                                            {data.items.filter(curr => {
                                                const orig = (session.items || []).find(i => i.id === curr.id);
                                                return curr.counted_quantity !== (orig?.system_quantity || 0);
                                            }).length} Items
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Items Table */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Filter by product name or batch number..." 
                                        className="pl-10 border-slate-200 h-10"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" className="h-10 border-slate-200">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {filteredItems.map(item => {
                                    const formData = data.items.find(i => i.id === item.id);
                                    const variance = (formData?.counted_quantity || 0) - item.system_quantity;
                                    const hasVariance = variance !== 0;

                                    return (
                                        <Card key={item.id} className={cn(
                                            "border-slate-200 transition-all duration-300",
                                            hasVariance ? "border-amber-200 bg-amber-50/20" : "hover:border-slate-300"
                                        )}>
                                            <CardContent className="p-4">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className={cn(
                                                            "h-12 w-12 rounded-xl flex items-center justify-center border transition-colors",
                                                            hasVariance ? "bg-amber-100 border-amber-200 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-400"
                                                        )}>
                                                            <Package className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <h4 className="font-bold text-slate-900 leading-tight">
                                                                {item.product.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight">
                                                                    <Hash className="h-3 w-3" /> {item.batch.batch_number}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
                                                                    EXP: {new Date(item.batch.expiry_date).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8 bg-white/50 p-2 px-4 rounded-lg border border-slate-100">
                                                        <div className="flex flex-col">
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-tighter",
                                                                item.system_quantity === 0 ? "text-rose-500" : "text-slate-400"
                                                            )}>
                                                                {item.system_quantity === 0 ? "System Empty" : "System Qty"}
                                                            </span>
                                                            <span className={cn(
                                                                "text-sm font-bold",
                                                                item.system_quantity === 0 ? "text-rose-600" : "text-slate-900"
                                                            )}>
                                                                {item.system_quantity}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col space-y-1.5 w-24">
                                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Current Count</Label>
                                                            <Input 
                                                                type="number"
                                                                className={cn(
                                                                    "h-8 text-xs font-black transition-all",
                                                                    hasVariance ? "border-amber-300 ring-2 ring-amber-100 ring-offset-0 focus:ring-amber-500" : "border-slate-200 focus:ring-slate-400"
                                                                )}
                                                                value={formData?.counted_quantity}
                                                                onChange={(e) => updateItemCount(item.id, e.target.value)}
                                                                disabled={session.status === 'completed'}
                                                            />
                                                        </div>

                                                        <div className="flex flex-col items-end min-w-[60px]">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Variance</span>
                                                            <span className={cn(
                                                                "text-sm font-black",
                                                                variance === 0 ? "text-slate-400" : (hasVariance ? "text-amber-600" : "text-emerald-600")
                                                            )}>
                                                                {variance > 0 ? '+' : ''}{variance}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

StockCountShow.layout = {
    breadcrumbs: [
        { title: 'Inventory' , href: '#' },
        { title: 'Physical Audit' , href: '/inventory/stock-count' },
        { title: 'Active Session' , href: '#' }
    ],
};
