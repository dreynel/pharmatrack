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

$productId = (int)($input['product_id'] ?? $input['productId'] ?? 0);
$supplierId = !empty($input['supplier_id'] ?? $input['supplierId'] ?? null)
    ? (int)($input['supplier_id'] ?? $input['supplierId'])
    : null;
$supplierNameInput = sanitizeString($input['supplier_name'] ?? $input['supplierName'] ?? '');
$suggestedQty = (int)($input['suggested_qty'] ?? $input['suggestedQty'] ?? 0);
$orderQty = (int)($input['order_qty'] ?? $input['orderQty'] ?? ($suggestedQty > 0 ? $suggestedQty : 10));
$unitCost = (float)($input['unit_cost'] ?? $input['unitCost'] ?? 0);

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

    $supplierName = $supplierNameInput ?: null;
    if ($supplierId) {
        $supStmt = $pdo->prepare("SELECT name FROM suppliers WHERE id = ?");
        $supStmt->execute([$supplierId]);
        $foundName = $supStmt->fetchColumn();
        if ($foundName) {
            $supplierName = $foundName;
        }
    } elseif (!empty($supplierName)) {
        $supStmt = $pdo->prepare("SELECT id FROM suppliers WHERE name = ? LIMIT 1");
        $supStmt->execute([$supplierName]);
        $foundId = $supStmt->fetchColumn();
        if ($foundId) {
            $supplierId = (int)$foundId;
        }
    }

    $poNumber = generateRefNo('PO');
    $totalCost = round($orderQty * $unitCost, 2);
    $finalSuggestedQty = $suggestedQty > 0 ? $suggestedQty : $orderQty;

    $stmt = $pdo->prepare("
        INSERT INTO purchase_orders (
            po_number, supplier_id, supplier_name, product_id, product_name,
            suggested_qty, order_qty, unit_cost, total_cost, status, expected_delivery, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, 'Pending', DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY), NOW(), NOW()
        )
    ");
    $stmt->execute([
        $poNumber, $supplierId, $supplierName, $productId, $prod['name'],
        $finalSuggestedQty, $orderQty, $unitCost, $totalCost
    ]);

    if ($supplierId) {
        $pdo->prepare("UPDATE suppliers SET active_pos = active_pos + 1 WHERE id = ?")->execute([$supplierId]);
    }

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

