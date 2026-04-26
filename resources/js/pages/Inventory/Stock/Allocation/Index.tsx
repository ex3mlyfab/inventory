import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/Components/shared/page-header';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Product, StorageLocationBasic } from '@/types/inventory';
import { 
    Plus, Trash2, Save, Package, Store, 
    Calendar, Hash, Scale, DollarSign, AlertTriangle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Props {
    locations: StorageLocationBasic[];
    products: Product[];
}

interface AllocationItem {
    product_id: string;
    batch_number: string;
    expiry_date: string;
    quantity: string;
    unit_cost: string;
}

export default function InitialAllocation({ locations, products }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        storage_location_id: locations.length === 1 ? locations[0].id : '',
        items: [
            { product_id: '', batch_number: '', expiry_date: '', quantity: '', unit_cost: '' }
        ] as AllocationItem[]
    });

    const addItem = () => {
        setData('items', [
            ...data.items,
            { product_id: '', batch_number: '', expiry_date: '', quantity: '', unit_cost: '' }
        ]);
    };

    const removeItem = (index: number) => {
        if (data.items.length === 1) return;
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const updateItem = (index: number, field: keyof AllocationItem, value: string) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/initial-allocation');
    };

    return (
        <>
            <Head title="Initial Stock Allocation" />

            <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <PageHeader 
                        title="Initial Stock Takeover" 
                        description="Record existing physical stock for store setup. This creates opening balances for your inventory."
                    />

                    <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 font-bold">Important Notice</AlertTitle>
                        <AlertDescription className="text-amber-700 text-xs">
                            Use this tool ONLY for initial system setup or bulk data takeover. For regular stock additions, 
                            please use the <strong>Goods Received (GRN)</strong> workflow.
                        </AlertDescription>
                    </Alert>

                    <form onSubmit={submit} className="space-y-6 pb-20">
                        {/* Header Section: Store Selection */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                    <Store className="h-4 w-4 text-brand" />
                                    Target Storage Location
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Select the warehouse or department store where the stock is currently physically present.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-md">
                                    <Select 
                                        value={data.storage_location_id} 
                                        onValueChange={(v) => setData('storage_location_id', v)}
                                    >
                                        <SelectTrigger className="h-11 border-slate-200 font-bold">
                                            <SelectValue placeholder="Select location..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    {loc.name} ({loc.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.storage_location_id && (
                                        <p className="mt-1.5 text-xs text-rose-600 font-bold">{errors.storage_location_id}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                                    Physical Stock Entries
                                </h3>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={addItem}
                                    className="h-8 border-brand/20 text-brand font-bold hover:bg-brand/5"
                                >
                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                    Add Row
                                </Button>
                            </div>

                            {data.items.map((item, index) => (
                                <Card key={index} className="border-slate-200 overflow-hidden group">
                                    <div className="bg-slate-50 border-b p-2 px-4 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Entry #{index + 1}
                                        </span>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => removeItem(index)}
                                            className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 transition-colors"
                                            disabled={data.items.length === 1}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            {/* Product Selection */}
                                            <div className="md:col-span-4 space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-500 flex items-center gap-1">
                                                    <Package className="h-3 w-3" /> Product
                                                </Label>
                                                <Select 
                                                    value={item.product_id} 
                                                    onValueChange={(v) => updateItem(index, 'product_id', v)}
                                                >
                                                    <SelectTrigger className="h-9 border-slate-200 font-bold text-xs ring-0">
                                                        <SelectValue placeholder="Identify product..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold">{p.name}</span>
                                                                    <span className="text-[10px] text-slate-400 uppercase">{p.sku}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors[`items.${index}.product_id` as keyof typeof errors] && (
                                                    <p className="text-[10px] text-rose-600 font-bold">{errors[`items.${index}.product_id` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            {/* Batch Details */}
                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-500 flex items-center gap-1">
                                                    <Hash className="h-3 w-3" /> Batch #
                                                </Label>
                                                <Input 
                                                    className="h-9 font-mono text-xs border-slate-200"
                                                    placeholder="BN-XXXX"
                                                    value={item.batch_number}
                                                    onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                                                />
                                                {errors[`items.${index}.batch_number` as keyof typeof errors] && (
                                                    <p className="text-[10px] text-rose-600 font-bold">{errors[`items.${index}.batch_number` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Expiry
                                                </Label>
                                                <Input 
                                                    type="date"
                                                    className="h-9 text-xs border-slate-200"
                                                    value={item.expiry_date}
                                                    onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                                                />
                                            </div>

                                            {/* Quantities */}
                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-500 flex items-center gap-1">
                                                    <Scale className="h-3 w-3" /> Qty (SOH)
                                                </Label>
                                                <Input 
                                                    type="number"
                                                    className="h-9 font-black text- brand border-slate-200"
                                                    placeholder="0"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                />
                                                {errors[`items.${index}.quantity` as keyof typeof errors] && (
                                                    <p className="text-[10px] text-rose-600 font-bold">{errors[`items.${index}.quantity` as keyof typeof errors]}</p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-tight text-slate-500 flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" /> Unit Cost
                                                </Label>
                                                <Input 
                                                    type="number"
                                                    step="0.01"
                                                    className="h-9 border-slate-200"
                                                    placeholder="0.00"
                                                    value={item.unit_cost}
                                                    onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Footer Section */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-center z-50">
                            <div className="max-w-7xl w-full flex justify-end gap-3 px-8">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className="font-bold text-slate-500 h-11"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-brand hover:bg-brand-dark px-12 h-11 font-black shadow-lg shadow-brand/20 transition-all active:scale-95"
                                >
                                    {processing ? 'Processing...' : 'Finalize Allocation'}
                                    {!processing && <Save className="ml-2 h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

InitialAllocation.layout = {
    breadcrumbs: [
        { title: 'Inventory' , href: '#' },
        { title: 'System Setup' , href: '#' },
        { title: 'Takeover Allocation' , href: '#' }
    ],
};
