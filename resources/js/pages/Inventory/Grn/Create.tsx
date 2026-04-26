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
} from 'lucide-react';

interface StorageLocation { id: string; name: string; code: string; type: string; }

interface Props {
    suppliers: Pick<Supplier, 'id' | 'name' | 'code' | 'category'>[];
    products: (Pick<Product, 'id' | 'name' | 'sku' | 'is_expirable'> & { unit_of_measure?: { abbreviation: string } })[];
    locations: StorageLocation[];
    defaultGrnRef: string;
    purchaseOrders: any[];
}

export default function GrnCreate({ suppliers, products, locations, defaultGrnRef, purchaseOrders }: Props) {
    const { data, setData, post, processing, errors } = useForm({
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
        setData(d => ({ ...d, purchase_order_id: poId, po_item_id: '', product_id: '', supplier_id: purchaseOrders.find(p => p.id === poId)?.supplier_id || '' }));
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

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title="Receive Goods (GRN)" />

            <div className="flex flex-col gap-4">
                <Link href="/procurement/grn" className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to GRN Register
                </Link>
                <PageHeader
                    title="Record Goods Received"
                    description="Log an inbound stock delivery. A Stock Movement of type 'In' will be created automatically."
                />
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    {/* GRN Reference & Supplier */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">GRN Details</h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="reference" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    GRN Reference No. <span className="text-brand">*</span>
                                </Label>
                                <Input
                                    id="reference"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    className="font-mono bg-muted/30 border-none focus-visible:ring-brand/20"
                                    placeholder="GRN-YYYYMMDD-0001"
                                />
                                <InputError message={errors.reference} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="purchase_order_id" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Link to Purchase Order
                                </Label>
                                <select
                                    id="purchase_order_id"
                                    className="flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    value={data.purchase_order_id}
                                    onChange={(e) => handlePoChange(e.target.value)}
                                >
                                    <option value="">— Direct Receipt (No PO) —</option>
                                    {purchaseOrders.map((po) => (
                                        <option key={po.id} value={po.id}>{po.po_number} ({po.supplier?.name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supplier_id" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Supplier / Vendor
                                </Label>
                                <select
                                    id="supplier_id"
                                    className="flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    disabled={!!data.purchase_order_id}
                                >
                                    <option value="">— No Supplier (Walk-in) —</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                                <InputError message={errors.supplier_id} />
                            </div>

                            {data.purchase_order_id && (
                                <div className="space-y-2">
                                    <Label htmlFor="po_item_id" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                        PO Item <span className="text-brand">*</span>
                                    </Label>
                                    <select
                                        id="po_item_id"
                                        className="flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 ring-2 ring-brand/10"
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
                                    <InputError message={errors.po_item_id} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Product & Batch */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Package className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Product & Batch Info</h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="product_id" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Product <span className="text-brand">*</span>
                                </Label>
                                <select
                                    id="product_id"
                                    className="flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
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
                                <InputError message={errors.product_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="batch_number" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Batch Number
                                    <span className="ml-2 text-[9px] italic text-text-muted font-normal normal-case">
                                        (auto-fills with GRN Ref if blank)
                                    </span>
                                </Label>
                                <Input
                                    id="batch_number"
                                    value={data.batch_number}
                                    onChange={(e) => setData('batch_number', e.target.value)}
                                    placeholder={`Leave blank → ${data.reference || 'GRN-REF'}`}
                                    className="font-mono bg-muted/30 border-none focus-visible:ring-brand/20"
                                />
                                <InputError message={errors.batch_number} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="storage_location_id" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Receiving Location
                                </Label>
                                <select
                                    id="storage_location_id"
                                    className="flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    value={data.storage_location_id}
                                    onChange={(e) => setData('storage_location_id', e.target.value)}
                                >
                                    <option value="">— Select store location —</option>
                                    {locations.map((l) => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                    ))}
                                </select>
                                <InputError message={errors.storage_location_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quantity_received" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Quantity Received <span className="text-brand">*</span>
                                </Label>
                                <Input
                                    id="quantity_received"
                                    type="number"
                                    min="1"
                                    value={data.quantity_received}
                                    onChange={(e) => setData('quantity_received', e.target.value)}
                                    placeholder="0"
                                    className="bg-muted/30 border-none focus-visible:ring-brand/20"
                                />
                                <InputError message={errors.quantity_received} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit_cost" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Unit Cost (₦) <span className="text-brand">*</span>
                                </Label>
                                <Input
                                    id="unit_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.unit_cost}
                                    onChange={(e) => setData('unit_cost', e.target.value)}
                                    placeholder="0.00"
                                    className="bg-muted/30 border-none focus-visible:ring-brand/20"
                                />
                                <InputError message={errors.unit_cost} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manufacturing_date" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Manufacturing Date
                                </Label>
                                <Input
                                    id="manufacturing_date"
                                    type="date"
                                    value={data.manufacturing_date}
                                    onChange={(e) => setData('manufacturing_date', e.target.value)}
                                    className="bg-muted/30 border-none focus-visible:ring-brand/20"
                                />
                                <InputError message={errors.manufacturing_date} />
                            </div>

                            {isExpirable && (
                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                        Expiry Date
                                    </Label>
                                    <Input
                                        id="expiry_date"
                                        type="date"
                                        value={data.expiry_date}
                                        onChange={(e) => setData('expiry_date', e.target.value)}
                                        className="bg-muted/30 border-none focus-visible:ring-brand/20"
                                    />
                                    <InputError message={errors.expiry_date} />
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Receiving Notes
                                </Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Condition of goods on arrival, partial delivery notes, etc."
                                    className="flex min-h-[80px] w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                                />
                                <InputError message={errors.notes} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar — Summary & Submit */}
                <div className="space-y-6">
                    {/* Live total */}
                    {data.quantity_received && data.unit_cost && (
                        <Card className="border-brand/20 bg-brand/5 border-dashed">
                            <CardContent className="p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Batch Value</p>
                                <p className="text-3xl font-extrabold text-brand mt-1">
                                    {new Intl.NumberFormat('en-NG', {
                                        style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
                                    }).format(Number(data.quantity_received) * Number(data.unit_cost))}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    {data.quantity_received} units × ₦{Number(data.unit_cost).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-brand">
                                <BadgeCheck className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Confirm Receipt</span>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex gap-2 items-start">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <p>
                                    Saving this form will <strong>immediately update stock levels</strong> and
                                    log an inbound movement in the audit trail.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    className="w-full bg-brand hover:bg-brand-dark text-brand-foreground shadow-lg h-11"
                                    disabled={processing}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {processing ? 'Saving…' : 'Post GRN'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-text-muted"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
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
