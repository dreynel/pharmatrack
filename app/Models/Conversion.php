<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Conversion extends Model
{
    protected $fillable = [
        'conv_code',
        'date',
        'source_product_id',
        'source_product_name',
        'source_uom',
        'source_qty',
        'target_product_id',
        'target_product_name',
        'target_uom',
        'target_qty',
        'multiplier',
        'batch_no',
        'expiry_date',
        'operator',
        'notes'
    ];

    protected $casts = [
        'source_qty' => 'integer',
        'target_qty' => 'integer',
        'multiplier' => 'integer',
        'date' => 'datetime',
        'expiry_date' => 'date:Y-m-d'
    ];

    protected $appends = [
        'convCode',
        'sourceProductId',
        'sourceProductName',
        'sourceUom',
        'sourceQty',
        'targetProductId',
        'targetProductName',
        'targetUom',
        'targetQty',
        'batchNo',
        'expiryDate',
    ];

    public function getConvCodeAttribute(): string
    {
        return $this->attributes['conv_code'] ?? '';
    }

    public function getSourceProductIdAttribute(): ?int
    {
        return $this->attributes['source_product_id'] ?? null;
    }

    public function getSourceProductNameAttribute(): string
    {
        return $this->attributes['source_product_name'] ?? '';
    }

    public function getSourceUomAttribute(): string
    {
        return $this->attributes['source_uom'] ?? '';
    }

    public function getSourceQtyAttribute(): int
    {
        return (int)($this->attributes['source_qty'] ?? 0);
    }

    public function getTargetProductIdAttribute(): ?int
    {
        return $this->attributes['target_product_id'] ?? null;
    }

    public function getTargetProductNameAttribute(): string
    {
        return $this->attributes['target_product_name'] ?? '';
    }

    public function getTargetUomAttribute(): string
    {
        return $this->attributes['target_uom'] ?? '';
    }

    public function getTargetQtyAttribute(): int
    {
        return (int)($this->attributes['target_qty'] ?? 0);
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

    public function sourceProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'source_product_id');
    }

    public function targetProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'target_product_id');
    }
}

