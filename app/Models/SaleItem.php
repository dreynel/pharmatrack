<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'quantity',
        'unit_price',
        'cost_price',
        'subtotal'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'float',
        'cost_price' => 'float',
        'subtotal' => 'float'
    ];

    protected $appends = [
        'productId',
        'name',
        'qty',
        'price'
    ];

    public function getProductIdAttribute(): ?int
    {
        return $this->attributes['product_id'] ?? null;
    }

    public function getNameAttribute(): string
    {
        return $this->attributes['product_name'] ?? '';
    }

    public function getQtyAttribute(): int
    {
        return (int)($this->attributes['quantity'] ?? 0);
    }

    public function getPriceAttribute(): float
    {
        return (float)($this->attributes['unit_price'] ?? 0);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

