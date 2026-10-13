<?php
/**
 * Action: Execute Bulk to Piece Conversion (Breakdown)
 * Domain: Modules/Conversion
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$sourceId = (int)($input['source_product_id'] ?? 0);
$sourceQty = (int)($input['source_qty'] ?? 1);
$targetId = (int)($input['target_product_id'] ?? 0);
$multiplier = (int)($input['multiplier'] ?? 0);
$notes = sanitizeString($input['notes'] ?? '');
$operator = sanitizeString($input['operator'] ?? ($_SESSION['user']['name'] ?? 'Pharmacist'));

if ($sourceId <= 0 || $targetId <= 0 || $sourceQty <= 0) {
    jsonResponse(['success' => false, 'error' => 'Please specify valid source product, target product, and quantity.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch Source Product
    $sourceStmt = $pdo->prepare("SELECT * FROM products WHERE id = ? FOR UPDATE");
    $sourceStmt->execute([$sourceId]);
    $sourceProd = $sourceStmt->fetch();

    if (!$sourceProd) {
        throw new Exception("Source product not found.");
    }

    if ($sourceProd['stock'] < $sourceQty) {
        throw new Exception("Insufficient stock for source item '{$sourceProd['name']}'. In stock: {$sourceProd['stock']}, requested: {$sourceQty}.");
    }

    // 2. Fetch Target Product
    $targetStmt = $pdo->prepare("SELECT * FROM products WHERE id = ? FOR UPDATE");
    $targetStmt->execute([$targetId]);
    $targetProd = $targetStmt->fetch();

    if (!$targetProd) {
        throw new Exception("Target product not found.");
    }

    // If multiplier is not explicitly sent, use product's conversion_rate or calculate
    if ($multiplier <= 0) {
        $multiplier = (int)($sourceProd['conversion_rate'] ?? 100);
        if ($multiplier <= 0) $multiplier = 100;
    }

    $targetQty = $sourceQty * $multiplier;
    $convCode = generateRefNo('CNV');
    $batchNo = $sourceProd['batch_no'] ?? null;
    $expiryDate = $sourceProd['expiry_date'] ?? null;

    // 3. Deduct Source Product Stock
    $updateSource = $pdo->prepare("UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?");
    $updateSource->execute([$sourceQty, $sourceId]);

    // 4. Increment Target Product Stock (and copy batch/expiry if empty)
    $updateTarget = $pdo->prepare("
        UPDATE products 
        SET stock = stock + ?,
            batch_no = COALESCE(batch_no, ?),
            expiry_date = COALESCE(expiry_date, ?),
            updated_at = NOW()
        WHERE id = ?
    ");
    $updateTarget->execute([$targetQty, $batchNo, $expiryDate, $targetId]);

    // 5. Insert Conversion Record
    $convStmt = $pdo->prepare("
        INSERT INTO conversions (
            conv_code, date, source_product_id, source_product_name, source_uom, source_qty,
            target_product_id, target_product_name, target_uom, target_qty, multiplier,
            batch_no, expiry_date, operator, notes, created_at, updated_at
        ) VALUES (
            ?, NOW(), ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, NOW(), NOW()
        )
    ");
    $convStmt->execute([
        $convCode,
        $sourceId, $sourceProd['name'], $sourceProd['uom'] ?? 'Box', $sourceQty,
        $targetId, $targetProd['name'], $targetProd['uom'] ?? 'Piece', $targetQty, $multiplier,
        $batchNo, $expiryDate, $operator, $notes
    ]);
    $convId = $pdo->lastInsertId();

    // 6. Record Stock Movement for both products
    $movementStmt = $pdo->prepare("
        INSERT INTO stock_movements (
            movement_code, timestamp, product_id, product_name, type,
            qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    // Movement for Source (Out)
    $movCodeOut = generateRefNo('MOV');
    $movementStmt->execute([
        $movCodeOut, $sourceId, $sourceProd['name'], 'CONVERSION_OUT',
        -$sourceQty, $sourceProd['stock'], $sourceProd['stock'] - $sourceQty,
        $convCode, "Broken down into {$targetQty} {$targetProd['uom']}"
    ]);

    // Movement for Target (In)
    $movCodeIn = generateRefNo('MOV');
    $movementStmt->execute([
        $movCodeIn, $targetId, $targetProd['name'], 'CONVERSION_IN',
        $targetQty, $targetProd['stock'], $targetProd['stock'] + $targetQty,
        $convCode, "Received from breakdown of {$sourceQty} {$sourceProd['uom']}"
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => "Successfully broke down {$sourceQty} {$sourceProd['uom']} into {$targetQty} {$targetProd['uom']}.",
        'conversion' => [
            'id' => $convId,
            'conv_code' => $convCode,
            'source_product_name' => $sourceProd['name'],
            'source_qty' => $sourceQty,
            'target_product_name' => $targetProd['name'],
            'target_qty' => $targetQty,
            'multiplier' => $multiplier
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}

