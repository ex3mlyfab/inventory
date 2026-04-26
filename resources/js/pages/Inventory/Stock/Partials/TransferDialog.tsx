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
import { Product, StorageLocationBasic } from '@/types/inventory';
import { Search, Loader2, Package, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    locations: StorageLocationBasic[];
}

export function TransferDialog({ isOpen, onClose, locations }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        stock_batch_id: '',
        target_location_id: '',
        quantity: '',
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
            clearErrors();
            setSearchTerm('');
            setSearchResults([]);
            setSelectedProduct(null);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (searchTerm.length < 2) return;
        
        setIsSearching(true);
        try {
            // Reusing the same batch search endpoint as adjustments
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
        post('/inventory/stock-transfers', {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <ArrowRightLeft className="h-4 w-4" />
                            </div>
                            <DialogTitle>Internal Stock Transfer</DialogTitle>
                        </div>
                        <DialogDescription>
                            Move stock immediately between storage locations.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Target Selection */}
                        <div className="space-y-2">
                            <Label>Destination Location</Label>
                            <Select 
                                value={data.target_location_id} 
                                onValueChange={(val) => setData('target_location_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Where are you sending this?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.target_location_id && <p className="text-xs text-critical font-bold">{errors.target_location_id}</p>}
                        </div>

                        {/* Product Selection */}
                        {!selectedProduct && (
                            <div className="space-y-2">
                                <Label>Find Product (Source)</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search source product..."
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                                        />
                                    </div>
                                    <Button type="button" onClick={handleSearch} disabled={isSearching} variant="outline">
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                                    </Button>
                                </div>
                                
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md divide-y shadow-sm">
                                        {searchResults.map((product) => (
                                            <button
                                                key={product.id}
                                                type="button"
                                                className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors flex justify-between items-center"
                                                onClick={() => setSelectedProduct(product)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{product.name}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase">{product.sku}</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-tighter">
                                                    {product.stock_batches?.length || 0} Batches
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedProduct && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border text-sm">
                                    <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-slate-900 leading-none">{selectedProduct.name}</h4>
                                        <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">{selectedProduct.sku}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[10px] font-bold" 
                                        type="button"
                                        onClick={() => {
                                            setSelectedProduct(null);
                                            setData('stock_batch_id', '');
                                        }}
                                    >
                                        Change
                                    </Button>
                                </div>

                                {/* Batch Selection */}
                                <div className="space-y-2">
                                    <Label>Select Batch to Transfer</Label>
                                    <Select 
                                        value={data.stock_batch_id} 
                                        onValueChange={(val) => setData('stock_batch_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select specific batch..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedProduct.stock_batches?.map((batch) => (
                                                <SelectItem key={batch.id} value={batch.id}>
                                                    <div className="flex justify-between items-center w-full gap-4">
                                                        <span className="font-bold text-xs">{batch.batch_number}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            Avail: {batch.quantity_on_hand} | Exp: {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.stock_batch_id && <p className="text-xs text-critical font-bold">{errors.stock_batch_id}</p>}
                                </div>

                                {data.stock_batch_id && (
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Transfer Quantity</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            placeholder="Enter quantity to move..."
                                            value={data.quantity}
                                            onChange={(e) => setData('quantity', e.target.value)}
                                            className="h-10 font-bold"
                                        />
                                        {errors.quantity && <p className="text-xs text-critical font-bold">{errors.quantity}</p>}
                                        
                                        {/* Max helper */}
                                        {(() => {
                                            const batch = selectedProduct.stock_batches?.find(b => b.id === data.stock_batch_id);
                                            if (batch) {
                                                return <p className="text-[10px] text-slate-400 font-medium">Maximum available: {batch.quantity_on_hand}</p>
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {errors.error && (
                            <Alert variant="destructive" className="bg-critical-bg border-critical/20">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs font-bold text-critical">
                                    {errors.error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 px-8" 
                            disabled={processing || !data.stock_batch_id || !data.target_location_id || !data.quantity}
                        >
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Transfer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
