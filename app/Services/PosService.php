<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Exception;

class PosService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function processSale(array $payload): Sale
    {
        return DB::transaction(function () use ($payload) {
            $items = $payload['items'] ?? [];
            if (empty($items)) {
                throw new Exception("Cannot process sale: Cart is empty.");
            }

            $invoiceNo = $payload['invoice_no'] ?? ('TXN-' . rand(10000, 99999));
            $cashier = $payload['cashier'] ?? 'Cashier Xyra';
            $paymentMethod = $payload['payment_method'] ?? 'Cash';
            $customerType = $payload['customer_type'] ?? 'Regular';
            $customerName = $payload['customer_name'] ?? null;
            $customerIdNo = $payload['customer_id_no'] ?? null;
            $notes = $payload['notes'] ?? null;

            $subtotal = 0;
            $saleItemsData = [];

            foreach ($items as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['productId']);
                $qty = (int)$item['qty'];

                if ($product->stock < $qty) {
                    throw new Exception("Insufficient stock for {$product->name}. In stock: {$product->stock}, Requested: {$qty}");
                }

                $itemSubtotal = $product->unit_price * $qty;
                $subtotal += $itemSubtotal;

                $saleItemsData[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_price' => $product->unit_price,
                    'cost_price' => $product->cost_price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $discount = 0;
            $discountType = $payload['discount_type'] ?? 'None';

            if (isset($payload['discount']) && is_numeric($payload['discount'])) {
                $discount = (float)$payload['discount'];
            } elseif ($discountType === 'Senior Citizen' || $customerType === 'Senior Citizen') {
                $discount = round($subtotal * 0.05, 2);
            } elseif ($discountType === 'PWD' || $customerType === 'PWD') {
                $discount = round($subtotal * 0.10, 2);
            }

            $total = max(0, $subtotal - $discount);
            $amountPaid = isset($payload['amount_paid']) ? (float)$payload['amount_paid'] : $total;
            if ($amountPaid < $total && $paymentMethod === 'Cash') {
                throw new Exception("Amount paid (₱" . number_format($amountPaid, 2) . ") is less than the total due (₱" . number_format($total, 2) . ").");
            }
            $change = max(0, $amountPaid - $total);

            $sale = Sale::create([
                'invoice_no' => $invoiceNo,
                'cashier' => $cashier,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'discount_type' => $discountType,
                'customer_type' => $customerType,
                'customer_name' => $customerName,
                'customer_id_no' => $customerIdNo,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'amount_paid' => $amountPaid,
                'change' => $change,
                'notes' => $notes,
            ]);

            foreach ($saleItemsData as $data) {
                /** @var Product $product */
                $product = $data['product'];
                $qty = $data['quantity'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $qty,
                    'unit_price' => $data['unit_price'],
                    'cost_price' => $data['cost_price'],
                    'subtotal' => $data['subtotal'],
                ]);

                $prevStock = $product->stock;
                $product->stock -= $qty;
                $product->recalculateStatus();
                $product->save();

                $this->inventoryService->logMovement(
                    $product->id,
                    $product->name,
                    'POS_SALE',
                    -$qty,
                    $prevStock,
                    $product->stock,
                    $invoiceNo,
                    "Sold at POS Counter (Receipt #{$invoiceNo})"
                );
            }

            return $sale->load('items');
        });
    }
}
