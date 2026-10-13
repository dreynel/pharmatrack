<?php
/**
 * Action: Create or Update User
 * Domain: Registry/UserRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? 0);
$name = sanitizeString($input['name'] ?? '');
$email = sanitizeString($input['email'] ?? '');
$role = sanitizeString($input['role'] ?? 'cashier');
$password = $input['password'] ?? '';

if (empty($name) || empty($email)) {
    jsonResponse(['success' => false, 'error' => 'Name and email are required.'], 400);
}

try {
    if ($id > 0) {
        // Update user
        if (!empty($password)) {
            $hashed = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, role = ?, password = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $email, $role, $hashed, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, role = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $email, $role, $id]);
        }
        $userId = $id;
        $msg = 'User updated successfully.';
    } else {
        // Insert user
        if (empty($password)) {
            $password = 'password123';
        }
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, role, password, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$name, $email, $role, $hashed]);
        $userId = $pdo->lastInsertId();
        $msg = 'User registered successfully.';
    }

    jsonResponse([
        'success' => true,
        'message' => $msg,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => $role
        ]
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}

