<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockIn extends Model
{
    protected $fillable = [
        'ref_no',
        'supplier_id',
        'supplier_name',
        'date',
        'received_by',
        'total_amount',
        'notes'
    ];

    protected $casts = [
        'total_amount' => 'float',
        'date' => 'date:Y-m-d'
    ];

    protected $appends = [
        'refNo',
        'supplierName',
        'receivedBy',
        'totalAmount',
    ];

    public function getRefNoAttribute(): string
    {
        return $this->attributes['ref_no'] ?? '';
    }

    public function getSupplierNameAttribute(): string
    {
        return $this->attributes['supplier_name'] ?? '';
    }

    public function getReceivedByAttribute(): string
    {
        return $this->attributes['received_by'] ?? '';
    }

    public function getTotalAmountAttribute(): float
    {
        return (float)($this->attributes['total_amount'] ?? 0);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockInItem::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(StockInItem::class);
    }
}

