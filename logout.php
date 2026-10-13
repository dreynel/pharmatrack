<?php
/**
 * PharmaTrack - Native PHP Logout Handler
 */
require_once __DIR__ . '/config/session.php';
logoutUser();
header('Location: login.php');
exit;

