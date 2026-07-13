import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { 
    Users, 
    Package, 
    History, 
    ArrowLeft, 
    Plus, 
    UserMinus, 
    MapPin, 
    Building2,
    Calendar,
    Activity,
    Search,
    Filter,
    UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from '@/components/ui/dialog';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
    location: any;
    inventory: any[];
    history: {
        data: any[];
        links: any[];
        current_page: number;
        last_page: number;
    };
    assignableUsers: any[];
    isSuperAdmin: boolean;
}

export default function ShowLocation({ location, inventory, history, assignableUsers, isSuperAdmin }: Props) {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    
    const assignForm = useForm({
        user_ids: [] as string[]
    });

    const removeForm = useForm({});

    const handleAssignUsers = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post(`/inventory/locations/${location.id}/assign-users`, {
            onSuccess: () => {
                setIsAssignModalOpen(false);
                assignForm.reset();
                toast.success('Users assigned successfully');
            }
        });
    };

    const handleRemoveUser = (user: any) => {
        if (confirm(`Are you sure you want to remove ${user.name} from this location?`)) {
            removeForm.delete(`/inventory/locations/${location.id}/users/${user.id}`, {
                onSuccess: () => {
                    toast.success('User removed successfully');
                }
            });
        }
    };

    const toggleUserSelection = (userId: string | number) => {
        const id = String(userId);
        const current = [...assignForm.data.user_ids];
        if (current.includes(id)) {
            assignForm.setData('user_ids', current.filter(existing => existing !== id));
        } else {
            assignForm.setData('user_ids', [...current, id]);
        }
    };

    const filteredAssignableUsers = assignableUsers.filter(u => 
        u.name.toLowerCase().includes(searchUser.toLowerCase()) || 
        u.email.toLowerCase().includes(searchUser.toLowerCase())
    );

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

    return (
        <>
            <Head title={`Store — ${location.name}`} />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full py-8 px-4">
                {/* Navigation Back */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" asChild className="text-text-muted hover:text-brand">
                        <Link href="/inventory/locations">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Locations
                        </Link>
                    </Button>
                </div>

                {/* Store Header Card */}
                <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden mb-4">
                    <div className="bg-brand p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                                        {getTypeLabel(location.type)}
                                    </Badge>
                                    {location.is_active ? (
                                        <Badge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full">Active</Badge>
                                    ) : (
                                        <Badge className="bg-slate-500 text-white border-none px-3 py-1 rounded-full">Inactive</Badge>
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                    {location.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm bg-white/10 px-2 py-0.5 rounded border border-white/10">{location.code}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">{location.department?.name || 'Central Facility'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm">{location.address || 'Standard Location'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                {isSuperAdmin && (
                                    <Button 
                                        className="bg-white text-brand hover:bg-white/90 shadow-xl"
                                        onClick={() => setIsAssignModalOpen(true)}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Manage Staff
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="inventory" className="w-full space-y-6">
                    <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border inline-flex h-auto">
                        <TabsTrigger value="inventory" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Package className="w-4 h-4 mr-2" />
                            Inventory Directory
                        </TabsTrigger>
                        <TabsTrigger value="users" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Users className="w-4 h-4 mr-2" />
                            Assigned Personnel
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <History className="w-4 h-4 mr-2" />
                            Stock Life-Cycle
                        </TabsTrigger>
                    </TabsList>

                    {/* Inventory Directory */}
                    <TabsContent value="inventory" className="space-y-4">
                        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg">Stock on Hand</CardTitle>
                                        <CardDescription>Directory of products currently stored in this location.</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="px-3">
                                        {inventory.length} Unique Products
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/10">
                                            <TableHead className="pl-6 uppercase text-[10px] font-bold">Product Information</TableHead>
                                            <TableHead className="uppercase text-[10px] font-bold text-center">Batches</TableHead>
                                            <TableHead className="uppercase text-[10px] font-bold text-center">Available Stock</TableHead>
                                            <TableHead className="pr-6 text-right uppercase text-[10px] font-bold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inventory.length > 0 ? (
                                            inventory.map((item) => (
                                                <TableRow key={item.product_id} className="hover:bg-brand/5 border-border/30 group">
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                                                                <Package className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-text-primary group-hover:text-brand transition-colors">
                                                                    {item.product.name}
                                                                </span>
                                                                <span className="text-xs text-text-muted">{item.product.sku}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="rounded-full">
                                                            {item.batches_count} Batches
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`text-sm font-black ${item.total_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {item.total_quantity} {item.product.unit_of_measure?.name || 'Units'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/inventory/products/${item.product_id}`}>
                                                                Details
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-text-muted">
                                                    No stock currently held in this location.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Assigned Personnel */}
                    <TabsContent value="users" className="space-y-4">
                        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-lg">Store Staff</CardTitle>
                                        <CardDescription>Users authorized to perform operations in this store.</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="px-3">
                                        {location.users?.length || 0} Members
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                    {location.users?.length > 0 ? (
                                        location.users.map((user: any) => (
                                            <div key={user.id} className="p-4 rounded-2xl border border-border bg-white shadow-sm flex items-center justify-between group hover:border-brand/50 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-text-primary line-clamp-1">{user.name}</span>
                                                        <span className="text-[10px] text-text-muted truncate max-w-[120px]">{user.email}</span>
                                                    </div>
                                                </div>
                                                {isSuperAdmin && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-text-muted hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleRemoveUser(user)}
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center text-text-muted">
                                            No personnel specifically assigned to this location.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Stock History */}
                    <TabsContent value="history" className="space-y-4">
                        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <div>
                                    <CardTitle className="text-lg">Audit Logs</CardTitle>
                                    <CardDescription>Complete historical record of stock movements for this location.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/10">
                                            <TableHead className="pl-6 uppercase text-[10px] font-bold">Timestamp</TableHead>
                                            <TableHead className="uppercase text-[10px] font-bold">Product</TableHead>
                                            <TableHead className="uppercase text-[10px] font-bold text-center">Type</TableHead>
                                            <TableHead className="uppercase text-[10px] font-bold text-center">Quantity</TableHead>
                                            <TableHead className="uppercase text-[10px] font-bold">Operator</TableHead>
                                            <TableHead className="pr-6 text-right uppercase text-[10px] font-bold">Reference</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.data.length > 0 ? (
                                            history.data.map((movement) => (
                                                <TableRow key={movement.id} className="hover:bg-slate-50 border-border/30">
                                                    <TableCell className="pl-6 py-4 text-xs text-text-muted">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-text-secondary">{format(new Date(movement.created_at), 'MMM dd, yyyy')}</span>
                                                            <span>{format(new Date(movement.created_at), 'HH:mm a')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-text-primary">{movement.batch?.product?.name}</span>
                                                            <span className="text-[10px] font-mono text-text-muted">Batch: {movement.batch?.batch_number}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={
                                                            movement.type === 'receive' || movement.type === 'transfer_in' ? 'outline' : 
                                                            movement.type === 'adjust' ? 'secondary' : 'destructive'
                                                        } className={cn(
                                                            "rounded-full capitalize text-[10px] px-2 py-0",
                                                            (movement.type === 'receive' || movement.type === 'transfer_in') && "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        )}>
                                                            {movement.type.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`font-black text-sm ${
                                                            movement.type === 'receive' || movement.type === 'transfer_in' ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                            {movement.type === 'receive' || movement.type === 'transfer_in' ? '+' : '-'}{movement.quantity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                                                {movement.user?.name.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-medium text-text-secondary">{movement.user?.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <span className="text-[10px] font-mono text-text-muted bg-muted px-2 py-1 rounded">
                                                            Ref: {movement.reference_id?.split('-')[0] || 'Manual'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-text-muted">
                                                    No movement history recorded yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                
                                {/* Simple Pagination */}
                                {history.last_page > 1 && (
                                    <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center px-6">
                                        <div className="text-xs text-text-muted font-medium">
                                            Showing page {history.current_page} of {history.last_page}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild disabled={history.current_page === 1}>
                                                <Link href={`/inventory/locations/${location.id}?page=${history.current_page - 1}`}>Previous</Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild disabled={history.current_page === history.last_page}>
                                                <Link href={`/inventory/locations/${location.id}?page=${history.current_page + 1}`}>Next</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Assign User Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <form onSubmit={handleAssignUsers}>
                        <div className="px-6 py-8 bg-brand text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <DialogHeader className="relative z-10">
                                <DialogTitle className="text-2xl font-black tracking-tight">Assign Staff</DialogTitle>
                                <DialogDescription className="text-white/70">
                                    Select personnel to authorize for this store.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <div className="p-6 space-y-4 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input 
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {filteredAssignableUsers.length > 0 ? (
                                    filteredAssignableUsers.map((user) => (
                                        <div 
                                            key={user.id} 
                                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer ${
                                                assignForm.data.user_ids.includes(String(user.id))
                                                    ? 'border-brand bg-brand/5'
                                                    : 'border-border hover:border-brand/30 hover:bg-slate-50'
                                            }`}
                                            onClick={() => toggleUserSelection(user.id)}
                                        >
                                            <Checkbox 
                                                checked={assignForm.data.user_ids.includes(String(user.id))}
                                                onCheckedChange={() => toggleUserSelection(user.id)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-text-primary">{user.name}</span>
                                                <span className="text-[10px] text-text-muted font-medium">{user.email}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-text-muted text-sm border border-dashed rounded-2xl">
                                        No assignable users found.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-between items-center rounded-b-3xl">
                            <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-brand hover:bg-brand-dark px-8 shadow-lg shadow-brand/20"
                                disabled={assignForm.processing || assignForm.data.user_ids.length === 0}
                            >
                                {assignForm.processing ? 'Assigning...' : `Assign ${assignForm.data.user_ids.length} User(s)`}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ShowLocation.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/locations' },
        { title: 'Storage Locations', href: '/inventory/locations' },
        { title: 'Store Details', href: '#' }
    ],
};
