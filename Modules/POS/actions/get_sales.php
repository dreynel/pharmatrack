<?php
/**
 * Action: Fetch Recent Sales Transactions
 * Domain: Modules/POS
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$search = trim($_GET['search'] ?? '');
$date = trim($_GET['date'] ?? '');

$query = "
    SELECT 
        s.*,
        COUNT(si.id) as items_count,
        COALESCE(SUM(si.quantity), 0) as total_units
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE 1=1
";

$params = [];

if (!empty($search)) {
    $query .= " AND (s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.cashier LIKE ?)";
    $term = "%{$search}%";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

if (!empty($date)) {
    $query .= " AND DATE(s.created_at) = ?";
    $params[] = $date;
}

$query .= " GROUP BY s.id ORDER BY s.id DESC LIMIT " . max(1, min($limit, 200));

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $sales = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'count' => count($sales),
        'sales' => $sales
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

