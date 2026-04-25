import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { PageHeader } from '@/Components/shared/page-header';
import { Category } from '@/types/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import InputError from '@/Components/input-error';
import { Plus, Folder, Edit2, Trash2, ChevronRight, MoreVertical } from 'lucide-react';
import { Can } from '@/Components/can';
import { StatusBadge } from '@/Components/shared/status-badge';
import { ConfirmationDialog } from '@/Components/shared/confirmation-dialog';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/Components/ui/dropdown-menu';
import { DialogTrigger } from '@/Components/ui/dialog';

interface Props {
    categories: Category[];
}

export default function CategoriesIndex({ categories }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        is_active: true
    });

    const { delete: destroy, processing: deleting, errors: deleteErrors, clearErrors: clearDeleteErrors } = useForm({});

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (open && !editingCategory) {
            reset();
            clearErrors();
        }
    };

    const openCreate = () => {
        setEditingCategory(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parent_id: category.parent_id?.toString() || '',
            is_active: !!category.is_active
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const openDelete = (category: Category) => {
        setCategoryToDelete(category);
        clearDeleteErrors();
        setIsDeleteDialogOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            put(`/inventory/categories/${editingCategory.id}`, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                }
            });
        } else {
            post('/inventory/categories', {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = () => {
        if (categoryToDelete) {
            destroy(`/inventory/categories/${categoryToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                },
                preserveScroll: true
            });
        }
    };

    const renderNode = (category: Category, depth: number = 0) => {
        return (
            <div key={category.id} className="flex flex-col group">
                <div 
                    className={`flex items-center gap-4 py-3 border-b border-border/50 hover:bg-brand/5 transition-colors duration-200 ${depth === 0 ? 'bg-white font-medium px-6 py-4' : 'bg-surface px-6 py-3'}`}
                    style={{ paddingLeft: `${(depth * 2) + 1.5}rem` }}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {depth > 0 && <ChevronRight className="w-4 h-4 text-text-muted" />}
                        <div className={`p-2 rounded-lg ${depth === 0 ? 'bg-brand/10 text-brand' : 'bg-muted text-text-muted'}`}>
                            <Folder className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col truncate">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">{category.name}</span>
                                <StatusBadge variant={category.is_active ? 'success' : 'draft'}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </StatusBadge>
                            </div>
                            {category.description && (
                                <span className="text-xs text-text-muted truncate max-w-md">
                                    {category.description}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Slug</span>
                            <span className="text-xs font-mono text-text-secondary">/{category.slug}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Can permission="categories.edit">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-text-muted hover:text-brand hover:bg-brand/10"
                                    onClick={() => openEdit(category)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </Can>
                            
                            <Can permission="categories.delete">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-text-muted hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => openDelete(category)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </Can>
                        </div>
                    </div>
                </div>
                {category.children && category.children.length > 0 && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                        {category.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title="Categories" />

            <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full py-8">
                <PageHeader 
                    title="Inventory Categories" 
                    description="Organize your pharmaceutical and hospital stock within a hierarchical classification system."
                    className="px-4 md:px-0"
                >
                    <Can permission="categories.create">
                        <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md hover:shadow-lg transition-all" onClick={openCreate}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Category
                        </Button>
                    </Can>
                </PageHeader>

                <div className="bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="bg-muted/30 px-6 py-3 border-b border-border flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-text-muted">
                        <span>Hierarchy & Details</span>
                        <div className="flex items-center gap-12 mr-24">
                            <span>Slug Reference</span>
                            <span>Actions</span>
                        </div>
                    </div>
                    
                    {categories.length > 0 ? (
                        <div className="flex flex-col w-full divide-y divide-border/30">
                            {categories.map((c) => renderNode(c, 0))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Folder className="w-8 h-8 text-text-muted/50" />
                            </div>
                            <div className="max-w-xs">
                                <h3 className="font-semibold text-text-primary">No categories yet</h3>
                                <p className="text-sm text-text-muted mt-1">Start by creating your first top-level category to organize your products.</p>
                            </div>
                            <Can permission="categories.create">
                                <Button variant="outline" className="mt-2" onClick={openCreate}>
                                    Create Category
                                </Button>
                            </Can>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Category Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                            <DialogDescription>
                                {editingCategory 
                                    ? `Update the details for ${editingCategory.name}.` 
                                    : 'Add a new classification level to your inventory.'}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-5 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="parent_id" className="text-xs font-bold uppercase tracking-wider text-text-muted">Parent Category</Label>
                                <select 
                                    id="parent_id"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50"
                                    value={data.parent_id}
                                    onChange={e => setData('parent_id', e.target.value)}
                                >
                                    <option value="">None (Top Level)</option>
                                    {categories.map(c => (
                                        <React.Fragment key={c.id}>
                                            <option value={c.id} disabled={editingCategory?.id === c.id}>{c.name}</option>
                                            {c.children && c.children.map(child => (
                                                <option key={child.id} value={child.id} disabled={editingCategory?.id === child.id}>
                                                    &nbsp;&nbsp;— {child.name}
                                                </option>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </select>
                                <p className="text-[10px] text-text-muted italic">Hierarchy is limited to 3 levels deep.</p>
                                <InputError message={errors.parent_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-text-muted">Display Name</Label>
                                <Input 
                                    id="name"
                                    placeholder="e.g. Antibiotics, Surgical Supplies"
                                    className="h-10 border-input focus:ring-brand/20 focus:border-brand"
                                    value={data.name} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        setData('name', val);
                                        // auto-generate slug IF it's empty or matches the old auto-gen version
                                        const autoSlug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/^-+|-+$/g, '');
                                        if(!data.slug || data.slug === data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/^-+|-+$/g, '')) {
                                            setData('slug', autoSlug);
                                        }
                                    }} 
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-text-muted">URL Identifier (Slug)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">/</span>
                                    <Input 
                                        id="slug"
                                        className="h-10 pl-6 font-mono text-sm border-input focus:ring-brand/20 focus:border-brand"
                                        value={data.slug} 
                                        onChange={e => setData('slug', e.target.value)} 
                                    />
                                </div>
                                <InputError message={errors.slug} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-text-muted">Description (Optional)</Label>
                                <textarea 
                                    id="description"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Provide brief context for this category..."
                                    value={data.description} 
                                    onChange={e => setData('description', e.target.value)} 
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                                <Checkbox 
                                    id="is_active" 
                                    checked={data.is_active} 
                                    onCheckedChange={c => setData('is_active', !!c)} 
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <label htmlFor="is_active" className="text-sm font-semibold tracking-tight text-text-primary cursor-pointer">
                                        Mark as Active
                                    </label>
                                    <p className="text-[10px] text-text-muted">Inactive categories are hidden from selection during stock entry.</p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-brand hover:bg-brand-dark px-8" disabled={processing}>
                                {editingCategory ? 'Update Category' : 'Create Category'}
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
                    setCategoryToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Category?"
                description={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete <span className="font-bold text-text-primary">{categoryToDelete?.name}</span>? This action cannot be undone.</p>
                        
                        {deleteErrors.error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-medium animate-in shake-1">
                                {deleteErrors.error}
                            </div>
                        )}

                        <div className="p-3 bg-critical/5 border border-critical/10 rounded-lg text-xs text-text-muted">
                            <p><strong>Note:</strong> You cannot delete categories that contain sub-categories or assigned products.</p>
                        </div>
                    </div>
                }
                confirmText={deleting ? "Deleting..." : "Delete Category"}
                variant="destructive"
                isLoading={deleting}
            />
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '#' },
        { title: 'Categories', href: '#' }
    ],
};
