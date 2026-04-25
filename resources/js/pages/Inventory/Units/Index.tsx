import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { PageHeader } from '@/Components/shared/page-header';
import { DataTable, Column } from '@/Components/shared/data-table';
import { UnitOfMeasure } from '@/types/inventory';
import { Button } from '@/Components/ui/button';
import { Plus, Ruler, Edit2, Trash2, Scale, Search, X, MoreHorizontal } from 'lucide-react';
import { Can } from '@/Components/can';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import InputError from '@/Components/input-error';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/Components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/Components/shared/confirmation-dialog';
import { Badge } from '@/Components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';

interface Props {
    units: {
        data: UnitOfMeasure[];
        meta: PaginationMeta;
        links: any[];
    };
    filters: {
        search?: string;
    };
    base_units: UnitOfMeasure[];
}

export default function UnitsIndex({ units, filters, base_units }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<UnitOfMeasure | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const debouncedSearch = useDebounce(searchQuery, 400);

    // Initial load tracking to avoid searching on first render if no change
    const [isInitialRender, setIsInitialRender] = useState(true);

    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
            return;
        }

        router.get('/inventory/units', 
            { search: debouncedSearch }, 
            { preserveState: true, preserveScroll: true, replace: true }
        );
    }, [debouncedSearch]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        abbreviation: '',
        base_unit_id: '',
        conversion_factor: 1
    });

    const { delete: destroy, processing: deleting, errors: deleteErrors, clearErrors: clearDeleteErrors } = useForm({});

    const openCreate = () => {
        setEditingUnit(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEdit = (unit: UnitOfMeasure) => {
        setEditingUnit(unit);
        setData({
            name: unit.name,
            abbreviation: unit.abbreviation,
            base_unit_id: unit.base_unit_id || '',
            conversion_factor: unit.conversion_factor
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const openDelete = (unit: UnitOfMeasure) => {
        setUnitToDelete(unit);
        clearDeleteErrors();
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit) {
            put(`/inventory/units/${editingUnit.id}`, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                }
            });
        } else {
            post('/inventory/units', {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = () => {
        if (unitToDelete) {
            destroy(`/inventory/units/${unitToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setUnitToDelete(null);
                },
                preserveScroll: true
            });
        }
    };

    const columns: Column<UnitOfMeasure>[] = [
        {
            header: 'Unit Name',
            cell: (unit) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-brand/5 text-brand flex items-center justify-center border border-brand/10">
                        <Scale className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{unit.name}</span>
                        <span className="text-[11px] font-mono text-text-muted tracking-wide uppercase">{unit.abbreviation}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Conversion',
            cell: (unit) => (
                <div className="flex flex-col gap-1">
                    {unit.base_unit_id ? (
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-text-primary">1 {unit.abbreviation}</span>
                            <span className="text-text-muted">=</span>
                            <Badge variant="secondary" className="px-2 h-5 bg-brand/10 text-brand border-none">
                                {unit.conversion_factor} {unit.base_unit?.abbreviation}
                            </Badge>
                        </div>
                    ) : (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-info/30 text-info bg-info/5 px-2">
                            Base Unit
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: '',
            id: 'actions',
            className: 'text-right min-w-[50px]',
            cell: (unit) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(unit)} className="cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Can permission="units.delete">
                            <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={() => openDelete(unit)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Unit
                            </DropdownMenuItem>
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <>
            <Head title="Units of Measure" />

            <div className="flex flex-col gap-8 py-8 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <PageHeader 
                    title="Units of Measure" 
                    description="Define standardized units and conversion factors for consistent stock management."
                >
                    <Can permission="units.create">
                        <Button 
                            className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-[0_4px_14px_0_rgb(0,128,96,0.39)] hover:shadow-[0_6px_20px_rgba(0,128,96,0.23)] transition-all duration-300 px-6 font-semibold" 
                            onClick={openCreate}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Unit
                        </Button>
                    </Can>
                </PageHeader>

                <div className="flex flex-col gap-6">
                    <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                            <Input 
                                placeholder="Search units or abbreviations..." 
                                className="pl-10 h-11 bg-surface border-border/60 focus:bg-white transition-all shadow-none"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full text-text-muted"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <DataTable 
                            columns={columns}
                            data={units?.data || []}
                            meta={units as any}
                            keyExtractor={(u) => u?.id}
                            emptyMessage={searchQuery ? `No results found for "${searchQuery}"` : "No units of measure defined yet."}
                        />
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
                            <DialogDescription>
                                Set up units like tablets, packs, or liters with conversion logic.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Unit Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. Tablets, Box of 100" 
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="abbreviation">Abbreviation</Label>
                                <Input 
                                    id="abbreviation" 
                                    placeholder="e.g. tabs, bx100" 
                                    value={data.abbreviation} 
                                    onChange={e => setData('abbreviation', e.target.value)} 
                                />
                                <InputError message={errors.abbreviation} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="base_unit_id">Base Unit (Optional)</Label>
                                <select 
                                    id="base_unit_id"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                                    value={data.base_unit_id}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setData('base_unit_id', val);
                                        if(!val) setData('conversion_factor', 1);
                                    }}
                                >
                                    <option value="">None (This is a Base Unit)</option>
                                    {Array.isArray(base_units) && base_units.filter(u => !editingUnit || u.id !== editingUnit.id).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                                    ))}
                                </select>
                                <InputError message={errors.base_unit_id} />
                            </div>

                            {data.base_unit_id && (
                                <div className="grid gap-2">
                                    <Label htmlFor="conversion_factor">Conversion Factor</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted font-medium">1 {data.abbreviation || 'Unit'} =</div>
                                        <Input 
                                            id="conversion_factor" 
                                            type="number" 
                                            step="0.0001"
                                            className="pl-20"
                                            placeholder="1.0000" 
                                            value={data.conversion_factor} 
                                            onChange={e => setData('conversion_factor', parseFloat(e.target.value))} 
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                                            {units.find(u => u.id === data.base_unit_id)?.abbreviation}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-text-muted italic">How many base units are in this unit?</p>
                                    <InputError message={errors.conversion_factor} />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-brand hover:bg-brand-dark" disabled={processing}>
                                {editingUnit ? 'Update Unit' : 'Create Unit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setUnitToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Unit of Measure?"
                description={
                    <div className="space-y-3">
                        <p>Confirm deletion of <span className="font-bold text-text-primary">{unitToDelete?.name}</span>.</p>
                        {deleteErrors.error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-medium">
                                {deleteErrors.error}
                            </div>
                        )}
                        <p className="text-xs text-text-muted italic">Deleting a unit may fail if it is assigned to existing products.</p>
                    </div>
                }
                confirmText={deleting ? "Deleting..." : "Delete Unit"}
                variant="destructive"
                isLoading={deleting}
            />
        </>
    );
}

UnitsIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '#' },
        { title: 'Units of Measure', href: '#' }
    ]
};
