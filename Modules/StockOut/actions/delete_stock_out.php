<?php
/**
 * Action: Delete / Void Stock-Out Disposal
 * Domain: Modules/StockOut
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();
$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Stock Out ID is required.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch items to reverse stock (re-increment stock)
    $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM stock_out_items WHERE stock_out_id = ?");
    $itemStmt->execute([$id]);
    $items = $itemStmt->fetchAll();

    $revertStmt = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    foreach ($items as $item) {
        if (!empty($item['product_id']) && $item['quantity'] > 0) {
            $revertStmt->execute([$item['quantity'], $item['product_id']]);
        }
    }

    // 2. Delete parent (cascade deletes stock_out_items)
    $delStmt = $pdo->prepare("DELETE FROM stock_outs WHERE id = ?");
    $delStmt->execute([$id]);

    $pdo->commit();
    jsonResponse(['success' => true, 'message' => 'Stock-Out record successfully removed and stock returned.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

