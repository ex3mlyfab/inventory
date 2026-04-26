import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Supplier, Product, PurchaseOrder } from '@/types/inventory';
import {
    ArrowLeft, Save, Plus, Trash2,
    ShoppingCart, Building2, Package, Hash,
    AlertCircle
} from 'lucide-react';

interface Props {
    order: PurchaseOrder;
    suppliers: Pick<Supplier, 'id' | 'name' | 'code'>[];
    products: (Pick<Product, 'id' | 'name' | 'sku'> & { unit_of_measure?: { abbreviation: string } })[];
}

export default function PurchaseOrderEdit({ order, suppliers, products }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        supplier_id: order.supplier_id,
        po_number: order.po_number,
        notes: order.notes ?? '',
        items: order.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product?.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
        })),
    });

    const addItem = () => {
        setData('items', [...data.items, { product_id: '', product_name: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const updateItem = (index: number, key: string, value: any) => {
        const newItems = [...data.items];
        if (key === 'product_id') {
            const p = products.find(prod => prod.id === value);
            newItems[index].product_id = value;
            newItems[index].product_name = p?.name ?? '';
        } else {
            newItems[index][key] = value;
        }
        setData('items', newItems);
    };

    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/procurement/purchase-orders/${order.id}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title={`Edit Order ${order.po_number}`} />

            <div className="flex flex-col gap-4">
                <Link href={`/procurement/purchase-orders/${order.id}`} className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Order Details
                </Link>
                <PageHeader
                    title={`Edit Order: ${order.po_number}`}
                    description="Modifier existing order details before submission or approval."
                />
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Details */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Order Reference</h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="po_number" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">PO Number <span className="text-brand">*</span></Label>
                                <Input
                                    id="po_number"
                                    value={data.po_number}
                                    onChange={(e) => setData('po_number', e.target.value)}
                                    className="font-mono bg-muted/30 border-none focus-visible:ring-brand/20"
                                />
                                <InputError message={errors.po_number} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supplier_id" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Supplier <span className="text-brand">*</span></Label>
                                <select
                                    id="supplier_id"
                                    className="flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                >
                                    <option value="">Select Supplier…</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                                <InputError message={errors.supplier_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-brand" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Order Items</h3>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 border-brand/20 text-brand">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add Product
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/10">
                                    <tr className="border-b border-border/30 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                                        <th className="px-6 py-3">Product</th>
                                        <th className="px-3 py-3 w-32">Quantity</th>
                                        <th className="px-3 py-3 w-40">Unit Price (₦)</th>
                                        <th className="px-3 py-3 w-40 text-right">Total (₦)</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {data.items.map((item, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="px-6 py-4">
                                                <select
                                                    className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 font-medium"
                                                    value={item.product_id}
                                                    onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                                                >
                                                    <option value="">Select Product…</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                    ))}
                                                </select>
                                                <InputError message={errors[`items.${idx}.product_id`] as string} />
                                            </td>
                                            <td className="px-3 py-4">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                                    className="bg-muted/10 border-none h-8 text-sm focus-visible:ring-brand/20"
                                                />
                                            </td>
                                            <td className="px-3 py-4">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value))}
                                                    className="bg-muted/10 border-none h-8 text-sm focus-visible:ring-brand/20"
                                                />
                                            </td>
                                            <td className="px-3 py-4 text-right text-sm font-bold font-mono">
                                                {formatCurrency(item.quantity * item.unit_price)}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {data.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(idx)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <div className="space-y-2 px-2">
                        <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Additional Notes</Label>
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="flex min-h-[100px] w-full rounded-xl border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                            placeholder="Terms, delivery instructions, etc."
                        />
                        <InputError message={errors.notes} />
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border-brand/20 bg-brand/5 border-dashed">
                        <CardContent className="p-6 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Total Order Value</p>
                            <p className="text-4xl font-extrabold text-brand mt-2 font-mono">
                                {formatCurrency(totalAmount)}
                            </p>
                            <p className="text-xs text-text-muted mt-2 italic">Excluding taxes & shipping</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-brand">
                                <Save className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Action Center</span>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                                <p>Saving changes will preserve current order status. If order was rejected, it must be re-submitted for approval.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button className="w-full bg-brand hover:bg-brand-dark text-white h-11" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full text-text-muted" onClick={() => window.history.back()}>
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
PurchaseOrderEdit.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/purchase-orders' },
        { title: 'Edit Order', href: '#' },
    ],
};
