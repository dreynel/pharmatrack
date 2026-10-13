<?php
/**
 * Action: Financial & Inventory Audit Reports
 * Domain: Modules/Reports
 * Supports: 'sales', 'valuation', 'losses', 'fsn'
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$type = sanitizeString($_GET['type'] ?? 'sales');
$range = sanitizeString($_GET['range'] ?? 'month');
$startDate = sanitizeString($_GET['start_date'] ?? '');
$endDate = sanitizeString($_GET['end_date'] ?? '');

try {
    switch ($type) {
        case 'sales':
            // Date filter condition
            $whereClause = "1=1";
            $params = [];
            if (!empty($startDate) && !empty($endDate)) {
                $whereClause = "DATE(s.created_at) BETWEEN ? AND ?";
                $params = [$startDate, $endDate];
            } elseif ($range === 'today') {
                $whereClause = "DATE(s.created_at) = CURRENT_DATE()";
            } elseif ($range === 'week') {
                $whereClause = "s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            } elseif ($range === 'month') {
                $whereClause = "s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            } elseif ($range === 'year') {
                $whereClause = "s.created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)";
            }

            // Summary metrics
            $summaryStmt = $pdo->prepare("
                SELECT 
                    COUNT(id) as total_transactions,
                    COALESCE(SUM(subtotal), 0) as gross_sales,
                    COALESCE(SUM(discount), 0) as total_discounts,
                    COALESCE(SUM(total), 0) as net_sales
                FROM sales s
                WHERE {$whereClause}
            ");
            $summaryStmt->execute($params);
            $summary = $summaryStmt->fetch();

            // Daily trend breakdown
            $trendStmt = $pdo->prepare("
                SELECT 
                    DATE(s.created_at) as sale_date,
                    COUNT(s.id) as transactions,
                    SUM(s.subtotal) as gross,
                    SUM(s.discount) as discounts,
                    SUM(s.total) as net
                FROM sales s
                WHERE {$whereClause}
                GROUP BY DATE(s.created_at)
                ORDER BY sale_date DESC
            ");
            $trendStmt->execute($params);
            $breakdown = $trendStmt->fetchAll();

            // Top selling medicines in period
            $topItemsStmt = $pdo->prepare("
                SELECT 
                    si.product_name,
                    SUM(si.quantity) as total_qty,
                    SUM(si.subtotal) as total_revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE {$whereClause}
                GROUP BY si.product_id, si.product_name
                ORDER BY total_qty DESC
                LIMIT 10
            ");
            $topItemsStmt->execute($params);
            $topItems = $topItemsStmt->fetchAll();

            jsonResponse([
                'success' => true,
                'type' => 'sales',
                'summary' => $summary,
                'breakdown' => $breakdown,
                'top_items' => $topItems
            ]);
            break;

        case 'valuation':
            // Inventory Valuation (Cost vs Retail Value)
            $valStmt = $pdo->query("
                SELECT 
                    p.id, p.sku, p.name, p.category, p.stock,
                    p.cost_price, p.unit_price,
                    ROUND(p.stock * p.cost_price, 2) as inventory_cost_value,
                    ROUND(p.stock * p.unit_price, 2) as inventory_retail_value,
                    ROUND((p.stock * p.unit_price) - (p.stock * p.cost_price), 2) as potential_profit
                FROM products p
                ORDER BY inventory_cost_value DESC
            ");
            $items = $valStmt->fetchAll();

            $totalCostVal = 0.0;
            $totalRetailVal = 0.0;
            $totalUnits = 0;
            foreach ($items as $row) {
                $totalCostVal += (float)$row['inventory_cost_value'];
                $totalRetailVal += (float)$row['inventory_retail_value'];
                $totalUnits += (int)$row['stock'];
            }

            jsonResponse([
                'success' => true,
                'type' => 'valuation',
                'summary' => [
                    'total_items' => count($items),
                    'total_units' => $totalUnits,
                    'total_cost_value' => round($totalCostVal, 2),
                    'total_retail_value' => round($totalRetailVal, 2),
                    'projected_gross_margin' => round($totalRetailVal - $totalCostVal, 2)
                ],
                'items' => $items
            ]);
            break;

        case 'losses':
            // Stock-out Losses (Expired, Damaged)
            $lossStmt = $pdo->query("
                SELECT 
                    so.reason,
                    COUNT(DISTINCT so.id) as incidents,
                    SUM(soi.quantity) as total_units_lost,
                    COALESCE(SUM(soi.quantity * soi.cost_price), 0) as total_loss_cost
                FROM stock_outs so
                LEFT JOIN stock_out_items soi ON so.id = soi.stock_out_id
                GROUP BY so.reason
                ORDER BY total_loss_cost DESC
            ");
            $lossByReason = $lossStmt->fetchAll();

            // Recent loss records
            $recentLossStmt = $pdo->query("
                SELECT 
                    so.ref_no, so.date, so.reason, so.authorized_by,
                    soi.product_name, soi.quantity, soi.cost_price,
                    (soi.quantity * soi.cost_price) as loss_amount
                FROM stock_outs so
                JOIN stock_out_items soi ON so.id = soi.stock_out_id
                ORDER BY so.date DESC, so.id DESC
                LIMIT 50
            ");
            $recentLosses = $recentLossStmt->fetchAll();

            $totalLossAmount = array_sum(array_column($lossByReason, 'total_loss_cost'));

            jsonResponse([
                'success' => true,
                'type' => 'losses',
                'summary' => [
                    'total_loss_amount' => round($totalLossAmount, 2),
                    'breakdown' => $lossByReason
                ],
                'items' => $recentLosses
            ]);
            break;

        case 'fsn':
            // Fast, Slow, Non-moving Analysis (30-day window)
            $fsnStmt = $pdo->query("
                SELECT 
                    p.id, p.name, p.category, p.stock,
                    COALESCE(SUM(si.quantity), 0) as units_sold_30d
                FROM products p
                LEFT JOIN sale_items si ON p.id = si.product_id
                LEFT JOIN sales s ON si.sale_id = s.id AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY p.id
                ORDER BY units_sold_30d DESC
            ");
            $rawFsn = $fsnStmt->fetchAll();

            $fast = [];
            $slow = [];
            $non = [];

            foreach ($rawFsn as $item) {
                $sold = (int)$item['units_sold_30d'];
                if ($sold >= 30) {
                    $item['classification'] = 'Fast-Moving';
                    $fast[] = $item;
                } elseif ($sold > 0) {
                    $item['classification'] = 'Slow-Moving';
                    $slow[] = $item;
                } else {
                    $item['classification'] = 'Non-Moving';
                    $non[] = $item;
                }
            }

            jsonResponse([
                'success' => true,
                'type' => 'fsn',
                'summary' => [
                    'fast_count' => count($fast),
                    'slow_count' => count($slow),
                    'non_moving_count' => count($non)
                ],
                'items' => array_merge($fast, $slow, $non)
            ]);
            break;

        default:
            jsonResponse(['success' => false, 'error' => "Unknown report type '{$type}'."], 400);
    }
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

