import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ExpiryBadgeProps {
    expiryDate: string | null;
}

export function ExpiryBadge({ expiryDate }: ExpiryBadgeProps) {
    if (!expiryDate) return <span className="text-text-muted text-sm">-</span>;

    const date = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // reset time for accurate day comparison
    date.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    if (date < now) {
        return <Badge className="bg-critical text-white hover:bg-critical/90 border-none">Expired</Badge>;
    }
    if (date <= thirtyDaysFromNow) {
        return <Badge className="bg-warning-bg text-warning hover:bg-warning-bg border-none pointer-events-none">Expiring Soon</Badge>;
    }
    return <Badge className="bg-success-bg text-brand hover:bg-success-bg border-none pointer-events-none">Valid</Badge>;
}
