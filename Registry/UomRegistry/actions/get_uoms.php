<?php
/**
 * Action: Get All Units of Measure (UoMs)
 * Domain: Registry/UomRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query("SELECT * FROM uoms ORDER BY name ASC");
    $uoms = $stmt->fetchAll();

    // Attach product count for each UOM
    $countStmt = $pdo->query("SELECT uom, COUNT(*) as count FROM products WHERE uom IS NOT NULL GROUP BY uom");
    $counts = [];
    while ($r = $countStmt->fetch()) {
        $counts[strtolower(trim($r['uom']))] = (int)$r['count'];
    }

    foreach ($uoms as &$u) {
        $key = strtolower(trim($u['name']));
        $u['product_count'] = $counts[$key] ?? 0;
    }
    unset($u);

    jsonResponse([
        'success' => true,
        'count' => count($uoms),
        'data' => $uoms
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
