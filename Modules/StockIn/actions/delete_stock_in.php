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

    $pStmt = $pdo->prepare("SELECT ref_no FROM stock_ins WHERE id = ? LIMIT 1");
    $pStmt->execute([$id]);
    $refNo = $pStmt->fetchColumn() ?: null;

    // 1. Remove StockIn entries from `inventory` ledger and recalculate product stock balances
    deleteInventoryEntries($pdo, 'StockIn', $id, $refNo);

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

