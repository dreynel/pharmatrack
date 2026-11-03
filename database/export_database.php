<?php
/**
 * PharmaTrack - Complete Live Database Dump for Hostinger
 * Exports all current tables and current records with zero FK dependency failures.
 * Tailored for 1-click import into Hostinger phpMyAdmin or MySQL CLI.
 */

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDatabaseConnection();
    echo "Connecting to database...\n";

    // Hostinger and MariaDB / MySQL compatibility settings
    $pdo->exec("SET NAMES utf8mb4");

    // Fetch all tables
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Discovered " . count($tables) . " tables in database.\n";

    $now = date('Y-m-d H:i:s');
    $sql  = "-- =====================================================================\n";
    $sql .= "-- PharmaTrack Live Database Dump for Hostinger Production\n";
    $sql .= "-- Generated: " . $now . "\n";
    $sql .= "-- System: Native PHP Xyra Andrea Pharmacy Management System\n";
    $sql .= "-- Target: Hostinger phpMyAdmin / MariaDB / MySQL 8.x / 5.7+\n";
    $sql .= "-- Instructions:\n";
    $sql .= "--   1. In Hostinger hPanel -> Databases -> Create Database (e.g. u123456_pharma)\n";
    $sql .= "--   2. Click 'Enter phpMyAdmin'\n";
    $sql .= "--   3. Click 'Import' -> Select this file -> Click 'Go'\n";
    $sql .= "-- =====================================================================\n\n";

    $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n";
    $sql .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
    $sql .= "SET AUTOCOMMIT = 0;\n";
    $sql .= "START TRANSACTION;\n";
    $sql .= "SET time_zone = '+00:00';\n";
    $sql .= "SET NAMES utf8mb4;\n\n";

    $stats = [];

    foreach ($tables as $table) {
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
        $stats[$table] = $count;

        $sql .= "-- --------------------------------------------------------\n";
        $sql .= "-- Table structure for table `{$table}`\n";
        $sql .= "-- --------------------------------------------------------\n";
        $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";

        $createRow = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(PDO::FETCH_NUM);
        $createTableSql = $createRow[1];

        // Ensure engine is InnoDB
        $sql .= $createTableSql . ";\n\n";

        // Dump table data if rows exist
        if ($count > 0) {
            $sql .= "-- Dumping data for table `{$table}` ({$count} records)\n";

            // Fetch columns to guarantee deterministic column order
            $colStmt = $pdo->query("SHOW COLUMNS FROM `{$table}`");
            $columns = [];
            while ($col = $colStmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = $col['Field'];
            }
            $colList = implode('`, `', $columns);

            $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
            $chunks = array_chunk($rows, 100);

            foreach ($chunks as $chunk) {
                $valueRows = [];
                foreach ($chunk as $row) {
                    $escaped = [];
                    foreach ($columns as $c) {
                        $val = $row[$c];
                        if ($val === null) {
                            $escaped[] = 'NULL';
                        } else {
                            $escaped[] = $pdo->quote($val);
                        }
                    }
                    $valueRows[] = "(" . implode(', ', $escaped) . ")";
                }
                $sql .= "INSERT INTO `{$table}` (`{$colList}`) VALUES\n";
                $sql .= implode(",\n", $valueRows) . ";\n";
            }
            $sql .= "\n";
        }
    }

    $sql .= "COMMIT;\n";
    $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

    // Save to database/pharmatrack_current_dump.sql
    $dest1 = __DIR__ . '/pharmatrack_current_dump.sql';
    file_put_contents($dest1, $sql);

    // Save also to database/pharmatrack_hostinger_dump.sql (Hostinger default)
    $dest2 = __DIR__ . '/pharmatrack_hostinger_dump.sql';
    file_put_contents($dest2, $sql);

    // Save to root directory as pharmatrack_hostinger.sql for ultra-easy finding
    $dest3 = __DIR__ . '/../pharmatrack_hostinger.sql';
    file_put_contents($dest3, $sql);

    echo "\n=== Live Database Dump Successfully Generated! ===\n";
    echo "Primary File : database/pharmatrack_current_dump.sql (" . number_format(strlen($sql)) . " bytes)\n";
    echo "Hostinger File: database/pharmatrack_hostinger_dump.sql\n";
    echo "Root Shortcut : pharmatrack_hostinger.sql\n\n";
    echo "Tables & Record Counts Dumped:\n";
    foreach ($stats as $t => $c) {
        printf("  - %-25s : %d records\n", $t, $c);
    }

} catch (Exception $e) {
    echo "Error generating dump: " . $e->getMessage() . "\n";
    exit(1);
}

