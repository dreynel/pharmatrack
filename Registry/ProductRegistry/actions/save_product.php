<?php
/**
 * Action: Create / Save Product
 * Domain: Registry/ProductRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$name = trim($input['name'] ?? '');
if (empty($name)) {
    jsonResponse(['success' => false, 'error' => 'Product name is required.'], 422);
}

$sku = trim($input['sku'] ?? '');
if (empty($sku)) {
    $sku = 'SKU-' . strtoupper(substr(uniqid(), -6));
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO products (
            sku, barcode, name, generic_name, category, uom,
            unit_price, cost_price, stock, reorder_point,
            batch_no, expiry_date, is_bulk, conversion_rate, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    $genericName = $input['generic_name'] ?? ($input['genericName'] ?? null);
    $category = $input['category'] ?? 'General';
    $uom = $input['uom'] ?? 'Box';
    $unitPrice = (float)($input['unit_price'] ?? ($input['unitPrice'] ?? 0));
    $costPrice = (float)($input['cost_price'] ?? ($input['costPrice'] ?? 0));
    $stock = (int)($input['stock'] ?? 0);
    $reorderPoint = (int)($input['reorder_point'] ?? ($input['reorderPoint'] ?? 10));
    $batchNo = $input['batch_no'] ?? ($input['batchNo'] ?? null);
    $expiryDate = !empty($input['expiry_date']) ? $input['expiry_date'] : (!empty($input['expiryDate']) ? $input['expiryDate'] : null);
    $isBulk = !empty($input['is_bulk']) || !empty($input['isBulk']) ? 1 : 0;
    $conversionRate = (int)($input['conversion_rate'] ?? ($input['conversionRate'] ?? 100));

    $stmt->execute([
        $sku,
        $input['barcode'] ?? null,
        $name,
        $genericName,
        $category,
        $uom,
        $unitPrice,
        $costPrice,
        $stock,
        $reorderPoint,
        $batchNo,
        $expiryDate,
        $isBulk,
        $conversionRate
    ]);

    $id = (int)$pdo->lastInsertId();

    $fetchStmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $fetchStmt->execute([$id]);
    $product = $fetchStmt->fetch();

    jsonResponse([
        'success' => true,
        'id' => $id,
        'product' => $product,
        'data' => $product,
        'message' => 'Product successfully added to registry.'
    ], 201);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

