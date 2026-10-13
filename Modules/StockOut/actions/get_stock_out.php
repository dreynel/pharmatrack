<?php
/**
 * Action: Get All Stock-Out / Disposal Records (Parent Records)
 * Domain: Modules/StockOut
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query("
        SELECT 
            so.*, 
            COUNT(soi.id) as item_count,
            COALESCE(SUM(soi.quantity), 0) as total_units,
            COALESCE(SUM(soi.quantity * soi.cost_price), 0) as total_loss_cost
        FROM stock_outs so
        LEFT JOIN stock_out_items soi ON so.id = soi.stock_out_id
        GROUP BY so.id
        ORDER BY so.id DESC
    ");
    $records = $stmt->fetchAll();

    if (!empty($records)) {
        $itemStmt = $pdo->query("
            SELECT 
                soi.*,
                soi.quantity as qty,
                soi.product_name as name,
                soi.cost_price as costPrice,
                soi.batch_no as batchNo,
                soi.product_id as productId,
                p.sku,
                p.category,
                p.uom,
                ROUND(soi.quantity * soi.cost_price, 2) as line_total
            FROM stock_out_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            ORDER BY soi.id ASC
        ");
        $allItems = $itemStmt->fetchAll();
        $itemsByStockOut = [];
        foreach ($allItems as $it) {
            $itemsByStockOut[$it['stock_out_id']][] = $it;
        }

        foreach ($records as &$rec) {
            $rec['items'] = $itemsByStockOut[$rec['id']] ?? [];
            $rec['refNo'] = $rec['ref_no'];
            $rec['authorizedBy'] = $rec['authorized_by'];
            $rec['totalLossCost'] = (float)$rec['total_loss_cost'];
        }
        unset($rec);
    }

    jsonResponse([
        'success' => true,
        'count' => count($records),
        'data' => $records,
        'logs' => $records
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

