<?php
/**
 * Action: Create Purchase Order from Forecast Recommendations
 * Domain: Modules/Forecast
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$productId = (int)($input['product_id'] ?? 0);
$supplierId = !empty($input['supplier_id']) ? (int)$input['supplier_id'] : null;
$orderQty = (int)($input['order_qty'] ?? ($input['suggested_qty'] ?? 10));
$unitCost = (float)($input['unit_cost'] ?? 0);

if ($productId <= 0 || $orderQty <= 0) {
    jsonResponse(['success' => false, 'error' => 'Product and valid order quantity are required.'], 400);
}

try {
    $prodStmt = $pdo->prepare("SELECT name, cost_price FROM products WHERE id = ?");
    $prodStmt->execute([$productId]);
    $prod = $prodStmt->fetch();

    if (!$prod) {
        throw new Exception("Product not found.");
    }

    if ($unitCost <= 0) {
        $unitCost = (float)$prod['cost_price'];
    }

    $supplierName = null;
    if ($supplierId) {
        $supStmt = $pdo->prepare("SELECT name FROM suppliers WHERE id = ?");
        $supStmt->execute([$supplierId]);
        $supplierName = $supStmt->fetchColumn();
    }

    $poNumber = generateRefNo('PO');
    $totalCost = round($orderQty * $unitCost, 2);

    $stmt = $pdo->prepare("
        INSERT INTO purchase_orders (
            po_number, supplier_id, supplier_name, product_id, product_name,
            suggested_qty, order_qty, unit_cost, total_cost, status, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, 'Pending', NOW(), NOW()
        )
    ");
    $stmt->execute([
        $poNumber, $supplierId, $supplierName, $productId, $prod['name'],
        $orderQty, $orderQty, $unitCost, $totalCost
    ]);

    jsonResponse([
        'success' => true,
        'message' => "Purchase Order {$poNumber} generated successfully.",
        'po' => [
            'id' => $pdo->lastInsertId(),
            'po_number' => $poNumber,
            'product_name' => $prod['name'],
            'order_qty' => $orderQty,
            'total_cost' => $totalCost
        ]
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}

