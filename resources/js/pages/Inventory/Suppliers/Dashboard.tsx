import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Building2, Users, CheckCircle2, AlertCircle, Plus, ArrowRight, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Supplier } from '@/types/inventory';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Can } from '@/components/can';

interface Props {
    stats: {
        total: number;
        active: number;
        by_category: { category: string, count: number }[];
        recent: Supplier[];
    };
}

export default function SupplierDashboard({ stats }: Props) {
    const categoryData = stats.by_category.map(item => ({
        name: item.category.replace('_', ' ').charAt(0).toUpperCase() + item.category.replace('_', ' ').slice(1),
        value: item.count
    }));

    return (
        <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <Head title="Supplier Insights" />

            <PageHeader 
                title="Supplier Network Insights" 
                description="Strategic overview of vendors, procurement performance, and partnership status."
            >
                <div className="flex items-center gap-3">
                    <Link href="/procurement/suppliers">
                        <Button variant="outline" className="border-brand/20 text-brand hover:bg-brand/5 transition-all">
                            View All Suppliers
                        </Button>
                    </Link>
                    <Can permission="suppliers.create">
                        <Link href="/procurement/suppliers/create">
                            <Button className="bg-brand hover:bg-brand-dark text-brand-foreground shadow-md transition-all">
                                <Plus className="w-4 h-4 mr-2" />
                                Register New
                            </Button>
                        </Link>
                    </Can>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Partners" 
                    value={stats.total} 
                    icon={Building2} 
                />
                <StatCard 
                    label="Active Status" 
                    value={stats.active} 
                    icon={CheckCircle2} 
                    className="border-success/20 bg-success/5"
                />
                <StatCard 
                    label="New Onboarded" 
                    value={stats.recent.length} 
                    icon={TrendingUp} 
                    className="border-info/20 bg-info/5"
                />
                <StatCard 
                    label="Procured Value" 
                    value="₦ 0.0" 
                    icon={BarChart3} 
                    className="border-warning/20 bg-warning/5"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart: Category Distribution */}
                <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2 text-brand">
                                    <BarChart3 className="h-5 w-5" />
                                    Vendor Distribution
                                </CardTitle>
                                <CardDescription>Suppliers by business category</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={120}
                                    tick={{ fontSize: 11, fontWeight: 600 }}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,128,128,0.02)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                                />
                                <Bar 
                                    dataKey="value" 
                                    fill="hsl(var(--brand))" 
                                    radius={[0, 6, 6, 0]} 
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-brand">
                            <Users className="h-5 w-5" />
                            Recently Registered
                        </CardTitle>
                        <CardDescription>Latest additions to the network</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col divide-y divide-border/50">
                            {stats.recent.length > 0 ? stats.recent.map(supplier => (
                                <Link 
                                    key={supplier.id}
                                    href={`/procurement/suppliers/${supplier.id}`}
                                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="h-10 w-10 rounded-xl bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0 text-brand group-hover:scale-110 transition-transform">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-text-primary truncate">{supplier.name}</p>
                                        <p className="text-[10px] text-text-muted uppercase tracking-tighter font-mono">{supplier.code}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </Link>
                            )) : (
                                <div className="p-10 text-center text-text-muted text-xs">
                                    No recent activity found.
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-muted/20 border-t border-border/50">
                            <Link href="/procurement/suppliers" className="text-[11px] font-bold text-brand hover:underline flex items-center justify-center uppercase tracking-wider">
                                View Full Directory
                                <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="border-border/50 shadow-lg overflow-hidden bg-brand relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-32 w-32 text-white" />
                    </div>
                    <CardContent className="p-10 text-white relative z-10">
                        <h3 className="text-3xl font-bold mb-3">Strategic Partnering</h3>
                        <p className="text-brand-foreground/80 mb-8 max-w-md text-sm leading-relaxed">Optimize your procurement lifecycle by maintaining a robust and verified supplier database for FMC Abuja.</p>
                        <Can permission="suppliers.create">
                            <Link href="/procurement/suppliers/create">
                                <Button className="bg-white text-brand hover:bg-white/90 shadow-xl font-bold h-11 px-8 rounded-xl">
                                    Start Registration
                                </Button>
                            </Link>
                        </Can>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden border-l-4 border-l-warning">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-warning" />
                            Compliance Alerts
                        </CardTitle>
                        <CardDescription>Items requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 rounded-xl bg-warning/5 border border-warning/10">
                                <p className="text-sm font-bold text-warning-foreground">Registration renewals: 0</p>
                                <p className="text-xs text-text-muted mt-1">Vendors with expiring CAC or Tax Clearance certificates.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/30">
                                <p className="text-sm font-bold text-text-primary">Performance review cycle: Pending</p>
                                <p className="text-xs text-text-muted mt-1">Review session for pharmacological distributors starts in 12 days.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// @ts-ignore
SupplierDashboard.layout = {
    breadcrumbs: [
        { title: 'Procurement', href: '/procurement/suppliers' },
        { title: 'Suppliers Overview', href: '/procurement/suppliers' },
        { title: 'Strategic Insights', href: '#' }
    ],
};
