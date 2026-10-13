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

    jsonResponse([
        'success' => true,
        'count' => count($categories),
        'data' => $categories
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

