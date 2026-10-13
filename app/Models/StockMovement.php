<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class StockMovement extends Model
{
    protected $fillable = [
        'movement_code',
        'timestamp',
        'product_id',
        'product_name',
        'type',
        'qty_change',
        'previous_stock',
        'new_stock',
        'reference_id',
        'remarks'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'qty_change' => 'integer',
        'previous_stock' => 'integer',
        'new_stock' => 'integer'
    ];

    protected $appends = [
        'productId',
        'productName',
        'qtyChange',
        'previousStock',
        'newStock',
        'referenceId',
    ];

    public function getProductIdAttribute(): ?int
    {
        return $this->attributes['product_id'] ?? null;
    }

    public function getProductNameAttribute(): string
    {
        return $this->attributes['product_name'] ?? '';
    }

    public function getQtyChangeAttribute(): int
    {
        return (int)($this->attributes['qty_change'] ?? 0);
    }

    public function getPreviousStockAttribute(): int
    {
        return (int)($this->attributes['previous_stock'] ?? 0);
    }

    public function getNewStockAttribute(): int
    {
        return (int)($this->attributes['new_stock'] ?? 0);
    }

    public function getReferenceIdAttribute(): ?string
    {
        return $this->attributes['reference_id'] ?? null;
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

