<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Product extends Model
{
    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'generic_name',
        'category_id',
        'category',
        'uom',
        'unit_price',
        'cost_price',
        'stock',
        'reorder_point',
        'batch_no',
        'expiry_date',
        'daily_avg_sales',
        'forecast_demand_30d',
        'status',
        'is_bulk',
        'parent_product_id',
        'child_product_id',
        'conversion_rate',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'cost_price' => 'float',
        'stock' => 'integer',
        'reorder_point' => 'integer',
        'daily_avg_sales' => 'float',
        'forecast_demand_30d' => 'integer',
        'is_bulk' => 'boolean',
        'conversion_rate' => 'integer',
        'expiry_date' => 'date:Y-m-d',
    ];

    protected $appends = [
        'genericName',
        'unitPrice',
        'costPrice',
        'reorderPoint',
        'batchNo',
        'expiryDate',
        'dailyAvgSales',
        'forecastDemand30d',
        'isBulk',
        'parentProductId',
        'childProductId',
        'conversionRate',
    ];

    public function getGenericNameAttribute(): ?string
    {
        return $this->attributes['generic_name'] ?? null;
    }

    public function getUnitPriceAttribute(): float
    {
        return (float)($this->attributes['unit_price'] ?? 0);
    }

    public function getCostPriceAttribute(): float
    {
        return (float)($this->attributes['cost_price'] ?? 0);
    }

    public function getReorderPointAttribute(): int
    {
        return (int)($this->attributes['reorder_point'] ?? 0);
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

    public function getDailyAvgSalesAttribute(): float
    {
        return (float)($this->attributes['daily_avg_sales'] ?? 0);
    }

    public function getForecastDemand30dAttribute(): int
    {
        return (int)($this->attributes['forecast_demand_30d'] ?? 0);
    }

    public function getIsBulkAttribute(): bool
    {
        return (bool)($this->attributes['is_bulk'] ?? false);
    }

    public function getParentProductIdAttribute(): ?int
    {
        return $this->attributes['parent_product_id'] ?? null;
    }

    public function getChildProductIdAttribute(): ?int
    {
        return $this->attributes['child_product_id'] ?? null;
    }

    public function getConversionRateAttribute(): int
    {
        return (int)($this->attributes['conversion_rate'] ?? 100);
    }

    public function categoryRel(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function parentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'parent_product_id');
    }

    public function childProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'child_product_id');
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function recalculateStatus(): string
    {
        $now = Carbon::now();
        $isExpiringSoon = false;
        if (!empty($this->attributes['expiry_date'])) {
            $exp = Carbon::parse($this->attributes['expiry_date']);
            $daysDiff = $now->diffInDays($exp, false);
            $isExpiringSoon = ($daysDiff <= 30 && $daysDiff >= 0);
        }

        $stock = (int)($this->attributes['stock'] ?? 0);
        $reorder = (int)($this->attributes['reorder_point'] ?? 10);

        if ($stock <= 0) {
            $status = 'Out of Stock';
        } elseif ($stock <= ($reorder / 2)) {
            $status = 'Critical Low';
        } elseif ($stock <= $reorder) {
            $status = 'Low Stock';
        } elseif ($isExpiringSoon) {
            $status = 'Expiring Soon';
        } else {
            $status = 'In Stock';
        }

        $this->status = $status;
        return $status;
    }
}

