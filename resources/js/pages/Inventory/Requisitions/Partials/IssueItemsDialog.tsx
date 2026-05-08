import React, { useState, useEffect, useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Requisition, RequisitionItem, StockBatch } from '@/types/inventory';
import { Loader2, Package, CheckCircle2, AlertCircle, Hash, Search, User, Eraser, PenLine } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requisition: Requisition & { items: RequisitionItem[] };
}

interface IssuanceRow {
    requisition_item_id: string;
    product_id: string;
    product_name: string;
    quantity_approved: number;
    quantity_issued: number;
    selected_batch_id: string;
    issue_quantity: number;
    available_batches: StockBatch[];
}

// --- Signature Pad Component ---
const SignaturePad = ({ onSave, onClear }: { onSave: (data: string) => void, onClear: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#0f172a'; // Slate 900
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        if (e.type === 'mousedown' || e.type === 'touchstart') {
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onClear();
    };

    return (
        <div className="space-y-2">
            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    className="w-full h-[150px] bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-crosshair touch-none transition-colors group-hover:border-brand/30"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={clear}
                    className="absolute top-2 right-2 h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                >
                    <Eraser className="h-3 w-3 mr-1.5" /> Clear
                </Button>
                {!isDrawing && canvasRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <PenLine className="h-8 w-8 text-slate-400" />
                    </div>
                )}
            </div>
        </div>
    );
};

