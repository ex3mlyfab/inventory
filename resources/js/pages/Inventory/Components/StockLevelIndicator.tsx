import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StockLevelIndicatorProps {
    currentStock: number;
    reorderLevel: number;
}

export function StockLevelIndicator({ currentStock, reorderLevel }: StockLevelIndicatorProps) {
    if (currentStock <= 0) {
        return <Badge className="bg-critical text-white hover:bg-critical/90 border-none">Out of Stock</Badge>;
    }
    if (currentStock <= reorderLevel) {
        return <Badge className="bg-warning-bg text-warning hover:bg-warning-bg/90 border-none pointer-events-none">Low Stock</Badge>;
    }
    return <Badge className="bg-success-bg text-brand hover:bg-success-bg/90 border-none pointer-events-none">In Stock</Badge>;
}
