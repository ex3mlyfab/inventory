import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import SupplierForm from './Components/SupplierForm';

interface Props {
    categories: string[];
}

export default function SupplierCreate({ categories }: Props) {
    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title="Register New Supplier" />

            <div className="flex flex-col gap-4">
                <Link href="/inventory/suppliers" className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Directory
                </Link>

                <PageHeader 
                    title="Register New Supplier" 
                    description="Onboard a new vendor or distributor into the hospital's supply chain network."
                />
            </div>

            <SupplierForm categories={categories} />
        </div>
    );
}

// @ts-ignore
SupplierCreate.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Supplier Network', href: '/inventory/suppliers' },
        { title: 'Registration', href: '#' }
    ],
};
