<?php
/**
 * Action: Fetch Conversion Records
 * Domain: Modules/Conversion
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$search = trim($_GET['search'] ?? '');

$query = "SELECT * FROM conversions WHERE 1=1";
$params = [];

if (!empty($search)) {
    $query .= " AND (conv_code LIKE ? OR source_product_name LIKE ? OR target_product_name LIKE ? OR batch_no LIKE ?)";
    $term = "%{$search}%";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

$query .= " ORDER BY id DESC LIMIT " . max(1, min($limit, 200));

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $conversions = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'count' => count($conversions),
        'conversions' => $conversions
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

