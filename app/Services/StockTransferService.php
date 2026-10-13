<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockIn;
use App\Models\StockInItem;
use App\Models\StockOut;
use App\Models\StockOutItem;
use Illuminate\Support\Facades\DB;
use Exception;

class StockTransferService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function processStockIn(array $payload): StockIn
    {
        return DB::transaction(function () use ($payload) {
            $refNo = $payload['refNo'] ?? $payload['ref_no'] ?? ('DR-' . rand(100000, 999999));
            $supplierName = $payload['supplierName'] ?? $payload['supplier_name'] ?? 'General Distributor';
            $supplierId = $payload['supplierId'] ?? $payload['supplier_id'] ?? null;
            $receivedBy = $payload['receivedBy'] ?? $payload['received_by'] ?? 'Xyra Andrea';
            $date = $payload['date'] ?? now()->toDateString();
            $notes = $payload['notes'] ?? '';
            $items = $payload['items'] ?? [];

            if (empty($items)) {
                throw new Exception("No receiving items provided.");
            }

            $totalAmount = 0;

            $stockIn = StockIn::create([
                'ref_no' => $refNo,
                'supplier_id' => $supplierId,
                'supplier_name' => $supplierName,
                'date' => $date,
                'received_by' => $receivedBy,
                'total_amount' => 0,
                'notes' => $notes,
            ]);

            foreach ($items as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['productId'] ?? $item['product_id']);
                $qty = (int)$item['qty'];
                $costPrice = isset($item['costPrice']) ? (float)$item['costPrice'] : (float)($item['cost_price'] ?? $item['unit_cost'] ?? $product->cost_price);
                $batchNo = $item['batchNo'] ?? $item['batch_no'] ?? $product->batch_no;
                $expiryDate = $item['expiryDate'] ?? $item['expiry_date'] ?? $product->expiry_date;

                $lineTotal = $qty * $costPrice;
                $totalAmount += $lineTotal;

                StockInItem::create([
                    'stock_in_id' => $stockIn->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $qty,
                    'cost_price' => $costPrice,
                    'batch_no' => $batchNo,
                    'expiry_date' => $expiryDate,
                ]);

                $prevStock = $product->stock;
                $product->stock += $qty;
                $product->cost_price = $costPrice;
                if (!empty($batchNo)) $product->batch_no = $batchNo;
                if (!empty($expiryDate)) $product->expiry_date = $expiryDate;
                $product->recalculateStatus();
                $product->save();

                $this->inventoryService->logMovement(
                    $product->id,
                    $product->name,
                    'STOCK_IN',
                    $qty,
                    $prevStock,
                    $product->stock,
                    $refNo,
                    "Received from {$supplierName} (Batch {$product->batch_no})"
                );
            }

            $stockIn->total_amount = $totalAmount;
            $stockIn->save();

            return $stockIn->load('items');
        });
    }

    public function processStockOut(array $payload): StockOut
    {
        return DB::transaction(function () use ($payload) {
            $refNo = $payload['refNo'] ?? $payload['ref_no'] ?? ('SO-' . rand(10000, 99999));
            $reason = $payload['reason'] ?? 'Expired Medicine Disposal';
            $date = $payload['date'] ?? now()->toDateString();
            $authorizedBy = $payload['authorizedBy'] ?? $payload['authorized_by'] ?? 'Xyra Andrea (Manager)';
            $notes = $payload['notes'] ?? '';
            $items = $payload['items'] ?? [];

            if (empty($items)) {
                throw new Exception("No items provided for stock out.");
            }

            $stockOut = StockOut::create([
                'ref_no' => $refNo,
                'reason' => $reason,
                'date' => $date,
                'authorized_by' => $authorizedBy,
                'notes' => $notes,
            ]);

            foreach ($items as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['productId'] ?? $item['product_id']);
                $qty = (int)$item['qty'];

                if ($product->stock < $qty) {
                    throw new Exception("Cannot stock out {$qty} units of {$product->name}. Only {$product->stock} available.");
                }

                $batchNo = $item['batchNo'] ?? $item['batch_no'] ?? $product->batch_no;
                $costPrice = isset($item['costPrice']) ? (float)$item['costPrice'] : (float)($item['cost_price'] ?? $item['unit_cost'] ?? $product->cost_price);

                StockOutItem::create([
                    'stock_out_id' => $stockOut->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $qty,
                    'cost_price' => $costPrice,
                    'batch_no' => $batchNo,
                ]);

                $prevStock = $product->stock;
                $product->stock -= $qty;
                $product->recalculateStatus();
                $product->save();

                $this->inventoryService->logMovement(
                    $product->id,
                    $product->name,
                    'STOCK_OUT',
                    -$qty,
                    $prevStock,
                    $product->stock,
                    $refNo,
                    "Stock Out: {$reason} - Auth: {$authorizedBy}"
                );
            }

            return $stockOut->load('items');
        });
    }

    public function updateStockIn(string|int $id, array $payload): StockIn
    {
        return DB::transaction(function () use ($id, $payload) {
            $stockIn = is_numeric($id) 
                ? StockIn::with('items')->findOrFail($id) 
                : StockIn::with('items')->where('ref_no', $id)->firstOrFail();

            if (isset($payload['refNo']) || isset($payload['ref_no'])) {
                $stockIn->ref_no = $payload['refNo'] ?? $payload['ref_no'];
            }
            if (isset($payload['supplierName']) || isset($payload['supplier_name'])) {
                $stockIn->supplier_name = $payload['supplierName'] ?? $payload['supplier_name'];
            }
            if (isset($payload['date'])) {
                $stockIn->date = $payload['date'];
            }
            if (isset($payload['receivedBy']) || isset($payload['received_by'])) {
                $stockIn->received_by = $payload['receivedBy'] ?? $payload['received_by'];
            }
            if (isset($payload['notes']) || isset($payload['remarks'])) {
                $stockIn->notes = $payload['notes'] ?? $payload['remarks'];
            }
            $stockIn->save();

            return $stockIn->fresh('items');
        });
    }

    public function deleteStockIn(string|int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $stockIn = is_numeric($id) 
                ? StockIn::with('items')->findOrFail($id) 
                : StockIn::with('items')->where('ref_no', $id)->firstOrFail();

            // Reverse the stock added to products by this delivery receipt
            foreach ($stockIn->items as $item) {
                $product = Product::lockForUpdate()->find($item->product_id);
                if ($product) {
                    $prevStock = $product->stock;
                    $product->stock = max(0, $product->stock - $item->quantity);
                    $product->recalculateStatus();
                    $product->save();

                    $this->inventoryService->logMovement(
                        $product->id,
                        $product->name,
                        'STOCK_OUT',
                        -$item->quantity,
                        $prevStock,
                        $product->stock,
                        $stockIn->ref_no,
                        "Reversal: Deleted Stock In shipment #{$stockIn->ref_no}"
                    );
                }
            }

            $stockIn->items()->delete();
            return (bool)$stockIn->delete();
        });
    }

    public function updateStockOut(string|int $id, array $payload): StockOut
    {
        return DB::transaction(function () use ($id, $payload) {
            $stockOut = is_numeric($id) 
                ? StockOut::with('items')->findOrFail($id) 
                : StockOut::with('items')->where('ref_no', $id)->firstOrFail();

            if (isset($payload['refNo']) || isset($payload['ref_no'])) {
                $stockOut->ref_no = $payload['refNo'] ?? $payload['ref_no'];
            }
            if (isset($payload['reason'])) {
                $stockOut->reason = $payload['reason'];
            }
            if (isset($payload['date'])) {
                $stockOut->date = $payload['date'];
            }
            if (isset($payload['authorizedBy']) || isset($payload['authorized_by'])) {
                $stockOut->authorized_by = $payload['authorizedBy'] ?? $payload['authorized_by'];
            }
            if (isset($payload['notes']) || isset($payload['remarks'])) {
                $stockOut->notes = $payload['notes'] ?? $payload['remarks'];
            }
            $stockOut->save();

            return $stockOut->fresh('items');
        });
    }

    public function deleteStockOut(string|int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $stockOut = is_numeric($id) 
                ? StockOut::with('items')->findOrFail($id) 
                : StockOut::with('items')->where('ref_no', $id)->firstOrFail();

            // Restore deducted stock back to products
            foreach ($stockOut->items as $item) {
                $product = Product::lockForUpdate()->find($item->product_id);
                if ($product) {
                    $prevStock = $product->stock;
                    $product->stock += $item->quantity;
                    $product->recalculateStatus();
                    $product->save();

                    $this->inventoryService->logMovement(
                        $product->id,
                        $product->name,
                        'STOCK_IN',
                        $item->quantity,
                        $prevStock,
                        $product->stock,
                        $stockOut->ref_no,
                        "Reversal: Deleted Stock Out voucher #{$stockOut->ref_no} (Stock Restored)"
                    );
                }
            }

            $stockOut->items()->delete();
            return (bool)$stockOut->delete();
        });
    }
}
