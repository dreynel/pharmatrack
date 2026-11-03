<?php
/**
 * PharmaTrack - Native PHP Database Connection (PDO)
 * Xyra Andrea Pharmacy - Sales & Inventory Management System
 * Supports Standalone MySQL 8.x (e.g. MySQL 8.9) and XAMPP MariaDB with Auto-Migration
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
                $val = trim($val, " \t\n\r\0\x0B\"'");
                if ($key === 'DB_HOST' && !empty($val)) $host = $val;
                if ($key === 'DB_PORT' && !empty($val)) $port = $val;
                if ($key === 'DB_DATABASE' && !empty($val)) $dbname = $val;
                if ($key === 'DB_USERNAME' && !empty($val)) $username = $val;
                if ($key === 'DB_PASSWORD') $password = $val;
            }
        }
    }

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    // Configure MySQL 8.x session compatibility (disable ONLY_FULL_GROUP_BY) and auto-import schema if empty
    $configureAndEnsureSchema = function(PDO $dbInstance) {
        try {
            $dbInstance->exec("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
        } catch (Throwable $t) {
            // Ignore if SQLite or unsupported
        }

        try {
            $check = $dbInstance->query("SHOW TABLES LIKE 'products'")->fetch();
            if (!$check) {
                $schemaFile = __DIR__ . '/../database/pharmatrack_db.sql';
                if (!file_exists($schemaFile)) {
                    $schemaFile = __DIR__ . '/../database/schema.sql';
                }
                if (file_exists($schemaFile)) {
                    $sql = file_get_contents($schemaFile);
                    if (!empty($sql)) {
                        // Enable emulate prepares temporarily so PDO can execute multi-statement SQL dumps
                        $dbInstance->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
                        $dbInstance->exec($sql);
                        // Wait for any multi-query result sets to clear
                        while ($dbInstance->nextRowset()) { /* flush */ }
                        $dbInstance->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
                    }
                }
            }

            $checkMovements = $dbInstance->query("SHOW TABLES LIKE 'stock_movements'")->fetch();
            if (!$checkMovements) {
                $dbInstance->exec("
                    CREATE TABLE IF NOT EXISTS `stock_movements` (
                      `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                      `movement_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                      `timestamp` datetime NOT NULL,
                      `product_id` bigint unsigned DEFAULT NULL,
                      `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                      `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                      `qty_change` int NOT NULL,
                      `previous_stock` int NOT NULL,
                      `new_stock` int NOT NULL,
                      `reference_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                      `remarks` text COLLATE utf8mb4_unicode_ci,
                      `created_at` timestamp NULL DEFAULT NULL,
                      `updated_at` timestamp NULL DEFAULT NULL,
                      PRIMARY KEY (`id`),
                      UNIQUE KEY `stock_movements_movement_code_unique` (`movement_code`),
                      KEY `stock_movements_product_id_foreign` (`product_id`),
                      CONSTRAINT `stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            }

            $checkUoms = $dbInstance->query("SHOW TABLES LIKE 'uoms'")->fetch();
            if (!$checkUoms) {
                $dbInstance->exec("
                    CREATE TABLE IF NOT EXISTS `uoms` (
                      `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                      `name` varchar(100) NOT NULL,
                      `abbreviation` varchar(50) DEFAULT NULL,
                      `description` varchar(255) DEFAULT NULL,
                      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                      `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      PRIMARY KEY (`id`),
                      UNIQUE KEY `uoms_name_unique` (`name`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
                $dbInstance->exec("
                    INSERT IGNORE INTO `uoms` (`name`, `abbreviation`, `description`) VALUES
                    ('Tablet', 'tab', 'Solid single-dose pharmaceutical tablet'),
                    ('Capsule', 'cap', 'Gelatin encased single-dose medicine'),
                    ('Box', 'box', 'Standard packaging box / carton'),
                    ('Strip', 'strip', 'Blister strip packaging of 10-12 units'),
                    ('Bottle', 'btl', 'Liquid suspension, syrup, or drops bottle'),
                    ('Tube', 'tube', 'Topical ointment, cream, or gel container'),
                    ('Sachet', 'sachet', 'Single-dose powder / oral rehydration packet'),
                    ('Vial', 'vial', 'Sterile injectable liquid / reconstituted solution'),
                    ('Ampoule', 'amp', 'Sealed glass capsule for single parenteral injection');
                ");
            }

            // Ensure batch_no & expiry_date exist in sale_items and stock_out_items
            try {
                $colsSale = $dbInstance->query("SHOW COLUMNS FROM sale_items LIKE 'batch_no'")->fetch();
                if (!$colsSale) {
                    $dbInstance->exec("ALTER TABLE sale_items ADD COLUMN batch_no varchar(100) DEFAULT NULL AFTER cost_price");
                    $dbInstance->exec("ALTER TABLE sale_items ADD COLUMN expiry_date date DEFAULT NULL AFTER batch_no");
                }
                $colsSoExp = $dbInstance->query("SHOW COLUMNS FROM stock_out_items LIKE 'expiry_date'")->fetch();
                if (!$colsSoExp) {
                    $dbInstance->exec("ALTER TABLE stock_out_items ADD COLUMN expiry_date date DEFAULT NULL AFTER batch_no");
                }

                $checkVat = $dbInstance->query("SHOW COLUMNS FROM sales LIKE 'vatable_sales'")->fetch();
                if (!$checkVat) {
                    $dbInstance->exec("ALTER TABLE sales ADD COLUMN vatable_sales decimal(12,2) NOT NULL DEFAULT 0.00 AFTER total");
                    $dbInstance->exec("ALTER TABLE sales ADD COLUMN vat_amount decimal(12,2) NOT NULL DEFAULT 0.00 AFTER vatable_sales");
                    $dbInstance->exec("ALTER TABLE sales ADD COLUMN vat_exempt_sales decimal(12,2) NOT NULL DEFAULT 0.00 AFTER vat_amount");
                    $dbInstance->exec("ALTER TABLE sales ADD COLUMN zero_rated_sales decimal(12,2) NOT NULL DEFAULT 0.00 AFTER vat_exempt_sales");
                }

                $checkReturns = $dbInstance->query("SHOW TABLES LIKE 'sale_returns'")->fetch();
                if (!$checkReturns) {
                    $dbInstance->exec("
                        CREATE TABLE IF NOT EXISTS `sale_returns` (
                          `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                          `return_no` varchar(255) NOT NULL,
                          `sale_id` bigint unsigned NOT NULL,
                          `invoice_no` varchar(255) NOT NULL,
                          `cashier` varchar(255) DEFAULT 'Pharmacist',
                          `customer_name` varchar(255) DEFAULT 'Walk-in Customer',
                          `reason` varchar(255) NOT NULL,
                          `condition_type` varchar(100) NOT NULL DEFAULT 'resellable',
                          `refund_method` varchar(100) NOT NULL DEFAULT 'Cash',
                          `refund_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
                          `restocked` tinyint(1) NOT NULL DEFAULT '1',
                          `notes` text DEFAULT NULL,
                          `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                          `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          PRIMARY KEY (`id`),
                          UNIQUE KEY `sale_returns_return_no_unique` (`return_no`),
                          KEY `sale_returns_sale_id_index` (`sale_id`)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                    ");
                    $dbInstance->exec("
                        CREATE TABLE IF NOT EXISTS `sale_return_items` (
                          `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                          `sale_return_id` bigint unsigned NOT NULL,
                          `sale_item_id` bigint unsigned DEFAULT NULL,
                          `product_id` bigint unsigned NOT NULL,
                          `product_name` varchar(255) NOT NULL,
                          `quantity` int NOT NULL,
                          `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
                          `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
                          `batch_no` varchar(255) DEFAULT NULL,
                          `expiry_date` date DEFAULT NULL,
                          `restocked` tinyint(1) NOT NULL DEFAULT '1',
                          `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                          PRIMARY KEY (`id`),
                          KEY `sale_return_items_return_id_index` (`sale_return_id`),
                          KEY `sale_return_items_product_id_index` (`product_id`)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                    ");
                }
            } catch (Throwable $colErr) {}
        } catch (Throwable $t) {
            try {
                $dbInstance->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            } catch (Throwable $ignore) {}
        }
    };

    // Candidate passwords to try automatically across standalone MySQL 8.x & XAMPP setups
    $candidatePasswords = array_values(array_unique([$password, '', '007622', 'root', 'admin', 'password']));
    $lastException = null;

    // Pass 1: Try connecting directly to pharmatrack_db
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";
    foreach ($candidatePasswords as $tryPass) {
        try {
            $pdo = new PDO($dsn, $username, $tryPass, $options);
            $configureAndEnsureSchema($pdo);
            return $pdo;
        } catch (PDOException $e) {
            $lastException = $e;
        }
    }

    // Pass 2: Connect to MySQL Server (without dbname) to auto-create `pharmatrack_db` and import dump
    $serverDsn = "mysql:host={$host};port={$port};charset={$charset}";
    foreach ($candidatePasswords as $tryPass) {
        try {
            $serverPdo = new PDO($serverDsn, $username, $tryPass, $options);
            $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo = new PDO($dsn, $username, $tryPass, $options);
            $configureAndEnsureSchema($pdo);
            return $pdo;
        } catch (PDOException $e) {
            $lastException = $e;
        }
    }

    // Pass 3: Fallback to SQLite if file exists
    $sqlitePath = __DIR__ . '/../database/database.sqlite';
    if (file_exists($sqlitePath)) {
        try {
            $pdo = new PDO("sqlite:{$sqlitePath}", null, null, $options);
            return $pdo;
        } catch (Throwable $sqliteErr) {}
    }

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . ($lastException ? $lastException->getMessage() : 'Unable to connect to MySQL') . '. Verify DB_USERNAME and DB_PASSWORD in .env or config/db.php.'
    ]);
    exit;
}
