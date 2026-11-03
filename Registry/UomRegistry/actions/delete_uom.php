<?php
/**
 * Action: Delete Unit of Measure (UOM)
 * Domain: Registry/UomRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();
$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));

if (!$id) {
    jsonResponse(['success' => false, 'error' => 'UOM ID is required.'], 400);
}

try {
    // 1. Fetch UOM details
    $stmt = $pdo->prepare("SELECT name FROM uoms WHERE id = ?");
    $stmt->execute([$id]);
    $uom = $stmt->fetch();

    if (!$uom) {
        jsonResponse(['success' => false, 'error' => 'Unit of measure not found.'], 404);
    }

    // 2. Check if products use this UOM
    $pStmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE uom = ?");
    $pStmt->execute([$uom['name']]);
    $inUseCount = (int)$pStmt->fetchColumn();

    if ($inUseCount > 0) {
        jsonResponse([
            'success' => false, 
            'error' => "Cannot delete '{$uom['name']}' because {$inUseCount} product(s) are currently using it. Please reassign those products first."
        ], 409);
    }

    // 3. Delete
    $del = $pdo->prepare("DELETE FROM uoms WHERE id = ?");
    $del->execute([$id]);

    jsonResponse(['success' => true, 'message' => "Unit of measure '{$uom['name']}' deleted successfully."]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
