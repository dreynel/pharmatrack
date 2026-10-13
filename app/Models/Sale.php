<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Sale extends Model
{
    protected $fillable = [
        'invoice_no',
        'cashier',
        'subtotal',
        'discount',
        'discount_type',
        'customer_type',
        'customer_name',
        'customer_id_no',
        'total',
        'payment_method',
        'amount_paid',
        'change',
        'notes'
    ];

    protected $casts = [
        'subtotal' => 'float',
        'discount' => 'float',
        'total' => 'float',
        'amount_paid' => 'float',
        'change' => 'float'
    ];

    protected $appends = [
        'paymentMethod',
        'amountPaid',
        'timestamp',
    ];

    public function getPaymentMethodAttribute(): string
    {
        return $this->attributes['payment_method'] ?? 'Cash';
    }

    public function getAmountPaidAttribute(): float
    {
        return (float)($this->attributes['amount_paid'] ?? 0);
    }

    public function getTimestampAttribute(): string
    {
        $val = $this->attributes['created_at'] ?? null;
        return $val ? Carbon::parse($val)->format('Y-m-d H:i:s') : '';
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }
}

