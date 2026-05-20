import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Box,
    ClipboardList,
    Gauge,
    Package,
    Pill,
    Settings,
    Shield,
    Wrench,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

/**
 * Main application sidebar.
 *
 * Navigation is structured as modules with permission-gated sub-links.
 * The NavModule component handles visibility — if a user has zero permitted
 * children within a module, the entire module is hidden automatically.
 */
export function AppSidebar() {
    const mainNavItems: NavItem[] = [
        // ─── Dashboard (flat link, always visible) ──────────────
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: Gauge,
        },

        // ─── Product Catalog ────────────────────────────────────
        {
            title: 'Product Catalog',
            href: '/inventory/products',
            icon: Package,
            children: [
                {
                    title: 'Products',
                    href: '/inventory/products',
                    permission: 'products.view',
                },
                {
                    title: 'Categories',
                    href: '/inventory/categories',
                    permission: 'categories.manage',
                },
                {
                    title: 'Units of Measure',
                    href: '/inventory/units',
                    permission: 'products.view',
                },
                {
                    title: 'Storage Locations',
                    href: '/inventory/locations',
                    permission: 'locations.manage',
                },
            ],
        },

        // ─── Stock & Inventory ──────────────────────────────────
        {
            title: 'Stock & Inventory',
            href: '/inventory/stock',
            icon: Box,
            children: [
                {
                    title: 'Stock Levels',
                    href: '/inventory/stock',
                    permission: 'stock.view',
                },
                {
                    title: 'My Holdings',
                    href: '/inventory/holdings',
                    permission: 'stock.view',
                },
                {
                    title: 'Stock Movements',
                    href: '/inventory/stock-movements',
                    permission: 'stock.movements.view',
                },
                {
                    title: 'Stock Adjustments',
                    href: '/inventory/stock-adjustments',
                    permission: 'stock.adjust',
                },
                {
                    title: 'Initial Allocation',
                    href: '/inventory/initial-allocation',
                    permission: 'stock.allocate',
                },
                {
                    title: 'Transfers',
                    href: '/inventory/stock-transfers',
                    permission: 'stock.transfer',
                },
                {
                    title: 'Stock Count',
                    href: '/inventory/stock-count',
                    permission: 'stock.count',
                },
                {
                    title: 'Departmental Stores',
                    href: '/inventory/departmental-stores',
                    permission: 'stock.view',
                },
            ],
        },

        // ─── Procurement ────────────────────────────────────────
        {
            title: 'Procurement',
            href: '/procurement/grn',
            icon: ClipboardList,
            children: [
                {
                    title: 'Supplier Directory',
                    href: '/inventory/suppliers',
                    permission: 'suppliers.view',
                },
                {
                    title: 'Supplier Insights',
                    href: '/inventory/suppliers/dashboard',
                    permission: 'suppliers.view',
                },
                {
                    title: 'Goods Received (GRN)',
                    href: '/procurement/grn',
                    permission: 'grn.view',
                },
                {
                    title: 'Requisitions',
                    href: '/procurement/requisitions',
                    permission: 'requisitions.create',
                },
            ],
        },



        // ─── Equipment & Assets ─────────────────────────────────
        {
            title: 'Equipment & Assets',
            href: '/equipment/assets',
            icon: Wrench,
            children: [
                {
                    title: 'Assets',
                    href: '/equipment/assets',
                    permission: 'assets.view',
                },
                {
                    title: 'Maintenance',
                    href: '/equipment/maintenance',
                    permission: 'maintenance.view',
                },
                {
                    title: 'Work Orders',
                    href: '/equipment/work-orders',
                    permission: 'work-orders.manage',
                },
                {
                    title: 'Calibration',
                    href: '/equipment/calibration',
                    permission: 'calibration.manage',
                },
            ],
        },

        // ─── Reports & Analytics ────────────────────────────────
        {
            title: 'Reports',
            href: '/reports',
            icon: BarChart3,
            children: [
                {
                    title: 'Reports Dashboard',
                    href: '/reports',
                    permission: 'reports.view',
                },
                {
                    title: 'Export Center',
                    href: '/reports/export',
                    permission: 'reports.export',
                },
                {
                    title: 'Audit Trail',
                    href: '/reports/audit-trail',
                    permission: 'audit-trail.view',
                },
            ],
        },

        // ─── Administration ─────────────────────────────────────
        {
            title: 'Administration',
            href: '/admin/users',
            icon: Shield,
            children: [
                {
                    title: 'User Management',
                    href: '/admin/users',
                    permission: 'users.manage',
                },
                {
                    title: 'Roles & Permissions',
                    href: '/admin/roles',
                    permission: 'roles.manage',
                },
                {
                    title: 'Departments',
                    href: '/admin/departments',
                    permission: 'departments.manage',
                },
                {
                    title: 'System Settings',
                    href: '/admin/settings',
                    permission: 'settings.manage',
                },
                {
                    title: 'Branding',
                    href: '/admin/branding',
                    permission: 'settings.manage',
                },
            ],
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Settings',
            href: '/settings/profile',
            icon: Settings,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
