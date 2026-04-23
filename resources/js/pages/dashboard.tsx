import { Head, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { dashboard } from '@/routes';
import {
    AlertTriangle,
    Box,
    Calendar,
    ClipboardList,
    Package,
    TrendingDown,
} from 'lucide-react';

export default function Dashboard() {
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
                        value={0}
                        icon={Package}
                        trend={{ value: 0, label: 'vs last month' }}
                    />
                    <StatCard
                        label="Low Stock Items"
                        value={0}
                        icon={TrendingDown}
                    />
                    <StatCard
                        label="Expiring Soon"
                        value={0}
                        icon={AlertTriangle}
                    />
                    <StatCard
                        label="Pending Requisitions"
                        value={0}
                        icon={ClipboardList}
                    />
                </div>

                {/* Charts placeholder — 2-column layout */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-[#E1E3E5] bg-white p-6">
                        <h3 className="mb-4 text-base font-semibold text-[#181d1a]">
                            Stock Movement Trend
                        </h3>
                        <div className="flex h-48 items-center justify-center text-sm text-[#6D7175]">
                            <div className="text-center">
                                <Box className="mx-auto mb-2 h-8 w-8 text-[#bdc9c2]" />
                                <p>Chart data will appear when inventory is populated</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-[#E1E3E5] bg-white p-6">
                        <h3 className="mb-4 text-base font-semibold text-[#181d1a]">
                            Stock by Category
                        </h3>
                        <div className="flex h-48 items-center justify-center text-sm text-[#6D7175]">
                            <div className="text-center">
                                <Box className="mx-auto mb-2 h-8 w-8 text-[#bdc9c2]" />
                                <p>Category breakdown will appear here</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-lg border border-[#E1E3E5] bg-white">
                    <div className="border-b border-[#E1E3E5] px-6 py-4">
                        <h3 className="text-base font-semibold text-[#181d1a]">
                            Recent Activity
                        </h3>
                    </div>
                    <div className="flex h-32 items-center justify-center text-sm text-[#6D7175]">
                        <div className="text-center">
                            <Calendar className="mx-auto mb-2 h-6 w-6 text-[#bdc9c2]" />
                            <p>No recent activity yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
