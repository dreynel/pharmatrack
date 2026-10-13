<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function logMovement(
        int $productId,
        string $productName,
        string $type,
        int $qtyChange,
        int $previousStock,
        int $newStock,
        ?string $referenceId = null,
        ?string $remarks = null
    ): StockMovement {
        return StockMovement::create([
            'movement_code' => 'MOV-' . strtoupper(substr(uniqid(), -6)),
            'timestamp' => now(),
            'product_id' => $productId,
            'product_name' => $productName,
            'type' => $type,
            'qty_change' => $qtyChange,
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reference_id' => $referenceId,
            'remarks' => $remarks,
        ]);
    }

    public function updateStatus(Product $product): string
    {
        $status = $product->recalculateStatus();
        $product->save();
        return $status;
    }

    public function quickRestock(int $productId, int $quantity, string $remarks = 'Manual restock'): Product
    {
        $product = Product::findOrFail($productId);
        $prevStock = $product->stock;
        $product->stock += $quantity;
        $product->recalculateStatus();
        $product->save();

        $this->logMovement(
            $product->id,
            $product->name,
            'STOCK_IN',
            $quantity,
            $prevStock,
            $product->stock,
            'MANUAL-RESTOCK',
            $remarks
        );

        return $product;
    }

    public function getCriticalAlerts(): array
    {
        $lowStock = Product::where('stock', '<=', DB::raw('reorder_point'))->get();
        $expiringSoon = Product::whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', Carbon::now()->addDays(30))
            ->whereDate('expiry_date', '>=', Carbon::now())
            ->get();

        return [
            'low_stock' => $lowStock,
            'expiring_soon' => $expiringSoon,
            'low_stock_count' => $lowStock->count(),
            'expiring_count' => $expiringSoon->count(),
        ];
    }
}
