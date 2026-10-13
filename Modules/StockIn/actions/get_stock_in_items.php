<?php
/**
 * Action: Get Itemized Medicines for a Stock-In Delivery (Child Records)
 * Domain: Modules/StockIn
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$stockInId = (int)($_GET['stock_in_id'] ?? 0);

if (!$stockInId) {
    jsonResponse(['success' => false, 'error' => 'Stock-In batch ID is required.'], 400);
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            sii.*,
            p.sku,
            p.category,
            p.uom,
            ROUND(sii.quantity * sii.cost_price, 2) as line_total
        FROM stock_in_items sii
        LEFT JOIN products p ON sii.product_id = p.id
        WHERE sii.stock_in_id = ?
        ORDER BY sii.id ASC
    ");
    $stmt->execute([$stockInId]);
    $items = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'stock_in_id' => $stockInId,
        'count' => count($items),
        'items' => $items
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

