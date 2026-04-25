import React from 'react';
import { StockBatch } from '@/types/inventory';
import { Card, CardContent } from '@/Components/ui/card';
import { ExpiryBadge } from './ExpiryBadge';

export function BatchInfoCard({ batch }: { batch: StockBatch }) {
    return (
        <Card className="shadow-none border-border">
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p className="text-xs text-text-secondary">Batch Number</p>
                    <p className="font-semibold text-text-primary text-sm mt-1">{batch.batch_number}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">Location</p>
                    <p className="font-medium text-text-primary text-sm mt-1">{batch.location || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">Quantity On Hand</p>
                    <p className="font-semibold text-text-primary text-sm mt-1">{batch.quantity_on_hand}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">Expiry</p>
                    <div className="mt-1">
                        <ExpiryBadge expiryDate={batch.expiry_date} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
