import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Supplier, SupplierStatus } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Edit2, Building2, Phone, Mail, MapPin, Info, ArrowLeft, CreditCard } from 'lucide-react';
import { Can } from '@/components/can';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    supplier: Supplier;
}

export default function SupplierShow({ supplier }: Props) {
    const statusStyles: Record<SupplierStatus, string> = {
        active: 'bg-success/10 text-success border-success/20',
        inactive: 'bg-muted text-text-muted border-border',
        suspended: 'bg-destructive/10 text-destructive border-destructive/20',
    };

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title={`Supplier: ${supplier.name}`} />

            <div className="flex flex-col gap-4">
                <Link href="/inventory/suppliers" className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Directory
                </Link>

                <PageHeader 
                    title={supplier.name} 
                    description={`Supplier Code: ${supplier.code}`}
                >
                    <div className="flex items-center gap-3">
                        <Badge className={`capitalize text-[10px] font-bold ${statusStyles[supplier.status]}`}>
                            {supplier.status}
                        </Badge>
                        <Can permission="suppliers.edit">
                            <Link href={`/inventory/suppliers/${supplier.id}/edit`}>
                                <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md transition-all">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Supplier
                                </Button>
                            </Link>
                        </Can>
                    </div>
                </PageHeader>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-brand" />
                                General Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Legal Name</label>
                                        <p className="text-text-primary font-medium">{supplier.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Supplier Code</label>
                                        <p className="text-text-primary font-mono">{supplier.code}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Category</label>
                                        <p className="text-text-primary capitalize">{supplier.category.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Tax ID / Reg No.</label>
                                        <p className="text-text-primary font-medium">{supplier.tax_id || 'Not Provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Registration Date</label>
                                        <p className="text-text-primary">{new Date(supplier.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="md:col-span-2 text-wrap break-words">
                                    <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Description</label>
                                    <p className="text-text-secondary text-sm mt-1 leading-relaxed whitespace-pre-wrap">
                                        {supplier.description || 'No description available for this supplier.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-brand" />
                                Location & Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/20 border border-border/50">
                                    <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                                        <MapPin className="h-5 w-5 text-brand" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-text-primary font-medium">{supplier.address || 'No physical address provided'}</p>
                                        <p className="text-sm text-text-muted">
                                            {supplier.city && `${supplier.city}, `}
                                            {supplier.state && `${supplier.state}, `}
                                            {supplier.country}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="flex flex-col gap-8">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-brand text-brand-foreground">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Contact Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-brand/5 border border-brand/10 flex items-center justify-center">
                                        <Building2 className="h-4 w-4 text-brand" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-text-muted">Contact Person</label>
                                        <span className="text-sm font-medium">{supplier.contact_person || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-brand/5 border border-brand/10 flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-brand" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-text-muted">Phone Number</label>
                                        <span className="text-sm font-medium">{supplier.phone || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-brand/5 border border-brand/10 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-brand" />
                                    </div>
                                    <div className="min-w-0">
                                        <label className="block text-[10px] uppercase font-bold text-text-muted">Email Address</label>
                                        <span className="text-sm font-medium truncate block">{supplier.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full justify-start border-border hover:bg-muted" asChild disabled={!supplier.email}>
                                <a href={supplier.email ? `mailto:${supplier.email}` : '#'}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Email
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden border-l-4 border-l-brand">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-text-primary uppercase text-[11px] tracking-widest">Financial Meta</h4>
                                <CreditCard className="h-4 w-4 text-brand" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-medium text-text-muted">Payment Terms</label>
                                    <span className="text-sm font-semibold">Standard Net 30</span>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-text-muted">Total Procured Value</label>
                                    <span className="text-lg font-bold text-brand">₦ 0.00</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// @ts-ignore
SupplierShow.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Supplier Network', href: '/inventory/suppliers' },
        { title: 'Details', href: '#' }
    ],
};
