<?php
/**
 * Action: Create or Update Stock-In Delivery Intake (Parent-Child Transaction)
 * Domain: Modules/StockIn
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));
$isUpdate = ($id > 0) || ($_SERVER['REQUEST_METHOD'] === 'PUT');

$refNo = sanitizeString($input['ref_no'] ?? ($input['refNo'] ?? generateRefNo('DR')));
$supplierId = !empty($input['supplier_id']) ? (int)$input['supplier_id'] : (!empty($input['supplierId']) ? (int)$input['supplierId'] : null);
$supplierName = sanitizeString($input['supplier_name'] ?? ($input['supplierName'] ?? ''));
$date = !empty($input['date']) ? sanitizeString($input['date']) : date('Y-m-d');
$receivedBy = sanitizeString($input['received_by'] ?? ($input['receivedBy'] ?? ($_SESSION['user']['name'] ?? 'Pharmacist')));
$notes = sanitizeString($input['notes'] ?? ($input['remarks'] ?? ''));
$items = isset($input['items']) && is_array($input['items']) ? $input['items'] : null;

// Lookup supplier_id by supplier_name if supplier_id was not explicitly passed
if (!$supplierId && !empty($supplierName)) {
    $supStmt = $pdo->prepare("SELECT id FROM suppliers WHERE name = ? LIMIT 1");
    $supStmt->execute([$supplierName]);
    $supRow = $supStmt->fetch();
    if ($supRow) {
        $supplierId = (int)$supRow['id'];
    }
}

if (!$isUpdate && empty($items)) {
    jsonResponse(['success' => false, 'error' => 'At least one medicine child item is required for Stock-In delivery.'], 400);
}

try {
    $pdo->beginTransaction();

    if ($isUpdate && $id > 0) {
        // Verify parent exists
        $existStmt = $pdo->prepare("SELECT * FROM stock_ins WHERE id = ? LIMIT 1");
        $existStmt->execute([$id]);
        $existingParent = $existStmt->fetch();
        if (!$existingParent) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'error' => "Stock-In parent document #{$id} not found."], 404);
        }

        // Update parent metadata
        $updParent = $pdo->prepare("
            UPDATE stock_ins
            SET ref_no = ?,
                supplier_id = ?,
                supplier_name = ?,
                date = ?,
                received_by = ?,
                notes = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $updParent->execute([
            $refNo ?: $existingParent['ref_no'],
            $supplierId ?? $existingParent['supplier_id'],
            $supplierName ?: $existingParent['supplier_name'],
            $date ?: $existingParent['date'],
            $receivedBy ?: $existingParent['received_by'],
            $notes,
            $id
        ]);

        // If updated children items were also passed, sync children and accounting `inventory` ledger
        if (is_array($items) && count($items) > 0) {
            // 1. Remove old StockIn ledger entries for this document & recalculate product balances
            deleteInventoryEntries($pdo, 'StockIn', $id, $existingParent['ref_no']);

            // 2. Delete old children rows
            $delChildStmt = $pdo->prepare("DELETE FROM stock_in_items WHERE stock_in_id = ?");
            $delChildStmt->execute([$id]);

            // 3. Insert new children rows and post positive (+) impacts to `inventory`
            $totalCost = 0.0;
            $childStmt = $pdo->prepare("
                INSERT INTO stock_in_items (
                    stock_in_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $updateProdMetaStmt = $pdo->prepare("
                UPDATE products 
                SET cost_price = ?,
                    batch_no = COALESCE(?, batch_no),
                    expiry_date = COALESCE(?, expiry_date),
                    updated_at = NOW()
                WHERE id = ?
            ");

            $finalRefNo = $refNo ?: $existingParent['ref_no'];
            $finalSupName = $supplierName ?: $existingParent['supplier_name'];

            foreach ($items as $item) {
                $productId = (int)($item['product_id'] ?? ($item['productId'] ?? 0));
                $prodName = sanitizeString($item['product_name'] ?? ($item['name'] ?? ''));
                $qty = (int)($item['quantity'] ?? ($item['qty'] ?? 0));
                $costPrice = (float)($item['cost_price'] ?? ($item['costPrice'] ?? 0));
                $batchNo = sanitizeString($item['batch_no'] ?? ($item['batchNo'] ?? ''));
                $expiryDate = !empty($item['expiry_date']) ? sanitizeString($item['expiry_date']) : (!empty($item['expiryDate']) ? sanitizeString($item['expiryDate']) : null);

                if ($qty <= 0) continue;
                $totalCost += ($qty * $costPrice);

                if ($productId > 0 && empty($prodName)) {
                    $pCheck = $pdo->prepare("SELECT name FROM products WHERE id = ?");
                    $pCheck->execute([$productId]);
                    $pRow = $pCheck->fetch();
                    if ($pRow) $prodName = $pRow['name'];
                }

                $childStmt->execute([
                    $id,
                    $productId ?: null,
                    $prodName,
                    $qty,
                    $costPrice,
                    $batchNo ?: null,
                    $expiryDate
                ]);

                if ($productId > 0) {
                    $updateProdMetaStmt->execute([
                        $costPrice,
                        $batchNo ?: null,
                        $expiryDate,
                        $productId
                    ]);

                    postInventoryEntry($pdo, [
                        'product_id' => $productId,
                        'product_name' => $prodName,
                        'transaction_code' => 'StockIn',
                        'transaction_id' => $id,
                        'reference_no' => $finalRefNo,
                        'impact' => +$qty,
                        'unit_cost' => $costPrice,
                        'batch_no' => $batchNo ?: null,
                        'expiry_date' => $expiryDate,
                        'remarks' => "Stock-In delivery receipt #{$finalRefNo} from {$finalSupName}"
                    ]);
                }
            }

            $updTotalStmt = $pdo->prepare("UPDATE stock_ins SET total_amount = ? WHERE id = ?");
            $updTotalStmt->execute([$totalCost, $id]);
        }

        $pdo->commit();

        $fetchParent = $pdo->prepare("SELECT * FROM stock_ins WHERE id = ?");
        $fetchParent->execute([$id]);
        $savedRecord = $fetchParent->fetch();

        $fetchChildren = $pdo->prepare("SELECT * FROM stock_in_items WHERE stock_in_id = ? ORDER BY id ASC");
        $fetchChildren->execute([$id]);
        $savedRecord['items'] = $fetchChildren->fetchAll();

        jsonResponse([
            'success' => true,
            'message' => "Delivery receipt #{$refNo} updated successfully.",
            'stock_in_id' => $id,
            'stockIn' => $savedRecord,
            'data' => $savedRecord,
            'ref_no' => $refNo
        ]);
    }

    // CREATE NEW PARENT + CHILDREN TRANSACTION
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

    // 2. Prepare Child Insert and Product Metadata Update
    $childStmt = $pdo->prepare("
        INSERT INTO stock_in_items (
            stock_in_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    $updateProdMetaStmt = $pdo->prepare("
        UPDATE products 
        SET cost_price = ?,
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
            ?, NOW(), ?, ?, 'STOCK_IN', ?, ?, ?, ?, ?, NOW(), NOW()
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

        if ($productId > 0 && empty($prodName)) {
            $checkStmt = $pdo->prepare("SELECT name FROM products WHERE id = ?");
            $checkStmt->execute([$productId]);
            $pRow = $checkStmt->fetch();
            if ($pRow) {
                $prodName = $pRow['name'];
            }
        }

        // Insert child item detail
        $childStmt->execute([
            $stockInId,
            $productId ?: null,
            $prodName,
            $qty,
            $costPrice,
            $batchNo ?: null,
            $expiryDate
        ]);

        // Post positive (+) impact entry to accounting `inventory` table with transaction_code = 'StockIn'
        if ($productId > 0) {
            $updateProdMetaStmt->execute([
                $costPrice,
                $batchNo ?: null,
                $expiryDate,
                $productId
            ]);

            $ledEntry = postInventoryEntry($pdo, [
                'product_id' => $productId,
                'product_name' => $prodName,
                'transaction_code' => 'StockIn',
                'transaction_id' => $stockInId,
                'reference_no' => $refNo,
                'impact' => +$qty,
                'unit_cost' => $costPrice,
                'batch_no' => $batchNo ?: null,
                'expiry_date' => $expiryDate,
                'remarks' => "Stock-In delivery receipt #{$refNo} from {$supplierName}"
            ]);

            $movCode = $ledEntry['entry_no'] ?: generateRefNo('MOV');
            $movementStmt->execute([
                $movCode,
                $productId,
                $prodName,
                $qty,
                $ledEntry['previous_balance'],
                $ledEntry['running_balance'],
                $refNo,
                "Stock-In delivery receipt #{$refNo} from {$supplierName}"
            ]);
        }
    }

    $pdo->commit();

    // Fetch saved stock-in record with children
    $fetchParent = $pdo->prepare("SELECT * FROM stock_ins WHERE id = ?");
    $fetchParent->execute([$stockInId]);
    $savedRecord = $fetchParent->fetch();
    if ($savedRecord) {
        $savedRecord['total_cost'] = $savedRecord['total_amount'];
        $fetchChildren = $pdo->prepare("SELECT * FROM stock_in_items WHERE stock_in_id = ? ORDER BY id ASC");
        $fetchChildren->execute([$stockInId]);
        $savedRecord['items'] = $fetchChildren->fetchAll();
    }

    jsonResponse([
        'success' => true,
        'message' => "Delivery receipt #{$refNo} successfully received and stocked.",
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
