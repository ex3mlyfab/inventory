import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import { Supplier } from '@/types/inventory';
import SupplierForm from './Components/SupplierForm';

interface Props {
    supplier: Supplier;
    categories: string[];
}

export default function SupplierEdit({ supplier, categories }: Props) {
    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title={`Edit Supplier: ${supplier.name}`} />

            <div className="flex flex-col gap-4">
                <Link href={`/inventory/suppliers/${supplier.id}`} className="flex items-center text-sm text-text-muted hover:text-brand transition-colors w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Details
                </Link>

                <PageHeader 
                    title="Edit Supplier Profile" 
                    description={`Review and update information for ${supplier.name}.`}
                />
            </div>

            <SupplierForm supplier={supplier} categories={categories} />
        </div>
    );
}

// @ts-ignore
SupplierEdit.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/stock' },
        { title: 'Supplier Network', href: '/inventory/suppliers' },
        { title: 'Edit Profile', href: '#' }
    ],
};
