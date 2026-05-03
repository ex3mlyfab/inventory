import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
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
import { Loader2, Package, CheckCircle2, AlertCircle, Hash, Search } from 'lucide-react';
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

export function IssueItemsDialog({ isOpen, onClose, requisition }: Props) {
    const [rows, setRows] = useState<IssuanceRow[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        issuances: [] as { requisition_item_id: string, stock_batch_id: string, quantity: number }[],
        release_form: null as File | null
    });

    useEffect(() => {
        if (isOpen) {
            fetchBatches();
        } else {
            setRows([]);
            reset();
            clearErrors();
        }
    }, [isOpen]);

    const fetchBatches = async () => {
        setIsLoadingBatches(true);
        try {
            // We need active batches for all products in the requisition from the ISSUING store
            const newRows: IssuanceRow[] = [];
            
            for (const item of requisition.items) {
                if (item.quantity_approved <= item.quantity_issued) continue;

                // Search for batches for this product in the issuing location
                const response = await fetch(`/inventory/stock-adjustments/search-batches?search=${encodeURIComponent(item.product?.name || '')}`);
                const products = await response.json();
                
                // Find our specific product among search results
                const product = products.find((p: any) => p.id === item.product_id);
                // Filter batches for ONLY the issuing location
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

        // Update form data
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
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                <form onSubmit={submit} className="flex flex-col h-full">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                <Package className="h-4 w-4" />
                            </div>
                            <DialogTitle>Issue Requisition Items</DialogTitle>
                        </div>
                        <DialogDescription>
                            Fulfill the request by selecting physical batches from your store.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-grow overflow-y-auto py-6 space-y-6">
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
                            <div className="space-y-4">
                                {rows.map((row, index) => (
                                    <div key={row.requisition_item_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-start justify-between mb-3 border-b border-slate-200/50 pb-3">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900">{row.product_name}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                                    Required: <span className="text-slate-900">{row.quantity_approved - row.quantity_issued}</span> more
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="bg-white border-slate-200 text-[10px] font-black uppercase">
                                                Item #{index + 1}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-8 space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Select Batch</Label>
                                                <Select 
                                                    value={row.selected_batch_id} 
                                                    onValueChange={(val) => updateRow(index, 'selected_batch_id', val)}
                                                >
                                                    <SelectTrigger className="h-9 bg-white border-slate-200">
                                                        <SelectValue placeholder="Identify source batch..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {row.available_batches.length === 0 ? (
                                                            <div className="p-2 text-xs text-rose-500 font-bold">No stock available in this store!</div>
                                                        ) : row.available_batches.map(batch => (
                                                            <SelectItem key={batch.id} value={batch.id}>
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <span className="font-bold text-xs uppercase">{batch.batch_number}</span>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        Avl: {batch.quantity_on_hand} | Exp: {batch.expiry_date}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-4 space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Qty to Issue</Label>
                                                <Input 
                                                    type="number"
                                                    className="h-9 bg-white font-black text-brand border-slate-200"
                                                    value={row.issue_quantity}
                                                    onChange={(e) => updateRow(index, 'issue_quantity', parseInt(e.target.value) || 0)}
                                                    max={row.quantity_approved - row.quantity_issued}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {rows.length > 0 && (
                                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/50 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                                            <Search className="h-3 w-3" /> Proof of Issuance
                                        </Label>
                                        <Input 
                                            type="file" 
                                            className="h-10 bg-white border-amber-200 file:text-[10px] file:font-bold file:uppercase file:bg-amber-100 file:border-0 file:rounded file:px-2 file:mr-2"
                                            onChange={(e) => setData('release_form', e.target.files?.[0] || null)}
                                            accept="image/*,.pdf"
                                        />
                                        <p className="text-[9px] text-amber-600 font-bold leading-tight">
                                            Optional: Upload the signed release form now to mark the movement as fully documented.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {errors.error && (
                            <Alert variant="destructive" className="bg-rose-50 border-rose-200">
                                <AlertCircle className="h-4 w-4 text-rose-600" />
                                <AlertDescription className="text-xs font-bold text-rose-700">
                                    {errors.error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button 
                            type="submit" 
                            className="bg-brand hover:bg-brand-dark px-10 h-11 transition-all active:scale-95 shadow-lg shadow-brand/20" 
                            disabled={processing || isLoadingBatches || data.issuances.length === 0}
                        >
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Finalize Issuance
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
