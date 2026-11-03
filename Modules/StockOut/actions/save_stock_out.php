<?php
/**
 * Action: Create or Update Stock-Out Disposal / Adjustment Entry (Parent-Child Transaction)
 * Domain: Modules/StockOut
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

if (!function_exists('getProductBatches')) {
    function getProductBatches(PDO $pdo, int $productId = 0): array {
        $sql = "
            SELECT 
                inv.product_id,
                COALESCE(p.name, inv.product_name) AS product_name,
                COALESCE(inv.batch_no, 'UNASSIGNED') AS batch_no,
                inv.expiry_date,
                SUM(inv.quantity) AS available_stock,
                MAX(inv.unit_cost) AS unit_cost
            FROM inventory inv
            LEFT JOIN products p ON inv.product_id = p.id
            WHERE 1=1
        ";
        $params = [];
        if ($productId > 0) {
            $sql .= " AND inv.product_id = ?";
            $params[] = $productId;
        }
        $sql .= "
            GROUP BY inv.product_id, product_name, COALESCE(inv.batch_no, 'UNASSIGNED'), inv.expiry_date
            HAVING available_stock > 0
            ORDER BY 
                CASE WHEN inv.expiry_date IS NULL THEN 1 ELSE 0 END,
                inv.expiry_date ASC, 
                batch_no ASC
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function($r) {
            return [
                'productId' => (int)$r['product_id'],
                'productName' => $r['product_name'],
                'batchNo' => $r['batch_no'] === 'UNASSIGNED' ? '' : $r['batch_no'],
                'batch_no' => $r['batch_no'] === 'UNASSIGNED' ? '' : $r['batch_no'],
                'displayBatch' => $r['batch_no'] === 'UNASSIGNED' ? 'Default / No Batch' : $r['batch_no'],
                'expiryDate' => $r['expiry_date'] ?: '',
                'expiry_date' => $r['expiry_date'] ?: '',
                'availableStock' => (int)$r['available_stock'],
                'stock' => (int)$r['available_stock'],
                'unitCost' => (float)$r['unit_cost']
            ];
        }, $rows);
    }
}

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));
$isUpdate = ($id > 0) || ($_SERVER['REQUEST_METHOD'] === 'PUT');

$refNo = sanitizeString($input['ref_no'] ?? ($input['refNo'] ?? generateRefNo('SO')));
$reason = sanitizeString($input['reason'] ?? 'Expired Medicine Disposal');
$date = !empty($input['date']) ? sanitizeString($input['date']) : date('Y-m-d');
$authorizedBy = sanitizeString($input['authorized_by'] ?? ($input['authorizedBy'] ?? ($_SESSION['user']['name'] ?? 'Pharmacist')));
$notes = sanitizeString($input['notes'] ?? ($input['remarks'] ?? ''));
$items = isset($input['items']) && is_array($input['items']) ? $input['items'] : null;

if (!$isUpdate && empty($items)) {
    jsonResponse(['success' => false, 'error' => 'At least one medicine child item is required for Stock-Out.'], 400);
}

try {
    $pdo->beginTransaction();

    if ($isUpdate && $id > 0) {
        $existStmt = $pdo->prepare("SELECT * FROM stock_outs WHERE id = ? LIMIT 1");
        $existStmt->execute([$id]);
        $existingParent = $existStmt->fetch();
        if (!$existingParent) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'error' => "Stock-Out parent voucher #{$id} not found."], 404);
        }

        // Update parent voucher header
        $updParent = $pdo->prepare("
            UPDATE stock_outs
            SET ref_no = ?,
                reason = ?,
                date = ?,
                authorized_by = ?,
                notes = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $updParent->execute([
            $refNo ?: $existingParent['ref_no'],
            $reason ?: $existingParent['reason'],
            $date ?: $existingParent['date'],
            $authorizedBy ?: $existingParent['authorized_by'],
            $notes,
            $id
        ]);

        // If updated children items were also passed, sync children and accounting `inventory` ledger
        if (is_array($items) && count($items) > 0) {
            // 1. Remove old StockOut ledger entries for this voucher & recalculate product balances
            deleteInventoryEntries($pdo, 'StockOut', $id, $existingParent['ref_no']);

            // 2. Delete old children rows
            $delChildStmt = $pdo->prepare("DELETE FROM stock_out_items WHERE stock_out_id = ?");
            $delChildStmt->execute([$id]);

            // 3. Insert new children rows and post negative (-) impacts to `inventory`
            $childStmt = $pdo->prepare("
                INSERT INTO stock_out_items (
                    stock_out_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $finalRefNo = $refNo ?: $existingParent['ref_no'];
            $finalReason = $reason ?: $existingParent['reason'];

            foreach ($items as $item) {
                $productId = (int)($item['product_id'] ?? ($item['productId'] ?? 0));
                $prodName = sanitizeString($item['product_name'] ?? ($item['name'] ?? ''));
                $qty = (int)($item['quantity'] ?? ($item['qty'] ?? 0));
                $costPrice = (float)($item['cost_price'] ?? ($item['costPrice'] ?? 0));
                $batchNo = sanitizeString($item['batch_no'] ?? ($item['batchNo'] ?? ''));
                $expiryDate = sanitizeString($item['expiry_date'] ?? ($item['expiryDate'] ?? ''));

                if ($qty <= 0) continue;

                if ($productId > 0) {
                    $checkStmt = $pdo->prepare("SELECT stock, cost_price, name FROM products WHERE id = ? FOR UPDATE");
                    $checkStmt->execute([$productId]);
                    $pRow = $checkStmt->fetch();
                    if ($pRow) {
                        if ($costPrice <= 0) $costPrice = (float)$pRow['cost_price'];
                        if (empty($prodName)) $prodName = $pRow['name'];
                    }

                    if ($batchNo === '' || $expiryDate === '') {
                        $activeBatches = getProductBatches($pdo, $productId);
                        if (!empty($activeBatches)) {
                            if ($batchNo === '') $batchNo = $activeBatches[0]['batchNo'];
                            if ($expiryDate === '') $expiryDate = $activeBatches[0]['expiryDate'];
                        }
                    }
                }

                $childStmt->execute([
                    $id,
                    $productId ?: null,
                    $prodName,
                    $qty,
                    $costPrice,
                    $batchNo ?: null,
                    $expiryDate ?: null
                ]);

                if ($productId > 0) {
                    postInventoryEntry($pdo, [
                        'product_id' => $productId,
                        'product_name' => $prodName,
                        'transaction_code' => 'StockOut',
                        'transaction_id' => $id,
                        'reference_no' => $finalRefNo,
                        'impact' => -$qty,
                        'unit_cost' => $costPrice,
                        'batch_no' => $batchNo ?: null,
                        'expiry_date' => $expiryDate ?: null,
                        'remarks' => "Stock-Out ({$finalReason}) - Voucher #{$finalRefNo}" . ($batchNo ? " (Batch: {$batchNo})" : "")
                    ]);
                }
            }
        }

        $pdo->commit();

        $fetchParent = $pdo->prepare("SELECT * FROM stock_outs WHERE id = ?");
        $fetchParent->execute([$id]);
        $savedRecord = $fetchParent->fetch();

        $fetchChildren = $pdo->prepare("SELECT * FROM stock_out_items WHERE stock_out_id = ? ORDER BY id ASC");
        $fetchChildren->execute([$id]);
        $savedRecord['items'] = $fetchChildren->fetchAll();

        jsonResponse([
            'success' => true,
            'message' => "Disposal voucher #{$refNo} updated successfully.",
            'stock_out_id' => $id,
            'stockOut' => $savedRecord,
            'data' => $savedRecord,
            'ref_no' => $refNo
        ]);
    }

    // CREATE NEW PARENT + CHILDREN TRANSACTION
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

    $childStmt = $pdo->prepare("
        INSERT INTO stock_out_items (
            stock_out_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    $movementStmt = $pdo->prepare("
        INSERT INTO stock_movements (
            movement_code, timestamp, product_id, product_name, type,
            qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
        ) VALUES (
            ?, NOW(), ?, ?, 'STOCK_OUT', ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    foreach ($items as $item) {
        $productId = (int)($item['product_id'] ?? ($item['productId'] ?? 0));
        $prodName = sanitizeString($item['product_name'] ?? ($item['name'] ?? ''));
        $qty = (int)($item['quantity'] ?? ($item['qty'] ?? 0));
        $costPrice = (float)($item['cost_price'] ?? ($item['costPrice'] ?? 0));
        $batchNo = sanitizeString($item['batch_no'] ?? ($item['batchNo'] ?? ''));
        $expiryDate = sanitizeString($item['expiry_date'] ?? ($item['expiryDate'] ?? ''));

        if ($qty <= 0) continue;

        if ($productId > 0) {
            $checkStmt = $pdo->prepare("SELECT stock, cost_price, name FROM products WHERE id = ? FOR UPDATE");
            $checkStmt->execute([$productId]);
            $pRow = $checkStmt->fetch();
            if ($pRow) {
                if ($costPrice <= 0) $costPrice = (float)$pRow['cost_price'];
                if (empty($prodName)) $prodName = $pRow['name'];
            }

            if ($batchNo === '' || $expiryDate === '') {
                $activeBatches = getProductBatches($pdo, $productId);
                if (!empty($activeBatches)) {
                    if ($batchNo === '') $batchNo = $activeBatches[0]['batchNo'];
                    if ($expiryDate === '') $expiryDate = $activeBatches[0]['expiryDate'];
                }
            }
        }

        $childStmt->execute([
            $stockOutId,
            $productId ?: null,
            $prodName,
            $qty,
            $costPrice,
            $batchNo ?: null,
            $expiryDate ?: null
        ]);

        // Post negative (-) impact entry to accounting `inventory` table with transaction_code = 'StockOut'
        if ($productId > 0) {
            $ledEntry = postInventoryEntry($pdo, [
                'product_id' => $productId,
                'product_name' => $prodName,
                'transaction_code' => 'StockOut',
                'transaction_id' => $stockOutId,
                'reference_no' => $refNo,
                'impact' => -$qty,
                'unit_cost' => $costPrice,
                'batch_no' => $batchNo ?: null,
                'expiry_date' => $expiryDate ?: null,
                'remarks' => "Stock-Out ({$reason}) - Voucher #{$refNo}" . ($batchNo ? " (Batch: {$batchNo})" : "")
            ]);

            $movCode = $ledEntry['entry_no'] ?: generateRefNo('MOV');
            $movementStmt->execute([
                $movCode,
                $productId,
                $prodName,
                -$qty,
                $ledEntry['previous_balance'],
                $ledEntry['running_balance'],
                $refNo,
                "Stock Out ({$reason}) - Voucher #{$refNo}"
            ]);
        }
    }

    $pdo->commit();

    $fetchParent = $pdo->prepare("SELECT * FROM stock_outs WHERE id = ?");
    $fetchParent->execute([$stockOutId]);
    $savedRecord = $fetchParent->fetch();
    if ($savedRecord) {
        $fetchChildren = $pdo->prepare("SELECT * FROM stock_out_items WHERE stock_out_id = ? ORDER BY id ASC");
        $fetchChildren->execute([$stockOutId]);
        $savedRecord['items'] = $fetchChildren->fetchAll();
    }

    jsonResponse([
        'success' => true,
        'message' => "Stock-out voucher #{$refNo} recorded and inventory deducted.",
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
