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

    $pStmt = $pdo->prepare("SELECT ref_no FROM stock_outs WHERE id = ? LIMIT 1");
    $pStmt->execute([$id]);
    $refNo = $pStmt->fetchColumn() ?: null;

    // 1. Remove StockOut entries from `inventory` ledger and recalculate product stock balances
    deleteInventoryEntries($pdo, 'StockOut', $id, $refNo);

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

