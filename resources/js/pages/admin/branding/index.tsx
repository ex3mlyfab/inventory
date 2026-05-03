import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, Save, Upload } from 'lucide-react';
import { useState } from 'react';
import brandingRoutes from '@/routes/admin/branding';

interface BrandingProps {
    branding: {
        app_name: string;
        app_tagline: string;
        app_logo: string | null;
    };
}

export default function Branding({ branding }: BrandingProps) {
    const [logoPreview, setLogoPreview] = useState<string | null>(branding.app_logo);

    const { data, setData, post, processing, errors } = useForm({
        app_name: branding.app_name,
        app_tagline: branding.app_tagline,
        app_logo_file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_logo_file', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(brandingRoutes.update.url(), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="System Branding" />
            <div className="space-y-6 p-6">
                <PageHeader
                    title="System Branding"
                    description="Customize the look and feel of your application."
                />

                <div className="mx-auto max-w-2xl">
                    <form onSubmit={submit} className="space-y-6">
                        <Card className="border-[#E1E3E5] shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">General Branding</CardTitle>
                                <CardDescription>Update the application name and tagline.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="app_name">Application Name</Label>
                                    <Input
                                        id="app_name"
                                        value={data.app_name}
                                        onChange={(e) => setData('app_name', e.target.value)}
                                        placeholder="MedStock Pro"
                                        className={errors.app_name ? 'border-red-500' : ''}
                                    />
                                    {errors.app_name && <p className="text-xs text-red-500">{errors.app_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="app_tagline">Tagline / Motto</Label>
                                    <Input
                                        id="app_tagline"
                                        value={data.app_tagline}
                                        onChange={(e) => setData('app_tagline', e.target.value)}
                                        placeholder="Precision in Pharmacy"
                                        className={errors.app_tagline ? 'border-red-500' : ''}
                                    />
                                    {errors.app_tagline && <p className="text-xs text-red-500">{errors.app_tagline}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#E1E3E5] shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Logo & Visuals</CardTitle>
                                <CardDescription>Upload your organization logo.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#E1E3E5] bg-gray-50 transition-colors hover:bg-gray-100">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <ImageIcon className="mb-2 h-8 w-8" />
                                                <span className="text-[10px] font-medium">No Logo</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex w-full items-center justify-center">
                                        <Label
                                            htmlFor="logo-upload"
                                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#181d1a] shadow-sm ring-1 ring-inset ring-[#E1E3E5] hover:bg-gray-50 transition-all"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Upload Logo
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </Label>
                                    </div>
                                    <p className="text-center text-[10px] text-gray-500">
                                        Recommended: SVG or PNG with transparent background. Max size 2MB.
                                    </p>
                                    {errors.app_logo_file && <p className="text-xs text-red-500">{errors.app_logo_file}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-end">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#181d1a] text-white hover:bg-[#181d1a]/90"
                            >
                                {processing ? 'Saving...' : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Branding Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Branding.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '#' },
        { title: 'Branding', href: brandingRoutes.index.url() },
    ],
};
