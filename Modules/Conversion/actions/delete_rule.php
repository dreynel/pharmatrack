<?php
/**
 * Action: Delete / Unlink Conversion Rule
 * Domain: Modules/Conversion
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? ($_GET['id'] ?? ($input['source_product_id'] ?? 0)));

if ($id <= 0) {
    jsonResponse(['success' => false, 'error' => 'Product ID is required to unlink rule.'], 422);
}

try {
    // Fetch child to clean up parent_product_id link
    $childStmt = $pdo->prepare("SELECT child_product_id FROM products WHERE id = ?");
    $childStmt->execute([$id]);
    $childId = (int)$childStmt->fetchColumn();

    $stmt = $pdo->prepare("
        UPDATE products 
        SET is_bulk = 0, 
            child_product_id = NULL,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$id]);

    if ($childId > 0) {
        $pdo->prepare("UPDATE products SET parent_product_id = NULL WHERE id = ? AND parent_product_id = ?")->execute([$childId, $id]);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Conversion rule unlinked successfully.'
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

