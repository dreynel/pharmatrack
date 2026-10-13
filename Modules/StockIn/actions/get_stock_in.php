<?php
/**
 * Action: Get All Stock-In Receiving Batches (Parent Records)
 * Domain: Modules/StockIn
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query("
        SELECT 
            si.*, 
            si.total_amount as total_cost,
            COUNT(sii.id) as item_count,
            COALESCE(SUM(sii.quantity), 0) as total_units
        FROM stock_ins si
        LEFT JOIN stock_in_items sii ON si.id = sii.stock_in_id
        GROUP BY si.id
        ORDER BY si.id DESC
    ");
    $records = $stmt->fetchAll();

    if (!empty($records)) {
        $itemStmt = $pdo->query("
            SELECT 
                sii.*,
                sii.quantity as qty,
                sii.product_name as name,
                sii.cost_price as costPrice,
                sii.batch_no as batchNo,
                sii.expiry_date as expiryDate,
                sii.product_id as productId,
                p.sku,
                p.category,
                p.uom,
                ROUND(sii.quantity * sii.cost_price, 2) as line_total
            FROM stock_in_items sii
            LEFT JOIN products p ON sii.product_id = p.id
            ORDER BY sii.id ASC
        ");
        $allItems = $itemStmt->fetchAll();
        $itemsByStockIn = [];
        foreach ($allItems as $it) {
            $itemsByStockIn[$it['stock_in_id']][] = $it;
        }

        foreach ($records as &$rec) {
            $rec['items'] = $itemsByStockIn[$rec['id']] ?? [];
            $rec['refNo'] = $rec['ref_no'];
            $rec['supplierName'] = $rec['supplier_name'];
            $rec['totalAmount'] = (float)$rec['total_amount'];
            $rec['receivedBy'] = $rec['received_by'];
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

