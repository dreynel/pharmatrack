<?php
/**
 * Action: Seasonal & Year-Over-Year Demand Forecasting Engine
 * Domain: Modules/Forecast
 * 
 * Pharmacist-Centric Restocking Logic:
 *  - Evaluates demand from the same calendar month last year (Year-Over-Year / Seasonal Demand).
 *  - Compares historical seasonal demand directly against current shelf stock.
 *  - Flags high depletion risks when current stock is low and seasonal demand was high.
 *  - Calculates recommended Purchase Order quantities with a supplier safety buffer.
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

// Selected month (format: YYYY-MM)
$targetMonthStr = isset($_GET['month']) ? trim($_GET['month']) : date('Y-m');
if (!preg_match('/^(\d{4})-(\d{2})$/', $targetMonthStr, $mParts)) {
    $targetYear = (int)date('Y');
    $targetMonth = (int)date('m');
    $targetMonthStr = sprintf('%04d-%02d', $targetYear, $targetMonth);
} else {
    $targetYear = (int)$mParts[1];
    $targetMonth = (int)$mParts[2];
}

$lastYear = $targetYear - 1;
$monthName = date('F', mktime(0, 0, 0, $targetMonth, 10));
$periodLabel = "{$monthName} {$targetYear} vs. {$monthName} {$lastYear}";

// Optional medicine ID filter
$selectedProductIds = [];
if (!empty($_GET['product_ids'])) {
    $rawIds = is_array($_GET['product_ids']) ? $_GET['product_ids'] : explode(',', (string)$_GET['product_ids']);
    foreach ($rawIds as $rId) {
        $cId = (int)trim($rId);
        if ($cId > 0) {
            $selectedProductIds[] = $cId;
        }
    }
    $selectedProductIds = array_values(array_unique($selectedProductIds));
}

try {
    // 1. Fetch historical sales for the same month last year
    $lyStmt = $pdo->prepare("
        SELECT si.product_id, COALESCE(SUM(si.quantity), 0) AS total_sold_ly
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ?
        GROUP BY si.product_id
    ");
    $lyStmt->execute([$lastYear, $targetMonth]);
    $lastYearSales = [];
    while ($row = $lyStmt->fetch()) {
        $lastYearSales[(int)$row['product_id']] = (int)$row['total_sold_ly'];
    }

    // 2. Fetch sales for the current month so far (if target month is current year)
    $cyStmt = $pdo->prepare("
        SELECT si.product_id, COALESCE(SUM(si.quantity), 0) AS total_sold_cy
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ?
        GROUP BY si.product_id
    ");
    $cyStmt->execute([$targetYear, $targetMonth]);
    $currYearSales = [];
    while ($row = $cyStmt->fetch()) {
        $currYearSales[(int)$row['product_id']] = (int)$row['total_sold_cy'];
    }

    // 3. Fetch trailing 30-day velocity
    $v30Stmt = $pdo->query("
        SELECT si.product_id, COALESCE(SUM(si.quantity), 0) AS sold_30d
        FROM sale_items si
        INNER JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY si.product_id
    ");
    $trailing30dSales = [];
    while ($row = $v30Stmt->fetch()) {
        $trailing30dSales[(int)$row['product_id']] = (int)$row['sold_30d'];
    }

    // 4. Fetch Products (filtered if product_ids provided)
    $productFilterSql = "";
    $productFilterParams = [];
    if (!empty($selectedProductIds)) {
        $inPlaceholders = implode(',', array_fill(0, count($selectedProductIds), '?'));
        $productFilterSql = " WHERE p.id IN ({$inPlaceholders}) ";
        $productFilterParams = $selectedProductIds;
    }

    $prodStmt = $pdo->prepare("
        SELECT 
            p.id, p.sku, p.name, p.generic_name, p.category, p.uom,
            p.stock,
            p.reorder_point, p.cost_price, p.unit_price,
            p.batch_no, p.expiry_date, p.daily_avg_sales, p.forecast_demand_30d,
            p.is_bulk, p.child_product_id, p.conversion_rate
        FROM products p
        {$productFilterSql}
        ORDER BY p.name ASC
    ");
    $prodStmt->execute($productFilterParams);
    $products = $prodStmt->fetchAll();

    $forecastList = [];

    foreach ($products as $prod) {
        $prodId = (int)$prod['id'];
        $currentStock = max(0, (int)$prod['stock']);
        $reorderPoint = max(1, (int)($prod['reorder_point'] ?: 10));
        $costPrice = (float)($prod['cost_price'] ?: 0);

        $demandLastYear = $lastYearSales[$prodId] ?? 0;
        $soldThisMonth = $currYearSales[$prodId] ?? 0;
        $sold30d = $trailing30dSales[$prodId] ?? 0;

        // Daily pace based on trailing 30 days
        $dailyVelocity = round($sold30d / 30, 2);
        if ($dailyVelocity <= 0 && !empty($prod['daily_avg_sales'])) {
            $dailyVelocity = (float)$prod['daily_avg_sales'];
        }

        // Projected 30-Day Demand based on Last Year's Same Month + recent velocity
        if ($demandLastYear > 0) {
            // Seasonal anchor: last year's actual sales for this calendar month
            $projectedDemand = max($demandLastYear, $sold30d);
            $historicalBasis = "Last Year ({$monthName} {$lastYear}): {$demandLastYear} {$prod['uom']}";
        } elseif ($sold30d > 0) {
            $projectedDemand = $sold30d;
            $historicalBasis = "Recent 30-Day Velocity: {$sold30d} {$prod['uom']}";
        } elseif (!empty($prod['forecast_demand_30d'])) {
            $projectedDemand = (int)$prod['forecast_demand_30d'];
            $historicalBasis = "Baseline Catalog Demand: {$projectedDemand} {$prod['uom']}";
        } else {
            $projectedDemand = max(10, $reorderPoint * 2);
            $historicalBasis = "Standard Reorder Baseline: {$projectedDemand} {$prod['uom']}";
        }

        // Supplier safety buffer (protects against delivery delays)
        $safetyStock = max($reorderPoint, (int)ceil($projectedDemand * 0.20));

        // Target stock for the period
        $targetStock = $projectedDemand + $safetyStock;

        // Recommended Restock / Purchase Order Quantity
        $suggestedReorder = max(0, $targetStock - $currentStock);

        // Days of stock remaining at expected rate
        $effectiveDailyRate = max(0.1, round($projectedDemand / 30, 2));
        $daysRemaining = ($effectiveDailyRate > 0 && $currentStock > 0) ? (int)floor($currentStock / $effectiveDailyRate) : 0;

        // Depletion Risk Assessment based on Current Stock vs. Last Year / Projected Demand
        if ($currentStock <= 0) {
            $urgency = 'Critical';
            $status = 'Out of Stock';
            $riskLabel = 'Stockout (0 units)';
        } elseif ($currentStock < ($projectedDemand * 0.25)) {
            $urgency = 'Critical';
            $status = 'Critical Depletion Risk';
            $riskLabel = "Runs out in < 7 days ({$currentStock} left vs {$projectedDemand} needed)";
        } elseif ($currentStock < $projectedDemand) {
            $urgency = 'High';
            $status = 'High Seasonal Demand / Low Stock';
            $riskLabel = "Low stock vs {$demandLastYear} units sold last {$monthName}";
        } elseif ($currentStock <= ($projectedDemand + $safetyStock)) {
            $urgency = 'Medium';
            $status = 'Reorder Soon';
            $riskLabel = 'Approaching safety buffer';
        } else {
            $urgency = 'Low';
            $status = 'Adequate Stock';
            $riskLabel = 'Stock covers seasonal demand';
        }

        $forecastList[] = [
            'product_id' => $prodId,
            'sku' => $prod['sku'],
            'name' => $prod['name'],
            'generic_name' => $prod['generic_name'],
            'category' => $prod['category'],
            'uom' => $prod['uom'],
            'batch_no' => $prod['batch_no'],
            'expiry_date' => $prod['expiry_date'],
            'current_stock' => $currentStock,
            'stock' => $currentStock,
            'reorder_point' => $reorderPoint,
            'cost_price' => $costPrice,
            'unit_price' => (float)$prod['unit_price'],
            'demand_last_year' => $demandLastYear,
            'last_year_label' => "{$monthName} {$lastYear}",
            'sold_this_month' => $soldThisMonth,
            'sold_30d' => $sold30d,
            'avg_daily_sales' => $dailyVelocity,
            'projected_demand' => $projectedDemand,
            'forecast_qty' => $projectedDemand,
            'forecast_30' => $projectedDemand,
            'safety_stock' => $safetyStock,
            'target_stock' => $targetStock,
            'suggested_reorder_qty' => $suggestedReorder,
            'suggested_reorder' => $suggestedReorder,
            'estimated_reorder_cost' => round($suggestedReorder * $costPrice, 2),
            'days_remaining' => $daysRemaining,
            'days_of_inventory_left' => $daysRemaining,
            'status' => $status,
            'urgency' => $urgency,
            'risk_label' => $riskLabel,
            'historical_basis' => $historicalBasis,
            // Fallback fields for backwards compatibility with controller
            'total_sold_period' => $demandLastYear,
            'elapsed_days' => 30,
            'analysis_period_days' => 30,
            'period_mode' => 'seasonal_yoy',
            'period_label' => $periodLabel
        ];
    }

    // Sort by priority: Critical first, then High, Medium, Low
    $priorityMap = ['Critical' => 1, 'High' => 2, 'Medium' => 3, 'Low' => 4];
    usort($forecastList, function($a, $b) use ($priorityMap) {
        $pA = $priorityMap[$a['urgency']] ?? 5;
        $pB = $priorityMap[$b['urgency']] ?? 5;
        if ($pA !== $pB) return $pA - $pB;
        return $a['days_remaining'] - $b['days_remaining'];
    });

    // 5. Build Dual-Bar Comparison Chart Data (Current Shelf Stock vs. Last Year's Same-Month Demand)
    // Select top medicines by demand/urgency for clear visual comparison
    $chartItems = array_slice($forecastList, 0, 8);
    $chartLabels = [];
    $chartStockData = [];
    $chartLastYearDemandData = [];

    foreach ($chartItems as $cItem) {
        $chartLabels[] = $cItem['name'];
        $chartStockData[] = $cItem['current_stock'];
        $chartLastYearDemandData[] = $cItem['demand_last_year'] ?: $cItem['projected_demand'];
    }

    $trendChart = [
        'labels' => $chartLabels,
        'datasets' => [
            [
                'label' => 'Current Shelf Stock',
                'data' => $chartStockData,
                'backgroundColor' => '#00a896'
            ],
            [
                'label' => "Last Year Demand ({$monthName} {$lastYear})",
                'data' => $chartLastYearDemandData,
                'backgroundColor' => '#f59e0b'
            ]
        ]
    ];

    $totalCatalogCount = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();

    jsonResponse([
        'success' => true,
        'target_month' => $targetMonthStr,
        'target_year' => $targetYear,
        'target_month_num' => $targetMonth,
        'month_name' => $monthName,
        'last_year' => $lastYear,
        'period_label' => $periodLabel,
        'count' => count($forecastList),
        'total_catalog_count' => $totalCatalogCount,
        'filtered_product_ids' => $selectedProductIds,
        'trend_chart' => $trendChart,
        'forecast' => $forecastList
    ]);

} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
