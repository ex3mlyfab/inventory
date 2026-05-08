import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, useHttp } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Supplier, Product, StorageLocationBasic, RequisitionType, Department } from '@/types/inventory';
import { Combobox } from '@/components/ui/combobox';
import {
    ArrowLeft, Save, Plus, Trash2, ArrowRightLeft,
    ShoppingCart, AlertCircle, BadgeCheck,
    Package, ClipboardList, Hash, Building2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────

interface Props {
    type: RequisitionType;
    stores: StorageLocationBasic[];
    departmentalStores: StorageLocationBasic[];
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
    available_stock?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const SELECT_CLS = 'flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20';
const CARD_HEADER_CLS = 'px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2';

// ── Component ─────────────────────────────────────────────────────────────

export default function RequisitionCreate({ type, stores, departmentalStores, products, suppliers, departments, defaultRef, user }: Props) {
    const isInternal = type === 'internal';
    const isDepartmental = type === 'departmental';
    const isPurchase = type === 'purchase';

    const http = useHttp();
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
        requesting_department_id: user.department_id || '',
        issuing_location_id: stores.find(s => s.name.toLowerCase().includes('main store'))?.id || '',
        supplier_id: '',
        purpose: '',
        required_by: '',
        notes: '',
        items: [{ product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', available_stock: undefined }],
    });

    // ── Memoized Options ─────────────────────────────────────────────────

    const productOptions = useMemo(() => products.map(p => ({
        label: `${p.name} — ${p.sku}${p.unit_of_measure ? ` (${p.unit_of_measure.abbreviation})` : ''}`,
        value: p.id
    })), [products]);

    const storeOptions = useMemo(() => stores.map(l => ({
        label: `${l.name} (${l.code})`,
        value: l.id
    })), [stores]);

    const departmentOptions = useMemo(() => departments.map(d => ({
        label: `${d.name} (${d.code})`,
        value: d.id
    })), [departments]);

    const supplierOptions = useMemo(() => suppliers.map(s => ({
        label: `${s.name} (${s.code})`,
        value: s.id
    })), [suppliers]);

    const addItem = () =>
        setData('items', [...data.items, { product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', available_stock: undefined }]);

    const removeItem = (i: number) =>
        setData('items', data.items.filter((_, idx) => idx !== i));

    const updateItem = (i: number, field: keyof LineItem, value: any) => {
        const updated = [...data.items];
        updated[i] = { ...updated[i], [field]: value };
        setData('items', updated);

        const locationId = isPurchase ? data.requesting_location_id : data.issuing_location_id;
        if (field === 'product_id' && value && locationId) {
            checkStock(i, value);
        }
    };

    const checkStock = (index: number, productId: string, locationOverride?: string) => {
        const locationId = locationOverride || (isPurchase ? data.requesting_location_id : data.issuing_location_id);
        if (!productId || !locationId) return;

        const params = new URLSearchParams({ 
            product_id: productId, 
            location_id: locationId 
        }).toString();

        http.get(`/procurement/requisitions/check-stock?${params}`, {
            onSuccess: (res: any) => {
                // Defensively extract available stock from varying response shapes
                const available = res?.available ?? res?.data?.available ?? 0;
                setData((prev) => {
                    const items = [...prev.items];
                    if (items[index]) {
                        items[index] = { ...items[index], available_stock: Number(available) };
                    }
                    return { ...prev, items };
                });
            },
            onError: (e) => {
                console.error('Failed to check stock', e);
                // Set stock to undefined on error so UI shows "No store selected" instead of stale data
                setData((prev) => {
                    const items = [...prev.items];
                    if (items[index]) {
                        items[index] = { ...items[index], available_stock: undefined };
                    }
                    return { ...prev, items };
                });
            }
        });
    };

    // Re-check all items if location changes — pass locationId explicitly to avoid stale closures
    React.useEffect(() => {
        const locationId = isPurchase ? data.requesting_location_id : data.issuing_location_id;
        if (locationId) {
            data.items.forEach((item, i) => {
                if (item.product_id) checkStock(i, item.product_id, locationId);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.issuing_location_id, data.requesting_location_id]);

    const totalEstimated = data.items.reduce(
        (sum, row) => sum + (Number(row.quantity_requested) * Number(row.estimated_unit_cost || 0)),
        0
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/procurement/requisitions');
    };

    const pageTitle = isInternal ? 'New Internal Transfer' : isDepartmental ? 'New Departmental Request' : 'New Purchase Request';

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
            <Head title={pageTitle} />

            <div className="flex flex-col gap-4">
                <Link href="/procurement/requisitions" className="flex items-center text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-colors w-fit group">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Register
                </Link>

                {/* Type switcher banner */}
                <div className={cn(
                    "flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-3xl border-2 border-dashed transition-all duration-500",
                    isInternal ? 'bg-brand/[0.03] border-brand/20 shadow-lg shadow-brand/5' :
                        isDepartmental ? 'bg-blue-500/[0.03] border-blue-500/20 shadow-lg shadow-blue-500/5' :
                            'bg-amber-500/[0.03] border-amber-500/20 shadow-lg shadow-amber-500/5'
                )}>
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-110 duration-300",
                        isInternal ? 'bg-brand/10 text-brand' :
                            isDepartmental ? 'bg-blue-500/10 text-blue-600' :
                                'bg-amber-500/10 text-amber-600'
                    )}>
                        {isInternal ? <ArrowRightLeft className="h-7 w-7" /> :
                            isDepartmental ? <Building2 className="h-7 w-7" /> :
                                <ShoppingCart className="h-7 w-7" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "font-black text-[11px] uppercase tracking-[0.2em] mb-1",
                            isInternal ? 'text-brand' : isDepartmental ? 'text-blue-600' : 'text-amber-600'
                        )}>
                            {isInternal ? 'Internal Transfer' :
                                isDepartmental ? 'Departmental Issue' :
                                    'Direct Purchase'}
                        </p>
                        <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
                            {isInternal ? 'Store-to-Store Movement' :
                                isDepartmental ? 'Unit Supply Request' :
                                    'External Procurement'}
                        </h2>
                        <p className="text-xs font-medium text-text-muted mt-1 leading-relaxed">
                            {isInternal ? 'Relocate stock between inventory locations within the facility.' :
                                isDepartmental ? 'Request consumable items from central stores to your department.' :
                                    'Order new stock or services from verified external vendors.'
                            }
                        </p>
                    </div>
                    {/* Type switcher links */}
                    <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto pt-2 sm:pt-0">
                        {user.role !== 'Ward/Dept Head' && (
                            <>
                                {!isInternal && (
                                    <Link href="/procurement/requisitions/create?type=internal">
                                        <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider border-brand/20 text-brand hover:bg-brand/5 px-4">Switch to Internal</Button>
                                    </Link>
                                )}
                                {!isPurchase && (
                                    <Link href="/procurement/requisitions/create?type=purchase">
                                        <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider border-amber-500/20 text-amber-700 hover:bg-amber-500/5 px-4">Switch to Purchase</Button>
                                    </Link>
                                )}
                            </>
                        )}
                        {!isDepartmental && (
                            <Link href="/procurement/requisitions/create?type=departmental">
                                <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider border-blue-500/20 text-blue-700 hover:bg-blue-500/5 px-4">Switch to Departmental</Button>
                            </Link>
                        )}
                    </div>
                </div>

                <PageHeader
                    title={pageTitle}
                    description={
                        <div className="flex items-center gap-2 mt-1">
                            <Hash className="h-3.5 w-3.5 text-brand" />
                            <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-tighter">REF: {data.reference}</span>
                        </div>
                    }
                    className="pb-2"
                />
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    {/* ── Requisition Meta ─────────────────────────────── */}
                    <Card className="border-border/50 shadow-xl shadow-brand/5 overflow-hidden rounded-3xl">
                        <div className={CARD_HEADER_CLS}>
                            <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                <Hash className="h-4 w-4 text-brand" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Submission Metadata</h3>
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
                    <Card className="border-border/50 shadow-xl shadow-brand/5 overflow-hidden rounded-3xl">
                        <div className={CARD_HEADER_CLS}>
                            <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center",
                                isInternal ? 'bg-brand/10 text-brand' : isDepartmental ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                            )}>
                                {isInternal ? <ArrowRightLeft className="h-4 w-4" /> :
                                    isDepartmental ? <Building2 className="h-4 w-4" /> :
                                        <ShoppingCart className="h-4 w-4" />
                                }
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">
                                {isInternal ? 'Logistics Route' : isDepartmental ? 'Target Allocation' : 'Supplier Designation'}
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
                                            <Combobox
                                                options={storeOptions}
                                                value={data.requesting_location_id}
                                                onChange={(val) => setData('requesting_location_id', val)}
                                                placeholder="Select requesting store…"
                                                className="bg-muted/30 border-none"
                                            />
                                            <InputError message={errors.requesting_location_id} />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                                Requesting Department <span className="text-brand">*</span>
                                            </Label>
                                            <Combobox
                                                options={departmentOptions}
                                                value={data.requesting_department_id}
                                                onChange={(val) => setData('requesting_department_id', val)}
                                                placeholder="Select department…"
                                                className="bg-muted/30 border-none"
                                            />
                                            <InputError message={errors.requesting_department_id} />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                            Issuing Store <span className="text-brand">*</span>
                                            <span className="ml-2 text-[10px] normal-case font-normal italic text-text-muted">(source of stock)</span>
                                        </Label>
                                        <Combobox
                                            options={storeOptions.filter(o => o.value !== data.requesting_location_id)}
                                            value={data.issuing_location_id}
                                            onChange={(val) => setData('issuing_location_id', val)}
                                            placeholder="Select issuing store…"
                                            className="bg-muted/30 border-none"
                                        />
                                        <InputError message={errors.issuing_location_id} />
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">Target Store (Receiving) <span className="text-brand">*</span></Label>
                                        <Combobox
                                            options={storeOptions}
                                            value={data.requesting_location_id}
                                            onChange={(val) => setData('requesting_location_id', val)}
                                            placeholder="Select store to restock…"
                                            className="bg-muted/30 border-none"
                                        />
                                        <InputError message={errors.requesting_location_id} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-text-muted">Preferred Supplier (Optional)</Label>
                                        <Combobox
                                            options={supplierOptions}
                                            value={data.supplier_id}
                                            onChange={(val) => setData('supplier_id', val)}
                                            placeholder="No preference"
                                            className="bg-muted/30 border-none"
                                        />
                                        <InputError message={(errors as any).supplier_id} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Line Items ───────────────────────────────────── */}
                    <Card className="border-border/50 shadow-xl shadow-brand/5 overflow-hidden rounded-3xl bg-white">
                        <div className={CARD_HEADER_CLS}>
                            <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                <Package className="h-4 w-4" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Requested Line Items</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            {/* Column headers */}
                            <div className="hidden md:grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
                                <div className={cn(
                                    isPurchase ? "col-span-5" : 
                                    isDepartmental ? "col-span-7" : 
                                    "col-span-5"
                                )}>Product</div>
                                {(isInternal || isPurchase) && <div className="col-span-2 text-center">Available</div>}
                                <div className="col-span-2 text-center">Qty Required</div>
                                {(isInternal || isDepartmental) && <div className="col-span-2 text-center">Avail Qty</div>}
                                {isPurchase && <div className="col-span-2 text-center">Est. Unit Cost (₦)</div>}
                                <div className="col-span-1" />
                            </div>

                            {data.items.map((item, i) => (
                                <div key={i} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-3 items-start p-4 md:p-0 rounded-xl border border-border/50 md:border-none bg-muted/10 md:bg-transparent relative">
                                    {/* Mobile Remove Button */}
                                    {data.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(i)}
                                            className="absolute top-2 right-2 h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 flex md:hidden items-center justify-center transition-colors z-10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}

                                    <div className={cn(
                                        "w-full", 
                                        isPurchase ? "md:col-span-5" : 
                                        isDepartmental ? "md:col-span-7" : 
                                        "md:col-span-5"
                                    )}>
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-text-muted md:hidden mb-1.5 block">Product</Label>
                                        <Combobox
                                            options={productOptions}
                                            value={item.product_id}
                                            onChange={(val) => updateItem(i, 'product_id', val)}
                                            placeholder="Select product…"
                                            className="bg-muted/30 border-none"
                                        />
                                        {(errors as any)[`items.${i}.product_id`] && (
                                            <p className="text-xs text-destructive mt-1">{(errors as any)[`items.${i}.product_id`]}</p>
                                        )}
                                    </div>

                                    {(isInternal || isPurchase) && (
                                        <div className="md:col-span-2 flex flex-col items-start md:items-center justify-center md:pt-2 w-full">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-text-muted md:hidden mb-1.5 block">Stock Status</Label>
                                            {item.available_stock !== undefined ? (
                                                <span className={`text-xs font-bold ${item.available_stock === 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                                    {item.available_stock}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-text-muted italic">No store selected</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 md:contents gap-4 w-full">
                                        <div className="md:col-span-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-text-muted md:hidden mb-1.5 block">Qty Req</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity_requested}
                                                onChange={(e) => updateItem(i, 'quantity_requested', e.target.value)}
                                                placeholder="0"
                                                className={`bg-muted/30 border-none focus-visible:ring-brand/20 text-center ${item.available_stock !== undefined && isInternal && Number(item.quantity_requested) > item.available_stock
                                                        ? 'text-destructive font-bold ring-1 ring-destructive/50'
                                                        : ''
                                                    }`}
                                            />
                                            {item.available_stock !== undefined && isInternal && Number(item.quantity_requested) > item.available_stock && (
                                                <p className="text-[9px] text-destructive mt-1 text-center font-bold animate-pulse">Exceeds Stock</p>
                                            )}
                                        </div>

                                        {(isInternal || isDepartmental) ? (
                                            <div className="md:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-text-muted md:hidden mb-1.5 block">Avail Qty</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={item.quantity_on_hand}
                                                    onChange={(e) => updateItem(i, 'quantity_on_hand', e.target.value)}
                                                    placeholder="0"
                                                    className="bg-brand/5 border-dashed border-brand/20 focus-visible:ring-brand/20 text-center font-bold text-brand"
                                                />
                                            </div>
                                        ) : (!isInternal && !isDepartmental) && (
                                            <div className="md:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-text-muted md:hidden mb-1.5 block">Est. Unit Cost (₦)</Label>
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
                                    </div>



                                    <div className="hidden md:flex md:col-span-1 justify-end pt-1">
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
                                className="mt-4 border-2 border-dashed border-brand/20 text-brand hover:bg-brand/5 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider w-full md:w-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" />
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

                    <Card className="border-border/50 shadow-xl shadow-brand/5 overflow-hidden rounded-3xl bg-white sticky top-8">
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center gap-3 text-brand">
                                <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                                    <BadgeCheck className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Finalize Submission</span>
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

                            <div className="flex flex-col gap-3 pt-2">
                                <Button
                                    className="w-full bg-brand hover:bg-brand-dark text-brand-foreground shadow-lg shadow-brand/20 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                    disabled={processing}
                                >
                                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    {processing ? 'Processing...' : 'Submit Requisition'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-muted/50 h-10 rounded-xl"
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
RequisitionCreate.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Requisitions', href: '/procurement/requisitions' },
        { title: 'New Request', href: '#' },
    ],
};
