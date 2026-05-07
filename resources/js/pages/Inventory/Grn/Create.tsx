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
    ArrowLeft, Save, Hash, Package,
    Building2, BadgeCheck, AlertCircle,
    Calendar, Receipt, Boxes, MapPin, X
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
        purchase_order_id: '',
        po_item_id: '',
        product_id: '',
        batch_number: '',
        quantity_received: '',
        unit_cost: '',
        manufacturing_date: '',
        expiry_date: '',
        storage_location_id: '',
        notes: '',
    });

    // Handle PO Selection
    const handlePoChange = (poId: string) => {
        setData(d => ({ 
            ...d, 
            purchase_order_id: poId, 
            po_item_id: '', 
            product_id: '', 
            supplier_id: purchaseOrders.find(p => p.id === poId)?.supplier_id || '' 
        }));
    };

    // Handle PO Item Selection
    const handlePoItemChange = (itemId: string) => {
        const po = purchaseOrders.find(p => p.id === data.purchase_order_id);
        const item = po?.items.find((i: any) => i.id === itemId);
        if (item) {
            setData(d => ({
                ...d,
                po_item_id: itemId,
                product_id: item.product_id,
                quantity_received: (item.quantity - item.quantity_received).toString(),
                unit_cost: item.unit_price.toString(),
            }));
        }
    };

    // Show expiry field only for expirable products
    const selectedProduct = products.find((p) => p.id === data.product_id);
    const isExpirable = selectedProduct?.is_expirable ?? false;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/procurement/grn');
    };

    const inputClasses = "h-11 bg-muted/30 border-transparent focus:border-brand/20 focus:ring-brand/5 rounded-xl transition-all";
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
                    description="Record stock receipt from vendors or purchase orders."
                    className="pb-2"
                />
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">

                    {/* Source & Reference */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Source Details</h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="reference" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    GRN Reference <span className="text-brand">*</span>
                                </Label>
                                <Input
                                    id="reference"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    className={cn(inputClasses, "font-mono text-xs uppercase tracking-tighter")}
                                    placeholder="GRN-REF-..."
                                />
                                <InputError message={errors.reference} />
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="purchase_order_id" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Link to Purchase Order
                                </Label>
                                <div className="relative group">
                                    <select
                                        id="purchase_order_id"
                                        className={selectClasses}
                                        value={data.purchase_order_id}
                                        onChange={(e) => handlePoChange(e.target.value)}
                                    >
                                        <option value="">— Direct Receipt (No PO) —</option>
                                        {purchaseOrders.map((po) => (
                                            <option key={po.id} value={po.id}>{po.po_number} ({po.supplier?.name})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                        <ArrowLeft className="h-3.5 w-3.5 rotate-270" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supplier_id" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Supplier / Vendor
                                </Label>
                                <div className="relative group">
                                    <select
                                        id="supplier_id"
                                        className={cn(selectClasses, !!data.purchase_order_id && "opacity-60 cursor-not-allowed bg-muted/50")}
                                        value={data.supplier_id}
                                        onChange={(e) => setData('supplier_id', e.target.value)}
                                        disabled={!!data.purchase_order_id}
                                    >
                                        <option value="">— No Supplier (Walk-in) —</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                        <ArrowLeft className="h-3.5 w-3.5 rotate-270" />
                                    </div>
                                </div>
                                <InputError message={errors.supplier_id} />
                            </div>

                            {data.purchase_order_id && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="po_item_id" className="text-[10px] font-black uppercase tracking-widest text-brand">
                                        Select PO Item <span className="text-brand">*</span>
                                    </Label>
                                    <div className="relative group">
                                        <select
                                            id="po_item_id"
                                            className={cn(selectClasses, "ring-1 ring-brand/20 bg-brand/[0.02]")}
                                            value={data.po_item_id}
                                            onChange={(e) => handlePoItemChange(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Item from PO…</option>
                                            {purchaseOrders.find(p => p.id === data.purchase_order_id)?.items.map((item: any) => (
                                                <option key={item.id} value={item.id} disabled={item.quantity_received >= item.quantity}>
                                                    {item.product?.name} (Ordered: {item.quantity}, Rec: {item.quantity_received})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand">
                                            <ArrowLeft className="h-3.5 w-3.5 rotate-270" />
                                        </div>
                                    </div>
                                    <InputError message={errors.po_item_id} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Item Details */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Package className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Item & Batch</h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="product_id" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Product <span className="text-brand">*</span>
                                </Label>
                                <div className="relative group">
                                    <select
                                        id="product_id"
                                        className={cn(selectClasses, !!data.po_item_id && "opacity-60 cursor-not-allowed bg-muted/50")}
                                        value={data.product_id}
                                        onChange={(e) => setData('product_id', e.target.value)}
                                        disabled={!!data.po_item_id}
                                    >
                                        <option value="">Select a product…</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} — {p.sku}{p.unit_of_measure ? ` (${p.unit_of_measure.abbreviation})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                        <ArrowLeft className="h-3.5 w-3.5 rotate-270" />
                                    </div>
                                </div>
                                <InputError message={errors.product_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="batch_number" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Batch Number
                                </Label>
                                <Input
                                    id="batch_number"
                                    value={data.batch_number}
                                    onChange={(e) => setData('batch_number', e.target.value)}
                                    placeholder={data.reference || "Internal Reference"}
                                    className={cn(inputClasses, "font-mono text-xs uppercase")}
                                />
                                <InputError message={errors.batch_number} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="storage_location_id" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Storage Location
                                </Label>
                                <div className="relative group">
                                    <select
                                        id="storage_location_id"
                                        className={selectClasses}
                                        value={data.storage_location_id}
                                        onChange={(e) => setData('storage_location_id', e.target.value)}
                                    >
                                        <option value="">— Select Target Store —</option>
                                        {locations.map((l) => (
                                            <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                        <ArrowLeft className="h-3.5 w-3.5 rotate-270" />
                                    </div>
                                </div>
                                <InputError message={errors.storage_location_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity_received" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Quantity <span className="text-brand">*</span>
                                </Label>
                                <div className="relative">
                                    <Boxes className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                    <Input
                                        id="quantity_received"
                                        type="number"
                                        min="1"
                                        value={data.quantity_received}
                                        onChange={(e) => setData('quantity_received', e.target.value)}
                                        placeholder="0"
                                        className={cn(inputClasses, "pl-11")}
                                    />
                                </div>
                                <InputError message={errors.quantity_received} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit_cost" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Unit Cost (₦) <span className="text-brand">*</span>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">₦</span>
                                    <Input
                                        id="unit_cost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.unit_cost}
                                        onChange={(e) => setData('unit_cost', e.target.value)}
                                        placeholder="0.00"
                                        className={cn(inputClasses, "pl-11")}
                                    />
                                </div>
                                <InputError message={errors.unit_cost} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manufacturing_date" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Mfg Date
                                </Label>
                                <Input
                                    id="manufacturing_date"
                                    type="date"
                                    value={data.manufacturing_date}
                                    onChange={(e) => setData('manufacturing_date', e.target.value)}
                                    className={inputClasses}
                                />
                                <InputError message={errors.manufacturing_date} />
                            </div>

                            <div className={cn("space-y-2 transition-all", !isExpirable && "opacity-40 grayscale")}>
                                <Label htmlFor="expiry_date" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Expiry Date {isExpirable && <span className="text-brand">*</span>}
                                </Label>
                                <Input
                                    id="expiry_date"
                                    type="date"
                                    value={data.expiry_date}
                                    onChange={(e) => setData('expiry_date', e.target.value)}
                                    className={inputClasses}
                                    disabled={!isExpirable}
                                />
                                <InputError message={errors.expiry_date} />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Receiving Notes
                                </Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Condition of goods, partial delivery notes, etc."
                                    className="flex min-h-[100px] w-full rounded-xl border-transparent bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 focus:border-brand/20 transition-all resize-none"
                                />
                                <InputError message={errors.notes} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar — Actions */}
                <div className="space-y-6">
                    {/* Live Calculation */}
                    {data.quantity_received && data.unit_cost && (
                        <Card className="border-brand/20 bg-brand/[0.02] border-dashed shadow-none">
                            <CardContent className="p-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-2">Estimated Value</p>
                                <p className="text-3xl font-black text-brand tracking-tighter">
                                    {new Intl.NumberFormat('en-NG', {
                                        style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
                                    }).format(Number(data.quantity_received) * Number(data.unit_cost))}
                                </p>
                                <div className="mt-4 pt-4 border-t border-brand/10 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-text-muted uppercase">{data.quantity_received} Units</span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase">@ ₦{Number(data.unit_cost).toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardContent className="p-6 space-y-5">
                            <div className="flex items-center gap-3 text-emerald-600">
                                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <BadgeCheck className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Post to Ledger</span>
                            </div>
                            
                            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                                <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                                    Submitting this form will <strong>immediately update stock levels</strong> and 
                                    log an inbound audit trail.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full bg-brand hover:bg-brand-dark text-brand-foreground shadow-xl h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Posting...
                                        </span>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Post Goods Receipt
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-11 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                    onClick={() => window.history.back()}
                                >
                                    Discard Changes
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

