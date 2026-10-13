<?php
/**
 * Action: Create Stock-In Delivery Intake (Parent-Child Transaction)
 * Domain: Modules/StockIn
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$refNo = sanitizeString($input['ref_no'] ?? ($input['refNo'] ?? generateRefNo('RCV')));
$supplierId = !empty($input['supplier_id']) ? (int)$input['supplier_id'] : (!empty($input['supplierId']) ? (int)$input['supplierId'] : null);
$supplierName = sanitizeString($input['supplier_name'] ?? ($input['supplierName'] ?? ''));
$date = !empty($input['date']) ? sanitizeString($input['date']) : date('Y-m-d');
$receivedBy = sanitizeString($input['received_by'] ?? ($input['receivedBy'] ?? ($_SESSION['user']['name'] ?? 'Pharmacist')));
$notes = sanitizeString($input['notes'] ?? '');
$items = $input['items'] ?? [];

if (empty($items) || !is_array($items)) {
    jsonResponse(['success' => false, 'error' => 'At least one medicine item is required for Stock-In delivery.'], 400);
}

try {
    $pdo->beginTransaction();

    // Calculate total cost
    $totalCost = 0.0;
    foreach ($items as $item) {
        $qty = (int)($item['quantity'] ?? ($item['qty'] ?? 0));
        $cost = (float)($item['cost_price'] ?? ($item['costPrice'] ?? 0));
        $totalCost += ($qty * $cost);
    }

    // 1. Insert Parent Delivery Record
    $parentStmt = $pdo->prepare("
        INSERT INTO stock_ins (
            ref_no, supplier_id, supplier_name, date, total_amount, received_by, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");
    $parentStmt->execute([
        $refNo,
        $supplierId,
        $supplierName,
        $date,
        $totalCost,
        $receivedBy,
        $notes
    ]);
    $stockInId = (int)$pdo->lastInsertId();

    // 2. Prepare Child Insert and Product Inventory Update
    $childStmt = $pdo->prepare("
        INSERT INTO stock_in_items (
            stock_in_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    $updateProdStmt = $pdo->prepare("
        UPDATE products 
        SET stock = stock + ?,
            cost_price = ?,
            batch_no = COALESCE(?, batch_no),
            expiry_date = COALESCE(?, expiry_date),
            updated_at = NOW()
        WHERE id = ?
    ");

    $movementStmt = $pdo->prepare("
        INSERT INTO stock_movements (
            movement_code, timestamp, product_id, product_name, type,
            qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
        ) VALUES (
            ?, NOW(), ?, ?, 'RECEIVING', ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    foreach ($items as $item) {
        $productId = (int)($item['product_id'] ?? ($item['productId'] ?? 0));
        $prodName = sanitizeString($item['product_name'] ?? ($item['name'] ?? ''));
        $qty = (int)($item['quantity'] ?? ($item['qty'] ?? 0));
        $costPrice = (float)($item['cost_price'] ?? ($item['costPrice'] ?? 0));
        $batchNo = sanitizeString($item['batch_no'] ?? ($item['batchNo'] ?? ''));
        $expiryDate = !empty($item['expiry_date']) ? sanitizeString($item['expiry_date']) : (!empty($item['expiryDate']) ? sanitizeString($item['expiryDate']) : null);

        if ($qty <= 0) continue;

        // Fetch current stock
        $currentStock = 0;
        if ($productId > 0) {
            $checkStmt = $pdo->prepare("SELECT stock, name FROM products WHERE id = ?");
            $checkStmt->execute([$productId]);
            $pRow = $checkStmt->fetch();
            if ($pRow) {
                $currentStock = (int)$pRow['stock'];
                if (empty($prodName)) $prodName = $pRow['name'];
            }
        }

        // Insert item detail
        $childStmt->execute([
            $stockInId,
            $productId ?: null,
            $prodName,
            $qty,
            $costPrice,
            $batchNo ?: null,
            $expiryDate
        ]);

        // Update product inventory
        if ($productId > 0) {
            $updateProdStmt->execute([
                $qty,
                $costPrice,
                $batchNo ?: null,
                $expiryDate,
                $productId
            ]);

            // Log stock movement
            $newStock = $currentStock + $qty;
            $movCode = generateRefNo('MOV');
            $movementStmt->execute([
                $movCode,
                $productId,
                $prodName,
                $qty,
                $currentStock,
                $newStock,
                $refNo,
                "Stock-in delivery intake batch #{$refNo}"
            ]);
        }
    }

    $pdo->commit();

    // Fetch saved stock-in record
    $fetchParent = $pdo->prepare("SELECT * FROM stock_ins WHERE id = ?");
    $fetchParent->execute([$stockInId]);
    $savedRecord = $fetchParent->fetch();
    if ($savedRecord) {
        $savedRecord['total_cost'] = $savedRecord['total_amount'];
        $savedRecord['items'] = $items;
    }

    jsonResponse([
        'success' => true,
        'message' => "Delivery batch #{$refNo} successfully received and stocked.",
        'stock_in_id' => $stockInId,
        'stockIn' => $savedRecord,
        'data' => $savedRecord,
        'ref_no' => $refNo
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

