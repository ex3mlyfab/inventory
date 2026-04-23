import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { usePermissions } from '@/hooks/use-permissions';
import type { NavItem } from '@/types';

interface NavModuleProps {
    /** Module title shown in the sidebar */
    title: string;
    /** Lucide icon component for the module */
    icon?: NavItem['icon'];
    /** Sub-links within this module, each gated by `permission` */
    children: NavItem[];
}

/**
 * A collapsible sidebar module with permission-gated sub-links.
 *
 * - Auto-opens when the current URL matches any child link.
 * - Hides entirely if the user has no permitted children.
 * - Each child is individually gated by its `permission` field.
 */
export function NavModule({ title, icon: Icon, children }: NavModuleProps) {
    const { can } = usePermissions();
    const { isCurrentOrParentUrl } = useCurrentUrl();

    // Filter children to only those the user has permission to see
    const visibleChildren = children.filter(
        (child) => !child.permission || can(child.permission),
    );

    // If no children are visible, hide the entire module
    if (visibleChildren.length === 0) {
        return null;
    }

    // Auto-open if user is currently on a page within this module
    const isActive = visibleChildren.some((child) =>
        isCurrentOrParentUrl(child.href),
    );

    return (
        <Collapsible defaultOpen={isActive} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={{ children: title }}
                        isActive={isActive}
                    >
                        {Icon && <Icon className="h-5 w-5" strokeWidth={1.5} />}
                        <span className="text-sm font-medium">{title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <SidebarMenuSub>
                        {visibleChildren.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={isCurrentOrParentUrl(child.href)}
                                >
                                    <Link href={child.href} prefetch>
                                        <span>{child.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
