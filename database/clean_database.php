<?php
/**
 * PharmaTrack - Database Cleaner & Fresh Hostinger Dump Generator
 * Cleans live database and exports production-ready dumps
 */
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDatabaseConnection();
    echo "Connected to database: pharmatrack_db\n";

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    $tablesToTruncate = [
        'sale_return_items',
        'sale_returns',
        'sale_items',
        'sales',
        'inventory',
        'stock_movements',
        'stock_in_items',
        'stock_ins',
        'stock_out_items',
        'stock_outs',
        'conversions',
        'purchase_order_items',
        'purchase_orders'
    ];

    foreach ($tablesToTruncate as $tbl) {
        $check = $pdo->query("SHOW TABLES LIKE '{$tbl}'")->fetchAll();
        if (!empty($check)) {
            $pdo->exec("TRUNCATE TABLE `{$tbl}`;");
            $pdo->exec("ALTER TABLE `{$tbl}` AUTO_INCREMENT = 1;");
            echo "Truncated table: {$tbl}\n";
        }
    }

    // Reset products inventory status, batch numbers, expiry dates, and conversion rules
    $resetProducts = $pdo->exec("
        UPDATE products 
        SET stock = 0, 
            batch_no = NULL, 
            expiry_date = NULL, 
            status = 'Out of Stock', 
            daily_avg_sales = 0.00, 
            forecast_demand_30d = 0,
            is_bulk = 0,
            child_product_id = NULL,
            parent_product_id = NULL,
            conversion_rate = 1
    ");
    echo "Reset products: stock=0, batch_no=NULL, expiry_date=NULL, status='Out of Stock', conversions unlinked ({$resetProducts} rows updated)\n";

    // Reset active PO count on suppliers if column exists
    $chkCol = $pdo->query("SHOW COLUMNS FROM suppliers LIKE 'active_pos'")->fetchAll();
    if (!empty($chkCol)) {
        $pdo->exec("UPDATE suppliers SET active_pos = 0");
        echo "Reset suppliers active_pos to 0\n";
    }

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // Verification
    echo "\n--- VERIFICATION OF LIVE DATABASE ---\n";
    $tablesToCheck = [
        'users',
        'categories',
        'uoms',
        'suppliers',
        'products',
        'inventory',
        'stock_movements',
        'stock_ins',
        'stock_in_items',
        'stock_outs',
        'stock_out_items',
        'sales',
        'sale_items',
        'sale_returns',
        'sale_return_items',
        'conversions',
        'purchase_orders',
        'purchase_order_items'
    ];

    foreach ($tablesToCheck as $tbl) {
        $check = $pdo->query("SHOW TABLES LIKE '{$tbl}'")->fetchAll();
        if (!empty($check)) {
            $cnt = $pdo->query("SELECT COUNT(*) FROM `{$tbl}`")->fetchColumn();
            echo sprintf("%-20s: %d rows\n", $tbl, $cnt);
        }
    }

    // Helper to strip foreign keys from CREATE TABLE for deferred attachment
    function separateCreateSqlAndConstraints($createSql) {
        $lines = explode("\n", $createSql);
        $cleanLines = [];
        $constraints = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if (preg_match('/^CONSTRAINT\s+`?([^`\s]+)`?\s+FOREIGN KEY/i', $trimmed) || preg_match('/^FOREIGN KEY/i', $trimmed)) {
                $constraints[] = rtrim($trimmed, ',');
            } else {
                $cleanLines[] = $line;
            }
        }

        // Clean trailing comma before the closing parenthesis
        for ($i = count($cleanLines) - 1; $i >= 0; $i--) {
            $trimmed = trim($cleanLines[$i]);
            if (strpos($trimmed, ')') === 0) {
                for ($j = $i - 1; $j >= 0; $j--) {
                    if (trim($cleanLines[$j]) !== '') {
                        $cleanLines[$j] = rtrim(rtrim($cleanLines[$j]), ',');
                        break;
                    }
                }
                break;
            }
        }

        return [implode("\n", $cleanLines), $constraints];
    }

    // Generate Clean SQL Dump
    $now = date('Y-m-d H:i:s');
    $dumpHeader = "-- =====================================================================\n";
    $dumpHeader .= "-- PharmaTrack Clean Production Database Dump\n";
    $dumpHeader .= "-- Target: Hostinger / Local MySQL / MariaDB (Fresh Clean Installation)\n";
    $dumpHeader .= "-- Generated: {$now}\n";
    $dumpHeader .= "-- Inventory & Stock Records: Clean (0 records, stock = 0)\n";
    $dumpHeader .= "-- Master Data: Users (4), Categories, UOMs, Suppliers, Products\n";
    $dumpHeader .= "-- Architecture: Reverse DROP order + Deferred FK constraints (100% phpMyAdmin safe)\n";
    $dumpHeader .= "-- =====================================================================\n\n";
    $dumpHeader .= "SET FOREIGN_KEY_CHECKS = 0;\n";
    $dumpHeader .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
    $dumpHeader .= "START TRANSACTION;\n";
    $dumpHeader .= "SET time_zone = \"+00:00\";\n\n";

    $dumpSql = $dumpHeader;

    // Drop tables in reverse dependency order so no drop ever fails
    $dropOrder = [
        'purchase_order_items',
        'purchase_orders',
        'sale_return_items',
        'sale_returns',
        'sale_items',
        'sales',
        'stock_out_items',
        'stock_outs',
        'stock_in_items',
        'stock_ins',
        'stock_movements',
        'inventory',
        'conversions',
        'products',
        'users',
        'suppliers',
        'uoms',
        'categories'
    ];

    $dumpSql .= "-- --------------------------------------------------------\n";
    $dumpSql .= "-- Drop Existing Tables (Reverse Dependency Order)\n";
    $dumpSql .= "-- --------------------------------------------------------\n";
    foreach ($dropOrder as $tbl) {
        $dumpSql .= "DROP TABLE IF EXISTS `{$tbl}`;\n";
    }
    $dumpSql .= "\n";

    $allTables = [
        'categories',
        'uoms',
        'suppliers',
        'users',
        'products',
        'conversions',
        'inventory',
        'stock_movements',
        'stock_ins',
        'stock_in_items',
        'stock_outs',
        'stock_out_items',
        'sales',
        'sale_items',
        'sale_returns',
        'sale_return_items',
        'purchase_orders',
        'purchase_order_items'
    ];

    $allConstraints = [];

    foreach ($allTables as $table) {
        $check = $pdo->query("SHOW TABLES LIKE '{$table}'")->fetchAll();
        if (empty($check)) continue;

        $createRow = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(PDO::FETCH_NUM);
        $createSql = $createRow[1];

        list($cleanCreateSql, $constraints) = separateCreateSqlAndConstraints($createSql);
        if (!empty($constraints)) {
            $allConstraints[$table] = $constraints;
        }

        $dumpSql .= "-- --------------------------------------------------------\n";
        $dumpSql .= "-- Table structure for table `{$table}`\n";
        $dumpSql .= "-- --------------------------------------------------------\n";
        $dumpSql .= $cleanCreateSql . ";\n\n";

        // Dump data for master catalog tables only
        $masterTables = ['categories', 'uoms', 'suppliers', 'users', 'products'];
        if (in_array($table, $masterTables)) {
            $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                $dumpSql .= "-- Dumping data for table `{$table}`\n";
                $cols = array_keys($rows[0]);
                $colList = implode('`, `', $cols);

                $valRows = [];
                foreach ($rows as $row) {
                    $escapedVals = [];
                    foreach ($row as $val) {
                        if ($val === null) {
                            $escapedVals[] = 'NULL';
                        } else {
                            $escapedVals[] = $pdo->quote($val);
                        }
                    }
                    $valRows[] = "(" . implode(', ', $escapedVals) . ")";
                }

                $dumpSql .= "INSERT INTO `{$table}` (`{$colList}`) VALUES\n";
                $dumpSql .= implode(",\n", $valRows) . ";\n\n";
            }
        }
    }

    if (!empty($allConstraints)) {
        $dumpSql .= "-- --------------------------------------------------------\n";
        $dumpSql .= "-- Foreign Key Constraints (Deferred for Safe Import)\n";
        $dumpSql .= "-- --------------------------------------------------------\n";
        foreach ($allConstraints as $table => $constraints) {
            $dumpSql .= "ALTER TABLE `{$table}`\n";
            $adds = array_map(function($c) { return "  ADD " . $c; }, $constraints);
            $dumpSql .= implode(",\n", $adds) . ";\n\n";
        }
    }

    $dumpSql .= "COMMIT;\n";
    $dumpSql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

    $freshDumpPath = __DIR__ . '/pharmatrack_fresh_dump.sql';
    $hostingerDumpPath = __DIR__ . '/pharmatrack_hostinger_dump.sql';
    $schemaPath = __DIR__ . '/schema.sql';
    $dbSqlPath = __DIR__ . '/pharmatrack_db.sql';
    $rootHostingerPath = __DIR__ . '/../pharmatrack_hostinger.sql';

    file_put_contents($freshDumpPath, $dumpSql);
    file_put_contents($hostingerDumpPath, $dumpSql);
    file_put_contents($schemaPath, $dumpSql);
    file_put_contents($dbSqlPath, $dumpSql);
    file_put_contents($rootHostingerPath, $dumpSql);

    echo "\nGenerated clean SQL dumps:\n";
    echo "  - {$freshDumpPath} (" . strlen($dumpSql) . " bytes)\n";
    echo "  - {$hostingerDumpPath} (" . strlen($dumpSql) . " bytes)\n";
    echo "  - {$schemaPath} (" . strlen($dumpSql) . " bytes)\n";
    echo "  - {$dbSqlPath} (" . strlen($dumpSql) . " bytes)\n";
    echo "  - {$rootHostingerPath} (" . strlen($dumpSql) . " bytes)\n";
    echo "\nDatabase and dump files cleaned successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
