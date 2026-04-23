import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: string;       // Required permission to see this item
    children?: NavItem[];      // Sub-items for collapsible groups
};

export type NavGroup = {
    title: string;
    icon?: LucideIcon | null;
    permission?: string;       // Required permission to see entire group
    items: NavItem[];
};
