<?php
/**
 * Action: Delete / Void Stock-In Receiving Delivery
 * Domain: Modules/StockIn
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();
$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Stock In ID is required.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch items to reverse stock
    $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM stock_in_items WHERE stock_in_id = ?");
    $itemStmt->execute([$id]);
    $items = $itemStmt->fetchAll();

    $revertStmt = $pdo->prepare("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?");
    foreach ($items as $item) {
        if (!empty($item['product_id']) && $item['quantity'] > 0) {
            $revertStmt->execute([$item['quantity'], $item['product_id']]);
        }
    }

    // 2. Delete parent (cascade deletes children)
    $delStmt = $pdo->prepare("DELETE FROM stock_ins WHERE id = ?");
    $delStmt->execute([$id]);

    $pdo->commit();
    jsonResponse(['success' => true, 'message' => 'Stock-In delivery record successfully removed and inventory reverted.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

