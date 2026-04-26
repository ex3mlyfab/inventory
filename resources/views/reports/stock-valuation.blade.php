<!DOCTYPE html>
<html>
<head>
    <title>Stock Valuation Report</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { bg-color: #f5f5f5; font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #777; }
        .total-row { font-weight: bold; bg-color: #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Federal Medical Centre Abuja</h1>
        <h2>Stock Valuation Report</h2>
        <p>Generated on: {{ now()->format('Y-m-d H:i:s') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Location</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @php $grandTotal = 0; @endphp
            @foreach($data as $item)
                @php 
                    $lineTotal = $item->quantity_on_hand * $item->unit_cost;
                    $grandTotal += $lineTotal;
                @endphp
                <tr>
                    <td>{{ $item->product->sku }}</td>
                    <td>{{ $item->product->name }}</td>
                    <td>{{ $item->storageLocation?->name }}</td>
                    <td>{{ $item->batch_number }}</td>
                    <td>{{ $item->expiry_date?->format('Y-m-d') }}</td>
                    <td>{{ $item->quantity_on_hand }}</td>
                    <td>₦{{ number_format($item->unit_cost, 2) }}</td>
                    <td>₦{{ number_format($lineTotal, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="7" style="text-align: right;">Grand Total:</td>
                <td>₦{{ number_format($grandTotal, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="footer">
        <p>FMC Abuja Inventory Management System &copy; {{ date('Y') }}</p>
    </div>
</body>
</html>
