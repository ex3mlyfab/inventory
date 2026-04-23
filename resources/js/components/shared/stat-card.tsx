import { type LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className = '' }: StatCardProps) {
    return (
        <div
            className={`rounded-lg border border-[#E1E3E5] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.05)] ${className}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6D7175]">{label}</span>
                {Icon && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e0f4eb]">
                        <Icon className="h-4 w-4 text-[#008060]" />
                    </div>
                )}
            </div>
            <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-[#181d1a]">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
            </div>
            {trend && (
                <div className="mt-1 flex items-center gap-1">
                    {trend.value >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-[#008060]" />
                    ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-[#D82C0D]" />
                    )}
                    <span
                        className={`text-xs font-medium ${
                            trend.value >= 0 ? 'text-[#008060]' : 'text-[#D82C0D]'
                        }`}
                    >
                        {trend.value >= 0 ? '+' : ''}
                        {trend.value}%
                    </span>
                    <span className="text-xs text-[#6D7175]">{trend.label}</span>
                </div>
            )}
        </div>
    );
}
