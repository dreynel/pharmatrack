<?php
/**
 * Action: Delete Category
 * Domain: Registry/CategoryRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();
$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Category ID is required.'], 400);
}

try {
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['success' => true, 'message' => 'Category deleted successfully.']);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

