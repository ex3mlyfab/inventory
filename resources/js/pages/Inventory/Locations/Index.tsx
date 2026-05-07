import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { StorageLocation, Department } from '@/types/auth'; // Using types from auth.ts though they are also in inventory.ts
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { Plus, MapPin, Edit2, Trash2, Home, Package, Activity, MoreVertical, Building2, Eye } from 'lucide-react';
import { Can } from '@/components/can';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Props {
    locations: StorageLocation[];
    departments: Department[];
}

export default function LocationsIndex({ locations, departments }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState<StorageLocation | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        type: 'main_store',
        department_id: '',
        address: '',
        description: '',
        is_active: true
    });

    const { delete: destroy, processing: deleting, errors: deleteErrors, clearErrors: clearDeleteErrors } = useForm({});

    const openCreate = () => {
        setEditingLocation(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEdit = (location: StorageLocation) => {
        setEditingLocation(location);
        setData({
            name: location.name,
            code: location.code,
            type: location.type,
            department_id: location.department_id?.toString() || '',
            address: location.address || '',
            description: location.description || '',
            is_active: !!location.is_active
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const openDelete = (location: StorageLocation) => {
        setLocationToDelete(location);
        clearDeleteErrors();
        setIsDeleteDialogOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLocation) {
            put(`/inventory/locations/${editingLocation.id}`, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                }
            });
        } else {
            post('/inventory/locations', {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = () => {
        if (locationToDelete) {
            destroy(`/inventory/locations/${locationToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setLocationToDelete(null);
                },
                preserveScroll: true
            });
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            main_store: 'Main Store',
            pharmacy: 'Pharmacy',
            satellite_pharmacy: 'Satellite Pharmacy',
            ward_store: 'Ward Store',
            laboratory: 'Laboratory'
        };
        return labels[type] || type;
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'pharmacy':
            case 'satellite_pharmacy':
                return <Activity className="w-5 h-5" />;
            case 'main_store':
                return <Home className="w-5 h-5" />;
            case 'laboratory':
                return <Package className="w-5 h-5" />;
            default:
                return <MapPin className="w-5 h-5" />;
        }
    };

    return (
        <>
            <Head title="Storage Locations" />

            <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full py-8">
                <PageHeader 
                    title="Storage Locations" 
                    description="Manage physical storage areas for medical stock, including pharmacies, wards, and central stores."
                    className="px-4 md:px-0"
                >
                    <Can permission="locations.manage">
                        <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md hover:shadow-lg transition-all" onClick={openCreate}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Location
                        </Button>
                    </Can>
                </PageHeader>

                <div className="bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="grid grid-cols-12 bg-muted/30 px-6 py-3 border-b border-border text-[11px] font-bold uppercase tracking-widest text-text-muted">
                        <div className="col-span-5">Location Details</div>
                        <div className="col-span-3 text-center">Type</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    
                    {locations.length > 0 ? (
                        <div className="flex flex-col w-full divide-y divide-border/30">
                            {locations.map((loc) => (
                                <div key={loc.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-brand/5 transition-colors duration-200">
                                    <div className="col-span-5 flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl bg-brand/10 text-brand shadow-sm`}>
                                            {getTypeIcon(loc.type)}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-text-primary">{loc.name}</span>
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-text-muted">{loc.code}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Building2 className="w-3.5 h-3.5 text-text-muted" />
                                                <span className="text-xs text-text-muted">
                                                    {loc.department?.name || 'No Department'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-3 flex justify-center">
                                        <span className="text-xs font-medium text-text-secondary px-3 py-1 bg-surface rounded-lg border border-border/50">
                                            {getTypeLabel(loc.type)}
                                        </span>
                                    </div>

                                    <div className="col-span-2 flex justify-center">
                                        <StatusBadge variant={loc.is_active ? 'success' : 'draft'}>
                                            {loc.is_active ? 'Active' : 'Inactive'}
                                        </StatusBadge>
                                    </div>

                                    <div className="col-span-2 flex justify-end gap-1">
                                        <Can permission="locations.manage">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-brand">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => window.location.href = `/inventory/locations/${loc.id}`}>
                                                        <Eye className="w-3.5 h-3.5" /> View Store
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(loc)}>
                                                        <Edit2 className="w-3.5 h-3.5" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => openDelete(loc)}>
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </Can>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-text-muted/50" />
                            </div>
                            <div className="max-w-xs">
                                <h3 className="font-semibold text-text-primary">No locations found</h3>
                                <p className="text-sm text-text-muted mt-1">Configure your hospital's storage map to begin tracking inventory across different points.</p>
                            </div>
                            <Can permission="locations.manage">
                                <Button variant="outline" className="mt-2" onClick={openCreate}>
                                    Initialize Locations
                                </Button>
                            </Can>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Location Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
                    <form onSubmit={submit} className="flex flex-col">
                        <div className="px-6 py-6 bg-brand text-brand-foreground">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    {editingLocation ? 'Update Location Details' : 'Register New Storage Location'}
                                </DialogTitle>
                                <DialogDescription className="text-brand-foreground/70">
                                    {editingLocation 
                                        ? `Modify properties for ${editingLocation.name}.` 
                                        : 'Define a new storage area within the hospital database.'}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <div className="p-6 grid gap-6 bg-white">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-text-muted">Display Name</Label>
                                    <Input 
                                        id="name"
                                        placeholder="e.g. Ward A Store, Main Pharmacy"
                                        className="h-10 border-input focus:ring-brand/20 focus:border-brand"
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-text-muted">Location Code</Label>
                                    <Input 
                                        id="code"
                                        placeholder="e.g. WARD-A-ST"
                                        className="h-10 font-mono text-xs border-input focus:ring-brand/20 focus:border-brand"
                                        value={data.code} 
                                        onChange={e => setData('code', e.target.value.toUpperCase())} 
                                    />
                                    <InputError message={errors.code} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-text-muted">Location Type</Label>
                                    <select 
                                        id="type"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                                        value={data.type}
                                        onChange={e => setData('type', e.target.value as any)}
                                    >
                                        <option value="main_store">Main Store</option>
                                        <option value="pharmacy">Pharmacy</option>
                                        <option value="satellite_pharmacy">Satellite Pharmacy</option>
                                        <option value="ward_store">Ward Store</option>
                                        <option value="laboratory">Laboratory</option>
                                    </select>
                                    <InputError message={errors.type} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="department_id" className="text-xs font-bold uppercase tracking-wider text-text-muted">Assigned Department</Label>
                                    <select 
                                        id="department_id"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                                        value={data.department_id}
                                        onChange={e => setData('department_id', e.target.value)}
                                    >
                                        <option value="">Select a Department (Optional)</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.department_id} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-text-muted">Physical Address / Site Location</Label>
                                <Input 
                                    id="address"
                                    placeholder="e.g. Ground Floor, West Wing"
                                    className="h-10 border-input focus:ring-brand/20 focus:border-brand"
                                    value={data.address} 
                                    onChange={e => setData('address', e.target.value)} 
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-text-muted">Notes & Description</Label>
                                <textarea 
                                    id="description"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Operational hours, storage constraints, or contact details..."
                                    value={data.description} 
                                    onChange={e => setData('description', e.target.value)} 
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="flex items-center space-x-2 bg-muted/20 p-4 rounded-xl border border-dashed border-border">
                                <Checkbox 
                                    id="is_active" 
                                    checked={data.is_active} 
                                    onCheckedChange={c => setData('is_active', !!c)} 
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <label htmlFor="is_active" className="text-sm font-bold tracking-tight text-text-primary cursor-pointer">
                                        Activate Location
                                    </label>
                                    <p className="text-[10px] text-text-muted">Inactive locations cannot be selected for new stock movements or inventory transfers.</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-between items-center">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-text-muted hover:text-text-primary">
                                Discard Changes
                            </Button>
                            <Button type="submit" className="bg-brand hover:bg-brand-dark px-10 shadow-lg shadow-brand/20" disabled={processing}>
                                {editingLocation ? 'Save Changes' : 'Create Location'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setLocationToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Decommission Location?"
                description={
                    <div className="space-y-4">
                        <p className="text-sm text-text-secondary">Are you absolutely sure you want to delete <span className="font-extrabold text-text-primary underline decoration-brand/30">{locationToDelete?.name}</span>?</p>
                        
                        {deleteErrors.error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-semibold">
                                {deleteErrors.error}
                            </div>
                        )}

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex gap-3 items-start">
                            <Activity className="w-4 h-4 mt-0.5 shrink-0" />
                            <p><strong>System Rule:</strong> Locations cannot be deleted if they currently hold any active stock batches or have historical movement records linked to them.</p>
                        </div>
                    </div>
                }
                confirmText={deleting ? "Deleting..." : "Confirm Deletion"}
                variant="destructive"
                isLoading={deleting}
            />
        </>
    );
}

// @ts-ignore
LocationsIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '#' },
        { title: 'Storage Locations', href: '#' }
    ],
};

