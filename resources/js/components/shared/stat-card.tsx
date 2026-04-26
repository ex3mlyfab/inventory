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
    variant?: 'default' | 'warning' | 'danger' | 'success';
    className?: string;
}

export function StatCard({ 
    label, 
    value, 
    icon: Icon, 
    trend, 
    variant = 'default',
    className = '' 
}: StatCardProps) {
    const variantStyles = {
        default: {
            border: 'border-[#E1E3E5]',
            iconBg: 'bg-[#F1F2F3]',
            iconColor: 'text-[#6D7175]'
        },
        warning: {
            border: 'border-amber-200 bg-amber-50/30',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600'
        },
        danger: {
            border: 'border-red-200 bg-red-50/30',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600'
        },
        success: {
            border: 'border-emerald-200 bg-emerald-50/30',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600'
        }
    };

    const style = variantStyles[variant];

    return (
        <div
            className={`rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${style.border} ${className}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6D7175]">{label}</span>
                {Icon && (
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.iconBg}`}>
                        <Icon className={`h-5 w-5 ${style.iconColor}`} />
                    </div>
                )}
            </div>
            <div className="mt-3">
                <span className="text-3xl font-bold tracking-tight text-[#181d1a]">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
            </div>
            {trend && (
                <div className="mt-2 flex items-center gap-1.5">
                    <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        trend.value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {trend.value >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                            {trend.value >= 0 ? '+' : ''}
                            {trend.value}%
                        </span>
                    </div>
                    <span className="text-[10px] font-medium text-[#6D7175] uppercase tracking-tight">{trend.label}</span>
                </div>
            )}
        </div>
    );
}
