<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'po_number',
        'supplier_id',
        'supplier_name',
        'product_id',
        'product_name',
        'suggested_qty',
        'order_qty',
        'unit_cost',
        'total_cost',
        'status',
        'expected_delivery',
        'notes'
    ];

    protected $casts = [
        'suggested_qty' => 'integer',
        'order_qty' => 'integer',
        'unit_cost' => 'float',
        'total_cost' => 'float',
        'expected_delivery' => 'date:Y-m-d'
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

