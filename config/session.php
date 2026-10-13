<?php
/**
 * PharmaTrack - Native PHP Session & Authentication Management
 * Xyra Andrea Pharmacy - Sales & Inventory Management System
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function isAuthenticated(): bool {
    return !empty($_SESSION['user_id']);
}

function isAdmin(): bool {
    return isAuthenticated() && isset($_SESSION['user_role']) && strtolower($_SESSION['user_role']) === 'admin';
}

function isCashier(): bool {
    return isAuthenticated() && isset($_SESSION['user_role']) && strtolower($_SESSION['user_role']) === 'cashier';
}

function getCurrentUser(): ?array {
    if (!isAuthenticated()) {
        return null;
    }
    return [
        'id'    => (int)$_SESSION['user_id'],
        'name'  => $_SESSION['user_name'] ?? 'User',
        'email' => $_SESSION['user_email'] ?? '',
        'role'  => $_SESSION['user_role'] ?? 'cashier'
    ];
}

function loginUser(array $user): void {
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'] ?? 'Staff Member';
    $_SESSION['user_email'] = $user['email'] ?? '';
    $_SESSION['user_role'] = $user['role'] ?? 'cashier';
    $_SESSION['user'] = [
        'id'    => (int)$user['id'],
        'name'  => $_SESSION['user_name'],
        'email' => $_SESSION['user_email'],
        'role'  => $_SESSION['user_role']
    ];
    $_SESSION['last_activity'] = time();
}

function logoutUser(): void {
    $_SESSION = [];
    if (ini_get("session.use_cookies") && !headers_sent()) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function requireAuth(): void {
    if (!isAuthenticated()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error'   => 'Unauthorized. Please sign in to access this resource.'
        ]);
        exit;
    }
}

function requireLogin(string $redirectUrl = 'login.php'): void {
    if (!isAuthenticated()) {
        header("Location: {$redirectUrl}");
        exit;
    }
}
