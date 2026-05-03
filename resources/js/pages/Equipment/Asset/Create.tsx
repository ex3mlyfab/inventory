import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import equipment from '@/routes/equipment';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Category, StorageLocationBasic } from '@/types/inventory';
import { Save, X, Wrench, ShieldCheck, Info } from 'lucide-react';

interface Props {
    categories: Category[];
    locations: StorageLocationBasic[];
}

export default function CreateAsset({ categories, locations }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        asset_tag: '',
        serial_number: '',
        category_id: '',
        model_number: '',
        manufacturer: '',
        purchase_date: '',
        purchase_cost: 0,
        warranty_expiry: '',
        status: 'functional',
        storage_location_id: '',
        notes: ''
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(equipment.assets.store().url);
    };

    return (
        <>
            <Head title="Add Asset" />

            <div className="py-8 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8">
                    <PageHeader 
                        title="Register New Asset" 
                        description="Onboard new equipment or facility assets into the management system."
                    />

                    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity & Classification</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-tight text-slate-600">Asset Name</Label>
                                            <Input 
                                                id="name"
                                                value={data.name} 
                                                onChange={e => setData('name', e.target.value)} 
                                                placeholder="e.g. Philips Ultrasound Machine"
                                                className="h-11 font-medium"
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="asset_tag" className="text-xs font-bold uppercase tracking-tight text-slate-600">Asset Tag / Identifier</Label>
                                            <Input 
                                                id="asset_tag"
                                                value={data.asset_tag} 
                                                onChange={e => setData('asset_tag', e.target.value)} 
                                                placeholder="e.g. BME-2024-001"
                                                className="h-11 font-mono uppercase"
                                            />
                                            <InputError message={errors.asset_tag} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-tight text-slate-600">Category</Label>
                                            <select 
                                                id="category"
                                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
                                                value={data.category_id}
                                                onChange={e => setData('category_id', e.target.value)}
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.category_id} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location" className="text-xs font-bold uppercase tracking-tight text-slate-600">Primary Location</Label>
                                            <select 
                                                id="location"
                                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
                                                value={data.storage_location_id}
                                                onChange={e => setData('storage_location_id', e.target.value)}
                                            >
                                                <option value="">Select Location</option>
                                                {locations.map(l => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.storage_location_id} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manufacturer Details</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="manufacturer" className="text-xs font-bold uppercase tracking-tight text-slate-600">Manufacturer</Label>
                                            <Input 
                                                id="manufacturer"
                                                value={data.manufacturer} 
                                                onChange={e => setData('manufacturer', e.target.value)} 
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="model_number" className="text-xs font-bold uppercase tracking-tight text-slate-600">Model Number</Label>
                                            <Input 
                                                id="model_number"
                                                value={data.model_number} 
                                                onChange={e => setData('model_number', e.target.value)} 
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="serial_number" className="text-xs font-bold uppercase tracking-tight text-slate-600">Serial Number</Label>
                                            <Input 
                                                id="serial_number"
                                                value={data.serial_number} 
                                                onChange={e => setData('serial_number', e.target.value)} 
                                                className="h-10 font-mono"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acquisition & Warranty</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="purchase_date" className="text-xs font-bold uppercase tracking-tight text-slate-600">Purchase Date</Label>
                                            <Input 
                                                id="purchase_date"
                                                type="date"
                                                value={data.purchase_date} 
                                                onChange={e => setData('purchase_date', e.target.value)} 
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="purchase_cost" className="text-xs font-bold uppercase tracking-tight text-slate-600">Cost (₦)</Label>
                                            <Input 
                                                id="purchase_cost"
                                                type="number"
                                                value={data.purchase_cost} 
                                                onChange={e => setData('purchase_cost', parseFloat(e.target.value))} 
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="warranty_expiry" className="text-xs font-bold uppercase tracking-tight text-slate-600">Warranty Expiry</Label>
                                            <Input 
                                                id="warranty_expiry"
                                                type="date"
                                                value={data.warranty_expiry} 
                                                onChange={e => setData('warranty_expiry', e.target.value)} 
                                                className="h-10"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <select 
                                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand font-bold text-slate-700"
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value as any)}
                                    >
                                        <option value="functional">Functional</option>
                                        <option value="under_maintenance">Under Maintenance</option>
                                        <option value="damaged">Damaged</option>
                                        <option value="lost">Lost</option>
                                        <option value="decommissioned">Decommissioned</option>
                                    </select>
                                    
                                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <div className="flex gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Active Tracking</p>
                                                <p className="text-[10px] text-emerald-600 italic mt-0.5">Asset will be included in maintenance cycles and audits.</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3 px-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <textarea 
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                                        value={data.notes}
                                        onChange={e => setData('notes', e.target.value)}
                                        placeholder="Additional asset details, specific handling instructions..."
                                    />
                                </CardContent>
                            </Card>

                            <div className="flex flex-col gap-3">
                                <Button type="submit" disabled={processing} className="w-full h-12 bg-brand hover:bg-brand-dark text-white shadow-lg transition-all font-bold">
                                    <Save className="w-4 h-4 mr-2" />
                                    Register Asset
                                </Button>
                                <Link href={equipment.assets.index().url} className="w-full">
                                    <Button variant="outline" type="button" className="w-full h-12">
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

(CreateAsset as any).layout = {
    breadcrumbs: [
        { title: 'Equipment', href: equipment.assets.index().url },
        { title: 'Assets', href: equipment.assets.index().url },
        { title: 'Register Asset' , href: '#' }
    ],
};
