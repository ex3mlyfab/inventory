import { type ReactNode } from 'react';

type StatusVariant = 'success' | 'warning' | 'critical' | 'info' | 'pending' | 'draft' | 'expired';

interface StatusBadgeProps {
    variant: StatusVariant;
    children: ReactNode;
    className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-[#e0f4eb] text-[#006e3c]',
    warning: 'bg-[#fff3cd] text-[#856404]',
    critical: 'bg-[#fce4ec] text-[#c62828]',
    expired: 'bg-[#ffdad6] text-[#ba1a1a]',
    info: 'bg-[#e3f2fd] text-[#1565c0]',
    pending: 'bg-[#e3f2fd] text-[#1565c0]',
    draft: 'bg-[#f3f3f3] text-[#6D7175]',
};

export function StatusBadge({ variant, children, className = '' }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
        >
            {children}
        </span>
    );
}
