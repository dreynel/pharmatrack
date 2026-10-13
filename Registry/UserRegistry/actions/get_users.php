<?php
/**
 * Action: Get All Users
 * Domain: Registry/UserRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query("SELECT id, name, email, role, created_at FROM users ORDER BY name ASC");
    $users = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'count' => count($users),
        'data' => $users
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