export function IssueItemsDialog({ isOpen, onClose, requisition }: Props) {
    const { props } = usePage();
    const [rows, setRows] = useState<IssuanceRow[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        issuances: { requisition_item_id: string, stock_batch_id: string, quantity: number }[];
        collector_name: string;
        collector_signature: string;
        error?: string;
    }>({
        issuances: [] as { requisition_item_id: string, stock_batch_id: string, quantity: number }[],
        collector_name: requisition.requester?.name || '',
        collector_signature: '' as string,
    });

    useEffect(() => {
        if (isOpen) {
            fetchBatches();
            setData({
                issuances: [],
                collector_name: requisition.requester?.name || '',
                collector_signature: ''
            });
        } else {
            setRows([]);
            reset();
            clearErrors();
        }
    }, [isOpen]);

    const fetchBatches = async () => {
        setIsLoadingBatches(true);
        try {
            const newRows: IssuanceRow[] = [];
            for (const item of requisition.items) {
                if (item.quantity_approved <= item.quantity_issued) continue;

                const response = await fetch(`/inventory/stock-adjustments/search-batches?search=${encodeURIComponent(item.product?.name || '')}`);
                const products = await response.json();
                
                const product = products.find((p: any) => p.id === item.product_id);
                const locationBatches = (product?.stock_batches || []).filter((b: any) => 
                    b.storage_location_id === requisition.issuing_location_id
                );

                newRows.push({
                    requisition_item_id: item.id,
                    product_id: item.product_id,
                    product_name: item.product?.name || 'Unknown',
                    quantity_approved: item.quantity_approved,
                    quantity_issued: item.quantity_issued,
                    selected_batch_id: '',
                    issue_quantity: item.quantity_approved - item.quantity_issued,
                    available_batches: locationBatches
                });
            }
            setRows(newRows);
        } catch (error) {
            console.error('Failed to fetch batches', error);
        } finally {
            setIsLoadingBatches(false);
        }
    };

    const updateRow = (index: number, field: keyof IssuanceRow, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);

        setData('issuances', newRows
            .filter(r => r.selected_batch_id && r.issue_quantity > 0)
            .map(r => ({
                requisition_item_id: r.requisition_item_id,
                stock_batch_id: r.selected_batch_id,
                quantity: r.issue_quantity
            }))
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/procurement/requisitions/${requisition.id}/issue`, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
                <form onSubmit={submit} className="flex flex-col h-full overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand shadow-sm">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">Issue Requisition Items</DialogTitle>
                                <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                    Fulfill request • {requisition.reference}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        {isLoadingBatches ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-brand/40" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identifying local stock...</p>
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="text-center py-10">
                                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-500">No pending items found for issuance.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-brand" /> Batch Selection
                                    </h4>
                                    {rows.map((row, index) => (
                                        <div key={row.requisition_item_id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 hover:bg-white hover:shadow-md transition-all duration-300">
                                            <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900">{row.product_name}</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                                        Approved: <span className="text-slate-900">{row.quantity_approved}</span> | Pending: <span className="text-brand">{row.quantity_approved - row.quantity_issued}</span>
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="bg-white border-slate-200 text-[9px] font-black uppercase tracking-widest px-2 shadow-sm">
                                                    Item {index + 1}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                                <div className="sm:col-span-8 space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Identify Batch</Label>
                                                    <Select 
                                                        value={row.selected_batch_id} 
                                                        onValueChange={(val) => updateRow(index, 'selected_batch_id', val)}
                                                    >
                                                        <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl shadow-sm hover:border-brand/40 transition-colors">
                                                            <SelectValue placeholder="Search available stock..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {row.available_batches.length === 0 ? (
                                                                <div className="p-4 text-center">
                                                                    <AlertCircle className="h-5 w-5 text-rose-400 mx-auto mb-2" />
                                                                    <div className="text-[10px] text-rose-500 font-black uppercase">Out of Stock!</div>
                                                                </div>
                                                            ) : row.available_batches.map(batch => (
                                                                <SelectItem key={batch.id} value={batch.id} className="rounded-lg my-1">
                                                                    <div className="flex items-center justify-between w-full gap-8">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black text-xs uppercase tracking-tight text-slate-900">{batch.batch_number}</span>
                                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Expires: {batch.expiry_date || 'N/A'}</span>
                                                                        </div>
                                                                        <Badge className="bg-brand/10 text-brand text-[10px] font-black border-0">
                                                                            {batch.quantity_on_hand} Avl.
                                                                        </Badge>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="sm:col-span-4 space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Issue Qty</Label>
                                                    <div className="relative">
                                                        <Input 
                                                            type="number"
                                                            className="h-11 bg-white font-black text-brand border-slate-200 rounded-xl pr-12 shadow-sm focus:ring-brand/10 focus:border-brand/40"
                                                            value={row.issue_quantity}
                                                            onChange={(e) => updateRow(index, 'issue_quantity', parseInt(e.target.value) || 0)}
                                                            max={row.quantity_approved - row.quantity_issued}
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">PCS</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-brand/[0.03] rounded-3xl border border-brand/10 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> Collector Verification
                                        </h4>
                                        <Badge className="bg-brand text-white text-[9px] font-black uppercase tracking-widest px-3 border-0">Required</Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                                                <User className="h-3 w-3" /> Full Name of Collector
                                            </Label>
                                            <Input 
                                                placeholder="Enter person collecting stock..."
                                                className="h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm focus:ring-brand/10 focus:border-brand/40"
                                                value={data.collector_name}
                                                onChange={(e) => setData('collector_name', e.target.value)}
                                            />
                                            {errors.collector_name && <p className="text-[10px] text-rose-500 font-bold">{errors.collector_name}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                                                <PenLine className="h-3 w-3" /> Digital Signature
                                            </Label>
                                            <SignaturePad 
                                                onSave={(sig) => setData('collector_signature', sig)}
                                                onClear={() => setData('collector_signature', '')}
                                            />
                                            <p className="text-[9px] text-slate-400 font-bold leading-tight mt-1 ml-1 uppercase tracking-wider">
                                                By signing above, the collector acknowledges receipt of the physical items listed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {errors.error && (
                            <Alert variant="destructive" className="bg-rose-50 border-rose-200 rounded-2xl">
                                <AlertCircle className="h-4 w-4 text-rose-600" />
                                <AlertDescription className="text-[11px] font-bold text-rose-700 leading-snug">
                                    {errors.error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter className="p-6 pt-4 border-t bg-slate-50/50">
                        <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-8 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200/50">Cancel</Button>
                        <Button 
                            type="submit" 
                            className="bg-brand hover:bg-brand-dark px-10 h-11 transition-all active:scale-95 shadow-xl shadow-brand/20 rounded-xl font-black uppercase tracking-widest text-[10px]" 
                            disabled={processing || isLoadingBatches || data.issuances.length === 0 || !data.collector_name}
                        >
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Verify & Finalize
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

