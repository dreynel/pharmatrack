<?php
/**
 * Action: Create or Update Unit of Measure (UOM)
 * Domain: Registry/UomRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? 0);
$name = sanitizeString($input['name'] ?? '');
$abbreviation = sanitizeString($input['abbreviation'] ?? ($input['abbr'] ?? ''));
$description = sanitizeString($input['description'] ?? '');

if (empty($name)) {
    jsonResponse(['success' => false, 'error' => 'Unit of Measure name is required.'], 400);
}

try {
    if ($id > 0) {
        // Check duplicate name on other rows
        $check = $pdo->prepare("SELECT id FROM uoms WHERE name = ? AND id != ?");
        $check->execute([$name, $id]);
        if ($check->fetch()) {
            jsonResponse(['success' => false, 'error' => "Unit of measure '{$name}' already exists."], 409);
        }

        $stmt = $pdo->prepare("UPDATE uoms SET name = ?, abbreviation = ?, description = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $abbreviation, $description, $id]);
        $uomId = $id;
        $msg = 'Unit of measure updated successfully.';
    } else {
        // Check duplicate name
        $check = $pdo->prepare("SELECT id FROM uoms WHERE name = ?");
        $check->execute([$name]);
        if ($check->fetch()) {
            jsonResponse(['success' => false, 'error' => "Unit of measure '{$name}' already exists."], 409);
        }

        $stmt = $pdo->prepare("INSERT INTO uoms (name, abbreviation, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $stmt->execute([$name, $abbreviation, $description]);
        $uomId = (int)$pdo->lastInsertId();
        $msg = 'Unit of measure registered successfully.';
    }

    jsonResponse([
        'success' => true,
        'message' => $msg,
        'uom' => [
            'id' => $uomId,
            'name' => $name,
            'abbreviation' => $abbreviation,
            'description' => $description
        ]
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}
