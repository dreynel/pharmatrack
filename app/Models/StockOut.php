<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOut extends Model
{
    protected $fillable = [
        'ref_no',
        'reason',
        'date',
        'authorized_by',
        'notes'
    ];

    protected $casts = [
        'date' => 'date:Y-m-d'
    ];

    protected $appends = [
        'refNo',
        'authorizedBy',
    ];

    public function getRefNoAttribute(): string
    {
        return $this->attributes['ref_no'] ?? '';
    }

    public function getAuthorizedByAttribute(): string
    {
        return $this->attributes['authorized_by'] ?? '';
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOutItem::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(StockOutItem::class);
    }
}

