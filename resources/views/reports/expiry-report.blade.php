<!DOCTYPE html>
<html>
<head>
    <title>Stock Expiry Schedule</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { bg-color: #f5f5f5; font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #777; }
        .warning { color: #dc2626; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Federal Medical Centre Abuja</h1>
        <h2>Stock Expiry Schedule</h2>
        <p>Generated on: {{ now()->format('Y-m-d H:i:s') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Expiry Date</th>
                <th>Product</th>
                <th>Batch Number</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $item)
                @php 
                    $isExpired = $item->expiry_date->isPast();
                    $isExpiringSoon = !$isExpired && $item->expiry_date->diffInDays(now()) <= 90;
                @endphp
                <tr>
                    <td class="{{ $isExpired || $isExpiringSoon ? 'warning' : '' }}">
                        {{ $item->expiry_date->format('Y-m-d') }}
                    </td>
                    <td>{{ $item->product->name }}</td>
                    <td>{{ $item->batch_number }}</td>
                    <td>{{ $item->storageLocation?->name }}</td>
                    <td>{{ $item->quantity_on_hand }}</td>
                    <td>
                        @if($isExpired)
                            <span class="warning">EXPIRED</span>
                        @elseif($isExpiringSoon)
                            <span class="warning">EXPIRING SOON</span>
                        @else
                            ACTIVE
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>FMC Abuja Inventory Management System &copy; {{ date('Y') }}</p>
    </div>
</body>
</html>
