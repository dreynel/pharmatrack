<?php
/**
 * Action: Process Customer Return & Refund
 * Domain: Modules/POS
 * Implements Philippine Pharmacy FDA / RA 10918 safety guidelines:
 * - Receipt verification against original sale
 * - Good condition / unopened: Restock to inventory ledger
 * - Damaged / opened: Quarantined write-off (do not restock)
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$invoiceOrId = trim((string)($input['invoice_no'] ?? ($input['sale_id'] ?? ($input['id'] ?? ''))));
$reason = sanitizeString($input['reason'] ?? 'Customer Mistake / Wrong Item Selected');
$conditionType = sanitizeString($input['condition_type'] ?? 'resellable');
$refundMethod = sanitizeString($input['refund_method'] ?? 'Cash');
$notes = sanitizeString($input['notes'] ?? '');
$cashier = sanitizeString($input['cashier'] ?? ($_SESSION['user']['name'] ?? ($_SESSION['user']['username'] ?? 'Pharmacist')));
$items = $input['items'] ?? [];

if (empty($invoiceOrId)) {
    jsonResponse(['success' => false, 'error' => 'Original invoice number or sale ID is required.'], 400);
}

if (empty($items) || !is_array($items)) {
    jsonResponse(['success' => false, 'error' => 'Please select at least one item to return.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Locate original sale
    if (is_numeric($invoiceOrId)) {
        $saleStmt = $pdo->prepare("SELECT * FROM sales WHERE id = ? OR invoice_no = ? LIMIT 1 FOR UPDATE");
        $saleStmt->execute([(int)$invoiceOrId, $invoiceOrId]);
    } else {
        $saleStmt = $pdo->prepare("SELECT * FROM sales WHERE invoice_no = ? OR id = ? LIMIT 1 FOR UPDATE");
        $saleStmt->execute([$invoiceOrId, $invoiceOrId]);
    }
    $sale = $saleStmt->fetch();

    if (!$sale) {
        throw new Exception("Original transaction '{$invoiceOrId}' was not found.");
    }

    $saleId = (int)$sale['id'];
    $invoiceNo = (string)($sale['invoice_no'] ?: $sale['id']);
    $customerName = (string)($sale['customer_name'] ?? 'Walk-in Customer');

    // 2. Fetch original sale items
    $saleItemsStmt = $pdo->prepare("SELECT * FROM sale_items WHERE sale_id = ?");
    $saleItemsStmt->execute([$saleId]);
    $originalSaleItems = $saleItemsStmt->fetchAll();
    $origItemsById = [];
    $origItemsByProduct = [];
    foreach ($originalSaleItems as $osi) {
        $origItemsById[(int)$osi['id']] = $osi;
        $origItemsByProduct[(int)$osi['product_id']] = $osi;
    }

    // 3. Fetch already returned quantities for this sale
    $alreadyReturnedStmt = $pdo->prepare("
        SELECT sri.product_id, COALESCE(SUM(sri.quantity), 0) as total_returned
        FROM sale_return_items sri
        JOIN sale_returns sr ON sri.sale_return_id = sr.id
        WHERE sr.sale_id = ?
        GROUP BY sri.product_id
    ");
    $alreadyReturnedStmt->execute([$saleId]);
    $returnedMap = [];
    while ($rRow = $alreadyReturnedStmt->fetch()) {
        $returnedMap[(int)$rRow['product_id']] = (int)$rRow['total_returned'];
    }

    // 4. Validate and calculate return items
    $preparedReturnItems = [];
    $totalRefund = 0.0;
    $shouldRestock = ($conditionType === 'resellable');

    foreach ($items as $item) {
        $productId = (int)($item['productId'] ?? ($item['product_id'] ?? 0));
        $returnQty = (int)($item['qty'] ?? ($item['quantity'] ?? 0));
        $saleItemId = !empty($item['sale_item_id']) ? (int)$item['sale_item_id'] : null;

        if ($productId <= 0 || $returnQty <= 0) {
            continue;
        }

        // Match against original sale
        $matchedOriginal = null;
        if ($saleItemId && isset($origItemsById[$saleItemId])) {
            $matchedOriginal = $origItemsById[$saleItemId];
        } elseif (isset($origItemsByProduct[$productId])) {
            $matchedOriginal = $origItemsByProduct[$productId];
        }

        if (!$matchedOriginal) {
            throw new Exception("Product ID #{$productId} was not part of original invoice #{$invoiceNo}.");
        }

        $purchasedQty = (int)$matchedOriginal['quantity'];
        $alreadyReturned = $returnedMap[$productId] ?? 0;
        $maxReturnable = max(0, $purchasedQty - $alreadyReturned);

        if ($returnQty > $maxReturnable) {
            throw new Exception("Cannot return {$returnQty} units of '{$matchedOriginal['product_name']}'. Only {$maxReturnable} units remain eligible for return.");
        }

        $unitPrice = (float)$matchedOriginal['unit_price'];
        $lineRefund = round($returnQty * $unitPrice, 2);
        $totalRefund += $lineRefund;

        $batchNo = !empty($item['batch_no']) ? $item['batch_no'] : ($matchedOriginal['batch_no'] ?? null);
        $expiryDate = !empty($item['expiry_date']) ? $item['expiry_date'] : ($matchedOriginal['expiry_date'] ?? null);

        $preparedReturnItems[] = [
            'product_id' => $productId,
            'sale_item_id' => (int)$matchedOriginal['id'],
            'product_name' => $matchedOriginal['product_name'],
            'quantity' => $returnQty,
            'unit_price' => $unitPrice,
            'cost_price' => (float)($matchedOriginal['cost_price'] ?? 0),
            'subtotal' => $lineRefund,
            'batch_no' => $batchNo,
            'expiry_date' => $expiryDate,
            'restocked' => $shouldRestock ? 1 : 0
        ];
    }

    if (empty($preparedReturnItems)) {
        throw new Exception("No valid items selected for return.");
    }

    // 5. Generate unique Return Number
    $returnNo = generateRefNo('RET');

    // 6. Insert Parent Return Header
    $retStmt = $pdo->prepare("
        INSERT INTO sale_returns (
            return_no, sale_id, invoice_no, cashier, customer_name,
            reason, condition_type, refund_method, refund_amount,
            restocked, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, NOW(), NOW()
        )
    ");
    $retStmt->execute([
        $returnNo,
        $saleId,
        $invoiceNo,
        $cashier,
        $customerName,
        $reason,
        $conditionType,
        $refundMethod,
        $totalRefund,
        $shouldRestock ? 1 : 0,
        $notes
    ]);
    $returnId = (int)$pdo->lastInsertId();

    // 7. Insert Return Items & Post Inventory Ledger / Stock Movements
    $retItemStmt = $pdo->prepare("
        INSERT INTO sale_return_items (
            sale_return_id, sale_item_id, product_id, product_name,
            quantity, unit_price, subtotal, batch_no, expiry_date,
            restocked, created_at
        ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, NOW()
        )
    ");

    $movementStmt = null;
    try {
        $movementStmt = $pdo->prepare("
            INSERT INTO stock_movements (
                movement_code, timestamp, product_id, product_name, type,
                qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
            ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
    } catch (Throwable $ignore) {}

    foreach ($preparedReturnItems as $pItem) {
        $retItemStmt->execute([
            $returnId,
            $pItem['sale_item_id'],
            $pItem['product_id'],
            $pItem['product_name'],
            $pItem['quantity'],
            $pItem['unit_price'],
            $pItem['subtotal'],
            $pItem['batch_no'],
            $pItem['expiry_date'],
            $pItem['restocked']
        ]);

        if ($shouldRestock) {
            // Good condition -> Restock into active inventory
            $ledEntry = postInventoryEntry($pdo, [
                'product_id' => $pItem['product_id'],
                'product_name' => $pItem['product_name'],
                'transaction_code' => 'RET',
                'transaction_id' => $returnId,
                'reference_no' => $returnNo,
                'impact' => +$pItem['quantity'],
                'unit_cost' => $pItem['cost_price'],
                'batch_no' => $pItem['batch_no'],
                'expiry_date' => $pItem['expiry_date'],
                'remarks' => "Customer Return #{$returnNo} (Invoice #{$invoiceNo}): {$reason}"
            ]);

            if ($movementStmt) {
                try {
                    $movCode = $ledEntry['entry_no'] ?: generateRefNo('MOV');
                    $movementStmt->execute([
                        $movCode,
                        $pItem['product_id'],
                        $pItem['product_name'],
                        'Customer Return',
                        +$pItem['quantity'],
                        (int)$ledEntry['previous_balance'],
                        (int)$ledEntry['running_balance'],
                        $returnNo,
                        "Returned by customer from OR #{$invoiceNo}: {$reason}"
                    ]);
                } catch (Throwable $movErr) {}
            }
        } else {
            // Damaged / opened -> Log audit movement without restoring shelf inventory
            if ($movementStmt) {
                try {
                    $pRow = $pdo->query("SELECT stock FROM products WHERE id = " . (int)$pItem['product_id'])->fetch();
                    $curStock = (int)($pRow['stock'] ?? 0);
                    $movCode = generateRefNo('MOV');
                    $movementStmt->execute([
                        $movCode,
                        $pItem['product_id'],
                        $pItem['product_name'],
                        'Return Quarantine',
                        0,
                        $curStock,
                        $curStock,
                        $returnNo,
                        "Damaged return from OR #{$invoiceNo} (Quarantine write-off, not restocked)"
                    ]);
                } catch (Throwable $movErr) {}
            }
        }
    }

    $pdo->commit();

    $nowTimestamp = date('Y-m-d H:i:s');

    jsonResponse([
        'success' => true,
        'message' => 'Customer return and refund processed successfully.',
        'returnSlip' => [
            'id' => $returnNo,
            'return_no' => $returnNo,
            'return_id' => $returnId,
            'invoice_no' => $invoiceNo,
            'sale_id' => $saleId,
            'timestamp' => $nowTimestamp,
            'cashier' => $cashier,
            'customer_name' => $customerName,
            'reason' => $reason,
            'condition_type' => $conditionType,
            'condition_label' => $shouldRestock ? 'Good / Sealed (Restocked)' : 'Damaged / Opened (Quarantined)',
            'refund_method' => $refundMethod,
            'refund_amount' => $totalRefund,
            'restocked' => $shouldRestock,
            'items' => array_map(function($pi) {
                return [
                    'product_id' => $pi['product_id'],
                    'name' => $pi['product_name'],
                    'qty' => $pi['quantity'],
                    'price' => $pi['unit_price'],
                    'subtotal' => $pi['subtotal'],
                    'batch_no' => $pi['batch_no'] ?? '',
                    'expiry_date' => $pi['expiry_date'] ?? ''
                ];
            }, $preparedReturnItems),
            'items_count' => count($preparedReturnItems)
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}
