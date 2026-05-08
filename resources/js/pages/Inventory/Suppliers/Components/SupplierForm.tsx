import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Supplier } from '@/types/inventory';
import InputError from '@/components/input-error';
import { Save, Building2, Contact, MapPin, BadgeCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    supplier?: Supplier;
    categories: string[];
}

export default function SupplierForm({ supplier, categories }: Props) {
    const isEditing = !!supplier;

    const { data, setData, post, put, processing, errors } = useForm({
        name: supplier?.name || '',
        code: supplier?.code || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        contact_person: supplier?.contact_person || '',
        category: supplier?.category || categories[0] || 'general',
        tax_id: supplier?.tax_id || '',
        description: supplier?.description || '',
        status: supplier?.status || 'active',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            put(`/inventory/suppliers/${supplier.id}`);
        } else {
            post('/inventory/suppliers');
        }
    };

    return (
        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Basic Information */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-brand" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Entity Information</h3>
                    </div>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold text-text-muted uppercase tracking-wider">Legal Name</Label>
                            <Input 
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Full registered company name"
                                className="bg-muted/30 border-none focus-visible:ring-brand/20"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code" className="text-xs font-bold text-text-muted uppercase tracking-wider">Internal Code</Label>
                            <Input 
                                id="code"
                                value={data.code}
                                onChange={e => setData('code', e.target.value.toUpperCase())}
                                placeholder="SUP-000"
                                className="bg-muted/30 border-none font-mono focus-visible:ring-brand/20"
                            />
                            <InputError message={errors.code} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold text-text-muted uppercase tracking-wider">Business Category</Label>
                            <Select 
                                value={data.category} 
                                onValueChange={v => setData('category', v)}
                            >
                                <SelectTrigger className="bg-muted/30 border-none focus:ring-brand/20">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat} className="capitalize">
                                            {cat.replace('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tax_id" className="text-xs font-bold text-text-muted uppercase tracking-wider">TIN / Reg No.</Label>
                            <Input 
                                id="tax_id"
                                value={data.tax_id}
                                onChange={e => setData('tax_id', e.target.value)}
                                placeholder="12345678-0001"
                                className="bg-muted/30 border-none focus-visible:ring-brand/20"
                            />
                            <InputError message={errors.tax_id} />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-text-muted uppercase tracking-wider">Vendor Profile / Notes</Label>
                            <textarea 
                                id="description"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Summary of specialties, performance record, or clinical certifications..."
                                className="flex min-h-[100px] w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                            />
                            <InputError message={errors.description} />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                        <Contact className="h-4 w-4 text-brand" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Primary Contact</h3>
                    </div>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="contact_person" className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Person</Label>
                            <Input 
                                id="contact_person"
                                value={data.contact_person}
                                onChange={e => setData('contact_person', e.target.value)}
                                placeholder="Account Manager Name"
                                className="bg-muted/30 border-none focus-visible:ring-brand/20"
                            />
                            <InputError message={errors.contact_person} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</Label>
                            <Input 
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="sales@vendor.com"
                                className="bg-muted/30 border-none focus-visible:ring-brand/20"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold text-text-muted uppercase tracking-wider">Phone Number</Label>
                            <Input 
                                id="phone"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                placeholder="+234 ..."
                                className="bg-muted/30 border-none focus-visible:ring-brand/20"
                            />
                            <InputError message={errors.phone} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                {/* Location & Status */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">Status & Location</h3>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-xs font-bold text-text-muted uppercase tracking-wider">Verification Status</Label>
                            <Select 
                                value={data.status} 
                                onValueChange={v => setData('status', v as 'active' | 'on_hold' | 'inactive' | 'blacklisted' | 'suspended')}
                            >
                                <SelectTrigger className="bg-muted/30 border-none focus:ring-brand/20">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Verified (Active)</SelectItem>
                                    <SelectItem value="on_hold">On Hold (Pending Review)</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-xs font-bold text-text-muted uppercase tracking-wider">Physical Address</Label>
                            <textarea 
                                id="address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                placeholder="Headquarters or Warehouse location"
                                className="flex min-h-[100px] w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                            />
                            <InputError message={errors.address} />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Actions */}
                <Card className="border-brand/20 bg-brand/5 shadow-sm overflow-hidden border-dashed">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-brand">
                            <BadgeCheck className="h-5 w-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Final Audit</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                            Ensure all information provided is accurate and corresponds with official vendor documentation.
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button className="w-full bg-brand hover:bg-brand-dark text-brand-foreground shadow-lg h-11" disabled={processing}>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? 'Save Profile' : 'Register Supplier'}
                            </Button>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="w-full text-text-muted"
                                onClick={() => window.history.back()}
                            >
                                Discard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}
