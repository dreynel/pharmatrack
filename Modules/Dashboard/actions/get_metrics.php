<?php
/**
 * Action: Fetch Extended Dashboard Metrics & Analytics Trends
 * Domain: Modules/Dashboard
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    // 7-day revenue trend
    $revenueTrendStmt = $pdo->query("
        SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total,
            COUNT(id) as count
        FROM sales
        WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $revenueTrend = $revenueTrendStmt->fetchAll();

    // Inventory category distribution
    $categoryDistStmt = $pdo->query("
        SELECT 
            COALESCE(category, 'Uncategorized') as category,
            COUNT(id) as product_count,
            COALESCE(SUM(stock), 0) as total_units
        FROM products
        GROUP BY category
        ORDER BY total_units DESC
    ");
    $categoryDist = $categoryDistStmt->fetchAll();

    jsonResponse([
        'success' => true,
        'revenue_trend' => $revenueTrend,
        'category_distribution' => $categoryDist
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

