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
    $stmt = $pdo->prepare("SELECT name FROM categories WHERE id = ?");
    $stmt->execute([$id]);
    $cat = $stmt->fetch();

    if (!$cat) {
        jsonResponse(['success' => false, 'error' => 'Category not found.'], 404);
    }

    $pStmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE category = ?");
    $pStmt->execute([$cat['name']]);
    $inUseCount = (int)$pStmt->fetchColumn();

    if ($inUseCount > 0) {
        jsonResponse([
            'success' => false, 
            'error' => "Cannot delete '{$cat['name']}' because {$inUseCount} product(s) are currently categorized under it. Please reassign those products first."
        ], 409);
    }

    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['success' => true, 'message' => "Category '{$cat['name']}' deleted successfully."]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

