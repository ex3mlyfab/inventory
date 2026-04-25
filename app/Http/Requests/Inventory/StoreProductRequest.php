<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('products.create');
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku',
            'barcode' => 'nullable|string|max:255|unique:products,barcode',
            'image' => 'nullable|image|max:2048',
            'description' => 'nullable|string',
            'unit_of_measure_id' => 'required|exists:units_of_measure,id',
            'reorder_level' => 'required|integer|min:0',
            'reorder_quantity' => 'required|integer|min:1',
            'is_expirable' => 'boolean',
            'requires_prescription' => 'boolean',
            'status' => 'required|in:active,inactive,discontinued',
        ];
    }
}
