<?php
/**
 * Action: Fetch Single Sale & Itemized Receipt
 * Domain: Modules/POS
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$id = (int)($_GET['id'] ?? 0);

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Sale ID is required.'], 400);
}

try {
    // 1. Fetch Parent Sale Header
    $stmt = $pdo->prepare("SELECT * FROM sales WHERE id = ?");
    $stmt->execute([$id]);
    $sale = $stmt->fetch();

    if (!$sale) {
        jsonResponse(['success' => false, 'error' => 'Sale not found.'], 404);
    }

    // 2. Fetch Itemized Products
    $itemStmt = $pdo->prepare("
        SELECT 
            si.*,
            p.sku,
            p.category,
            p.uom
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
    ");
    $itemStmt->execute([$id]);
    $items = $itemStmt->fetchAll();

    jsonResponse([
        'success' => true,
        'sale' => $sale,
        'items' => $items
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

