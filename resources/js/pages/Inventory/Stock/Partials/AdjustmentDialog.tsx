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
import { Product, StockBatch } from '@/types/inventory';
import { Search, Loader2, Package, History, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialProduct?: Product;
    initialBatch?: StockBatch;
}

export function AdjustmentDialog({ isOpen, onClose, initialProduct, initialBatch }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
    
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        stock_batch_id: string;
        quantity: string;
        reason: string;
        notes: string;
        error?: string;
    }>({
        stock_batch_id: initialBatch?.id || '',
        quantity: '',
        reason: 'cycle_count',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (initialProduct) setSelectedProduct(initialProduct);
            if (initialBatch) setData('stock_batch_id', initialBatch.id);
        } else {
            reset();
            clearErrors();
            setSearchTerm('');
            setSearchResults([]);
            if (!initialProduct) setSelectedProduct(null);
        }
    }, [isOpen, initialProduct, initialBatch]);

    const handleSearch = async () => {
        if (searchTerm.length < 2) return;
        
        setIsSearching(true);
        try {
            const response = await fetch(`/inventory/stock-adjustments/search-batches?search=${encodeURIComponent(searchTerm)}`);
            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/stock-adjustments', {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-border shadow-2xl">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-text-primary tracking-tight">Request Stock Adjustment</DialogTitle>
                        <DialogDescription className="text-text-muted font-medium">
                            Create a manual stock adjustment request. This will require manager approval before taking effect.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        {/* Product Selection */}
                        {!initialProduct && !selectedProduct && (
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-text-muted">Find Product</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/50" />
                                        <Input
                                            placeholder="Search product name or SKU..."
                                            className="pl-10 h-11 border-border/60 focus:ring-brand/20 bg-muted/20"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                                        />
                                    </div>
                                    <Button type="button" onClick={handleSearch} disabled={isSearching} className="h-11 px-6 font-bold bg-brand hover:bg-brand-dark">
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                                    </Button>
                                </div>
                                
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-56 overflow-y-auto border border-border/60 rounded-xl divide-y divide-border/40 bg-white/50 backdrop-blur-sm">
                                        {searchResults.map((product) => (
                                            <button
                                                key={product.id}
                                                type="button"
                                                className="w-full text-left p-3 hover:bg-brand/5 transition-all flex justify-between items-center group"
                                                onClick={() => setSelectedProduct(product)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-primary group-hover:text-brand">{product.name}</span>
                                                    <span className="text-[10px] text-text-muted uppercase font-mono tracking-tighter mt-0.5">{product.sku}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/5 px-2 py-1 rounded-full">
                                                        {product.stock_batches?.length || 0} Batches
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedProduct && (
                            <div className="space-y-5">
                                <div className="flex items-center gap-4 p-4 bg-brand/5 rounded-2xl border border-brand/10 transition-all">
                                    <div className="h-12 w-12 rounded-xl bg-brand text-brand-foreground shadow-lg shadow-brand/20 flex items-center justify-center">
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-black text-text-primary leading-tight truncate">{selectedProduct.name}</h4>
                                        <p className="text-[10px] text-text-muted uppercase font-mono mt-1 tracking-widest">{selectedProduct.sku}</p>
                                    </div>
                                    {!initialProduct && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-brand hover:bg-brand/10" 
                                            type="button"
                                            onClick={() => {
                                                setSelectedProduct(null);
                                                setData('stock_batch_id', '');
                                            }}
                                        >
                                            Change
                                        </Button>
                                    )}
                                </div>

                                {/* Batch Selection */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-text-muted">Select Batch to Adjust</Label>
                                    <Select 
                                        value={data.stock_batch_id} 
                                        onValueChange={(val) => setData('stock_batch_id', val)}
                                        disabled={!!initialBatch}
                                    >
                                        <SelectTrigger className="h-11 border-border/60">
                                            <SelectValue placeholder="Select a specific batch..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedProduct.stock_batches?.map((batch) => (
                                                <SelectItem key={batch.id} value={batch.id}>
                                                    <div className="flex justify-between items-center w-full gap-8 py-0.5">
                                                        <span className="font-bold text-sm">{batch.batch_number}</span>
                                                        <span className="text-[10px] font-medium text-text-muted uppercase tracking-tighter bg-muted/50 px-1.5 py-0.5 rounded">
                                                            SOH: {batch.quantity_on_hand} | Exp: {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.stock_batch_id && <p className="text-[10px] text-critical font-black uppercase tracking-tight">{errors.stock_batch_id}</p>}
                                </div>

                                {data.stock_batch_id && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="quantity" className="text-xs font-black uppercase tracking-widest text-text-muted">Adj. Quantity</Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                placeholder="e.g. -5 or 10"
                                                className="h-11 border-border/60 font-bold text-center text-lg"
                                                value={data.quantity}
                                                onChange={(e) => setData('quantity', e.target.value)}
                                            />
                                            <p className="text-[9px] text-text-muted font-medium italic leading-tight">Use negative for deductions (damage, theft) and positive for gains.</p>
                                            {errors.quantity && <p className="text-[10px] text-critical font-black uppercase mt-1">{errors.quantity}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="reason" className="text-xs font-black uppercase tracking-widest text-text-muted">Reason</Label>
                                            <Select 
                                                value={data.reason} 
                                                onValueChange={(val: any) => setData('reason', val)}
                                            >
                                                <SelectTrigger id="reason" className="h-11 border-border/60 font-bold uppercase text-[10px] tracking-widest">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cycle_count" className="font-bold uppercase text-[10px]">Cycle Count</SelectItem>
                                                    <SelectItem value="damage" className="font-bold uppercase text-[10px]">Damage / Breakage</SelectItem>
                                                    <SelectItem value="expiry" className="font-bold uppercase text-[10px]">Expiry Disposal</SelectItem>
                                                    <SelectItem value="theft" className="font-bold uppercase text-[10px]">Theft / Missing</SelectItem>
                                                    <SelectItem value="correction" className="font-bold uppercase text-[10px]">Data Correction</SelectItem>
                                                    <SelectItem value="other" className="font-bold uppercase text-[10px]">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.reason && <p className="text-[10px] text-critical font-black uppercase mt-1">{errors.reason}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-text-muted">Approver Notes (Optional)</Label>
                                    <textarea
                                        id="notes"
                                        className="w-full min-h-[90px] rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-text-muted/40 font-medium"
                                        placeholder="Provide more context for approval..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    />
                                    {errors.notes && <p className="text-[10px] text-critical font-black uppercase">{errors.notes}</p>}
                                </div>
                            </div>
                        )}

                        {errors.error && (
                            <Alert variant="destructive" className="bg-critical/5 border-critical/20 rounded-xl">
                                <AlertCircle className="h-4 w-4 text-critical" />
                                <AlertDescription className="text-[11px] font-black text-critical uppercase tracking-tight">
                                    {errors.error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter className="border-t border-border/50 pt-6 gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="font-bold uppercase tracking-widest text-[10px] text-text-muted">Cancel</Button>
                        <Button 
                            type="submit" 
                            className="bg-brand hover:bg-brand-dark px-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand/20 h-10" 
                            disabled={processing || !data.stock_batch_id || !data.quantity}
                        >
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
