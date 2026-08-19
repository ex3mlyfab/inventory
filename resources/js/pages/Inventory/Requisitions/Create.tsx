import { Head, Link, useForm, router } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Save, Plus, Trash2, ArrowRightLeft,
    ShoppingCart, AlertCircle, BadgeCheck,
    Package, ClipboardList, Hash, Building2, Loader2
} from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Supplier, Product, StorageLocationBasic, RequisitionType, Department } from '@/types/inventory';

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
    requisition?: {
        id: string;
        reference: string;
        purpose: string;
        required_by: string;
        notes: string;
        updated_at: string;
        requesting_location_id: string | null;
        requesting_department_id: string | null;
        issuing_location_id: string | null;
        supplier_id: string | null;
        items: {
            id: string;
            product_id: string;
            quantity_requested: string;
            quantity_on_hand: string;
            estimated_unit_cost: string;
        }[];
    };
}

interface LineItem {
    product_id: string;
    quantity_requested: string;
    quantity_on_hand: string;
    estimated_unit_cost: string;
    available_stock?: number;
}

interface StoreProduct {
    id: string;
    name: string;
    sku: string;
    unit_of_measure?: string;
    is_expirable: boolean;
    available: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const SELECT_CLS = 'flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20';
const CARD_HEADER_CLS = 'px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2';

// ── Component ─────────────────────────────────────────────────────────────

export default function RequisitionCreate({ type, stores, departmentalStores, products, suppliers, departments, defaultRef, user, requisition }: Props) {
    const isInternal = type === 'internal';
    const isDepartmental = type === 'departmental';
    const isPurchase = type === 'purchase';

    const queryClient = useQueryClient();
    const { data, setData, post, put, processing, errors, transform, watch } = useForm<{
        type: RequisitionType;
        reference: string;
        status?: 'draft' | 'submitted';
        requesting_location_id: string;
        requesting_department_id: string;
        issuing_location_id: string;
        supplier_id: string;
        purpose: string;
        required_by: string;
        notes: string;
        updated_at?: string;
        sync_stock?: boolean;
        items: LineItem[];
    }>({
        type,
        reference: requisition?.reference ?? defaultRef,
        status: requisition ? undefined : 'submitted',
        requesting_location_id: requisition?.requesting_location_id ?? (user.role === 'Store Officer' ? (user.storage_location_id || '') : ''),
        requesting_department_id: requisition?.requesting_department_id ?? (user.department_id || ''),
        issuing_location_id: requisition?.issuing_location_id ?? '',
        supplier_id: requisition?.supplier_id ?? '',
        purpose: requisition?.purpose ?? '',
        required_by: requisition?.required_by ?? '',
        notes: requisition?.notes ?? '',
        updated_at: requisition?.updated_at,
        items: requisition?.items?.length
            ? requisition.items.map(i => ({
                product_id: i.product_id,
                quantity_requested: i.quantity_requested,
                quantity_on_hand: i.quantity_on_hand,
                estimated_unit_cost: i.estimated_unit_cost,
                available_stock: undefined,
            }))
            : [{ product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', available_stock: undefined }],
    });

    const isEditing = !!requisition;

    // Watch issuing_location_id for reactive query key
    const issuingLocationId = watch('issuing_location_id');

    // ── Fetch products available at issuing store ─────────────────────────
    const { data: storeProducts, isLoading: isLoadingStoreProducts, isSuccess: isStoreProductsSuccess } = useQuery({
        queryKey: ['store-products', issuingLocationId],
        queryFn: () => fetch(`/procurement/requisitions/products-by-store/${issuingLocationId}`).then((res: any) => res.json()),
        enabled: isDepartmental && !!issuingLocationId,
        staleTime: 1000 * 60 * 2,
    });

    // ── Memoized Options ─────────────────────────────────────────────────

    // For departmental: filter by issuing store. For others: show all products.
    const productOptions = useMemo(() => {
        const baseProducts = isDepartmental && isStoreProductsSuccess && storeProducts
            ? storeProducts.products
            : products;

        return baseProducts.map(p => ({
            label: `${p.name} — ${p.sku}${p.unit_of_measure ? ` (${p.unit_of_measure})` : ''}`,
            value: p.id,
            // Attach available stock for quick display
            available: (p as StoreProduct).available ?? undefined,
        }));
    }, [products, isDepartmental, isStoreProductsSuccess, storeProducts]);

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

    // ── Actions ───────────────────────────────────────────────────────────

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
            checkStock(value);
        }
    };

    const checkStock = useCallback(async (productId: string, locationOverride?: string) => {
        const locationId = locationOverride || (isPurchase ? data.requesting_location_id : data.issuing_location_id);

        if (!productId || !locationId) {
            return;
        }

        const params = new URLSearchParams({
            product_id: productId,
            location_id: locationId
        }).toString();

        try {
            const res = await queryClient.fetchQuery({
                queryKey: ['check-stock', productId, locationId],
                queryFn: () => fetch(`/procurement/requisitions/check-stock?${params}`).then((r: any) => r.json()),
                staleTime: 1000 * 60,
            });
            const available = res?.available ?? res?.data?.available ?? 0;
            setData((prev) => {
                const items = [...prev.items];
                const idx = items.findIndex(item => item.product_id === productId);

                if (idx >= 0) {
                    items[idx] = { ...items[idx], available_stock: Number(available) };
                }

                return { ...prev, items };
            });
        } catch (e) {
            console.error('Failed to check stock', e);
            setData((prev) => {
                const items = [...prev.items];
                const idx = items.findIndex(item => item.product_id === productId);

                if (idx >= 0) {
                    items[idx] = { ...items[idx], available_stock: undefined };
                }

                return { ...prev, items };
            });
        }
    }, [data.requesting_location_id, data.issuing_location_id, isPurchase, queryClient]);

    // ── Auto-populate line items when issuing store changes (Departmental) ──
    useEffect(() => {
        if (isDepartmental && isStoreProductsSuccess && storeProducts?.products?.length) {
            setData((prev) => {
                // Build new items from store products with available stock
                const newItems = storeProducts.products.map((p: StoreProduct) => ({
                    product_id: p.id,
                    quantity_requested: '',
                    quantity_on_hand: '',
                    estimated_unit_cost: '',
                    available_stock: p.available,
                }));

                // If editing, preserve existing selections that match
                if (isEditing && requisition?.items?.length) {
                    const existingMap = new Map(requisition.items.map(i => [i.product_id, i]));
                    return {
                        ...prev,
                        items: newItems.map(item => {
                            const existing = existingMap.get(item.product_id);
                            return existing ? {
                                ...item,
                                quantity_requested: existing.quantity_requested,
                                quantity_on_hand: existing.quantity_on_hand,
                                estimated_unit_cost: existing.estimated_unit_cost,
                            } : item;
                        })
                    };
                }

                return { ...prev, items: newItems.length > 0 ? newItems : [{ product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', available_stock: undefined }] };
            });
        }
    }, [isStoreProductsSuccess, storeProducts, isDepartmental, isEditing, requisition]);

    // Handle checkStock for non-departmental location changes
    useEffect(() => {
        if (!isDepartmental) {
            const locationId = data.requesting_location_id || data.issuing_location_id;
            if (locationId) {
                const itemsToCheck = data.items.filter(item => item.product_id);
                itemsToCheck.forEach((item) => {
                    checkStock(item.product_id, locationId);
                });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.issuing_location_id, data.requesting_location_id, isDepartmental, checkStock]);

    const totalEstimated = data.items.reduce(
        (sum, row) => sum + (Number(row.quantity_requested) * Number(row.estimated_unit_cost || 0)),
        0
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setData('status', 'submitted');

        if (isDepartmental) {
            transform((currentData) => ({
                ...currentData,
                items: currentData.items.filter(item =>
                    item.product_id &&
                    item.quantity_requested &&
                    Number(item.quantity_requested) > 0
                )
            }));
        }

        if (isEditing && requisition) {
            put(`/procurement/requisitions/${requisition.id}`);
        } else {
            post('/procurement/requisitions');
        }
    };

    const saveDraft = (e: React.FormEvent) => {
        e.preventDefault();
        setData('status', 'draft');

        if (isDepartmental) {
            transform((currentData) => ({
                ...currentData,
                items: currentData.items.filter(item =>
                    item.product_id &&
                    item.quantity_requested &&
                    Number(item.quantity_requested) > 0
                )
            }));
        }

        if (isEditing && requisition) {
            put(`/procurement/requisitions/${requisition.id}`);
        } else {
            post('/procurement/requisitions');
        }
    };

    const pageTitle = isEditing ? 'Edit Draft Requisition' : isInternal ? 'New Internal Transfer' : isDepartmental ? 'New Departmental Request' : 'New Purchase Request';

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
                                    Reference No.
                                </Label>
                                <Input
                                    value={data.reference}
                                    readOnly
                                    className="font-mono bg-muted/20 border-none text-text-muted cursor-not-allowed"
                                />
                                <p className="text-[10px] text-text-muted">Auto-generated on submission</p>
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
                                            disabled={isLoadingStoreProducts}
                                        />
                                        {isLoadingStoreProducts && (
                                            <div className="flex items-center gap-2 text-xs text-blue-600">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Loading products from store…
                                            </div>
                                        )}
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
                            {isDepartmental && isStoreProductsSuccess && storeProducts?.products?.length && (
                                <span className="ml-2 px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded-full">
                                    {storeProducts.products.length} products available
                                </span>
                            )}
                        </div>
                        <CardContent className="p-6 space-y-4">
                            {/* Column headers - Desktop only */}
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
                                    type="submit"
                                >
                                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    {processing ? 'Processing...' : isEditing ? 'Update Requisition' : 'Submit Requisition'}
                                </Button>
                                {!isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-muted/50"
                                        disabled={processing}
                                        onClick={saveDraft}
                                    >
                                        {processing ? 'Saving...' : 'Save Draft'}
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-muted/50 h-10 rounded-xl"
                                    onClick={() => isEditing && requisition ? router.visit(`/procurement/requisitions/${requisition.id}`) : window.history.back()}
                                >
                                    {isEditing ? 'Back to Requisition' : 'Discard Changes'}
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
        { title: 'Requisitions', href: '/procurement/requisitions' },
        { title: 'New Request', href: '#' },
    ],
};