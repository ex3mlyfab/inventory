import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    Package, 
    Edit, 
    History, 
    Layers, 
    Info, 
    AlertTriangle, 
    ArrowUpRight, 
    ArrowDownRight,
    Calendar,
    BarChart3,
    ArrowLeft
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

import { PageHeader } from '@/components/shared/page-header';
import { Product, StockBatch, StockMovement } from '@/types/inventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/shared/stat-card';
import { ExpiryBadge } from '../Components/ExpiryBadge';
import { DataTable, Column } from '@/components/shared/data-table';
import { StockLevelIndicator } from '../Components/StockLevelIndicator';
import { format } from 'date-fns';
import { Can } from '@/components/can';

interface Props {
    product: Product;
    recentMovements: StockMovement[];
    chartData: { date: string; change: number }[];
}

export default function ProductShow({ product, recentMovements, chartData }: Props) {
    const isLowStock = (product.quantity_on_hand || 0) <= product.reorder_level && (product.quantity_on_hand || 0) > 0;
    const isOutOfStock = (product.quantity_on_hand || 0) <= 0;

    const batchesColumns: Column<StockBatch>[] = [
        {
            header: 'Batch Number',
            cell: (batch) => (
                <div className="flex flex-col">
                    <span className="font-bold text-text-primary text-sm tracking-tight">{batch.batch_number}</span>
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">
                        {batch.location || 'No Location'}
                    </span>
                </div>
            )
        },
        {
            header: 'Quantity',
            cell: (batch) => (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-brand">{batch.quantity_on_hand}</span>
                    <span className="text-[10px] text-text-muted uppercase">{product.unit_of_measure?.abbreviation}</span>
                </div>
            )
        },
        {
            header: 'Expiry Date',
            cell: (batch) => <ExpiryBadge expiryDate={batch.expiry_date} />
        },
        {
            header: 'Status',
            cell: (batch) => (
                <Badge variant="outline" className={`
                    capitalize font-bold border-none
                    ${batch.status === 'active' ? 'bg-success-bg text-brand' : 
                      batch.status === 'expired' ? 'bg-critical text-white' : 
                      'bg-surface-highest text-text-muted'}
                `}>
                    {batch.status}
                </Badge>
            )
        }
    ];

    const movementColumns: Column<StockMovement>[] = [
        {
            header: 'Date',
            cell: (m) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{format(new Date(m.created_at), 'MMM dd, yyyy')}</span>
                    <span className="text-[10px] text-text-muted">{format(new Date(m.created_at), 'HH:mm')}</span>
                </div>
            )
        },
        {
            header: 'Reference',
            cell: (m) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight">{m.batch?.batch_number}</span>
                    <span className="text-[10px] text-text-muted uppercase font-bold">{m.type}</span>
                </div>
            )
        },
        {
            header: 'Quantity',
            cell: (m) => (
                <div className={`flex items-center gap-1 font-bold ${m.quantity > 0 ? 'text-brand' : 'text-critical'}`}>
                    {m.quantity > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{Math.abs(m.quantity)}</span>
                </div>
            )
        },
        {
            header: 'Staff',
            cell: (m) => <span className="text-sm text-text-secondary">{m.user?.name || 'System'}</span>
        }
    ];

    // Find earliest expiry date
    const earliestExpiry = product.stock_batches
        ?.filter(b => b.expiry_date && b.status === 'active')
        .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())[0]?.expiry_date;

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8 pb-12">
            <Head title={`Product: ${product.name}`} />

            {/* Premium Header */}
            <div className="flex flex-col gap-1">
                <Link 
                    href="/inventory/products" 
                    className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand transition-colors mb-2 uppercase tracking-widest"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Back to Catalog
                </Link>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-brand/5 border border-brand/10 flex items-center justify-center text-brand shrink-0">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <Package className="w-8 h-8" />
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">{product.name}</h1>
                                <StockLevelIndicator 
                                    currentStock={product.quantity_on_hand || 0} 
                                    reorderLevel={product.reorder_level} 
                                />
                            </div>
                            <div className="flex items-center gap-3 text-sm text-text-muted font-medium">
                                <span className="px-2 py-0.5 bg-surface-highest rounded border border-border text-[10px] font-bold uppercase tracking-wider">
                                    SKU: {product.sku}
                                </span>
                                <span>•</span>
                                <span className="text-brand font-bold">{product.category?.name}</span>
                                <span>•</span>
                                <span>{product.unit_of_measure?.name} ({product.unit_of_measure?.abbreviation})</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Can permission="products.edit">
                            <Link href={`/inventory/products/${product.id}/edit`}>
                                <Button className="bg-brand hover:bg-brand-dark text-white font-bold px-6 shadow-lg shadow-brand/10">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Product
                                </Button>
                            </Link>
                        </Can>
                        <Link href="/inventory/stock/movements">
                            <Button variant="outline" className="border-brand/20 hover:bg-brand/5 font-bold">
                                <History className="w-4 h-4 mr-2" />
                                Stock History
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLowStock && (
                    <div className="mt-6 flex items-center gap-3 p-4 bg-warning/5 border border-warning/20 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-warning-foreground">Stock attention required</p>
                            <p className="text-xs text-warning-foreground/80">Current inventory ({product.quantity_on_hand}) is below the reorder threshold of {product.reorder_level}. Consider restocking soon.</p>
                        </div>
                        <Link href="/inventory/stock/adjustments">
                            <Button size="sm" variant="outline" className="bg-white border-warning/30 text-warning hover:bg-warning/10 font-bold">
                                Adjust Stock
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label="Current Inventory" 
                    value={product.quantity_on_hand || 0} 
                    icon={Package}
                    className="border-brand/10"
                />
                <StatCard 
                    label="Reorder Level" 
                    value={product.reorder_level} 
                    icon={Layers}
                />
                <StatCard 
                    label="Earliest Expiry" 
                    value={earliestExpiry ? format(new Date(earliestExpiry), 'MMM dd, yyyy') : 'N/A'} 
                    icon={Calendar}
                    className={earliestExpiry ? 'border-warning/20' : ''}
                />
                <Card className="border-brand/10 shadow-sm overflow-hidden bg-brand/5">
                    <CardContent className="p-4 flex items-center gap-4 h-full">
                        <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Active Batches</span>
                            <span className="text-2xl font-black text-text-primary tracking-tighter">
                                {product.stock_batches?.filter(b => b.status === 'active').length || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="flex flex-col gap-6">
                <TabsList className="bg-surface-header p-1 border border-border w-full md:w-fit">
                    <TabsTrigger value="overview" className="px-6 py-2 rounded-md font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Info className="w-3.5 h-3.5 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="px-6 py-2 rounded-md font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Layers className="w-3.5 h-3.5 mr-2" />
                        Inventory
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="px-6 py-2 rounded-md font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <History className="w-3.5 h-3.5 mr-2" />
                        Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <Card className="border-border/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-surface-header/50 border-b border-border/60 py-4">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-secondary">Product Specification</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60">
                                        <div className="p-6 flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Description</span>
                                            <p className="text-sm text-text-primary leading-relaxed">
                                                {product.description || 'No description provided for this therapeutic item.'}
                                            </p>
                                        </div>
                                        <div className="p-6 flex flex-col gap-4">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tags & Compliance</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.is_expirable && (
                                                        <Badge variant="secondary" className="bg-info-bg text-info border-none font-bold">Requires Expiry Tracking</Badge>
                                                    )}
                                                    {product.requires_prescription && (
                                                        <Badge variant="secondary" className="bg-critical/10 text-critical border-none font-bold">Poison / Rx Only</Badge>
                                                    )}
                                                    <Badge variant="outline" className="border-brand font-bold text-brand bg-brand/5">Medical Grade</Badge>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Barcode / EAN</span>
                                                <span className="text-sm font-mono font-bold tracking-tight">{product.barcode || 'NO BARCODE'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-surface-header/50 border-b border-border/60 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-secondary">Inventory Activity (30 Days)</CardTitle>
                                            <CardDescription className="text-[10px]">Net stock changes tracked daily</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="h-[240px] w-full">
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                    <defs>
                                                        <linearGradient id="colorChange" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#008060" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#008060" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{fontSize: 10, fill: '#6D7175', fontWeight: 600}} 
                                                        dy={10}
                                                    />
                                                    <YAxis 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{fontSize: 10, fill: '#6D7175'}} 
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '8px', border: 'none', background: '#181d1a', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                        cursor={{ stroke: '#008060', strokeWidth: 1 }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="change" 
                                                        stroke="#008060" 
                                                        strokeWidth={3}
                                                        fillOpacity={1} 
                                                        fill="url(#colorChange)" 
                                                        animationDuration={1500}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-text-muted text-sm italic">
                                                Not enough activity data to render chart.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-6">
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="bg-surface-header/50 border-b border-border/60 py-4">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-secondary">Procurement Rules</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Reorder Threshold</span>
                                            <span className="text-lg font-black text-text-primary tracking-tighter">{product.reorder_level} {product.unit_of_measure?.abbreviation}</span>
                                        </div>
                                        <div className="h-1 w-24 bg-surface-highest rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-brand rounded-full transition-all duration-1000" 
                                                style={{ width: `${Math.min(((product.quantity_on_hand || 0) / (product.reorder_level * 2)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Min. Purchase Order</span>
                                        <span className="text-lg font-black text-text-primary tracking-tighter">{product.reorder_quantity} {product.unit_of_measure?.abbreviation}</span>
                                    </div>
                                    <Can permission="products.edit">
                                        <Link href={`/inventory/products/${product.id}/edit`}>
                                            <Button variant="outline" className="w-full border-brand/20 text-brand font-bold hover:bg-brand/5">
                                                Configure Alerts
                                            </Button>
                                        </Link>
                                    </Can>
                                </CardContent>
                            </Card>

                            <Card className="border-border/60 shadow-sm overflow-hidden">
                                <CardHeader className="bg-brand border-b border-brand py-4">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-white">System Info</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 flex flex-col gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Created On</span>
                                        <span className="text-xs font-bold text-text-primary">{format(new Date(product.created_at), 'MMMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Last Modified</span>
                                        <span className="text-xs font-bold text-text-primary">{format(new Date(product.updated_at), 'MMMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</span>
                                        <Badge className={`w-fit font-bold border-none ${product.status === 'active' ? 'bg-success-bg text-brand' : 'bg-surface-highest text-text-muted'}`}>
                                            {product.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="inventory" className="animate-in fade-in zoom-in-95 duration-300">
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-surface-header/50 border-b border-border/60 py-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-secondary">Batch Inventory</CardTitle>
                                <CardDescription className="text-[10px]">Tracked batches for this product</CardDescription>
                            </div>
                            <Link href="/inventory/stock">
                                <Button size="sm" className="bg-brand text-white font-bold h-8">
                                    Manage Batches
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable 
                                columns={batchesColumns}
                                data={product.stock_batches || []}
                                keyExtractor={(b) => b.id}
                                emptyMessage="No active stock batches found."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="animate-in fade-in zoom-in-95 duration-300">
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-surface-header/50 border-b border-border/60 py-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-secondary">Recent Ledger Movements</CardTitle>
                            <CardDescription className="text-[10px]">Audit trail of stock changes</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable 
                                columns={movementColumns}
                                data={recentMovements}
                                keyExtractor={(m) => m.id}
                                emptyMessage="No movement records found."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

ProductShow.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: '/inventory/products' },
        { title: 'Products', href: '/inventory/products' },
        { title: 'Product Details', href: '#' }
    ],
};
