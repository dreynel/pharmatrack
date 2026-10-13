<?php
/**
 * Action: Process POS Checkout & Sales Transaction
 * Domain: Modules/POS
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$items = $input['items'] ?? [];
$paymentMethod = sanitizeString($input['payment_method'] ?? 'Cash');
$amountPaid = (float)($input['amount_paid'] ?? 0);
$discountType = sanitizeString($input['discount_type'] ?? 'None');
$customerType = sanitizeString($input['customer_type'] ?? 'regular');
$customerName = sanitizeString($input['customer_name'] ?? '');
$customerIdNo = sanitizeString($input['customer_id_no'] ?? '');
$notes = sanitizeString($input['notes'] ?? '');
$cashier = sanitizeString($input['cashier'] ?? ($_SESSION['user']['name'] ?? 'Cashier'));

if (empty($items) || !is_array($items)) {
    jsonResponse(['success' => false, 'error' => 'Cart is empty. Please select products to purchase.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Calculate and verify subtotal and stock
    $calculatedSubtotal = 0.0;
    $preparedItems = [];

    $fetchProdStmt = $pdo->prepare("SELECT id, name, unit_price, cost_price, stock FROM products WHERE id = ? FOR UPDATE");

    foreach ($items as $item) {
        $productId = (int)($item['id'] ?? ($item['product_id'] ?? 0));
        $qty = (int)($item['quantity'] ?? ($item['qty'] ?? 1));

        if ($productId <= 0 || $qty <= 0) {
            throw new Exception("Invalid item in transaction cart.");
        }

        $fetchProdStmt->execute([$productId]);
        $prod = $fetchProdStmt->fetch();

        if (!$prod) {
            throw new Exception("Product #{$productId} not found.");
        }

        if ($prod['stock'] < $qty) {
            throw new Exception("Insufficient stock for '{$prod['name']}'. Available: {$prod['stock']}, requested: {$qty}.");
        }

        $unitPrice = (float)$prod['unit_price'];
        $costPrice = (float)$prod['cost_price'];
        $lineTotal = round($unitPrice * $qty, 2);
        $calculatedSubtotal += $lineTotal;

        $preparedItems[] = [
            'product' => $prod,
            'quantity' => $qty,
            'unit_price' => $unitPrice,
            'cost_price' => $costPrice,
            'subtotal' => $lineTotal
        ];
    }

    // 2. Compute Discounts (Senior / PWD 20%, or custom promo)
    $discountAmount = 0.0;
    if (in_array(strtolower($customerType), ['senior', 'pwd']) || stripos($discountType, '20%') !== false) {
        $discountAmount = round($calculatedSubtotal * 0.20, 2);
    } elseif (!empty($input['discount']) && is_numeric($input['discount'])) {
        $discountAmount = (float)$input['discount'];
    }

    $finalTotal = max(0, round($calculatedSubtotal - $discountAmount, 2));

    if ($paymentMethod === 'Cash' && $amountPaid < $finalTotal) {
        throw new Exception("Amount paid (₱" . number_format($amountPaid, 2) . ") is less than total due (₱" . number_format($finalTotal, 2) . ").");
    }

    $change = max(0, round($amountPaid - $finalTotal, 2));
    $invoiceNo = generateRefNo('INV');

    // 3. Insert Parent Sale
    $saleStmt = $pdo->prepare("
        INSERT INTO sales (
            invoice_no, cashier, subtotal, discount, discount_type,
            customer_type, customer_name, customer_id_no,
            total, payment_method, amount_paid, `change`, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");
    $saleStmt->execute([
        $invoiceNo, $cashier, $calculatedSubtotal, $discountAmount, $discountType,
        $customerType, $customerName, $customerIdNo,
        $finalTotal, $paymentMethod, $amountPaid, $change, $notes
    ]);
    $saleId = $pdo->lastInsertId();

    // 4. Insert Sale Items, Deduct Inventory & Record Stock Movement Ledger
    $insertItemStmt = $pdo->prepare("
        INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, cost_price, subtotal, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $updateStockStmt = $pdo->prepare("UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?");

    $movementStmt = $pdo->prepare("
        INSERT INTO stock_movements (
            movement_code, timestamp, product_id, product_name, type,
            qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
        ) VALUES (?, NOW(), ?, ?, 'SALE', ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    foreach ($preparedItems as $pItem) {
        $prod = $pItem['product'];
        $qty = $pItem['quantity'];

        $insertItemStmt->execute([
            $saleId, $prod['id'], $prod['name'], $qty,
            $pItem['unit_price'], $pItem['cost_price'], $pItem['subtotal']
        ]);

        $updateStockStmt->execute([$qty, $prod['id']]);

        $prevStock = (int)$prod['stock'];
        $newStock = $prevStock - $qty;
        $movCode = generateRefNo('MOV');

        $movementStmt->execute([
            $movCode, $prod['id'], $prod['name'],
            -$qty, $prevStock, $newStock, $invoiceNo,
            "Sold via invoice #{$invoiceNo}"
        ]);
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Sale completed successfully.',
        'sale' => [
            'id' => $saleId,
            'invoice_no' => $invoiceNo,
            'cashier' => $cashier,
            'subtotal' => $calculatedSubtotal,
            'discount' => $discountAmount,
            'total' => $finalTotal,
            'payment_method' => $paymentMethod,
            'amount_paid' => $amountPaid,
            'change' => $change,
            'items_count' => count($preparedItems)
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}

