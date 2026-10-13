<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class StockInItem extends Model
{
    protected $fillable = [
        'stock_in_id',
        'product_id',
        'product_name',
        'quantity',
        'cost_price',
        'batch_no',
        'expiry_date'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'cost_price' => 'float',
        'expiry_date' => 'date:Y-m-d'
    ];

    protected $appends = [
        'productId',
        'name',
        'qty',
        'costPrice',
        'batchNo',
        'expiryDate',
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

    public function getExpiryDateAttribute(): ?string
    {
        $val = $this->attributes['expiry_date'] ?? null;
        return $val ? Carbon::parse($val)->format('Y-m-d') : null;
    }

    public function stockIn(): BelongsTo
    {
        return $this->belongsTo(StockIn::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

