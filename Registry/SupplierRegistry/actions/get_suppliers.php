<?php
/**
 * Action: Get All Suppliers
 * Domain: Registry/SupplierRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY name ASC");
    $suppliers = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'count' => count($suppliers),
        'data' => $suppliers
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

