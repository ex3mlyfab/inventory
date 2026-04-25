import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, children, className = '' }: PageHeaderProps) {
    return (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#181d1a]">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-[#6D7175]">{description}</p>
                )}
            </div>
            {(actions || children) && (
                <div className="flex items-center gap-3">
                    {actions}
                    {children}
                </div>
            )}
        </div>
    );
}
