<?php
/**
 * Action: Create Stock-Out Disposal / Adjustment Entry
 * Domain: Modules/StockOut
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$refNo = sanitizeString($input['ref_no'] ?? ($input['refNo'] ?? generateRefNo('DISP')));
$reason = sanitizeString($input['reason'] ?? 'Expired');
$date = !empty($input['date']) ? sanitizeString($input['date']) : date('Y-m-d');
$authorizedBy = sanitizeString($input['authorized_by'] ?? ($input['authorizedBy'] ?? ($_SESSION['user']['name'] ?? 'Pharmacist')));
$notes = sanitizeString($input['notes'] ?? '');
$items = $input['items'] ?? [];

if (empty($items) || !is_array($items)) {
    jsonResponse(['success' => false, 'error' => 'At least one medicine item is required for Stock-Out.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Insert Parent Stock Out Record
    $parentStmt = $pdo->prepare("
        INSERT INTO stock_outs (
            ref_no, reason, date, authorized_by, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");
    $parentStmt->execute([
        $refNo,
        $reason,
        $date,
        $authorizedBy,
        $notes
    ]);
    $stockOutId = (int)$pdo->lastInsertId();

    // 2. Prepare Child Insert and Inventory Deduction
    $childStmt = $pdo->prepare("
        INSERT INTO stock_out_items (
            stock_out_id, product_id, product_name, quantity, cost_price, batch_no, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    $updateProdStmt = $pdo->prepare("
        UPDATE products 
        SET stock = GREATEST(0, stock - ?),
            updated_at = NOW()
        WHERE id = ?
    ");

    $movementStmt = $pdo->prepare("
        INSERT INTO stock_movements (
            movement_code, timestamp, product_id, product_name, type,
            qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
        ) VALUES (
            ?, NOW(), ?, ?, 'DISPOSAL', ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    foreach ($items as $item) {
        $productId = (int)($item['product_id'] ?? ($item['productId'] ?? 0));
        $prodName = sanitizeString($item['product_name'] ?? ($item['name'] ?? ''));
        $qty = (int)($item['quantity'] ?? ($item['qty'] ?? 0));
        $costPrice = (float)($item['cost_price'] ?? ($item['costPrice'] ?? 0));
        $batchNo = sanitizeString($item['batch_no'] ?? ($item['batchNo'] ?? ''));

        if ($qty <= 0) continue;

        // Fetch current stock and verify availability
        $currentStock = 0;
        if ($productId > 0) {
            $checkStmt = $pdo->prepare("SELECT stock, cost_price, name FROM products WHERE id = ? FOR UPDATE");
            $checkStmt->execute([$productId]);
            $pRow = $checkStmt->fetch();
            if ($pRow) {
                $currentStock = (int)$pRow['stock'];
                if ($costPrice <= 0) $costPrice = (float)$pRow['cost_price'];
                if (empty($prodName)) $prodName = $pRow['name'];
            }
        }

        // Insert Child Item
        $childStmt->execute([
            $stockOutId,
            $productId ?: null,
            $prodName,
            $qty,
            $costPrice,
            $batchNo ?: null
        ]);

        // Deduct inventory
        if ($productId > 0) {
            $updateProdStmt->execute([$qty, $productId]);

            // Movement Ledger
            $newStock = max(0, $currentStock - $qty);
            $movCode = generateRefNo('MOV');
            $movementStmt->execute([
                $movCode,
                $productId,
                $prodName,
                -$qty,
                $currentStock,
                $newStock,
                $refNo,
                "Stock disposal: {$reason} - #{$refNo}"
            ]);
        }
    }

    $pdo->commit();

    // Fetch saved stock-out record
    $fetchParent = $pdo->prepare("SELECT * FROM stock_outs WHERE id = ?");
    $fetchParent->execute([$stockOutId]);
    $savedRecord = $fetchParent->fetch();
    if ($savedRecord) {
        $savedRecord['items'] = $items;
    }

    jsonResponse([
        'success' => true,
        'message' => "Stock-out entry #{$refNo} recorded and inventory deducted.",
        'stock_out_id' => $stockOutId,
        'stockOut' => $savedRecord,
        'data' => $savedRecord,
        'ref_no' => $refNo
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

