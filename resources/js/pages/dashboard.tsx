import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Can } from '@/components/can';
import { dashboard } from '@/routes';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Box,
    Calendar,
    ClipboardList,
    Package,
    TrendingDown,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DashboardProps {
    stats: {
        totalProducts: number;
        lowStockCount: number;
        expiringSoonCount: number;
        pendingRequisitionsCount: number;
    };
    movementTrend: Array<{
        date: string;
        total_in: number;
        total_out: number;
    }>;
    stockByCategory: Array<{
        name: string;
        value: number;
    }>;
    recentActivity: Array<{
        id: string;
        type: 'in' | 'out';
        quantity: number;
        product_name: string;
        user_name: string;
        created_at: string;
        reference: string;
    }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard({
    stats,
    movementTrend,
    stockByCategory,
    recentActivity,
}: DashboardProps) {
    const { auth } = usePage<{ auth: { user: { name: string; roles: Array<string | { name: string }> } } }>().props;
    const userName = auth.user.name.split(' ')[0];
    const firstRole = auth.user.roles?.[0];
    const roleName = typeof firstRole === 'string' ? firstRole : firstRole?.name || 'User';

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-6 p-5">
                {/* Page Header */}
                <PageHeader
                    title={`Welcome back, ${userName}`}
                    description={`${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                    actions={
                        <StatusBadge variant="success">{roleName}</StatusBadge>
                    }
                />

                {/* Stat Cards — 4-column grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Products"
                        value={stats.totalProducts}
                        icon={Package}
                        trend={{ value: 0, label: 'vs last week' }}
                    />
                    <StatCard
                        label="Low Stock Items"
                        value={stats.lowStockCount}
                        icon={TrendingDown}
                        variant={stats.lowStockCount > 0 ? 'warning' : 'default'}
                    />
                    <StatCard
                        label="Expiring Soon"
                        value={stats.expiringSoonCount}
                        icon={AlertTriangle}
                        variant={stats.expiringSoonCount > 0 ? 'danger' : 'default'}
                    />
                    <Can permission="requisitions.view">
                        <StatCard
                            label="Pending Requisitions"
                            value={stats.pendingRequisitionsCount}
                            icon={ClipboardList}
                        />
                    </Can>
                </div>

                {/* Charts Section */}
                <Can permission="reports.view">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Stock Movement Trend */}
                        <div className="rounded-xl border border-[#E1E3E5] bg-white p-6 shadow-sm">
                            <h3 className="mb-6 text-sm font-semibold text-[#181d1a]">
                                Stock Movement Trend
                            </h3>
                            <div className="h-[300px] w-full">
                                {movementTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={movementTrend}>
                                            <defs>
                                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#6D7175', fontSize: 12 }}
                                                tickFormatter={(val) => new Date(val).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6D7175', fontSize: 12 }} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #E1E3E5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="total_in" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" name="Stock In" />
                                            <Area type="monotone" dataKey="total_out" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" name="Stock Out" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-[#6D7175]">
                                        <TrendingDown className="mb-2 h-8 w-8 opacity-20" />
                                        <p className="text-xs">No movement data for the last 7 days</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stock by Category */}
                        <div className="rounded-xl border border-[#E1E3E5] bg-white p-6 shadow-sm">
                            <h3 className="mb-6 text-sm font-semibold text-[#181d1a]">
                                Inventory Composition
                            </h3>
                            <div className="h-[300px] w-full">
                                {stockByCategory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stockByCategory}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stockByCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #E1E3E5' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-[#6D7175]">
                                        <Box className="mb-2 h-8 w-8 opacity-20" />
                                        <p className="text-xs">No categorized stock available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Can>

                {/* Recent Activity */}
                <Can permission="stock.movements.view">
                    <div className="rounded-xl border border-[#E1E3E5] bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-[#E1E3E5] px-6 py-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-[#181d1a]">
                                Recent Inventory Activity
                            </h3>
                            <Calendar className="h-4 w-4 text-[#6D7175]" />
                        </div>
                        <div className="divide-y divide-[#E1E3E5]">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${activity.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {activity.type === 'in' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{activity.product_name}</p>
                                                <p className="text-xs text-gray-500">{activity.user_name} • {activity.reference || 'No Reference'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${activity.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {activity.type === 'in' ? '+' : '-'}{activity.quantity}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{activity.created_at}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex h-32 items-center justify-center text-sm text-[#6D7175]">
                                    <div className="text-center">
                                        <p>No recent activity detected</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Can>
            </div>
        </>
    );
}

// @ts-ignore
Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ]
};
