import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Product, PaginationMeta } from '@/types/inventory';
import { ProductSearch } from '../Components/ProductSearch';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Eye, Edit2, Trash2, Package } from 'lucide-react';
import { StockLevelIndicator } from '../Components/StockLevelIndicator';
import { Can } from '@/components/can';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/stat-card';
import { AlertTriangle, PackageSearch } from 'lucide-react';

interface Props {
    products: {
        data: Product[];
    } & PaginationMeta;
    filters: {
        search?: string;
    };
    stats: {
        total: number;
        low_stock: number;
        out_of_stock: number;
    };
}

export default function ProductsIndex({ products, filters, stats }: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const { delete: destroy, processing: deleting, errors: deleteErrors, clearErrors } = useForm<{ error?: string }>({});

    const openDelete = (product: Product) => {
        setProductToDelete(product);
        clearErrors();
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (productToDelete) {
            destroy(`/inventory/products/${productToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setProductToDelete(null);
                },
                preserveScroll: true
            });
        }
    };

    const columns: Column<Product>[] = [
        {
            header: 'Product Details',
            cell: (product) => (
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-brand/5 text-brand border border-brand/10 shrink-0 overflow-hidden shadow-inner">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                            <Package className="h-6 w-6" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-text-primary truncate">{product.name}</span>
                        <span className="text-[10px] font-mono text-text-muted tracking-tight uppercase">{product.sku}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Category',
            cell: (product) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-text-secondary">{product.category?.name || 'Uncategorized'}</span>
                    {product.requires_prescription && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-info/30 text-info bg-info/5 uppercase leading-none">Rx Required</Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Stock Status',
            cell: (product) => (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-text-primary">{product.quantity_on_hand || 0}</span>
                        <span className="text-[10px] text-text-muted uppercase font-medium">{product.unit_of_measure?.abbreviation || 'units'}</span>
                    </div>
                    <StockLevelIndicator currentStock={product.quantity_on_hand || 0} reorderLevel={product.reorder_level} />
                </div>
            )
        },
        {
            header: 'Properties',
            cell: (product) => (
                <div className="flex flex-wrap gap-1">
                    {product.is_expirable && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-warning-bg/50 text-warning-foreground border-none">Expirable</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] h-5 px-2 border-border/50 text-text-muted">{product.status || 'Active'}</Badge>
                </div>
            )
        },
        {
            header: '',
            id: 'actions',
            className: 'text-right min-w-[50px]',
            cell: (product) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/inventory/products/${product.id}`} className="flex items-center cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <Can permission="products.edit">
                            <DropdownMenuItem asChild>
                                <Link href={`/inventory/products/${product.id}/edit`} className="flex items-center cursor-pointer">
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit Product
                                </Link>
                            </DropdownMenuItem>
                        </Can>
                        <DropdownMenuSeparator />
                        <Can permission="products.delete">
                            <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={() => openDelete(product)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                            </DropdownMenuItem>
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <>
            <Head title="Products Catalog" />

            <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                <PageHeader 
                    title="Products Catalog" 
                    description="Central registry for medical supplies, pharmaceuticals, and consumables."
                >
                    <Can permission="products.create">
                        <Link href={'/inventory/products/create'}>
                            <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md hover:shadow-lg transition-all px-6">
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Product
                            </Button>
                        </Link>
                    </Can>
                </PageHeader>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <StatCard 
                        label="Total Registered Products" 
                        value={stats.total} 
                        icon={Package} 
                    />
                    <StatCard 
                        label="Low Stock Alert" 
                        value={stats.low_stock} 
                        icon={AlertTriangle} 
                        className={stats.low_stock > 0 ? "border-warning/30 bg-warning/5" : ""}
                    />
                    <StatCard 
                        label="Out of Stock" 
                        value={stats.out_of_stock} 
                        icon={PackageSearch} 
                        className={stats.out_of_stock > 0 ? "border-destructive/20 bg-destructive/5" : ""}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-5 rounded-2xl border border-border shadow-sm">
                        <ProductSearch initialSearch={filters.search} routePath='/inventory/products' />
                        <div className="flex items-center gap-2">
                           {/* Future: Add Category Filter Dropdown */}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <DataTable 
                            columns={columns}
                            data={products.data}
                            meta={products}
                            keyExtractor={(p) => p.id}
                            emptyMessage={
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-text-muted/30">
                                        <Package className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-primary">No products found</p>
                                        <p className="text-sm text-text-muted mt-1">Try adjusting your search or add a new product to the catalog.</p>
                                    </div>
                                </div>
                            }
                        />
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col gap-3">
                        {products.data.length > 0 ? (
                            products.data.map((product) => (
                                <div key={product.id} className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 hover:shadow-md transition-all duration-200">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="h-11 w-11 rounded-xl bg-brand/5 text-brand border border-brand/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-text-primary truncate">{product.name}</span>
                                                <span className="text-[10px] font-mono text-text-muted tracking-tight uppercase">{product.sku}</span>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary shrink-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/inventory/products/${product.id}`} className="flex items-center cursor-pointer">
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <Can permission="products.edit">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/inventory/products/${product.id}/edit`} className="flex items-center cursor-pointer">
                                                            <Edit2 className="mr-2 h-4 w-4" /> Edit Product
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </Can>
                                                <DropdownMenuSeparator />
                                                <Can permission="products.delete">
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                        onClick={() => openDelete(product)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                                                    </DropdownMenuItem>
                                                </Can>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2 pl-[56px]">
                                        <span className="text-xs text-text-secondary">{product.category?.name || 'Uncategorized'}</span>
                                        {product.requires_prescription && (
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-info/30 text-info bg-info/5 uppercase leading-none">Rx</Badge>
                                        )}
                                        {product.is_expirable && (
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-warning-bg/50 text-warning-foreground border-none">Expirable</Badge>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center justify-between pl-[56px] pt-2 border-t border-border/30">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-text-primary">{product.quantity_on_hand || 0}</span>
                                            <span className="text-[10px] text-text-muted uppercase font-medium">{product.unit_of_measure?.abbreviation || 'units'}</span>
                                        </div>
                                        <StockLevelIndicator currentStock={product.quantity_on_hand || 0} reorderLevel={product.reorder_level} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white rounded-2xl border border-border">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-text-muted/30">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-text-primary">No products found</p>
                                    <p className="text-sm text-text-muted mt-1">Try adjusting your search or add a new product to the catalog.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setProductToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Product?"
                description={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete <span className="font-bold text-text-primary">{productToDelete?.name}</span>?</p>
                        
                        {deleteErrors.error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-medium">
                                {deleteErrors.error}
                            </div>
                        )}

                        <div className="p-3 bg-muted/50 rounded-lg text-xs text-text-muted border border-border/50">
                            <p><strong>Conditions for deletion:</strong></p>
                            <ul className="list-disc pl-4 mt-1 space-y-1">
                                <li>Current stock must be zero.</li>
                                <li>No historical batch records must exist.</li>
                            </ul>
                        </div>
                    </div>
                }
                confirmText={deleting ? "Deleting..." : "Delete Product"}
                variant="destructive"
                isLoading={deleting}
            />
        </>
    );
}

// @ts-ignore
ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/products' },
        { title: 'Products Catalog', href: '/inventory/products' }
    ]
};
