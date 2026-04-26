import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Supplier, Product, StorageLocationBasic, RequisitionType } from '@/types/inventory';
import {
    ArrowLeft, Save, Plus, Trash2, ArrowRightLeft,
    ShoppingCart, AlertCircle, BadgeCheck,
    Package, ClipboardList, Hash, Building2
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────

interface Props {
    type: RequisitionType;
    locations: StorageLocationBasic[];
    products: (Pick<Product, 'id' | 'name' | 'sku'> & { unit_of_measure?: { abbreviation: string } })[];
    suppliers: Pick<Supplier, 'id' | 'name' | 'code'>[];
    departments: Pick<Department, 'id' | 'name' | 'code'>[];
    defaultRef: string;
    user: {
        id: string;
        role: string;
        storage_location_id: string | null;
        department_id: string | null;
    };
}

interface LineItem {
    product_id: string;
    quantity_requested: string;
    quantity_on_hand: string;
    estimated_unit_cost: string;
    notes: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const SELECT_CLS = 'flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20';
const CARD_HEADER_CLS = 'px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2';

// ── Component ─────────────────────────────────────────────────────────────

export default function RequisitionCreate({ type, locations, products, suppliers, departments, defaultRef, user }: Props) {
    const isInternal     = type === 'internal';
    const isDepartmental = type === 'departmental';
    const isPurchase     = type === 'purchase';

    const { data, setData, post, processing, errors } = useForm<{
        type: RequisitionType;
        reference: string;
        requesting_location_id: string;
        requesting_department_id: string;
        issuing_location_id: string;
        supplier_id: string;
        purpose: string;
        required_by: string;
        notes: string;
        items: LineItem[];
    }>({
        type,
        reference: defaultRef,
        requesting_location_id: user.role === 'Store Officer' ? (user.storage_location_id || '') : '',
        requesting_department_id: user.role === 'Ward/Dept Head' ? (user.department_id || '') : '',
        issuing_location_id: '',
        supplier_id: '',
        purpose: '',
        required_by: '',
        notes: '',
        items: [{ product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', notes: '' }],
    });

    const addItem = () =>
        setData('items', [...data.items, { product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', notes: '' }]);

    const removeItem = (i: number) =>
        setData('items', data.items.filter((_, idx) => idx !== i));

    const updateItem = (i: number, field: keyof LineItem, value: string) => {
        const updated = [...data.items];
        updated[i] = { ...updated[i], [field]: value };
        setData('items', updated);
    };

    const totalEstimated = data.items.reduce(
        (sum, row) => sum + (Number(row.quantity_requested) * Number(row.estimated_unit_cost || 0)),
        0
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/procurement/requisitions');
    };

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title={`New ${isInternal ? 'Internal Transfer' : 'Purchase Request'}`} />

            <div className="flex flex-col gap-4">
                <Link href="/procurement/requisitions" className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requisitions
                </Link>

                {/* Type switcher banner */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    isInternal ? 'bg-brand/5 border-brand/20' : 'bg-amber-50 border-amber-200'
                }`}>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isInternal ? 'bg-brand/10' : isDepartmental ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                        {isInternal ? <ArrowRightLeft className="h-6 w-6 text-brand" /> :
                         isDepartmental ? <Building2 className="h-6 w-6 text-blue-700" /> :
                         <ShoppingCart className="h-6 w-6 text-amber-700" />
                        }
                    </div>
                    <div className="flex-1">
                        <p className={`font-bold text-sm ${isInternal ? 'text-brand' : isDepartmental ? 'text-blue-800' : 'text-amber-800'}`}>
                            {isInternal ? 'Internal Transfer Requisition' : 
                             isDepartmental ? 'Departmental Requisition' : 
                             'Purchase Requisition'}
                        </p>
                        <p className={`text-xs mt-0.5 ${isInternal ? 'text-brand/70' : isDepartmental ? 'text-blue-700/70' : 'text-amber-700'}`}>
                            {isInternal ? 'Request stock movement between two stores.' :
                             isDepartmental ? 'Request stock issue from a store to your department.' :
                             'Request procurement of goods from an external supplier.'
                            }
                        </p>
                    </div>
                    {/* Type switcher links */}
                    <div className="flex gap-4 items-center">
                        {user.role !== 'Ward/Dept Head' && (
                            <>
                                {!isInternal && (
                                    <Link href="/procurement/requisitions/create?type=internal" className="text-xs font-bold underline text-brand">
                                        Switch to Internal
                                    </Link>
                                )}
                                {!isPurchase && (
                                    <Link href="/procurement/requisitions/create?type=purchase" className="text-xs font-bold underline text-amber-800">
                                        Switch to Purchase
                                    </Link>
                                )}
                            </>
                        )}
                        {!isDepartmental && (
                            <Link href="/procurement/requisitions/create?type=departmental" className="text-xs font-bold underline text-blue-800">
                                Switch to Departmental
                            </Link>
                        )}
                    </div>
                </div>

                <PageHeader
                    title={isInternal ? 'New Internal Transfer Request' : 'New Purchase Request'}
                    description={`Reference: ${data.reference}`}
                />
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    {/* ── Requisition Meta ─────────────────────────────── */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className={CARD_HEADER_CLS}>
                            <Hash className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Requisition Details</h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Reference No. <span className="text-brand">*</span>
                                </Label>
                                <Input
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    className="font-mono bg-muted/30 border-none focus-visible:ring-brand/20"
                                />
                                <InputError message={errors.reference} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Required By Date
                                </Label>
                                <Input
                                    type="date"
                                    value={data.required_by}
                                    onChange={(e) => setData('required_by', e.target.value)}
                                    className="bg-muted/30 border-none focus-visible:ring-brand/20"
                                />
                                <InputError message={errors.required_by} />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                    Purpose / Justification
                                </Label>
                                <textarea
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    placeholder="Briefly state why this requisition is needed…"
                                    className="flex min-h-[72px] w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                                />
                                <InputError message={errors.purpose} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Route (Internal) or Supplier (Purchase) ──────── */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className={CARD_HEADER_CLS}>
                            {isInternal ? <ArrowRightLeft className="h-4 w-4 text-brand" /> :
                             isDepartmental ? <Building2 className="h-4 w-4 text-blue-600" /> :
                             <ShoppingCart className="h-4 w-4 text-amber-600" />
                            }
                            <h3 className="text-sm font-bold uppercase tracking-wider">
                                {isInternal ? 'Store Route' : isDepartmental ? 'Department Target' : 'Supplier Info'}
                            </h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(isInternal || isDepartmental) ? (
                                <>
                                    {isInternal ? (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                                Requesting Store <span className="text-brand">*</span>
                                            </Label>
                                            <select
                                                className={SELECT_CLS}
                                                value={data.requesting_location_id}
                                                onChange={(e) => setData('requesting_location_id', e.target.value)}
                                                disabled={user.role === 'Store Officer'}
                                            >
                                                <option value="">— Select requesting store —</option>
                                                {locations.map((l) => (
                                                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.requesting_location_id} />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                                Requesting Department <span className="text-brand">*</span>
                                            </Label>
                                            <select
                                                className={SELECT_CLS}
                                                value={data.requesting_department_id}
                                                onChange={(e) => setData('requesting_department_id', e.target.value)}
                                                disabled={user.role === 'Ward/Dept Head'}
                                            >
                                                <option value="">— Select department —</option>
                                                {departments.map((d) => (
                                                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.requesting_department_id} />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                            Issuing Store <span className="text-brand">*</span>
                                            <span className="ml-2 text-[10px] normal-case font-normal italic text-text-muted">(source of stock)</span>
                                        </Label>
                                        <select
                                            className={SELECT_CLS}
                                            value={data.issuing_location_id}
                                            onChange={(e) => setData('issuing_location_id', e.target.value)}
                                        >
                                            <option value="">— Select issuing store —</option>
                                            {locations
                                                .filter((l) => l.id !== data.requesting_location_id)
                                                .map((l) => (
                                                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                                ))
                                            }
                                        </select>
                                        <InputError message={errors.issuing_location_id} />
                                    </div>
                                </>
                            ) : (
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                        Preferred Supplier
                                        <span className="ml-2 text-[10px] normal-case font-normal italic text-text-muted">(optional — procurement team can override)</span>
                                    </Label>
                                    <select
                                        className={SELECT_CLS}
                                        value={data.supplier_id}
                                        onChange={(e) => setData('supplier_id', e.target.value)}
                                    >
                                        <option value="">— No preference —</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                    <InputError message={(errors as any).supplier_id} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Line Items ───────────────────────────────────── */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className={CARD_HEADER_CLS}>
                            <Package className="h-4 w-4 text-brand" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Requested Items</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            {/* Column headers */}
                            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
                                <div className="col-span-4">Product</div>
                                <div className="col-span-2 text-center">Qty Required</div>
                                {(isInternal || isDepartmental) && <div className="col-span-2 text-center">Qty on Hand</div>}
                                {!isInternal && !isDepartmental && <div className="col-span-2 text-center">Est. Unit Cost (₦)</div>}
                                <div className="col-span-3">Notes</div>
                                <div className="col-span-1" />
                            </div>

                            {data.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-12 gap-3 items-start">
                                    <div className="col-span-4">
                                        <select
                                            className={SELECT_CLS}
                                            value={item.product_id}
                                            onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                                        >
                                            <option value="">Select product…</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} — {p.sku}
                                                    {p.unit_of_measure ? ` (${p.unit_of_measure.abbreviation})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {(errors as any)[`items.${i}.product_id`] && (
                                            <p className="text-xs text-destructive mt-1">{(errors as any)[`items.${i}.product_id`]}</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity_requested}
                                            onChange={(e) => updateItem(i, 'quantity_requested', e.target.value)}
                                            placeholder="0"
                                            className="bg-muted/30 border-none focus-visible:ring-brand/20 text-center"
                                        />
                                    </div>

                                    {(isInternal || isDepartmental) && (
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.quantity_on_hand}
                                                onChange={(e) => updateItem(i, 'quantity_on_hand', e.target.value)}
                                                placeholder="0"
                                                className="bg-brand/5 border-dashed border-brand/20 focus-visible:ring-brand/20 text-center font-bold text-brand"
                                            />
                                        </div>
                                    )}

                                    {!isInternal && !isDepartmental && (
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.estimated_unit_cost}
                                                onChange={(e) => updateItem(i, 'estimated_unit_cost', e.target.value)}
                                                placeholder="0.00"
                                                className="bg-muted/30 border-none focus-visible:ring-brand/20 text-center"
                                            />
                                        </div>
                                    )}

                                    <div className="col-span-3">
                                        <Input
                                            value={item.notes}
                                            onChange={(e) => updateItem(i, 'notes', e.target.value)}
                                            placeholder="Line notes…"
                                            className="bg-muted/30 border-none focus-visible:ring-brand/20"
                                        />
                                    </div>

                                    <div className="col-span-1 flex justify-end pt-1">
                                        {data.items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(i)}
                                                className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                                className="mt-2 border-dashed border-brand/30 text-brand hover:bg-brand/5"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add Another Item
                            </Button>
                            {(errors as any).items && (
                                <p className="text-xs text-destructive">{(errors as any).items}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Sidebar ────────────────────────────────────────── */}
                <div className="space-y-6">
                    {/* Live estimated total (purchase only) */}
                    {!isInternal && !isDepartmental && totalEstimated > 0 && (
                        <Card className="border-brand/20 bg-brand/5 border-dashed">
                            <CardContent className="p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Estimated Total</p>
                                <p className="text-3xl font-extrabold text-brand mt-1">
                                    {new Intl.NumberFormat('en-NG', {
                                        style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
                                    }).format(totalEstimated)}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    {data.items.length} line item{data.items.length > 1 ? 's' : ''}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Item count (internal/departmental) */}
                    {(isInternal || isDepartmental) && data.items.filter((i) => i.product_id).length > 0 && (
                        <Card className="border-brand/20 bg-brand/5 border-dashed">
                            <CardContent className="p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Items Requested</p>
                                <p className="text-3xl font-extrabold text-brand mt-1">
                                    {data.items.filter((i) => i.product_id).length}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    Total qty: {data.items.reduce((s, i) => s + Number(i.quantity_requested || 0), 0)} units
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-brand">
                                <BadgeCheck className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Submit Requisition</span>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex gap-2 items-start">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <p>
                                    {isInternal
                                        ? 'This will notify the issuing store for approval and fulfilment.'
                                        : 'This will be sent to the Procurement Officer for approval.'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">Additional Notes</Label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Any additional information for the approver…"
                                    className="flex min-h-[60px] w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    className="w-full bg-brand hover:bg-brand-dark text-brand-foreground shadow-lg h-11"
                                    disabled={processing}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {processing ? 'Submitting…' : 'Submit Requisition'}
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
RequisitionCreate.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Requisitions', href: '/procurement/requisitions' },
        { title: 'New Request', href: '#' },
    ],
};
