<?php
 
namespace App\Exports;
 
use Maatwebsite\Excel\Concerns\FromCollection;
6: use Maatwebsite\Excel\Concerns\WithHeadings;
7: use Maatwebsite\Excel\Concerns\WithMapping;
8: use Maatwebsite\Excel\Concerns\ShouldAutoSize;
9: use Maatwebsite\Excel\Concerns\WithStyles;
10: use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
11: 
12: class InventoryReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
13: {
14:     protected $data;
15:     protected $type;
16: 
17:     public function __construct($data, $type)
18:     {
19:         $this->data = $data;
20:         $this->type = $type;
21:     }
22: 
23:     public function collection()
24:     {
25:         return $this->data;
26:     }
27: 
28:     public function headings(): array
29:     {
30:         switch ($this->type) {
31:             case 'products':
32:                 return ['SKU', 'Product Name', 'Category', 'UoM', 'Quantity on Hand', 'Reorder Level', 'Status'];
33:             case 'movements':
34:                 return ['Date', 'Product', 'Batch', 'Type', 'Quantity', 'Reference', 'Performed By'];
35:             case 'consumption':
36:                 return ['Product', 'SKU', 'Category', 'Quantity Consumed', 'Unit'];
37:             case 'stores':
38:                 return ['Location/Store', 'Department', 'Product', 'SKU', 'Batch', 'Quantity', 'Expiry'];
39:             default:
40:                 return [];
41:         }
42:     }
43: 
44:     public function map($row): array
45:     {
46:         switch ($this->type) {
47:             case 'products':
48:                 return [
49:                     $row->sku,
50:                     $row->name,
51:                     $row->category?->name,
52:                     $row->unitOfMeasure?->abbreviation,
53:                     $row->quantity_on_hand,
54:                     $row->reorder_level,
55:                     $row->status,
56:                 ];
57:             case 'movements':
58:                 return [
59:                     $row->created_at->format('Y-m-d H:i'),
60:                     $row->batch?->product?->name,
61:                     $row->batch?->batch_number,
62:                     $row->type,
63:                     $row->quantity,
64:                     $row->reference_type . ' #' . $row->reference_id,
65:                     $row->user?->name,
66:                 ];
67:             case 'consumption':
68:                 return [
69:                     $row->name,
70:                     $row->sku,
71:                     $row->category_name,
72:                     $row->total_consumed,
73:                     $row->uom_name,
74:                 ];
75:             case 'stores':
76:                 return [
77:                     $row->storage_location?->name,
78:                     $row->storage_location?->department?->name ?? 'Main Store',
79:                     $row->product?->name,
80:                     $row->product?->sku,
81:                     $row->batch_number,
82:                     $row->quantity_on_hand,
83:                     $row->expiry_date?->format('Y-m-d') ?? 'N/A',
84:                 ];
85:             default:
86:                 return [];
87:         }
88:     }
89: 
90:     public function styles(Worksheet $sheet)
91:     {
92:         return [
93:             1 => ['font' => ['bold' => true, 'size' => 12]],
94:         ];
95:     }
96: }
