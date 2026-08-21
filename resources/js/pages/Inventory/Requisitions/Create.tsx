import { Head, Link, useForm, router } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Save, Plus, Trash2, ArrowRightLeft,
    ShoppingCart, AlertCircle, BadgeCheck,
    Package, ClipboardList, Hash, Building2, Loader2, ChevronDown
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

interface ProductsByStoreResponse {
    products: StoreProduct[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

const CARD_HEADER_CLS = 'px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2';

const SELECT_INPUT_CLS = 'flex h-10 w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 appearance-none';

// ── Mobile Select Component ──────────────────────────────────────────────
// Native <select> that works reliably on mobile instead of Radix Popover Combobox
function MobileSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled,
    error,
    className,
}: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    placeholder: string;
    disabled?: boolean;
    error?: string;
    className?: string;
}) {
    return (
        <div className={className}>
            {label && (
                <Label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                    {label}
                </Label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    SELECT_INPUT_CLS,
                    disabled && 'opacity-50 cursor-not-allowed',
                    'min-h-[44px] text-base' // 44px touch target, 16px font prevents iOS zoom
                )}
                style={{ fontSize: '16px' }}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

// ── Mobile Product Picker ────────────────────────────────────────────────
// A touch-friendly mobile dropdown that replaces the native <select> which
// has been unreliable on some Android WebViews when the option list is long.
// It uses a simple state-driven panel that opens/closes on tap, with each
// option rendered as a full-height touch target.
function MobileProductPicker({
    options,
    value,
    onChange,
    isLoading,
}: {
    options: { label: string; value: string; available?: number }[];
    value: string;
    onChange: (v: string) => void;
    isLoading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when tapping outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                disabled={isLoading}
                className={cn(
                    SELECT_INPUT_CLS,
                    'flex items-center justify-between min-h-[44px] pr-10',
                    isLoading && 'opacity-50 cursor-not-allowed'
                )}
                style={{ fontSize: '16px' }}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className={cn(
                    'truncate text-sm',
                    !selected && 'text-text-muted'
                )}>
                    {selected?.label ?? 'Select product…'}
                </span>
                <ChevronDown className={cn(
                    'h-4 w-4 shrink-0 opacity-50 transition-transform duration-200',
                    open && 'rotate-180'
                )} />
            </button>

            {open && (
                <div
                    className="absolute z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border/50 bg-popover shadow-lg"
                    role="listbox"
                    aria-label="Product list"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-xs text-text-muted">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                        </div>
                    ) : options.length === 0 ? (
                        <div className="py-8 text-center text-xs text-text-muted">
                            No products available at this store.
                        </div>
                    ) : (
                        options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={value === opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={cn(
                                    'flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-accent transition-colors',
                                    value === opt.value && 'bg-accent font-semibold'
                                )}
                                style={{ minHeight: '44px' }}
                            >
                                {value === opt.value && (
                                    <span className="text-brand">✓</span>
                                )}
                                <span className="truncate">{opt.label}</span>
                                {opt.available !== undefined && opt.available > 0 && (
                                    <span className="ml-auto text-[10px] text-text-muted shrink-0">
                                        {opt.available} avail
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────

export default function RequisitionCreate({ type, stores, departmentalStores, products, suppliers, departments, defaultRef, user, requisition }: Props) {
    const isInternal = type === 'internal';
    const isDepartmental = type === 'departmental';
    const isPurchase = type === 'purchase';

    const queryClient = useQueryClient();
    const { data, setData, post, put, processing, errors, transform } = useForm<{
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

    // The issuing store is the single source of truth for the store-products query.
    // It lives in plain React state (not Inertia form data) because setData() can be
    // unreliable on mobile WebViews — the query and item population must never depend
    // on an Inertia state round-trip. The form field is still written for the payload.
    const [issuingLocationId, setIssuingLocationId] = useState(data.issuing_location_id);

    const onIssuingStoreChange = (val: string) => {
        setIssuingLocationId(val);
        setData('issuing_location_id', val);
    };

    // Client-side guard for the finalize actions (server also enforces min:1)
    const [formError, setFormError] = useState<string | null>(null);

    // ── Fetch products available at issuing store ─────────────────────────
    const { data: storeProducts, isLoading: isLoadingStoreProducts, isError: isStoreProductsError } = useQuery<ProductsByStoreResponse>({
        queryKey: ['store-products', issuingLocationId],
        queryFn: async ({ queryKey }) => {
            const [, locationId] = queryKey;
            const res = await fetch(`/procurement/requisitions/products-by-store/${locationId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
            }
            return res.json();
        },
        enabled: isDepartmental && !!issuingLocationId,
        staleTime: 1000 * 60 * 2,
        retry: 1,
    });

    // ── Memoized Options ─────────────────────────────────────────────────

    // Derive product options directly from query data — no success flag needed
    const productOptions = useMemo(() => {
        if (isDepartmental) {
            // Departmental line items must come from the selected issuing store's stock.
            // Before a store is selected (or if it has no stock) there is nothing to choose from,
            // so we never fall back to the full product catalog here.
            return (storeProducts?.products ?? []).map(p => ({
                label: p.name + ' \u2014 ' + p.sku + (p.unit_of_measure ? ' (' + p.unit_of_measure + ')' : ''),
                value: p.id,
                available: p.available,
            }));
        }

        return products.map(p => ({
            label: p.name + ' \u2014 ' + p.sku + (p.unit_of_measure ? ' (' + p.unit_of_measure + ')' : ''),
            value: p.id,
            available: undefined,
        }));
    }, [products, isDepartmental, storeProducts]);

    // ── LOCAL STATE for line items (departmental) ─────────────────────────
    // CRITICAL: We use local React state for departmental line items instead of
    // pushing them through Inertia's useForm setData during render. Inertia's
    // setData uses cloneDeep + useState which can silently fail to re-render
    // on mobile WebViews when called from a useEffect triggered by async query
    // resolution. Local state updates synchronously and reliably on all devices.
    const [localItems, setLocalItems] = useState<LineItem[]>(
        isDepartmental
            ? (requisition?.items?.length
                ? requisition.items.map(i => ({
                    product_id: i.product_id,
                    quantity_requested: i.quantity_requested,
                    quantity_on_hand: i.quantity_on_hand,
                    estimated_unit_cost: i.estimated_unit_cost,
                    available_stock: undefined,
                }))
                : [{ product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', available_stock: undefined }])
            : []
    );

    // When store products arrive, populate local items directly (no Inertia form involved).
    // Uses the functional updater so it never reads a stale closure, preserves typed
    // quantities for products that are still in the store, keeps manually-added rows,
    // and skips a rebuild when the product set is unchanged so typing is never disturbed.
    useEffect(() => {
        if (!isDepartmental) {
            return;
        }

        if (!storeProducts?.products?.length) {
            return;
        }

        setLocalItems(prev => {
            const existingMap = new Map(prev.map(i => [i.product_id, i]));

            const rows = storeProducts.products.map((p: StoreProduct) => {
                const existing = existingMap.get(p.id);
                return {
                    product_id: p.id,
                    quantity_requested: existing?.quantity_requested ?? '',
                    quantity_on_hand: existing?.quantity_on_hand ?? '',
                    estimated_unit_cost: existing?.estimated_unit_cost ?? '',
                    available_stock: p.available,
                };
            });

            const prevIds = prev.map(i => i.product_id).sort().join('|');
            const nextIds = rows.map(i => i.product_id).sort().join('|');
            if (prevIds === nextIds) {
                return prev;
            }

            return [...rows, ...prev.filter(i => !i.product_id)];
        });
    }, [storeProducts, isDepartmental]);

    // The items to render: local state for departmental, form state for others
    const displayItems = isDepartmental ? localItems : data.items;

    // Update a line item in the correct state
    const handleItemChange = (i: number, field: keyof LineItem, value: any) => {
        if (isDepartmental) {
            setLocalItems(prev => {
                const updated = [...prev];
                updated[i] = { ...updated[i], [field]: value };
                return updated;
            });
        } else {
            const updated = [...data.items];
            updated[i] = { ...updated[i], [field]: value };
            setData('items', updated);
        }

        const locationId = isPurchase ? data.requesting_location_id : data.issuing_location_id;
        // checkStock writes to the Inertia form's data.items — for departmental, items live in
        // localItems and available stock already comes from the store-products payload, so skip it.
        if (field === 'product_id' && value && locationId && !isDepartmental) {
            checkStock(value);
        }
    };

    const addLocalItem = () => {
        if (isDepartmental) {
            setLocalItems(prev => [...prev, { product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', available_stock: undefined }]);
        } else {
            setData('items', [...data.items, { product_id: '', quantity_requested: '', quantity_on_hand: '', estimated_unit_cost: '', available_stock: undefined }]);
        }
    };

    const removeLocalItem = (i: number) => {
        if (isDepartmental) {
            setLocalItems(prev => prev.filter((_, idx) => idx !== i));
        } else {
            setData('items', data.items.filter((_, idx) => idx !== i));
        }
    };

    const storeOptions = useMemo(() => stores.map(l => ({
        label: l.name + ' (' + l.code + ')',
        value: l.id
    })), [stores]);

    const departmentOptions = useMemo(() => departments.map(d => ({
        label: d.name + ' (' + d.code + ')',
        value: d.id
    })), [departments]);

    const supplierOptions = useMemo(() => suppliers.map(s => ({
        label: s.name + ' (' + s.code + ')',
        value: s.id
    })), [suppliers]);

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
                queryFn: () => fetch(`/procurement/requisitions/check-stock?${params}`, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                }).then((r: any) => r.json()),
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

    const totalEstimated = displayItems.reduce(
        (sum, row) => sum + (Number(row.quantity_requested) * Number(row.estimated_unit_cost || 0)),
        0
    );

    // Build the exact items payload from the state the user sees. This must run inside
    // transform() — Inertia's post/put reads form data synchronously (dataRef.current), so
    // setData() calls made just before submit are NOT flushed into the payload.
    const buildItems = () => {
        const source = isDepartmental ? localItems : data.items;
        return source
            .filter(item => item.product_id && Number(item.quantity_requested) > 0)
            .map(item => ({
                product_id: item.product_id,
                quantity_requested: String(Math.max(1, Number(item.quantity_requested) | 0)),
                quantity_on_hand: item.quantity_on_hand,
                estimated_unit_cost: item.estimated_unit_cost,
            }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const items = buildItems();
        if (!items.length) {
            setFormError('Add at least one item with a quantity before submitting.');
            return;
        }

        transform((currentData) => ({ ...currentData, status: 'submitted', items }));

        if (isEditing && requisition) {
            put(`/procurement/requisitions/${requisition.id}`);
        } else {
            post('/procurement/requisitions');
        }
    };

    const saveDraft = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const items = buildItems();
        if (!items.length) {
            setFormError('Add at least one item with a quantity before saving.');
            return;
        }

        transform((currentData) => ({ ...currentData, status: 'draft', items }));

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
                                        <MobileSelect
                                            label="Requesting Store *"
                                            value={data.requesting_location_id}
                                            onChange={(val) => setData('requesting_location_id', val)}
                                            options={storeOptions}
                                            placeholder="Select requesting store…"
                                            error={errors.requesting_location_id}
                                        />
                                    ) : (
                                        <MobileSelect
                                            label="Requesting Department *"
                                            value={data.requesting_department_id}
                                            onChange={(val) => setData('requesting_department_id', val)}
                                            options={departmentOptions}
                                            placeholder="Select department…"
                                            error={errors.requesting_department_id}
                                        />
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
                                            Issuing Store <span className="text-brand">*</span>
                                            <span className="ml-2 text-[10px] normal-case font-normal italic text-text-muted">(source of stock)</span>
                                        </Label>
                                        <MobileSelect
                                            value={data.issuing_location_id}
                                            onChange={onIssuingStoreChange}
                                            options={storeOptions.filter(o => o.value !== data.requesting_location_id)}
                                            placeholder="Select issuing store…"
                                            error={errors.issuing_location_id}
                                        />
                                        {isLoadingStoreProducts && (
                                            <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Loading products from store…
                                            </div>
                                        )}
                                        {isStoreProductsError && (
                                            <div className="flex items-center gap-2 text-xs text-destructive mt-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Failed to load products.
                                                <button
                                                    type="button"
                                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['store-products'] })}
                                                    className="underline font-bold hover:opacity-80"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <MobileSelect
                                        label="Target Store (Receiving) *"
                                        value={data.requesting_location_id}
                                        onChange={(val) => setData('requesting_location_id', val)}
                                        options={storeOptions}
                                        placeholder="Select store to restock…"
                                        error={errors.requesting_location_id}
                                    />
                                    <MobileSelect
                                        label="Preferred Supplier (Optional)"
                                        value={data.supplier_id}
                                        onChange={(val) => setData('supplier_id', val)}
                                        options={supplierOptions}
                                        placeholder="No preference"
                                        error={(errors as any).supplier_id}
                                    />
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
                            {isDepartmental && storeProducts?.products?.length && (
                                <span className="ml-2 px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded-full">
                                    {storeProducts.products.length} products loaded
                                </span>
                            )}
                        </div>
                        <CardContent className="p-6 space-y-4">
                            {/* Departmental guidance / empty states */}
                            {isDepartmental && !issuingLocationId && (
                                <div className="flex items-center gap-2 text-xs text-blue-700 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                                    <Building2 className="h-4 w-4 shrink-0" />
                                    Select an issuing store above to load the products available in that store.
                                </div>
                            )}
                            {isDepartmental && issuingLocationId && !isLoadingStoreProducts && !storeProducts?.products?.length && !isStoreProductsError && (
                                <div className="flex items-center gap-2 text-xs text-amber-700 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    No stock available at the selected store.
                                </div>
                            )}

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

                            {displayItems.map((item, i) => (
                                <div key={i} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-3 items-start p-4 md:p-0 rounded-xl border border-border/50 md:border-none bg-muted/10 md:bg-transparent relative">
                                    {/* Mobile Remove Button */}
                                    {displayItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeLocalItem(i)}
                                            className="absolute top-2 right-2 h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 flex md:hidden items-center justify-center transition-colors z-10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}

                                    {/* Product select — uses Combobox on desktop, native select on mobile */}
                                    <div className={cn(
                                        "w-full",
                                        isPurchase ? "md:col-span-5" :
                                        isDepartmental ? "md:col-span-7" :
                                        "md:col-span-5"
                                    )}>
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-text-muted md:hidden mb-1.5 block">Product</Label>
                                        {/* Desktop: Combobox with search. Mobile: native select for reliability */}
                                        <div className="hidden md:block">
                                            <Combobox
                                                options={productOptions}
                                                value={item.product_id}
                                                onChange={(val) => handleItemChange(i, 'product_id', val)}
                                                placeholder="Select product…"
                                                className="bg-muted/30 border-none"
                                            />
                                        </div>
                                        <div className="md:hidden">
                                            <MobileProductPicker
                                                options={productOptions}
                                                value={item.product_id}
                                                onChange={(val) => handleItemChange(i, 'product_id', val)}
                                                isLoading={isLoadingStoreProducts}
                                            />
                                        </div>
                                        {(errors as any)[`items.${i}.product_id`] && (
                                            <p className="text-xs text-destructive mt-1">{(errors as any)[`items.${i}.product_id`]}</p>
                                        )}
                                    </div>

                                    {/* Stock status - Internal/Purchase only */}
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
                                                onChange={(e) => handleItemChange(i, 'quantity_requested', e.target.value)}
                                                placeholder="0"
                                                className={`bg-muted/30 border-none focus-visible:ring-brand/20 text-center h-10 text-base ${item.available_stock !== undefined && isInternal && Number(item.quantity_requested) > item.available_stock
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
                                                    onChange={(e) => handleItemChange(i, 'quantity_on_hand', e.target.value)}
                                                    placeholder="0"
                                                    className="bg-brand/5 border-dashed border-brand/20 focus-visible:ring-brand/20 text-center font-bold text-brand h-10 text-base"
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
                                                    onChange={(e) => handleItemChange(i, 'estimated_unit_cost', e.target.value)}
                                                    placeholder="0.00"
                                                    className="bg-muted/30 border-none focus-visible:ring-brand/20 text-center h-10 text-base"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden md:flex md:col-span-1 justify-end pt-1">
                                        {displayItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLocalItem(i)}
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
                                onClick={addLocalItem}
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
                                    {displayItems.length} line item{displayItems.length > 1 ? 's' : ''}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Item count (internal/departmental) */}
                    {(isInternal || isDepartmental) && displayItems.filter((i) => i.product_id).length > 0 && (
                        <Card className="border-brand/20 bg-brand/5 border-dashed">
                            <CardContent className="p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Items Requested</p>
                                <p className="text-3xl font-extrabold text-brand mt-1">
                                    {displayItems.filter((i) => i.product_id).length}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    Total qty: {displayItems.reduce((s, i) => s + Number(i.quantity_requested || 0), 0)} units
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
                            {formError && (
                                <div className="flex items-center gap-2 text-xs text-destructive rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {formError}
                                </div>
                            )}
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