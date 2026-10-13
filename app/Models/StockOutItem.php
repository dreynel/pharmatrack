<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOutItem extends Model
{
    protected $fillable = [
        'stock_out_id',
        'product_id',
        'product_name',
        'quantity',
        'cost_price',
        'batch_no'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'cost_price' => 'float'
    ];

    protected $appends = [
        'productId',
        'name',
        'qty',
        'costPrice',
        'batchNo'
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

    public function getCostPriceAttribute(): float
    {
        return (float)($this->attributes['cost_price'] ?? 0);
    }

    public function getBatchNoAttribute(): ?string
    {
        return $this->attributes['batch_no'] ?? null;
    }

    public function stockOut(): BelongsTo
    {
        return $this->belongsTo(StockOut::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

