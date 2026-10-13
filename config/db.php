<?php
/**
 * PharmaTrack - Native PHP Database Connection (PDO)
 * Xyra Andrea Pharmacy - Sales & Inventory Management System
 */

function getDatabaseConnection(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = '127.0.0.1';
    $port = '3306';
    $dbname = 'pharmatrack_db';
    $username = 'root';
    $password = '007622'; // default from .env
    $charset = 'utf8mb4';

    // Parse .env if available
    $envPath = __DIR__ . '/../.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || $line[0] === '#') continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);
                if ($key === 'DB_HOST') $host = $val;
                if ($key === 'DB_PORT') $port = $val;
                if ($key === 'DB_DATABASE') $dbname = $val;
                if ($key === 'DB_USERNAME') $username = $val;
                if ($key === 'DB_PASSWORD') $password = $val;
            }
        }
    }

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    // Helper closure to initialize/migrate schema if needed
    $ensureSchema = function(PDO $dbInstance) {
        try {
            $check = $dbInstance->query("SHOW TABLES LIKE 'products'")->fetch();
            if (!$check) {
                $schemaFile = __DIR__ . '/../database/schema.sql';
                if (file_exists($schemaFile)) {
                    $sql = file_get_contents($schemaFile);
                    if (!empty($sql)) {
                        $dbInstance->exec($sql);
                    }
                }
            }
        } catch (Throwable $t) {
            // Log or continue silently
        }
    };

    // Attempt 1: Direct connection with provided credentials
    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
        $pdo = new PDO($dsn, $username, $password, $options);
        $ensureSchema($pdo);
        return $pdo;
    } catch (PDOException $e1) {
        // Attempt 2: Try standard default XAMPP credentials (empty password)
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
            $pdo = new PDO($dsn, $username, '', $options);
            $ensureSchema($pdo);
            return $pdo;
        } catch (PDOException $e2) {
            // Attempt 3: If database doesn't exist yet, connect to MySQL server and auto-create pharmatrack_db
            try {
                $rootPass = (!empty($password)) ? $password : '';
                $serverDsn = "mysql:host={$host};port={$port};charset={$charset}";
                try {
                    $serverPdo = new PDO($serverDsn, $username, $rootPass, $options);
                } catch (PDOException $ep) {
                    $serverPdo = new PDO($serverDsn, $username, '', $options);
                }

                $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                
                $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
                $pdo = new PDO($dsn, $username, $rootPass, $options);
                $ensureSchema($pdo);
                return $pdo;
            } catch (Throwable $e3) {
                // Attempt 4: Fallback to SQLite if file exists
                $sqlitePath = __DIR__ . '/../database/database.sqlite';
                if (file_exists($sqlitePath)) {
                    $pdo = new PDO("sqlite:{$sqlitePath}", null, null, $options);
                    return $pdo;
                }

                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'error' => 'Database connection failed: ' . $e2->getMessage() . '. To set up manually, import database/schema.sql into MySQL database named pharmatrack_db.'
                ]);
                exit;
            }
        }
    }
}

