<?php
/**
 * Action: Configure / Save Item Conversion Rule
 * Domain: Modules/Conversion
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$sourceId = (int)($input['source_product_id'] ?? ($input['sourceProductId'] ?? 0));
$targetId = (int)($input['target_product_id'] ?? ($input['targetProductId'] ?? 0));
$rawRate = $input['conversion_rate'] ?? ($input['conversionRate'] ?? ($input['rate'] ?? ($input['ratio'] ?? ($input['multiplier'] ?? 25))));
$rate = parseRatioValue($rawRate, 25);

if ($sourceId <= 0 || $targetId <= 0) {
    jsonResponse(['success' => false, 'error' => 'Both bulk source product and retail target product are required.'], 422);
}

if ($sourceId === $targetId) {
    jsonResponse(['success' => false, 'error' => 'Source bulk product and target retail product cannot be the same.'], 422);
}

if ($rate < 1) {
    jsonResponse(['success' => false, 'error' => 'Conversion packaging ratio must be at least 1.'], 422);
}

try {
    // Verify both products exist
    $chkStmt = $pdo->prepare("SELECT id, name, uom FROM products WHERE id IN (?, ?)");
    $chkStmt->execute([$sourceId, $targetId]);
    $rows = $chkStmt->fetchAll(PDO::FETCH_ASSOC);

    $found = [];
    foreach ($rows as $r) {
        $found[(int)$r['id']] = $r;
    }

    if (!isset($found[$sourceId]) || !isset($found[$targetId])) {
        jsonResponse(['success' => false, 'error' => 'One or both selected products could not be found.'], 404);
    }

    $sourceProd = $found[$sourceId];
    $targetProd = $found[$targetId];

    // Update Source Bulk Product
    $stmt = $pdo->prepare("
        UPDATE products 
        SET is_bulk = 1, 
            child_product_id = ?, 
            conversion_rate = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$targetId, $rate, $sourceId]);

    // Update Target Retail Product parent link
    $pdo->prepare("
        UPDATE products 
        SET parent_product_id = ?,
            updated_at = NOW()
        WHERE id = ?
    ")->execute([$sourceId, $targetId]);

    jsonResponse([
        'success' => true,
        'message' => "Conversion rule successfully configured (1 {$sourceProd['uom']} of {$sourceProd['name']} = {$rate} {$targetProd['uom']} of {$targetProd['name']}).",
        'rate' => $rate,
        'ratio' => "1:{$rate}",
        'source_product_id' => $sourceId,
        'target_product_id' => $targetId
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

