import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    className?: string;
    label?: string;
}

export function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className,
    label = 'Date Range',
}: DateRangePickerProps) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            {label && <Label className="text-xs text-text-secondary">{label}</Label>}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="h-9 text-sm"
                    />
                </div>
                <span className="text-text-muted text-sm px-1">to</span>
                <div className="relative">
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="h-9 text-sm"
                        min={startDate} // Prevent end date from being before start date natively
                    />
                </div>
            </div>
        </div>
    );
}
