<?php
/**
 * Action: Create or Update Supplier
 * Domain: Registry/SupplierRegistry
 * Supports POST (create or update when id is passed) and PUT (update by id)
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));
$name = trim($input['name'] ?? '');
$contactPerson = trim($input['contact_person'] ?? ($input['contactPerson'] ?? ($input['contact'] ?? '')));
$phone = trim($input['phone'] ?? ($input['contact_number'] ?? ''));
$email = trim($input['email'] ?? '');
$address = trim($input['address'] ?? '');
$activePos = isset($input['active_pos']) ? max(0, (int)$input['active_pos']) : null;

if (empty($name)) {
    jsonResponse(['success' => false, 'error' => 'Distributor / Supplier name is required.'], 422);
}

try {
    // Check for duplicate supplier name
    if ($id > 0) {
        $dupStmt = $pdo->prepare("SELECT id FROM suppliers WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1");
        $dupStmt->execute([$name, $id]);
    } else {
        $dupStmt = $pdo->prepare("SELECT id FROM suppliers WHERE LOWER(name) = LOWER(?) LIMIT 1");
        $dupStmt->execute([$name]);
    }

    if ($dupStmt->fetch()) {
        jsonResponse(['success' => false, 'error' => "A supplier named '{$name}' already exists."], 422);
    }

    $pdo->beginTransaction();

    if ($id > 0) {
        $oldStmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ? LIMIT 1");
        $oldStmt->execute([$id]);
        $existing = $oldStmt->fetch();

        if (!$existing) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'error' => 'Supplier record not found.'], 404);
        }

        $newActivePos = ($activePos !== null) ? $activePos : (int)$existing['active_pos'];

        $updStmt = $pdo->prepare("
            UPDATE suppliers
            SET name = ?,
                contact_person = ?,
                phone = ?,
                email = ?,
                address = ?,
                active_pos = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $updStmt->execute([
            $name,
            $contactPerson ?: null,
            $phone ?: null,
            $email ?: null,
            $address ?: null,
            $newActivePos,
            $id
        ]);

        // Keep stock_ins supplier_name synchronized when supplier is renamed
        if ($existing['name'] !== $name) {
            $syncStmt = $pdo->prepare("UPDATE stock_ins SET supplier_name = ? WHERE supplier_id = ? OR supplier_name = ?");
            $syncStmt->execute([$name, $id, $existing['name']]);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'id' => $id,
            'message' => 'Supplier details updated successfully.',
            'supplier' => [
                'id' => $id,
                'name' => $name,
                'contact_person' => $contactPerson,
                'phone' => $phone,
                'email' => $email,
                'address' => $address,
                'active_pos' => $newActivePos
            ]
        ]);
    } else {
        $initActivePos = ($activePos !== null) ? $activePos : 0;

        $insStmt = $pdo->prepare("
            INSERT INTO suppliers (name, contact_person, phone, email, address, active_pos, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $insStmt->execute([
            $name,
            $contactPerson ?: null,
            $phone ?: null,
            $email ?: null,
            $address ?: null,
            $initActivePos
        ]);

        $newId = (int)$pdo->lastInsertId();
        $pdo->commit();

        jsonResponse([
            'success' => true,
            'id' => $newId,
            'message' => 'Supplier successfully registered.',
            'supplier' => [
                'id' => $newId,
                'name' => $name,
                'contact_person' => $contactPerson,
                'phone' => $phone,
                'email' => $email,
                'address' => $address,
                'active_pos' => $initActivePos
            ]
        ], 201);
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
