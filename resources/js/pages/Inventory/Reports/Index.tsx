import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { 
    BarChart3, 
    TrendingUp, 
    AlertTriangle, 
    Package, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight,
    PieChart as PieChartIcon,
    History
} from 'lucide-react';
import { Can } from '@/components/can';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    ResponsiveContainer, 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface Props {
    stats: {
        total_products: number;
        total_inventory_value: number | null;
        low_stock_items: number;
        expiring_soon: number;
    };
    movementData: Array<{ date: string; in: number; out: number }>;
    categoryData: Array<{ name: string; value: number }>;
    canViewValuation: boolean;
}

const COLORS = ['#0D9488', '#0891B2', '#4F46E5', '#7C3AED', '#2563EB', '#DB2777'];

export default function ReportsDashboard({ stats, movementData, categoryData, canViewValuation }: Props) {
    const formattedValue = stats.total_inventory_value 
        ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(stats.total_inventory_value)
        : 'Restricted';

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
            <Head title="Reports & Analytics" />

            <PageHeader 
                title="Reports & Analytics" 
                description="Comprehensive overview of inventory health, stock movements, and financial valuation."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total catalog items" 
                    value={stats.total_products} 
                    icon={Package} 
                />
                <StatCard 
                    label="Total stock value" 
                    value={formattedValue} 
                    icon={DollarSign} 
                    className="border-indigo-100 bg-indigo-50/30"
                />
                <StatCard 
                    label="Low stock alerts" 
                    value={stats.low_stock_items} 
                    icon={TrendingUp} 
                    className="border-amber-100 bg-amber-50/30"
                />
                <StatCard 
                    label="Expiring (90 days)" 
                    value={stats.expiring_soon} 
                    icon={AlertTriangle} 
                    className="border-rose-100 bg-rose-50/30"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Movement Chart */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                    <History className="h-5 w-5" />
                                    Stock Movement Trend
                                </CardTitle>
                                <CardDescription>Last 7 days of inventory throughput</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={movementData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fill: '#666' }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fill: '#666' }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Line 
                                    type="monotone" 
                                    dataKey="in" 
                                    name="Stock In"
                                    stroke="#0D9488" 
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#0D9488' }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="out" 
                                    name="Stock Out"
                                    stroke="#F43F5E" 
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#F43F5E' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Pie Chart */}
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-primary">
                            <PieChartIcon className="h-5 w-5" />
                            Inventory by Category
                        </CardTitle>
                        <CardDescription>Product distribution across hospital units</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Can permission="reports.export">
                    <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">Generate Reports</h3>
                                    <p className="text-indigo-100 text-sm opacity-90 leading-relaxed">
                                        Access the Export Center to generate itemized valuation, 
                                        expiry schedules, and consumption patterns.
                                    </p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <BarChart3 className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <a href="/reports/export" className="inline-flex items-center justify-center bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all shadow-md group">
                                Go to Export Center
                                <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                        </CardContent>
                    </Card>
                </Can>

                <Can permission="audit-trail.view">
                    <Card className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white border-none shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">System Audit</h3>
                                    <p className="text-teal-100 text-sm opacity-90 leading-relaxed">
                                        Review historical system interactions and inventory 
                                        traceability via the unified audit trail.
                                    </p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <History className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <a href="/reports/audit-trail" className="inline-flex items-center justify-center bg-white text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition-all shadow-md group">
                                View Audit Trail
                                <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                        </CardContent>
                    </Card>
                </Can>
            </div>
        </div>
    );
}

ReportsDashboard.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Dashboard', href: '/' },
            { title: 'Reports & Analytics', href: '/reports' },
        ]}
    >
        {page}
    </AppLayout>
);
