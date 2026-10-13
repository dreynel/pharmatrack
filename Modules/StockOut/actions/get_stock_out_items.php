<?php
/**
 * Action: Get Itemized Disposed Medicines (Child Records)
 * Domain: Modules/StockOut
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$stockOutId = (int)($_GET['stock_out_id'] ?? 0);

if (!$stockOutId) {
    jsonResponse(['success' => false, 'error' => 'Stock-Out record ID is required.'], 400);
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            soi.*,
            p.sku,
            p.category,
            p.uom,
            ROUND(soi.quantity * soi.cost_price, 2) as line_total
        FROM stock_out_items soi
        LEFT JOIN products p ON soi.product_id = p.id
        WHERE soi.stock_out_id = ?
        ORDER BY soi.id ASC
    ");
    $stmt->execute([$stockOutId]);
    $items = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'stock_out_id' => $stockOutId,
        'count' => count($items),
        'items' => $items
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

