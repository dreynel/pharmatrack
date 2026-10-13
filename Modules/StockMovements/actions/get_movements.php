<?php
/**
 * Action: Fetch Stock Movements Ledger
 * Domain: Modules/StockMovements
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$search = trim($_GET['search'] ?? '');
$type = trim($_GET['type'] ?? '');
$productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;

$query = "SELECT * FROM stock_movements WHERE 1=1";
$params = [];

if (!empty($search)) {
    $query .= " AND (movement_code LIKE ? OR product_name LIKE ? OR reference_id LIKE ? OR remarks LIKE ?)";
    $term = "%{$search}%";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

if (!empty($type)) {
    $query .= " AND type = ?";
    $params[] = $type;
}

if ($productId > 0) {
    $query .= " AND product_id = ?";
    $params[] = $productId;
}

$query .= " ORDER BY id DESC LIMIT " . max(1, min($limit, 500));

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $movements = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'count' => count($movements),
        'movements' => $movements
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

