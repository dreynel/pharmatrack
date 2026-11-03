<?php
/**
 * Action: Get All Categories
 * Domain: Registry/CategoryRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
    $categories = $stmt->fetchAll();

    // Attach product count for each category
    $countStmt = $pdo->query("SELECT category, COUNT(*) as count FROM products WHERE category IS NOT NULL GROUP BY category");
    $counts = [];
    while ($r = $countStmt->fetch()) {
        $counts[strtolower(trim($r['category']))] = (int)$r['count'];
    }

    foreach ($categories as &$c) {
        $key = strtolower(trim($c['name']));
        $c['product_count'] = $counts[$key] ?? 0;
    }
    unset($c);

    jsonResponse([
        'success' => true,
        'count' => count($categories),
        'data' => $categories
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

