import React, { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Supplier, Product } from '@/types/inventory';
import {
    ArrowLeft, Save, Building2, BadgeCheck, 
    AlertCircle, Package, Boxes, Trash2, Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageLocation { id: string; name: string; code: string; type: string; }

interface Props {
    suppliers: Pick<Supplier, 'id' | 'name' | 'code' | 'category'>[];
    products: (Pick<Product, 'id' | 'name' | 'sku' | 'is_expirable'> & { unit_of_measure?: { abbreviation: string } })[];
    locations: StorageLocation[];
    defaultGrnRef: string;
    purchaseOrders: any[];
}

export default function GrnCreate({ suppliers, products, locations, defaultGrnRef, purchaseOrders }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        reference: defaultGrnRef,
        supplier_id: '',
        purchase_order_id: '', // Used as requisition_id in backend
        storage_location_id: '',
        notes: '',
        items: [] as any[],
    });

    // Handle Requisition Selection
    const handlePoChange = (poId: string) => {
        const po = purchaseOrders.find(p => p.id === poId);
        if (po) {
            const initialItems = po.items.map((item: any) => ({
                requisition_item_id: item.id,
                product_id: item.product_id,
                product_name: item.product?.name,
                sku: item.product?.sku,
                is_expirable: item.product?.is_expirable,
                quantity_approved: item.quantity_approved,
                quantity_remaining: item.quantity_approved - item.quantity_issued,
                quantity_received: item.quantity_approved - item.quantity_issued,
                unit_cost: item.estimated_unit_cost || 0,
                batch_number: '',
                expiry_date: '',
            })).filter((i: any) => i.quantity_remaining > 0);

            setData(d => ({ 
                ...d, 
                purchase_order_id: poId, 
                supplier_id: po.supplier_id || '',
                items: initialItems
            }));
        } else {
            setData(d => ({ ...d, purchase_order_id: '', items: [] }));
        }
    };

    // Update specific item in the list
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Prepare data for backend (rename purchase_order_id to requisition_id)
        const payload = {
            ...data,
            requisition_id: data.purchase_order_id,
        };
        post('/procurement/grn', {
            data: payload
        } as any);
    };

    const totalValue = data.items.reduce((sum, item) => sum + (Number(item.quantity_received) * Number(item.unit_cost)), 0);

    const inputClasses = "h-10 bg-muted/30 border-transparent focus:border-brand/20 focus:ring-brand/5 rounded-lg transition-all text-xs";
    const selectClasses = "flex h-11 w-full rounded-xl border-transparent bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand/20 transition-all appearance-none cursor-pointer";

    return (
        <div className="flex flex-col gap-6 py-6 sm:py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Head title="Receive Goods (GRN)" />

            <div className="flex flex-col gap-4">
                <Link href="/procurement/grn" className="flex items-center text-xs font-black uppercase tracking-widest text-text-muted hover:text-brand transition-colors w-fit group">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Register
                </Link>
                <PageHeader
                    title="Inbound Delivery"
                    description="Record stock receipt from vendors in bulk."
                    className="pb-2"
                />
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3 space-y-6">

                    {/* Header Details */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Source Details</h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">GRN Reference</Label>
                                <Input
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    className={cn(inputClasses, "h-11 font-mono uppercase tracking-tighter")}
                                />
                                <InputError message={errors.reference} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Link to Request</Label>
                                <select
                                    className={selectClasses}
                                    value={data.purchase_order_id}
                                    onChange={(e) => handlePoChange(e.target.value)}
                                >
                                    <option value="">— Direct Receipt (No Request) —</option>
                                    {purchaseOrders.map((po) => (
                                        <option key={po.id} value={po.id}>{po.reference} ({po.supplier?.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Target Store</Label>
                                <select
                                    className={selectClasses}
                                    value={data.storage_location_id}
                                    onChange={(e) => setData('storage_location_id', e.target.value)}
                                    required
                                >
                                    <option value="">— Select Target Store —</option>
                                    {locations.map((l) => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                    ))}
                                </select>
                                <InputError message={errors.storage_location_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bulk Item Table */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Line Items</h3>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted px-3 py-1 bg-white rounded-full border border-border/50">
                                {data.items.length} Items Found
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/5 border-b border-border/50">
                                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted">Item Details</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted w-32">Qty Recv</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted w-32">Unit Cost</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted">Batch / Expiry</th>
                                        <th className="px-4 py-3 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {data.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-text-muted italic text-sm">
                                                No items available. Select a request or add items manually.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.items.map((item, index) => (
                                            <tr key={index} className="group hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-text-primary">{item.product_name}</span>
                                                        <span className="text-[10px] text-text-muted font-mono">{item.sku}</span>
                                                        <span className="mt-1 text-[9px] font-black uppercase text-brand/60">
                                                            Outstanding: {item.quantity_remaining}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity_received}
                                                        max={item.quantity_remaining}
                                                        onChange={(e) => updateItem(index, 'quantity_received', e.target.value)}
                                                        className={cn(inputClasses, "w-full")}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">₦</span>
                                                        <Input
                                                            type="number"
                                                            value={item.unit_cost}
                                                            onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                                            className={cn(inputClasses, "w-full pl-6")}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 space-y-2">
                                                    <Input
                                                        placeholder="Batch Number"
                                                        value={item.batch_number}
                                                        onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                                                        className={cn(inputClasses, "w-full font-mono")}
                                                    />
                                                    {item.is_expirable && (
                                                        <Input
                                                            type="date"
                                                            value={item.expiry_date}
                                                            onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                                                            className={cn(inputClasses, "w-full h-8 text-[10px]")}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(index)}
                                                        className="h-8 w-8 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar — Summary & Actions */}
                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Summary</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Value</span>
                                <span className="text-xl font-black text-text-primary tracking-tighter">
                                    ₦{totalValue.toLocaleString()}
                                </span>
                            </div>

                            <div className="pt-4 border-t border-border/50 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">General Notes</Label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-xl bg-muted/30 border-transparent p-3 text-xs focus:ring-brand/5 focus:border-brand/20 transition-all resize-none"
                                    placeholder="Remarks for this delivery..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardContent className="p-6 space-y-5">
                            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                                <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                                    Posting will update stock levels for <strong>{data.items.length} items</strong>.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full bg-brand hover:bg-brand-dark text-brand-foreground shadow-xl h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                    disabled={processing || data.items.length === 0}
                                >
                                    {processing ? "Processing..." : "Post Goods Receipt"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-11 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                    onClick={() => window.history.back()}
                                >
                                    Discard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}

// @ts-ignore
GrnCreate.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'GRN Register', href: '/procurement/grn' },
        { title: 'Receive Goods', href: '#' },
    ],
};
