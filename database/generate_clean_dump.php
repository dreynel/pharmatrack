<?php
/**
 * PharmaTrack - Clean Production Database Generator (Users Data Only)
 * Suitable for Hostinger phpMyAdmin, cPanel, and Local XAMPP/MySQL
 */
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDatabaseConnection();
    echo "Connected to database successfully.\n";

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

        // Remove trailing comma before the closing parenthesis
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

        // Reset AUTO_INCREMENT to 1
        $cleanStr = implode("\n", $cleanLines);
        $cleanStr = preg_replace('/AUTO_INCREMENT=\d+/i', 'AUTO_INCREMENT=1', $cleanStr);

        return [$cleanStr, $constraints];
    }

    $now = date('Y-m-d H:i:s');
    $dropOrder = [
        'purchase_order_items',
        'purchase_orders',
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
        'purchase_orders',
        'purchase_order_items'
    ];

    // Build the dump with ONLY users data
    $buildDump = function(array $dataTables, string $title) use ($pdo, $dropOrder, $allTables, $now) {
        $dump = "-- =====================================================================\n";
        $dump .= "-- PharmaTrack Database Dump ({$title})\n";
        $dump .= "-- Target: Hostinger phpMyAdmin / Local MySQL & MariaDB\n";
        $dump .= "-- Generated: {$now}\n";
        $dump .= "-- Data Included: " . implode(', ', $dataTables) . " ONLY\n";
        $dump .= "-- Operational Tables: Clean 0 rows (Ready for fresh production Stock In)\n";
        $dump .= "-- Architecture: Reverse DROP + Clean CREATE + Deferred FK Constraints\n";
        $dump .= "-- =====================================================================\n\n";
        $dump .= "SET FOREIGN_KEY_CHECKS = 0;\n";
        $dump .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
        $dump .= "START TRANSACTION;\n";
        $dump .= "SET time_zone = \"+00:00\";\n\n";

        $dump .= "-- --------------------------------------------------------\n";
        $dump .= "-- Drop Existing Tables (Reverse Dependency Order)\n";
        $dump .= "-- --------------------------------------------------------\n";
        foreach ($dropOrder as $tbl) {
            $dump .= "DROP TABLE IF EXISTS `{$tbl}`;\n";
        }
        $dump .= "\n";

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

            $dump .= "-- --------------------------------------------------------\n";
            $dump .= "-- Table structure for table `{$table}`\n";
            $dump .= "-- --------------------------------------------------------\n";
            $dump .= $cleanCreateSql . ";\n\n";

            if (in_array($table, $dataTables)) {
                $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rows)) {
                    $dump .= "-- Dumping data for table `{$table}`\n";
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

                    $dump .= "INSERT INTO `{$table}` (`{$colList}`) VALUES\n";
                    $dump .= implode(",\n", $valRows) . ";\n\n";
                }
            }
        }

        if (!empty($allConstraints)) {
            $dump .= "-- --------------------------------------------------------\n";
            $dump .= "-- Deferred Foreign Key Constraints (Safe Import)\n";
            $dump .= "-- --------------------------------------------------------\n";
            foreach ($allConstraints as $table => $constraints) {
                $dump .= "ALTER TABLE `{$table}`\n";
                $adds = array_map(function($c) { return "  ADD " . $c; }, $constraints);
                $dump .= implode(",\n", $adds) . ";\n\n";
            }
        }

        $dump .= "COMMIT;\n";
        $dump .= "SET FOREIGN_KEY_CHECKS = 1;\n";

        return $dump;
    };

    // 1. Generate Dump with ONLY users data
    $cleanUsersOnlySql = $buildDump(['users'], 'Clean Database - Users Data Only');
    $cleanUsersOnlyPath = __DIR__ . '/pharmatrack_clean_users_only.sql';
    file_put_contents($cleanUsersOnlyPath, $cleanUsersOnlySql);

    // Also update hostinger dump and schema.sql
    file_put_contents(__DIR__ . '/pharmatrack_hostinger_dump.sql', $cleanUsersOnlySql);
    file_put_contents(__DIR__ . '/pharmatrack_fresh_dump.sql', $cleanUsersOnlySql);
    file_put_contents(__DIR__ . '/pharmatrack_fresh_install.sql', $cleanUsersOnlySql);
    file_put_contents(__DIR__ . '/pharmatrack_db.sql', $cleanUsersOnlySql);
    file_put_contents(__DIR__ . '/schema.sql', $cleanUsersOnlySql);

    echo "Generated clean database dump with ONLY users data:\n";
    echo "  - {$cleanUsersOnlyPath} (" . strlen($cleanUsersOnlySql) . " bytes)\n";
    echo "  - database/pharmatrack_hostinger_dump.sql (" . strlen($cleanUsersOnlySql) . " bytes)\n";
    echo "  - database/pharmatrack_fresh_dump.sql (" . strlen($cleanUsersOnlySql) . " bytes)\n";
    echo "  - database/schema.sql (" . strlen($cleanUsersOnlySql) . " bytes)\n";

    // 2. Also generate an optional dump that includes default categories & UOMs if needed
    $withLookupsSql = $buildDump(['users', 'categories', 'uoms', 'suppliers'], 'Clean Database with Standard Categories, UOMs & Users');
    $withLookupsPath = __DIR__ . '/pharmatrack_clean_with_lookups.sql';
    file_put_contents($withLookupsPath, $withLookupsSql);
    echo "  - {$withLookupsPath} (" . strlen($withLookupsSql) . " bytes)\n";

    echo "\nDump generation complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
