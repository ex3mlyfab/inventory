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
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">From</span>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="h-9 text-xs rounded-lg"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground ml-1">To</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="h-9 text-xs rounded-lg"
                        min={startDate}
                    />
                </div>
            </div>
        </div>
    );
}
