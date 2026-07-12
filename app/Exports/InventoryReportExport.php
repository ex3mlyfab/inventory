<?php
 
namespace App\Exports;
 
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $data;
    protected $type;

    public function __construct($data, $type)
    {
        $this->data = $data;
        $this->type = $type;
    }

    public function collection()
    {
        return $this->data;
    }

    public function headings(): array
    {
        switch ($this->type) {
            case 'products':
                return ['SKU', 'Product Name', 'Category', 'UoM', 'Quantity on Hand', 'Reorder Level', 'Expirable', 'Requires Prescription', 'Status'];
            case 'movements':
                return ['Date', 'Product', 'Batch', 'Type', 'Quantity', 'Reference', 'Performed By'];
            case 'consumption':
                return ['Product', 'SKU', 'Category', 'Quantity Consumed', 'Unit'];
            case 'stores':
                return ['Location/Store', 'Department', 'Product', 'SKU', 'Batch', 'Quantity', 'Expiry'];
            default:
                return [];
        }
    }

    public function map($row): array
    {
        switch ($this->type) {
            case 'products':
                return [
                    $row->sku,
                    $row->name,
                    $row->category?->name ?? '—',
                    $row->unitOfMeasure?->abbreviation ?? '—',
                    $row->quantity_on_hand,
                    $row->reorder_level,
                    $row->is_expirable ? 'Yes' : 'No',
                    $row->requires_prescription ? 'Yes' : 'No',
                    ucfirst($row->status),
                ];
            case 'movements':
                return [
                    $row->created_at->format('Y-m-d H:i'),
                    $row->batch?->product?->name ?? '—',
                    $row->batch?->batch_number ?? '—',
                    ucfirst(str_replace('_', ' ', $row->type)),
                    $row->quantity,
                    $row->reference_type ? ($row->reference_type . ' #' . $row->reference_id) : '—',
                    $row->user?->name ?? 'System',
                ];
            case 'consumption':
                return [
                    $row->name,
                    $row->sku,
                    $row->category_name,
                    $row->total_consumed,
                    $row->uom_name,
                ];
            case 'stores':
                return [
                    $row->storageLocation?->name ?? '—',
                    $row->storageLocation?->department?->name ?? 'Main Store',
                    $row->product?->name ?? '—',
                    $row->product?->sku ?? '—',
                    $row->batch_number,
                    $row->quantity_on_hand,
                    $row->expiry_date?->format('Y-m-d') ?? 'N/A',
                ];
            default:
                return [];
        }
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
        ];
    }
}
