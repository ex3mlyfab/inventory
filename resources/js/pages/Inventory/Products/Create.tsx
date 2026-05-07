import React, { useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Category, UnitOfMeasure } from '@/types/inventory';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { ImagePlus, X, Upload } from 'lucide-react';

interface Props {
    categories: Category[];
    units: UnitOfMeasure[];
}

export default function CreateProduct({ categories, units }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sku: '',
        barcode: '',
        category_id: '',
        description: '',
        unit_of_measure_id: '',
        image: null as File | null,
        reorder_level: 10,
        reorder_quantity: 50,
        is_expirable: false,
        requires_prescription: false,
        status: 'active'
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('image', null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/products', {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Add Product" />

            <div className="flex flex-col gap-8 py-8 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <PageHeader 
                    title="Add New Product" 
                    description="Enter the details for the new product to add it to the inventory catalog."
                />

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="bg-surface-header/50 border-b border-border py-4 px-6">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-secondary">Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="name" className="text-sm font-semibold">Product Name</Label>
                                        <Input 
                                            id="name"
                                            type="text" 
                                            value={data.name} 
                                            onChange={e => setData('name', e.target.value)} 
                                            placeholder="e.g. Amoxicillin 500mg"
                                            className="h-11"
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="sku" className="text-sm font-semibold">SKU / Reference</Label>
                                        <Input 
                                            id="sku"
                                            type="text" 
                                            value={data.sku} 
                                            onChange={e => setData('sku', e.target.value)} 
                                            placeholder="e.g. AMX-500"
                                            className="h-11 font-mono"
                                        />
                                        <InputError message={errors.sku} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                                        <select 
                                            id="category"
                                            className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
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
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="barcode" className="text-sm font-semibold">Barcode (Optional)</Label>
                                        <Input 
                                            id="barcode"
                                            type="text" 
                                            value={data.barcode} 
                                            onChange={e => setData('barcode', e.target.value)} 
                                            placeholder="Scan or enter barcode"
                                            className="h-11"
                                        />
                                        <InputError message={errors.barcode} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                    <textarea 
                                        id="description"
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        placeholder="Detailed description of the product, indications, etc."
                                    ></textarea>
                                    <InputError message={errors.description} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="bg-surface-header/50 border-b border-border py-4 px-6">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-secondary">Inventory & Measures</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="unit" className="text-sm font-semibold">Primary Unit</Label>
                                        <select 
                                            id="unit"
                                            className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
                                            value={data.unit_of_measure_id}
                                            onChange={e => setData('unit_of_measure_id', e.target.value)}
                                        >
                                            <option value="">Select Unit</option>
                                            {units.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.unit_of_measure_id} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="reorder_level" className="text-sm font-semibold text-warning">Low Stock Level</Label>
                                        <Input 
                                            id="reorder_level"
                                            type="number" 
                                            value={data.reorder_level} 
                                            onChange={e => setData('reorder_level', parseInt(e.target.value))} 
                                            className="h-11"
                                        />
                                        <InputError message={errors.reorder_level} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="reorder_quantity" className="text-sm font-semibold">Standard Order Qty</Label>
                                        <Input 
                                            id="reorder_quantity"
                                            type="number" 
                                            value={data.reorder_quantity} 
                                            onChange={e => setData('reorder_quantity', parseInt(e.target.value))} 
                                            className="h-11"
                                        />
                                        <InputError message={errors.reorder_quantity} />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-8 p-6 bg-brand/5 rounded-xl border border-brand/10">
                                    <label className="flex items-center gap-3 text-sm cursor-pointer group">
                                        <Checkbox 
                                            className="h-5 w-5 data-[state=checked]:bg-brand"
                                            checked={data.is_expirable} 
                                            onCheckedChange={(c) => setData('is_expirable', !!c)} 
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-brand italic">Expirable Item</span>
                                            <span className="text-[10px] text-text-muted">Requires tracking of batch expiry dates</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 text-sm cursor-pointer group">
                                        <Checkbox 
                                            className="h-5 w-5 data-[state=checked]:bg-info"
                                            checked={data.requires_prescription} 
                                            onCheckedChange={(c) => setData('requires_prescription', !!c)} 
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-info italic">Controlled Item</span>
                                            <span className="text-[10px] text-text-muted">Requires strict authorization for issuance</span>
                                        </div>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Image and Submit */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="bg-surface-header/50 border-b border-border py-4 px-6">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-secondary">Product Image</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center gap-4">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative w-full aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3
                                            ${imagePreview ? 'border-brand shadow-md' : 'border-border hover:border-brand/40 hover:bg-brand/5'}`}
                                    >
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button type="button" variant="secondary" size="sm" className="bg-white/20 backdrop-blur-md border-white/30 text-white">
                                                        Change Image
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center text-brand">
                                                    <ImagePlus className="w-8 h-8" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-text-primary">Upload Image</p>
                                                    <p className="text-[10px] text-text-muted mt-0.5">PNG, JPG up to 2MB</p>
                                                </div>
                                                <Button type="button" variant="outline" size="sm" className="mt-2">
                                                    Browse Files
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    {imagePreview && (
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={removeImage}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Remove Image
                                        </Button>
                                    )}

                                    <InputError message={errors.image} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={processing} className="w-full h-12 bg-brand hover:bg-brand-dark text-brand-foreground shadow-lg shadow-brand/20 transition-all font-bold">
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <Upload className="w-4 h-4 animate-bounce" />
                                        Saving Product...
                                    </span>
                                ) : 'Create Product'}
                            </Button>
                            <Link href={'/inventory/products'} className="w-full">
                                <Button variant="outline" type="button" className="w-full h-12">
                                    Cancel & Return
                                </Button>
                            </Link>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-[10px] text-text-muted leading-relaxed italic">
                            Tip: After creating this product, you can start tracking stock by adding batches on the product details page.
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateProduct.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/products' },
        { title: 'Products', href: '/inventory/products' },
        { title: 'Add Product' , href: '#' }
    ],
};
