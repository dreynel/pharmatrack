<?php
/**
 * Action: Create or Update Medicine Category
 * Domain: Registry/CategoryRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? 0);
$name = sanitizeString($input['name'] ?? '');
$description = sanitizeString($input['description'] ?? '');

if (empty($name)) {
    jsonResponse(['success' => false, 'error' => 'Category name is required.'], 400);
}

try {
    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $description, $id]);
        $catId = $id;
        $msg = 'Category updated successfully.';
    } else {
        $stmt = $pdo->prepare("INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
        $stmt->execute([$name, $description]);
        $catId = $pdo->lastInsertId();
        $msg = 'Category created successfully.';
    }

    jsonResponse([
        'success' => true,
        'message' => $msg,
        'category' => [
            'id' => $catId,
            'name' => $name,
            'description' => $description
        ]
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}

