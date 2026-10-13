<?php
/**
 * Action: Fetch Dashboard Real-time KPIs & Alert Data
 * Domain: Modules/Dashboard
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    // 1. Total active products
    $totalProducts = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();

    // 2. Low stock count (stock <= reorder_point OR stock = 0)
    $lowStockCount = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stock <= reorder_point OR stock = 0")->fetchColumn();

    // 3. Expiring soon count (within 90 days)
    $expiringCount = (int)$pdo->query("
        SELECT COUNT(*) FROM products 
        WHERE expiry_date IS NOT NULL 
          AND expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)
    ")->fetchColumn();

    // 4. Sales today
    $todaySalesStmt = $pdo->query("
        SELECT 
            COALESCE(SUM(total), 0) as total_sales,
            COUNT(id) as transactions_count
        FROM sales 
        WHERE DATE(created_at) = CURRENT_DATE()
    ");
    $todaySales = $todaySalesStmt->fetch();

    // 5. Total inventory valuation
    $valuation = (float)$pdo->query("SELECT COALESCE(SUM(stock * cost_price), 0) FROM products")->fetchColumn();

    // 6. Recent sales transactions (latest 5)
    $recentSalesStmt = $pdo->query("
        SELECT id, invoice_no, customer_name, total, payment_method, created_at
        FROM sales
        ORDER BY id DESC
        LIMIT 5
    ");
    $recentSales = $recentSalesStmt->fetchAll();

    // 7. Critical stock items (urgent top 5)
    $criticalStockStmt = $pdo->query("
        SELECT id, sku, name, stock, reorder_point
        FROM products
        WHERE stock <= reorder_point
        ORDER BY stock ASC
        LIMIT 5
    ");
    $criticalStock = $criticalStockStmt->fetchAll();

    jsonResponse([
        'success' => true,
        'kpi' => [
            'total_products' => $totalProducts,
            'low_stock_count' => $lowStockCount,
            'expiring_count' => $expiringCount,
            'today_sales' => (float)$todaySales['total_sales'],
            'today_transactions' => (int)$todaySales['transactions_count'],
            'inventory_valuation' => round($valuation, 2)
        ],
        'recent_sales' => $recentSales,
        'critical_stock' => $criticalStock
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
