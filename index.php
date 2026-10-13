<?php
/**
 * PharmaTrack - Native PHP Entrypoint
 * Xyra Andrea Pharmacy - Sales & Inventory Management System
 */
require_once __DIR__ . '/config/session.php';

// If user is not authenticated, redirect to login page
if (!isAuthenticated()) {
    header('Location: login.php');
    exit;
}

// User is logged in, serve the main application
require_once __DIR__ . '/index.html';

