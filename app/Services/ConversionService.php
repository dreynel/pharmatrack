<?php

namespace App\Services;

use App\Models\Conversion;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Exception;

class ConversionService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function processConversion(array $payload): Conversion
    {
        return DB::transaction(function () use ($payload) {
            $sourceId = $payload['sourceProductId'] ?? $payload['source_product_id'];
            $targetId = $payload['targetProductId'] ?? $payload['target_product_id'];
            $sourceQty = (int)($payload['sourceQty'] ?? $payload['source_qty'] ?? 1);

            $sourceProduct = Product::lockForUpdate()->findOrFail($sourceId);
            $targetProduct = Product::lockForUpdate()->findOrFail($targetId);

            if ($sourceProduct->stock < $sourceQty) {
                throw new Exception("Insufficient stock in bulk container {$sourceProduct->name}. Available: {$sourceProduct->stock}, requested: {$sourceQty}");
            }

            if (isset($payload['target_qty']) || isset($payload['targetQty'])) {
                $targetQty = (int)($payload['target_qty'] ?? $payload['targetQty']);
                $multiplier = $sourceQty > 0 ? (int)round($targetQty / $sourceQty) : $targetQty;
            } else {
                $multiplier = (int)($payload['multiplier'] ?? $sourceProduct->conversion_rate ?? 100);
                if ($multiplier <= 0) $multiplier = 100;
                $targetQty = $sourceQty * $multiplier;
            }
            $convCode = 'CONV-' . rand(10000, 99999);
            $operator = $payload['operator'] ?? 'Xyra Andrea (Pharmacist)';
            $notes = $payload['notes'] ?? "Unboxed {$sourceQty} {$sourceProduct->uom} into {$targetQty} {$targetProduct->uom}";

            $sourcePrevStock = $sourceProduct->stock;
            $sourceProduct->stock -= $sourceQty;
            $sourceProduct->recalculateStatus();
            $sourceProduct->save();

            $targetPrevStock = $targetProduct->stock;
            $targetProduct->stock += $targetQty;
            if (!empty($sourceProduct->batch_no)) {
                $targetProduct->batch_no = $sourceProduct->batch_no;
            }
            if (!empty($sourceProduct->expiry_date)) {
                $targetProduct->expiry_date = $sourceProduct->expiry_date;
            }

            if ($multiplier > 0 && $sourceProduct->cost_price > 0) {
                $targetProduct->cost_price = round($sourceProduct->cost_price / $multiplier, 2);
            }

            $targetProduct->recalculateStatus();
            $targetProduct->save();

            $conversion = Conversion::create([
                'conv_code' => $convCode,
                'date' => now(),
                'source_product_id' => $sourceProduct->id,
                'source_product_name' => $sourceProduct->name,
                'source_uom' => $sourceProduct->uom,
                'source_qty' => $sourceQty,
                'target_product_id' => $targetProduct->id,
                'target_product_name' => $targetProduct->name,
                'target_uom' => $targetProduct->uom,
                'target_qty' => $targetQty,
                'multiplier' => $multiplier,
                'batch_no' => $sourceProduct->batch_no,
                'expiry_date' => $sourceProduct->expiry_date,
                'operator' => $operator,
                'notes' => $notes,
            ]);

            $this->inventoryService->logMovement(
                $sourceProduct->id,
                $sourceProduct->name,
                'CONVERT_OUT',
                -$sourceQty,
                $sourcePrevStock,
                $sourceProduct->stock,
                $convCode,
                "Converted {$sourceQty} {$sourceProduct->uom} to {$targetQty} {$targetProduct->uom}"
            );

            $this->inventoryService->logMovement(
                $targetProduct->id,
                $targetProduct->name,
                'CONVERT_IN',
                $targetQty,
                $targetPrevStock,
                $targetProduct->stock,
                $convCode,
                "Received {$targetQty} {$targetProduct->uom} from {$sourceProduct->name} ({$convCode})"
            );

            return $conversion;
        });
    }
}
