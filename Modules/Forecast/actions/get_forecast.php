<?php
/**
 * Action: Demand Forecasting Based on Historical Sales Velocity
 * Domain: Modules/Forecast
 * Computes runout days, daily sales velocity, and reorder suggestions from actual sales
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$days = isset($_GET['days']) ? max(7, min((int)$_GET['days'], 180)) : 30;
$leadTimeDays = 7;     // Supplier delivery lead time
$bufferDays = 14;      // Safety stock buffer (2 weeks)

try {
    // 1. Fetch total sales per product over the last N days
    $salesStmt = $pdo->prepare("
        SELECT 
            si.product_id,
            SUM(si.quantity) as total_sold,
            COUNT(DISTINCT DATE(s.created_at)) as active_selling_days
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY si.product_id
    ");
    $salesStmt->execute([$days]);
    $salesData = [];
    while ($row = $salesStmt->fetch()) {
        $salesData[$row['product_id']] = [
            'total_sold' => (int)$row['total_sold'],
            'selling_days' => (int)$row['active_selling_days']
        ];
    }

    // 2. Fetch all products with suppliers
    $prodStmt = $pdo->query("
        SELECT 
            p.id, p.sku, p.name, p.generic_name, p.category, p.uom,
            p.stock, p.reorder_point, p.cost_price, p.unit_price,
            p.batch_no, p.expiry_date
        FROM products p
        ORDER BY p.name ASC
    ");
    $products = $prodStmt->fetchAll();

    $forecastList = [];

    foreach ($products as $prod) {
        $prodId = $prod['id'];
        $sold = $salesData[$prodId]['total_sold'] ?? 0;
        $stock = (int)$prod['stock'];
        $reorderPoint = (int)($prod['reorder_point'] ?: 10);

        // Daily sales velocity
        $avgDailySales = round($sold / $days, 2);

        // Calculate days remaining
        if ($avgDailySales > 0) {
            $daysRemaining = round($stock / $avgDailySales);
        } else {
            $daysRemaining = ($stock > 0) ? 999 : 0;
        }

        // Calculate suggested replenishment
        // Target inventory level = ADS * (Lead Time + Buffer Days)
        $targetStock = (int)ceil($avgDailySales * ($leadTimeDays + $bufferDays));
        if ($targetStock < $reorderPoint) {
            $targetStock = $reorderPoint * 2;
        }

        $suggestedReorder = max(0, $targetStock - $stock);

        // Classification
        if ($stock <= 0) {
            $status = 'Out of Stock';
            $urgency = 'Critical';
        } elseif ($daysRemaining <= $leadTimeDays || $stock <= $reorderPoint) {
            $status = 'Reorder Needed';
            $urgency = 'High';
        } elseif ($daysRemaining <= 21) {
            $status = 'Approaching Reorder';
            $urgency = 'Medium';
        } else {
            $status = 'Sufficient Stock';
            $urgency = 'Low';
        }

        $forecastList[] = [
            'product_id' => $prodId,
            'sku' => $prod['sku'],
            'name' => $prod['name'],
            'generic_name' => $prod['generic_name'],
            'category' => $prod['category'],
            'uom' => $prod['uom'],
            'stock' => $stock,
            'reorder_point' => $reorderPoint,
            'cost_price' => (float)$prod['cost_price'],
            'total_sold_period' => $sold,
            'analysis_period_days' => $days,
            'avg_daily_sales' => $avgDailySales,
            'days_remaining' => $daysRemaining,
            'suggested_reorder_qty' => $suggestedReorder,
            'estimated_reorder_cost' => round($suggestedReorder * (float)$prod['cost_price'], 2),
            'status' => $status,
            'urgency' => $urgency
        ];
    }

    // Sort by urgency: Critical first, High, Medium, Low
    $priorityMap = ['Critical' => 1, 'High' => 2, 'Medium' => 3, 'Low' => 4];
    usort($forecastList, function($a, $b) use ($priorityMap) {
        $pA = $priorityMap[$a['urgency']] ?? 5;
        $pB = $priorityMap[$b['urgency']] ?? 5;
        if ($pA !== $pB) return $pA - $pB;
        return $a['days_remaining'] - $b['days_remaining'];
    });

    jsonResponse([
        'success' => true,
        'period_days' => $days,
        'count' => count($forecastList),
        'forecast' => $forecastList
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

