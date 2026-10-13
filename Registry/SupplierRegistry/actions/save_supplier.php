<?php
/**
 * Action: Create / Save Supplier
 * Domain: Registry/SupplierRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$name = trim($input['name'] ?? '');
if (empty($name)) {
    jsonResponse(['success' => false, 'error' => 'Supplier name is required.'], 422);
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO suppliers (name, contact_person, contact_number, email, address, lead_time_days, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([
        $name,
        $input['contact_person'] ?? null,
        $input['contact_number'] ?? ($input['phone'] ?? null),
        $input['email'] ?? null,
        $input['address'] ?? null,
        (int)($input['lead_time_days'] ?? 7),
        $input['status'] ?? 'Active'
    ]);

    jsonResponse(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Supplier successfully registered.']);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

