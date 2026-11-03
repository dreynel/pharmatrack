-- =====================================================================
-- PharmaTrack Live Database Dump for Hostinger Production
-- Generated: 2026-11-03 00:42:09
-- System: Native PHP Xyra Andrea Pharmacy Management System
-- Target: Hostinger phpMyAdmin / MariaDB / MySQL 8.x / 5.7+
-- Instructions:
--   1. In Hostinger hPanel -> Databases -> Create Database (e.g. u123456_pharma)
--   2. Click 'Enter phpMyAdmin'
--   3. Click 'Import' -> Select this file -> Click 'Go'
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `categories` (9 records)
INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
('1', 'Analgesics', 'Pain relievers, antipyretics, and fever control medications', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('2', 'Antibiotics', 'Antibacterial and prescription anti-infectives', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('3', 'Respiratory', 'Decongestants, antitussives, and antihistamines for colds/cough', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('4', 'Vitamins & Supplements', 'Daily dietary multivitamins, minerals, and immune boosters', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('5', 'Cardiovascular', 'Hypertension, heart care, and maintenance medications', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('6', 'Antihistamines', 'Allergy relief, anti-itch, and non-drowsy formulations', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('7', 'First Aid', 'Antiseptics, rubbing alcohol, bandages, and clinical supplies', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('8', 'Gastrointestinal', 'Antacids, anti-diarrheal, and digestive health medications', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('10', 'Pain Reliever', '-', '2026-10-21 00:46:14', '2026-10-21 00:46:14');

-- --------------------------------------------------------
-- Table structure for table `conversions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `conversions`;
CREATE TABLE `conversions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `conv_code` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `source_product_id` bigint(20) unsigned DEFAULT NULL,
  `source_product_name` varchar(255) NOT NULL,
  `source_uom` varchar(255) NOT NULL DEFAULT 'Box',
  `source_qty` int(11) NOT NULL DEFAULT 1,
  `target_product_id` bigint(20) unsigned DEFAULT NULL,
  `target_product_name` varchar(255) NOT NULL,
  `target_uom` varchar(255) NOT NULL DEFAULT 'Piece',
  `target_qty` int(11) NOT NULL DEFAULT 100,
  `multiplier` int(11) NOT NULL DEFAULT 100,
  `batch_no` varchar(255) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `operator` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversions_conv_code_unique` (`conv_code`),
  KEY `conversions_source_product_id_foreign` (`source_product_id`),
  KEY `conversions_target_product_id_foreign` (`target_product_id`),
  CONSTRAINT `conversions_source_product_id_foreign` FOREIGN KEY (`source_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `conversions_target_product_id_foreign` FOREIGN KEY (`target_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `conversions` (5 records)
INSERT INTO `conversions` (`id`, `conv_code`, `date`, `source_product_id`, `source_product_name`, `source_uom`, `source_qty`, `target_product_id`, `target_product_name`, `target_uom`, `target_qty`, `multiplier`, `batch_no`, `expiry_date`, `operator`, `notes`, `created_at`, `updated_at`) VALUES
('1', 'CNV-20261101-0001', '2026-11-01 09:30:00', '1', 'Biogesic 500mg Box (100s)', 'Box', '2', '2', 'Biogesic 500mg Tablet', 'Piece', '200', '100', 'BG-2610A', '2028-10-31', 'Xyra Andrea (Pharmacist)', 'Routine unboxing into retail dispensing bins.', '2026-11-01 09:30:00', '2026-11-01 09:30:00'),
('2', 'CNV-20261101-0002', '2026-11-01 09:40:00', '3', 'Neozep Forte Box (100s)', 'Box', '2', '4', 'Neozep Forte Tablet', 'Piece', '200', '100', 'NZ-2610B', '2028-09-30', 'Xyra Andrea (Pharmacist)', 'Routine unboxing into retail dispensing bins.', '2026-11-01 09:40:00', '2026-11-01 09:40:00'),
('3', 'CNV-20261101-0003', '2026-11-01 09:50:00', '5', 'Bioflu 500mg Box (100s)', 'Box', '3', '6', 'Bioflu 500mg Tablet', 'Piece', '300', '100', 'BF-2610C', '2028-11-30', 'Xyra Andrea (Pharmacist)', 'Routine unboxing into retail dispensing bins.', '2026-11-01 09:50:00', '2026-11-01 09:50:00'),
('4', 'CNV-20261101-0004', '2026-11-01 10:00:00', '7', 'Alaxan FR Box (100s)', 'Box', '2', '8', 'Alaxan FR Capsule', 'Piece', '200', '100', 'AX-2610D', '2028-08-31', 'Xyra Andrea (Pharmacist)', 'Routine unboxing into retail dispensing bins.', '2026-11-01 10:00:00', '2026-11-01 10:00:00'),
('5', 'CNV-20261101-0005', '2026-11-01 10:15:00', '9', 'RiteMed Amoxicillin 500mg Box (100s)', 'Box', '2', '10', 'RiteMed Amoxicillin 500mg Capsule', 'Piece', '200', '100', 'AM-2610E', '2028-06-30', 'Xyra Andrea (Pharmacist)', 'Routine unboxing into retail dispensing bins.', '2026-11-01 10:15:00', '2026-11-01 10:15:00');

-- --------------------------------------------------------
-- Table structure for table `inventory`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entry_no` varchar(100) NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `transaction_code` varchar(50) NOT NULL COMMENT 'POS, StockIn, StockOut, Conversion, OpeningBalance, Adjustment',
  `transaction_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Parent record ID in sales, stock_ins, stock_outs, conversions, or products',
  `reference_no` varchar(100) DEFAULT NULL COMMENT 'Document / Invoice / Voucher #',
  `qty_in` int(10) unsigned NOT NULL DEFAULT 0,
  `qty_out` int(10) unsigned NOT NULL DEFAULT 0,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `previous_balance` int(11) NOT NULL DEFAULT 0,
  `running_balance` int(11) NOT NULL DEFAULT 0,
  `unit_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `batch_no` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `transacted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_entry_no_unique` (`entry_no`),
  KEY `inventory_product_id_index` (`product_id`),
  KEY `inventory_transaction_code_index` (`transaction_code`),
  KEY `inventory_reference_lookup_index` (`transaction_code`,`transaction_id`),
  KEY `inventory_reference_no_index` (`reference_no`),
  CONSTRAINT `inventory_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `inventory` (20 records)
INSERT INTO `inventory` (`id`, `entry_no`, `product_id`, `product_name`, `transaction_code`, `transaction_id`, `reference_no`, `qty_in`, `qty_out`, `quantity`, `previous_balance`, `running_balance`, `unit_cost`, `total_cost`, `batch_no`, `expiry_date`, `remarks`, `transacted_at`, `created_at`, `updated_at`) VALUES
('1', 'INV-STO-20261103004111-0AF0A', '1', 'Biogesic 500mg Box (100s)', 'StockIn', '1', 'DR-20261101-001', '10', '0', '10', '0', '10', '500.00', '5000.00', 'BG-2610A', '2028-10-31', 'Stock-In delivery #DR-20261101-001 from Unilab Distribution Phils', '2026-11-01 08:30:00', '2026-11-02 16:41:11', '2026-11-02 16:41:11'),
('2', 'INV-CON-20261103004112-5B9BF', '1', 'Biogesic 500mg Box (100s)', 'Conversion', '1', 'CNV-20261101-0001', '0', '2', '-2', '10', '8', '500.00', '-1000.00', 'BG-2610A', '2028-10-31', 'Unboxed 2 Boxes into 200 Biogesic 500mg Tablet (#CNV-20261101-0001)', '2026-11-01 09:30:00', '2026-11-02 16:41:12', '2026-11-02 16:41:12'),
('3', 'INV-CON-20261103004112-814BC', '2', 'Biogesic 500mg Tablet', 'Conversion', '1', 'CNV-20261101-0001', '200', '0', '200', '0', '200', '5.00', '1000.00', 'BG-2610A', '2028-10-31', 'Received 200 from Biogesic 500mg Box (100s) (#CNV-20261101-0001)', '2026-11-01 09:30:00', '2026-11-02 16:41:12', '2026-11-02 16:41:12'),
('4', 'INV-POS-20261103004113-5D44C', '2', 'Biogesic 500mg Tablet', 'POS', '1', 'INV-20261101-0001', '0', '20', '-20', '200', '180', '5.00', '-100.00', 'BG-2610A', '2028-10-31', 'POS Sale Invoice #INV-20261101-0001 to Lola Remedios Santos', '2026-11-01 10:15:00', '2026-11-02 16:41:13', '2026-11-02 16:41:13'),
('5', 'INV-STO-20261103004113-A9081', '3', 'Neozep Forte Box (100s)', 'StockIn', '2', 'DR-20261101-002', '10', '0', '10', '0', '10', '550.00', '5500.00', 'NZ-2610B', '2028-09-30', 'Stock-In delivery #DR-20261101-002 from Unilab Distribution Phils', '2026-11-01 08:45:00', '2026-11-02 16:41:13', '2026-11-02 16:41:13'),
('6', 'INV-CON-20261103004114-97B45', '3', 'Neozep Forte Box (100s)', 'Conversion', '2', 'CNV-20261101-0002', '0', '2', '-2', '10', '8', '550.00', '-1100.00', 'NZ-2610B', '2028-09-30', 'Unboxed 2 Boxes into 200 Neozep Forte Tablet (#CNV-20261101-0002)', '2026-11-01 09:40:00', '2026-11-02 16:41:14', '2026-11-02 16:41:14'),
('7', 'INV-CON-20261103004114-B449A', '4', 'Neozep Forte Tablet', 'Conversion', '2', 'CNV-20261101-0002', '200', '0', '200', '0', '200', '5.50', '1100.00', 'NZ-2610B', '2028-09-30', 'Received 200 from Neozep Forte Box (100s) (#CNV-20261101-0002)', '2026-11-01 09:40:00', '2026-11-02 16:41:14', '2026-11-02 16:41:14'),
('8', 'INV-POS-20261103004114-5E241', '4', 'Neozep Forte Tablet', 'POS', '2', 'INV-20261101-0002', '0', '15', '-15', '200', '185', '5.50', '-82.50', 'NZ-2610B', '2028-09-30', 'POS Sale Invoice #INV-20261101-0002 to Roberto Tan', '2026-11-01 11:00:00', '2026-11-02 16:41:14', '2026-11-02 16:41:14'),
('9', 'INV-STO-20261103004115-3789A', '5', 'Bioflu 500mg Box (100s)', 'StockIn', '3', 'DR-20261101-003', '10', '0', '10', '0', '10', '600.00', '6000.00', 'BF-2610C', '2028-11-30', 'Stock-In delivery #DR-20261101-003 from Unilab Distribution Phils', '2026-11-01 09:00:00', '2026-11-02 16:41:15', '2026-11-02 16:41:15'),
('10', 'INV-CON-20261103004115-F67ED', '5', 'Bioflu 500mg Box (100s)', 'Conversion', '3', 'CNV-20261101-0003', '0', '3', '-3', '10', '7', '600.00', '-1800.00', 'BF-2610C', '2028-11-30', 'Unboxed 3 Boxes into 300 Bioflu 500mg Tablet (#CNV-20261101-0003)', '2026-11-01 09:50:00', '2026-11-02 16:41:15', '2026-11-02 16:41:15'),
('11', 'INV-CON-20261103004116-E09BF', '6', 'Bioflu 500mg Tablet', 'Conversion', '3', 'CNV-20261101-0003', '300', '0', '300', '0', '300', '6.00', '1800.00', 'BF-2610C', '2028-11-30', 'Received 300 from Bioflu 500mg Box (100s) (#CNV-20261101-0003)', '2026-11-01 09:50:00', '2026-11-02 16:41:16', '2026-11-02 16:41:16'),
('12', 'INV-POS-20261103004116-D1497', '6', 'Bioflu 500mg Tablet', 'POS', '3', 'INV-20261101-0003', '0', '12', '-12', '300', '288', '6.00', '-72.00', 'BF-2610C', '2028-11-30', 'POS Sale Invoice #INV-20261101-0003 to Juan dela Cruz', '2026-11-01 13:20:00', '2026-11-02 16:41:16', '2026-11-02 16:41:16'),
('13', 'INV-STO-20261103004116-B2F05', '7', 'Alaxan FR Box (100s)', 'StockIn', '4', 'DR-20261101-004', '10', '0', '10', '0', '10', '850.00', '8500.00', 'AX-2610D', '2028-08-31', 'Stock-In delivery #DR-20261101-004 from Zuellig Pharma Philippines', '2026-11-01 09:15:00', '2026-11-02 16:41:16', '2026-11-02 16:41:16'),
('14', 'INV-CON-20261103004117-7B9DE', '7', 'Alaxan FR Box (100s)', 'Conversion', '4', 'CNV-20261101-0004', '0', '2', '-2', '10', '8', '850.00', '-1700.00', 'AX-2610D', '2028-08-31', 'Unboxed 2 Boxes into 200 Alaxan FR Capsule (#CNV-20261101-0004)', '2026-11-01 10:00:00', '2026-11-02 16:41:17', '2026-11-02 16:41:17'),
('15', 'INV-CON-20261103004117-6270B', '8', 'Alaxan FR Capsule', 'Conversion', '4', 'CNV-20261101-0004', '200', '0', '200', '0', '200', '8.50', '1700.00', 'AX-2610D', '2028-08-31', 'Received 200 from Alaxan FR Box (100s) (#CNV-20261101-0004)', '2026-11-01 10:00:00', '2026-11-02 16:41:17', '2026-11-02 16:41:17'),
('16', 'INV-POS-20261103004118-27195', '8', 'Alaxan FR Capsule', 'POS', '4', 'INV-20261101-0004', '0', '10', '-10', '200', '190', '8.50', '-85.00', 'AX-2610D', '2028-08-31', 'POS Sale Invoice #INV-20261101-0004 to Lolo Ernesto Macaraeg', '2026-11-01 14:45:00', '2026-11-02 16:41:18', '2026-11-02 16:41:18'),
('17', 'INV-STO-20261103004118-356E9', '9', 'RiteMed Amoxicillin 500mg Box (100s)', 'StockIn', '5', 'DR-20261101-005', '10', '0', '10', '0', '10', '480.00', '4800.00', 'AM-2610E', '2028-06-30', 'Stock-In delivery #DR-20261101-005 from Pascual Laboratories Inc.', '2026-11-01 09:30:00', '2026-11-02 16:41:18', '2026-11-02 16:41:18'),
('18', 'INV-CON-20261103004119-52509', '9', 'RiteMed Amoxicillin 500mg Box (100s)', 'Conversion', '5', 'CNV-20261101-0005', '0', '2', '-2', '10', '8', '480.00', '-960.00', 'AM-2610E', '2028-06-30', 'Unboxed 2 Boxes into 200 RiteMed Amoxicillin 500mg Capsule (#CNV-20261101-0005)', '2026-11-01 10:15:00', '2026-11-02 16:41:19', '2026-11-02 16:41:19'),
('19', 'INV-CON-20261103004119-84E94', '10', 'RiteMed Amoxicillin 500mg Capsule', 'Conversion', '5', 'CNV-20261101-0005', '200', '0', '200', '0', '200', '4.80', '960.00', 'AM-2610E', '2028-06-30', 'Received 200 from RiteMed Amoxicillin 500mg Box (100s) (#CNV-20261101-0005)', '2026-11-01 10:15:00', '2026-11-02 16:41:19', '2026-11-02 16:41:19'),
('20', 'INV-POS-20261103004119-C63A5', '10', 'RiteMed Amoxicillin 500mg Capsule', 'POS', '5', 'INV-20261101-0005', '0', '21', '-21', '200', '179', '4.80', '-100.80', 'AM-2610E', '2028-06-30', 'POS Sale Invoice #INV-20261101-0005 to Maria Clara Santos', '2026-11-01 16:10:00', '2026-11-02 16:41:19', '2026-11-02 16:41:19');

-- --------------------------------------------------------
-- Table structure for table `migrations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `migrations` (9 records)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
('1', '0001_01_01_000000_create_users_table', '1'),
('2', '0001_01_01_000001_create_cache_table', '1'),
('3', '0001_01_01_000002_create_jobs_table', '1'),
('4', '2026_09_30_000001_create_suppliers_and_categories_tables', '1'),
('5', '2026_09_30_000002_create_products_table', '1'),
('6', '2026_09_30_000003_create_sales_tables', '1'),
('7', '2026_09_30_000004_create_stock_in_tables', '1'),
('8', '2026_09_30_000005_create_stock_out_tables', '1'),
('9', '2026_09_30_000006_create_conversions_and_movements_tables', '1');

-- --------------------------------------------------------
-- Table structure for table `products`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(255) NOT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `generic_name` varchar(255) DEFAULT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `uom` varchar(255) NOT NULL DEFAULT 'Box',
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cost_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `reorder_point` int(11) NOT NULL DEFAULT 10,
  `batch_no` varchar(255) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `daily_avg_sales` decimal(8,2) NOT NULL DEFAULT 0.00,
  `forecast_demand_30d` int(11) NOT NULL DEFAULT 0,
  `status` varchar(255) NOT NULL DEFAULT 'In Stock',
  `is_bulk` tinyint(1) NOT NULL DEFAULT 0,
  `parent_product_id` bigint(20) unsigned DEFAULT NULL,
  `child_product_id` bigint(20) unsigned DEFAULT NULL,
  `conversion_rate` int(11) NOT NULL DEFAULT 100,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_sku_unique` (`sku`),
  KEY `products_category_id_foreign` (`category_id`),
  KEY `products_parent_product_id_foreign` (`parent_product_id`),
  KEY `products_child_product_id_foreign` (`child_product_id`),
  KEY `products_barcode_index` (`barcode`),
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_child_product_id_foreign` FOREIGN KEY (`child_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_parent_product_id_foreign` FOREIGN KEY (`parent_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `products` (10 records)
INSERT INTO `products` (`id`, `sku`, `barcode`, `name`, `generic_name`, `category_id`, `category`, `uom`, `unit_price`, `cost_price`, `stock`, `reorder_point`, `batch_no`, `expiry_date`, `daily_avg_sales`, `forecast_demand_30d`, `status`, `is_bulk`, `parent_product_id`, `child_product_id`, `conversion_rate`, `created_at`, `updated_at`) VALUES
('1', 'SKU-BIO-BOX', '480001661101', 'Biogesic 500mg Box (100s)', 'Paracetamol', '1', 'Analgesics', 'Box', '700.00', '500.00', '8', '3', 'BG-2610A', '2028-10-31', '0.00', '0', 'Low Stock', '1', NULL, '2', '100', '2026-11-01 00:54:31', '2026-11-02 16:42:04'),
('2', 'SKU-BIO-TAB', '480001661102', 'Biogesic 500mg Tablet', 'Paracetamol', '1', 'Analgesics', 'Tablet', '8.00', '5.00', '180', '20', 'BG-2610A', '2028-10-31', '0.00', '0', 'In Stock', '0', '1', NULL, '1', '2026-11-01 00:54:32', '2026-11-02 16:42:05'),
('3', 'SKU-NZP-BOX', '480001662201', 'Neozep Forte Box (100s)', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Box', '750.00', '550.00', '8', '3', 'NZ-2610B', '2028-09-30', '0.00', '0', 'Low Stock', '1', NULL, '4', '100', '2026-11-01 00:54:32', '2026-11-02 16:42:05'),
('4', 'SKU-NZP-TAB', '480001662202', 'Neozep Forte Tablet', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Tablet', '9.00', '5.50', '185', '20', 'NZ-2610B', '2028-09-30', '0.00', '0', 'In Stock', '0', '3', NULL, '1', '2026-11-01 00:54:32', '2026-11-02 16:42:06'),
('5', 'SKU-BFL-BOX', '480001663301', 'Bioflu 500mg Box (100s)', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Box', '800.00', '600.00', '7', '3', 'BF-2610C', '2028-11-30', '0.00', '0', 'Low Stock', '1', NULL, '6', '100', '2026-11-01 00:54:32', '2026-11-02 16:42:06'),
('6', 'SKU-BFL-TAB', '480001663302', 'Bioflu 500mg Tablet', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Tablet', '9.50', '6.00', '288', '20', 'BF-2610C', '2028-11-30', '0.00', '0', 'In Stock', '0', '5', NULL, '1', '2026-11-01 00:54:32', '2026-11-02 16:42:06'),
('7', 'SKU-ALX-BOX', '480001664401', 'Alaxan FR Box (100s)', 'Paracetamol + Ibuprofen (325mg/200mg)', '1', 'Analgesics', 'Box', '1050.00', '850.00', '8', '3', 'AX-2610D', '2028-08-31', '0.00', '0', 'Low Stock', '1', NULL, '8', '100', '2026-11-01 00:54:32', '2026-11-02 16:42:06'),
('8', 'SKU-ALX-CAP', '480001664402', 'Alaxan FR Capsule', 'Paracetamol + Ibuprofen (325mg/200mg)', '1', 'Analgesics', 'Capsule', '13.00', '8.50', '190', '20', 'AX-2610D', '2028-08-31', '0.00', '0', 'In Stock', '0', '7', NULL, '1', '2026-11-01 00:54:32', '2026-11-02 16:42:07'),
('9', 'SKU-AMX-BOX', '480001665501', 'RiteMed Amoxicillin 500mg Box (100s)', 'Amoxicillin Trihydrate', '2', 'Antibiotics', 'Box', '650.00', '480.00', '8', '3', 'AM-2610E', '2028-06-30', '0.00', '0', 'Low Stock', '1', NULL, '10', '100', '2026-11-01 00:54:32', '2026-11-02 16:42:07'),
('10', 'SKU-AMX-CAP', '480001665502', 'RiteMed Amoxicillin 500mg Capsule', 'Amoxicillin Trihydrate', '2', 'Antibiotics', 'Capsule', '8.50', '4.80', '179', '20', 'AM-2610E', '2028-06-30', '0.00', '0', 'In Stock', '0', '9', NULL, '1', '2026-11-01 00:54:32', '2026-11-02 16:42:07');

-- --------------------------------------------------------
-- Table structure for table `purchase_orders`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `po_number` varchar(255) NOT NULL,
  `supplier_id` bigint(20) unsigned DEFAULT NULL,
  `supplier_name` varchar(255) DEFAULT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `suggested_qty` int(11) NOT NULL DEFAULT 0,
  `order_qty` int(11) NOT NULL DEFAULT 0,
  `unit_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` varchar(255) NOT NULL DEFAULT 'Pending',
  `expected_delivery` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_orders_po_number_unique` (`po_number`),
  KEY `purchase_orders_supplier_id_foreign` (`supplier_id`),
  KEY `purchase_orders_product_id_foreign` (`product_id`),
  CONSTRAINT `purchase_orders_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_orders_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sale_items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cost_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `batch_no` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_items_sale_id_foreign` (`sale_id`),
  KEY `sale_items_product_id_foreign` (`product_id`),
  CONSTRAINT `sale_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sale_items_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sale_items` (65 records)
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `cost_price`, `batch_no`, `expiry_date`, `subtotal`, `created_at`, `updated_at`) VALUES
('1', '1', '2', 'Biogesic 500mg Tablet', '20', '8.00', '5.00', 'BG-2610A', '2028-10-31', '160.00', '2026-11-01 10:15:00', '2026-11-01 10:15:00'),
('2', '2', '4', 'Neozep Forte Tablet', '15', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '135.00', '2026-11-01 11:00:00', '2026-11-01 11:00:00'),
('3', '3', '6', 'Bioflu 500mg Tablet', '12', '9.50', '6.00', 'BF-2610C', '2028-11-30', '114.00', '2026-11-01 13:20:00', '2026-11-01 13:20:00'),
('4', '4', '8', 'Alaxan FR Capsule', '10', '13.00', '8.50', 'AX-2610D', '2028-08-31', '130.00', '2026-11-01 14:45:00', '2026-11-01 14:45:00'),
('5', '5', '10', 'RiteMed Amoxicillin 500mg Capsule', '21', '8.50', '4.80', 'AM-2610E', '2028-06-30', '178.50', '2026-11-01 16:10:00', '2026-11-01 16:10:00'),
('6', '6', '2', 'Biogesic 500mg Tablet', '15', '8.00', '5.00', 'BG-2610A', '2028-10-31', '120.00', '2025-01-12 11:30:00', '2025-01-12 11:30:00'),
('7', '6', '4', 'Neozep Forte Tablet', '14', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '126.00', '2025-01-12 11:30:00', '2025-01-12 11:30:00'),
('8', '6', '6', 'Bioflu 500mg Tablet', '15', '9.50', '6.00', 'BF-2610C', '2028-11-30', '142.50', '2025-01-12 11:30:00', '2025-01-12 11:30:00'),
('9', '7', '8', 'Alaxan FR Capsule', '12', '13.00', '8.50', 'AX-2610D', '2028-08-31', '156.00', '2025-01-24 11:30:00', '2025-01-24 11:30:00'),
('10', '7', '10', 'RiteMed Amoxicillin 500mg Capsule', '12', '8.50', '4.80', 'AM-2610E', '2028-06-30', '102.00', '2025-01-24 11:30:00', '2025-01-24 11:30:00'),
('11', '8', '2', 'Biogesic 500mg Tablet', '14', '8.00', '5.00', 'BG-2610A', '2028-10-31', '112.00', '2025-02-12 11:30:00', '2025-02-12 11:30:00'),
('12', '8', '4', 'Neozep Forte Tablet', '14', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '126.00', '2025-02-12 11:30:00', '2025-02-12 11:30:00'),
('13', '8', '6', 'Bioflu 500mg Tablet', '15', '9.50', '6.00', 'BF-2610C', '2028-11-30', '142.50', '2025-02-12 11:30:00', '2025-02-12 11:30:00'),
('14', '9', '8', 'Alaxan FR Capsule', '12', '13.00', '8.50', 'AX-2610D', '2028-08-31', '156.00', '2025-02-24 11:30:00', '2025-02-24 11:30:00'),
('15', '9', '10', 'RiteMed Amoxicillin 500mg Capsule', '12', '8.50', '4.80', 'AM-2610E', '2028-06-30', '102.00', '2025-02-24 11:30:00', '2025-02-24 11:30:00'),
('16', '10', '2', 'Biogesic 500mg Tablet', '16', '8.00', '5.00', 'BG-2610A', '2028-10-31', '128.00', '2025-03-12 11:30:00', '2025-03-12 11:30:00'),
('17', '10', '4', 'Neozep Forte Tablet', '15', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '135.00', '2025-03-12 11:30:00', '2025-03-12 11:30:00'),
('18', '10', '6', 'Bioflu 500mg Tablet', '16', '9.50', '6.00', 'BF-2610C', '2028-11-30', '152.00', '2025-03-12 11:30:00', '2025-03-12 11:30:00'),
('19', '11', '8', 'Alaxan FR Capsule', '14', '13.00', '8.50', 'AX-2610D', '2028-08-31', '182.00', '2025-03-24 11:30:00', '2025-03-24 11:30:00'),
('20', '11', '10', 'RiteMed Amoxicillin 500mg Capsule', '14', '8.50', '4.80', 'AM-2610E', '2028-06-30', '119.00', '2025-03-24 11:30:00', '2025-03-24 11:30:00'),
('21', '12', '2', 'Biogesic 500mg Tablet', '18', '8.00', '5.00', 'BG-2610A', '2028-10-31', '144.00', '2025-04-12 11:30:00', '2025-04-12 11:30:00'),
('22', '12', '4', 'Neozep Forte Tablet', '16', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '144.00', '2025-04-12 11:30:00', '2025-04-12 11:30:00'),
('23', '12', '6', 'Bioflu 500mg Tablet', '18', '9.50', '6.00', 'BF-2610C', '2028-11-30', '171.00', '2025-04-12 11:30:00', '2025-04-12 11:30:00'),
('24', '13', '8', 'Alaxan FR Capsule', '15', '13.00', '8.50', 'AX-2610D', '2028-08-31', '195.00', '2025-04-24 11:30:00', '2025-04-24 11:30:00'),
('25', '13', '10', 'RiteMed Amoxicillin 500mg Capsule', '15', '8.50', '4.80', 'AM-2610E', '2028-06-30', '127.50', '2025-04-24 11:30:00', '2025-04-24 11:30:00'),
('26', '14', '2', 'Biogesic 500mg Tablet', '16', '8.00', '5.00', 'BG-2610A', '2028-10-31', '128.00', '2025-05-12 11:30:00', '2025-05-12 11:30:00'),
('27', '14', '4', 'Neozep Forte Tablet', '15', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '135.00', '2025-05-12 11:30:00', '2025-05-12 11:30:00'),
('28', '14', '6', 'Bioflu 500mg Tablet', '16', '9.50', '6.00', 'BF-2610C', '2028-11-30', '152.00', '2025-05-12 11:30:00', '2025-05-12 11:30:00'),
('29', '15', '8', 'Alaxan FR Capsule', '14', '13.00', '8.50', 'AX-2610D', '2028-08-31', '182.00', '2025-05-24 11:30:00', '2025-05-24 11:30:00'),
('30', '15', '10', 'RiteMed Amoxicillin 500mg Capsule', '14', '8.50', '4.80', 'AM-2610E', '2028-06-30', '119.00', '2025-05-24 11:30:00', '2025-05-24 11:30:00'),
('31', '16', '2', 'Biogesic 500mg Tablet', '20', '8.00', '5.00', 'BG-2610A', '2028-10-31', '160.00', '2025-06-12 11:30:00', '2025-06-12 11:30:00'),
('32', '16', '4', 'Neozep Forte Tablet', '18', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '162.00', '2025-06-12 11:30:00', '2025-06-12 11:30:00'),
('33', '16', '6', 'Bioflu 500mg Tablet', '20', '9.50', '6.00', 'BF-2610C', '2028-11-30', '190.00', '2025-06-12 11:30:00', '2025-06-12 11:30:00'),
('34', '17', '8', 'Alaxan FR Capsule', '16', '13.00', '8.50', 'AX-2610D', '2028-08-31', '208.00', '2025-06-24 11:30:00', '2025-06-24 11:30:00'),
('35', '17', '10', 'RiteMed Amoxicillin 500mg Capsule', '16', '8.50', '4.80', 'AM-2610E', '2028-06-30', '136.00', '2025-06-24 11:30:00', '2025-06-24 11:30:00'),
('36', '18', '2', 'Biogesic 500mg Tablet', '26', '8.00', '5.00', 'BG-2610A', '2028-10-31', '208.00', '2025-07-12 11:30:00', '2025-07-12 11:30:00'),
('37', '18', '4', 'Neozep Forte Tablet', '25', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '225.00', '2025-07-12 11:30:00', '2025-07-12 11:30:00'),
('38', '18', '6', 'Bioflu 500mg Tablet', '28', '9.50', '6.00', 'BF-2610C', '2028-11-30', '266.00', '2025-07-12 11:30:00', '2025-07-12 11:30:00'),
('39', '19', '8', 'Alaxan FR Capsule', '24', '13.00', '8.50', 'AX-2610D', '2028-08-31', '312.00', '2025-07-24 11:30:00', '2025-07-24 11:30:00'),
('40', '19', '10', 'RiteMed Amoxicillin 500mg Capsule', '22', '8.50', '4.80', 'AM-2610E', '2028-06-30', '187.00', '2025-07-24 11:30:00', '2025-07-24 11:30:00'),
('41', '20', '2', 'Biogesic 500mg Tablet', '28', '8.00', '5.00', 'BG-2610A', '2028-10-31', '224.00', '2025-08-12 11:30:00', '2025-08-12 11:30:00'),
('42', '20', '4', 'Neozep Forte Tablet', '26', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '234.00', '2025-08-12 11:30:00', '2025-08-12 11:30:00'),
('43', '20', '6', 'Bioflu 500mg Tablet', '30', '9.50', '6.00', 'BF-2610C', '2028-11-30', '285.00', '2025-08-12 11:30:00', '2025-08-12 11:30:00'),
('44', '21', '8', 'Alaxan FR Capsule', '25', '13.00', '8.50', 'AX-2610D', '2028-08-31', '325.00', '2025-08-24 11:30:00', '2025-08-24 11:30:00'),
('45', '21', '10', 'RiteMed Amoxicillin 500mg Capsule', '24', '8.50', '4.80', 'AM-2610E', '2028-06-30', '204.00', '2025-08-24 11:30:00', '2025-08-24 11:30:00'),
('46', '22', '2', 'Biogesic 500mg Tablet', '22', '8.00', '5.00', 'BG-2610A', '2028-10-31', '176.00', '2025-09-12 11:30:00', '2025-09-12 11:30:00'),
('47', '22', '4', 'Neozep Forte Tablet', '20', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '180.00', '2025-09-12 11:30:00', '2025-09-12 11:30:00'),
('48', '22', '6', 'Bioflu 500mg Tablet', '22', '9.50', '6.00', 'BF-2610C', '2028-11-30', '209.00', '2025-09-12 11:30:00', '2025-09-12 11:30:00'),
('49', '23', '8', 'Alaxan FR Capsule', '18', '13.00', '8.50', 'AX-2610D', '2028-08-31', '234.00', '2025-09-24 11:30:00', '2025-09-24 11:30:00'),
('50', '23', '10', 'RiteMed Amoxicillin 500mg Capsule', '18', '8.50', '4.80', 'AM-2610E', '2028-06-30', '153.00', '2025-09-24 11:30:00', '2025-09-24 11:30:00'),
('51', '24', '2', 'Biogesic 500mg Tablet', '24', '8.00', '5.00', 'BG-2610A', '2028-10-31', '192.00', '2025-10-12 11:30:00', '2025-10-12 11:30:00'),
('52', '24', '4', 'Neozep Forte Tablet', '22', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '198.00', '2025-10-12 11:30:00', '2025-10-12 11:30:00'),
('53', '24', '6', 'Bioflu 500mg Tablet', '25', '9.50', '6.00', 'BF-2610C', '2028-11-30', '237.50', '2025-10-12 11:30:00', '2025-10-12 11:30:00'),
('54', '25', '8', 'Alaxan FR Capsule', '20', '13.00', '8.50', 'AX-2610D', '2028-08-31', '260.00', '2025-10-24 11:30:00', '2025-10-24 11:30:00'),
('55', '25', '10', 'RiteMed Amoxicillin 500mg Capsule', '20', '8.50', '4.80', 'AM-2610E', '2028-06-30', '170.00', '2025-10-24 11:30:00', '2025-10-24 11:30:00'),
('56', '26', '2', 'Biogesic 500mg Tablet', '28', '8.00', '5.00', 'BG-2610A', '2028-10-31', '224.00', '2025-11-12 11:30:00', '2025-11-12 11:30:00'),
('57', '26', '4', 'Neozep Forte Tablet', '26', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '234.00', '2025-11-12 11:30:00', '2025-11-12 11:30:00'),
('58', '26', '6', 'Bioflu 500mg Tablet', '30', '9.50', '6.00', 'BF-2610C', '2028-11-30', '285.00', '2025-11-12 11:30:00', '2025-11-12 11:30:00'),
('59', '27', '8', 'Alaxan FR Capsule', '26', '13.00', '8.50', 'AX-2610D', '2028-08-31', '338.00', '2025-11-24 11:30:00', '2025-11-24 11:30:00'),
('60', '27', '10', 'RiteMed Amoxicillin 500mg Capsule', '24', '8.50', '4.80', 'AM-2610E', '2028-06-30', '204.00', '2025-11-24 11:30:00', '2025-11-24 11:30:00'),
('61', '28', '2', 'Biogesic 500mg Tablet', '25', '8.00', '5.00', 'BG-2610A', '2028-10-31', '200.00', '2025-12-12 11:30:00', '2025-12-12 11:30:00'),
('62', '28', '4', 'Neozep Forte Tablet', '25', '9.00', '5.50', 'NZ-2610B', '2028-09-30', '225.00', '2025-12-12 11:30:00', '2025-12-12 11:30:00'),
('63', '28', '6', 'Bioflu 500mg Tablet', '26', '9.50', '6.00', 'BF-2610C', '2028-11-30', '247.00', '2025-12-12 11:30:00', '2025-12-12 11:30:00'),
('64', '29', '8', 'Alaxan FR Capsule', '24', '13.00', '8.50', 'AX-2610D', '2028-08-31', '312.00', '2025-12-24 11:30:00', '2025-12-24 11:30:00'),
('65', '29', '10', 'RiteMed Amoxicillin 500mg Capsule', '20', '8.50', '4.80', 'AM-2610E', '2028-06-30', '170.00', '2025-12-24 11:30:00', '2025-12-24 11:30:00');

-- --------------------------------------------------------
-- Table structure for table `sale_return_items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sale_return_items`;
CREATE TABLE `sale_return_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sale_return_id` bigint(20) unsigned NOT NULL,
  `sale_item_id` bigint(20) unsigned DEFAULT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `batch_no` varchar(255) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `restocked` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sale_return_items_return_id_index` (`sale_return_id`),
  KEY `sale_return_items_product_id_index` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sale_returns`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sale_returns`;
CREATE TABLE `sale_returns` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `return_no` varchar(255) NOT NULL,
  `sale_id` bigint(20) unsigned NOT NULL,
  `invoice_no` varchar(255) NOT NULL,
  `cashier` varchar(255) DEFAULT 'Pharmacist',
  `customer_name` varchar(255) DEFAULT 'Walk-in Customer',
  `reason` varchar(255) NOT NULL,
  `condition_type` varchar(100) NOT NULL DEFAULT 'resellable',
  `refund_method` varchar(100) NOT NULL DEFAULT 'Cash',
  `refund_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `restocked` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sale_returns_return_no_unique` (`return_no`),
  KEY `sale_returns_sale_id_index` (`sale_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sales`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(255) NOT NULL,
  `cashier` varchar(255) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount_type` varchar(255) DEFAULT NULL,
  `customer_type` varchar(255) NOT NULL DEFAULT 'regular',
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_id_no` varchar(255) DEFAULT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `vatable_sales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `vat_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `vat_exempt_sales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `zero_rated_sales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(255) NOT NULL DEFAULT 'Cash',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `change` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_invoice_no_unique` (`invoice_no`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sales` (29 records)
INSERT INTO `sales` (`id`, `invoice_no`, `cashier`, `subtotal`, `discount`, `discount_type`, `customer_type`, `customer_name`, `customer_id_no`, `total`, `vatable_sales`, `vat_amount`, `vat_exempt_sales`, `zero_rated_sales`, `payment_method`, `amount_paid`, `change`, `notes`, `created_at`, `updated_at`) VALUES
('1', 'INV-20261101-0001', 'Cashier Xyra', '160.00', '45.71', 'Senior Citizen (20%)', 'senior', 'Lola Remedios Santos', 'OSCA-2024-8841', '114.29', '0.00', '0.00', '114.29', '0.00', 'Cash', '120.00', '5.71', 'POS Checkout Completed', '2026-11-01 10:15:00', '2026-11-01 10:15:00'),
('2', 'INV-20261101-0002', 'Cashier Xyra', '135.00', '38.57', 'PWD (20%)', 'pwd', 'Roberto Tan', 'PWD-2023-4109', '96.43', '0.00', '0.00', '96.43', '0.00', 'GCash', '96.43', '0.00', 'POS Checkout Completed', '2026-11-01 11:00:00', '2026-11-01 11:00:00'),
('3', 'INV-20261101-0003', 'Cashier Xyra', '114.00', '0.00', 'Regular', 'regular', 'Juan dela Cruz', NULL, '114.00', '101.79', '12.21', '0.00', '0.00', 'Cash', '200.00', '86.00', 'POS Checkout Completed', '2026-11-01 13:20:00', '2026-11-01 13:20:00'),
('4', 'INV-20261101-0004', 'Cashier Xyra', '130.00', '37.14', 'Senior Citizen (20%)', 'senior', 'Lolo Ernesto Macaraeg', 'OSCA-2025-1192', '92.86', '0.00', '0.00', '92.86', '0.00', 'Cash', '100.00', '7.14', 'POS Checkout Completed', '2026-11-01 14:45:00', '2026-11-01 14:45:00'),
('5', 'INV-20261101-0005', 'Cashier Xyra', '178.50', '0.00', 'Regular', 'regular', 'Maria Clara Santos', NULL, '178.50', '159.38', '19.12', '0.00', '0.00', 'Maya', '178.50', '0.00', 'POS Checkout Completed', '2026-11-01 16:10:00', '2026-11-01 16:10:00'),
('6', 'INV-202501-2001', 'Cashier Juan', '388.50', '0.00', 'Regular', 'regular', 'Juan dela Cruz', NULL, '388.50', '346.88', '41.62', '0.00', '0.00', 'Cash', '400.00', '11.50', '2025 Historical Sales Record', '2025-01-12 11:30:00', '2025-01-12 11:30:00'),
('7', 'INV-202501-2002', 'Cashier Juan', '258.00', '0.00', 'Regular', 'regular', 'Maria Clara Santos', NULL, '258.00', '230.36', '27.64', '0.00', '0.00', 'Maya', '300.00', '42.00', '2025 Historical Sales Record', '2025-01-24 11:30:00', '2025-01-24 11:30:00'),
('8', 'INV-202502-2003', 'Cashier Xyra', '380.50', '108.72', 'Senior Citizen (20%)', 'senior', 'Lolo Ernesto Macaraeg', 'OSCA-2025-1192', '271.78', '0.00', '0.00', '271.78', '0.00', 'Cash', '300.00', '28.22', '2025 Historical Sales Record', '2025-02-12 11:30:00', '2025-02-12 11:30:00'),
('9', 'INV-202502-2004', 'Cashier Xyra', '258.00', '0.00', 'Regular', 'regular', 'Teresa Reyes', NULL, '258.00', '230.36', '27.64', '0.00', '0.00', 'Cash', '300.00', '42.00', '2025 Historical Sales Record', '2025-02-24 11:30:00', '2025-02-24 11:30:00'),
('10', 'INV-202503-2005', 'Cashier Juan', '415.00', '118.57', 'Senior Citizen (20%)', 'senior', 'Lola Remedios Santos', 'OSCA-2024-8841', '296.43', '0.00', '0.00', '296.43', '0.00', 'Cash', '300.00', '3.57', '2025 Historical Sales Record', '2025-03-12 11:30:00', '2025-03-12 11:30:00'),
('11', 'INV-202503-2006', 'Cashier Juan', '301.00', '86.00', 'PWD (20%)', 'pwd', 'Roberto Tan', 'PWD-2023-4109', '215.00', '0.00', '0.00', '215.00', '0.00', 'GCash', '250.00', '35.00', '2025 Historical Sales Record', '2025-03-24 11:30:00', '2025-03-24 11:30:00'),
('12', 'INV-202504-2007', 'Cashier Xyra', '459.00', '0.00', 'Regular', 'regular', 'Juan dela Cruz', NULL, '459.00', '409.82', '49.18', '0.00', '0.00', 'Cash', '500.00', '41.00', '2025 Historical Sales Record', '2025-04-12 11:30:00', '2025-04-12 11:30:00'),
('13', 'INV-202504-2008', 'Cashier Xyra', '322.50', '0.00', 'Regular', 'regular', 'Maria Clara Santos', NULL, '322.50', '287.95', '34.55', '0.00', '0.00', 'Maya', '350.00', '27.50', '2025 Historical Sales Record', '2025-04-24 11:30:00', '2025-04-24 11:30:00'),
('14', 'INV-202505-2009', 'Cashier Juan', '415.00', '118.57', 'Senior Citizen (20%)', 'senior', 'Lolo Ernesto Macaraeg', 'OSCA-2025-1192', '296.43', '0.00', '0.00', '296.43', '0.00', 'Cash', '300.00', '3.57', '2025 Historical Sales Record', '2025-05-12 11:30:00', '2025-05-12 11:30:00'),
('15', 'INV-202505-2010', 'Cashier Juan', '301.00', '0.00', 'Regular', 'regular', 'Teresa Reyes', NULL, '301.00', '268.75', '32.25', '0.00', '0.00', 'Cash', '350.00', '49.00', '2025 Historical Sales Record', '2025-05-24 11:30:00', '2025-05-24 11:30:00'),
('16', 'INV-202506-2011', 'Cashier Xyra', '512.00', '146.29', 'Senior Citizen (20%)', 'senior', 'Lola Remedios Santos', 'OSCA-2024-8841', '365.71', '0.00', '0.00', '365.71', '0.00', 'Cash', '400.00', '34.29', '2025 Historical Sales Record', '2025-06-12 11:30:00', '2025-06-12 11:30:00'),
('17', 'INV-202506-2012', 'Cashier Xyra', '344.00', '98.29', 'PWD (20%)', 'pwd', 'Roberto Tan', 'PWD-2023-4109', '245.71', '0.00', '0.00', '245.71', '0.00', 'GCash', '250.00', '4.29', '2025 Historical Sales Record', '2025-06-24 11:30:00', '2025-06-24 11:30:00'),
('18', 'INV-202507-2013', 'Cashier Juan', '699.00', '0.00', 'Regular', 'regular', 'Juan dela Cruz', NULL, '699.00', '624.11', '74.89', '0.00', '0.00', 'Cash', '700.00', '1.00', '2025 Historical Sales Record', '2025-07-12 11:30:00', '2025-07-12 11:30:00'),
('19', 'INV-202507-2014', 'Cashier Juan', '499.00', '0.00', 'Regular', 'regular', 'Maria Clara Santos', NULL, '499.00', '445.54', '53.46', '0.00', '0.00', 'Maya', '500.00', '1.00', '2025 Historical Sales Record', '2025-07-24 11:30:00', '2025-07-24 11:30:00'),
('20', 'INV-202508-2015', 'Cashier Xyra', '743.00', '212.29', 'Senior Citizen (20%)', 'senior', 'Lolo Ernesto Macaraeg', 'OSCA-2025-1192', '530.71', '0.00', '0.00', '530.71', '0.00', 'Cash', '550.00', '19.29', '2025 Historical Sales Record', '2025-08-12 11:30:00', '2025-08-12 11:30:00'),
('21', 'INV-202508-2016', 'Cashier Xyra', '529.00', '0.00', 'Regular', 'regular', 'Teresa Reyes', NULL, '529.00', '472.32', '56.68', '0.00', '0.00', 'Cash', '550.00', '21.00', '2025 Historical Sales Record', '2025-08-24 11:30:00', '2025-08-24 11:30:00'),
('22', 'INV-202509-2017', 'Cashier Juan', '565.00', '161.43', 'Senior Citizen (20%)', 'senior', 'Lola Remedios Santos', 'OSCA-2024-8841', '403.57', '0.00', '0.00', '403.57', '0.00', 'Cash', '450.00', '46.43', '2025 Historical Sales Record', '2025-09-12 11:30:00', '2025-09-12 11:30:00'),
('23', 'INV-202509-2018', 'Cashier Juan', '387.00', '110.57', 'PWD (20%)', 'pwd', 'Roberto Tan', 'PWD-2023-4109', '276.43', '0.00', '0.00', '276.43', '0.00', 'GCash', '300.00', '23.57', '2025 Historical Sales Record', '2025-09-24 11:30:00', '2025-09-24 11:30:00'),
('24', 'INV-202510-2019', 'Cashier Xyra', '627.50', '0.00', 'Regular', 'regular', 'Juan dela Cruz', NULL, '627.50', '560.27', '67.23', '0.00', '0.00', 'Cash', '650.00', '22.50', '2025 Historical Sales Record', '2025-10-12 11:30:00', '2025-10-12 11:30:00'),
('25', 'INV-202510-2020', 'Cashier Xyra', '430.00', '0.00', 'Regular', 'regular', 'Maria Clara Santos', NULL, '430.00', '383.93', '46.07', '0.00', '0.00', 'Maya', '450.00', '20.00', '2025 Historical Sales Record', '2025-10-24 11:30:00', '2025-10-24 11:30:00'),
('26', 'INV-202511-2021', 'Cashier Juan', '743.00', '212.29', 'Senior Citizen (20%)', 'senior', 'Lolo Ernesto Macaraeg', 'OSCA-2025-1192', '530.71', '0.00', '0.00', '530.71', '0.00', 'Cash', '550.00', '19.29', '2025 Historical Sales Record', '2025-11-12 11:30:00', '2025-11-12 11:30:00'),
('27', 'INV-202511-2022', 'Cashier Juan', '542.00', '0.00', 'Regular', 'regular', 'Teresa Reyes', NULL, '542.00', '483.93', '58.07', '0.00', '0.00', 'Cash', '550.00', '8.00', '2025 Historical Sales Record', '2025-11-24 11:30:00', '2025-11-24 11:30:00'),
('28', 'INV-202512-2023', 'Cashier Xyra', '672.00', '192.00', 'Senior Citizen (20%)', 'senior', 'Lola Remedios Santos', 'OSCA-2024-8841', '480.00', '0.00', '0.00', '480.00', '0.00', 'Cash', '500.00', '20.00', '2025 Historical Sales Record', '2025-12-12 11:30:00', '2025-12-12 11:30:00'),
('29', 'INV-202512-2024', 'Cashier Xyra', '482.00', '137.71', 'PWD (20%)', 'pwd', 'Roberto Tan', 'PWD-2023-4109', '344.29', '0.00', '0.00', '344.29', '0.00', 'GCash', '350.00', '5.71', '2025 Historical Sales Record', '2025-12-24 11:30:00', '2025-12-24 11:30:00');

-- --------------------------------------------------------
-- Table structure for table `sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sessions` (2 records)
INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('cwWHm9ejs85qnjT47J4wHnfWPc3PycIYmQN9p0JO', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.9549', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiQVRLMk5vSlR6QkdKVDFJZmVaS0pYSFFwb1FoN0NmcFk5aVpndjVZSSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', '1790819704'),
('QOPZnMsQ2MWuwkLQAMTVGNv6WWKvPPoqar1NflPx', '1', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoiT3FDZVJRalZ1M1ljSjdBRmZYSzk4bkJ1MmdBRE9SVm45emgxQmoxZyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7czo1OiJyb3V0ZSI7czo0OiJob21lIjt9czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTtzOjE3OiJwYXNzd29yZF9oYXNoX3dlYiI7czo2NDoiNTVlZmE0ODIwMmZiYWJlMjY2MWMzYjgwZTE2NDFkNzU2OTg0NDYxMjE3NGFhOWYzNzcwNjA5MjZjYjlkNTg5ZiI7fQ==', '1790822161');

-- --------------------------------------------------------
-- Table structure for table `stock_in_items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_in_items`;
CREATE TABLE `stock_in_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stock_in_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `cost_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `batch_no` varchar(255) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_in_items_stock_in_id_foreign` (`stock_in_id`),
  KEY `stock_in_items_product_id_foreign` (`product_id`),
  CONSTRAINT `stock_in_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_in_items_stock_in_id_foreign` FOREIGN KEY (`stock_in_id`) REFERENCES `stock_ins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stock_in_items` (5 records)
INSERT INTO `stock_in_items` (`id`, `stock_in_id`, `product_id`, `product_name`, `quantity`, `cost_price`, `batch_no`, `expiry_date`, `created_at`, `updated_at`) VALUES
('1', '1', '1', 'Biogesic 500mg Box (100s)', '10', '500.00', 'BG-2610A', '2028-10-31', '2026-11-01 08:30:00', '2026-11-01 08:30:00'),
('2', '2', '3', 'Neozep Forte Box (100s)', '10', '550.00', 'NZ-2610B', '2028-09-30', '2026-11-01 08:45:00', '2026-11-01 08:45:00'),
('3', '3', '5', 'Bioflu 500mg Box (100s)', '10', '600.00', 'BF-2610C', '2028-11-30', '2026-11-01 09:00:00', '2026-11-01 09:00:00'),
('4', '4', '7', 'Alaxan FR Box (100s)', '10', '850.00', 'AX-2610D', '2028-08-31', '2026-11-01 09:15:00', '2026-11-01 09:15:00'),
('5', '5', '9', 'RiteMed Amoxicillin 500mg Box (100s)', '10', '480.00', 'AM-2610E', '2028-06-30', '2026-11-01 09:30:00', '2026-11-01 09:30:00');

-- --------------------------------------------------------
-- Table structure for table `stock_ins`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_ins`;
CREATE TABLE `stock_ins` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ref_no` varchar(255) NOT NULL,
  `supplier_id` bigint(20) unsigned DEFAULT NULL,
  `supplier_name` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `received_by` varchar(255) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_ins_ref_no_unique` (`ref_no`),
  KEY `stock_ins_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `stock_ins_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stock_ins` (5 records)
INSERT INTO `stock_ins` (`id`, `ref_no`, `supplier_id`, `supplier_name`, `date`, `received_by`, `total_amount`, `notes`, `created_at`, `updated_at`) VALUES
('1', 'DR-20261101-001', '1', 'Unilab Distribution Phils', '2026-11-01', 'Xyra Andrea (Pharmacist)', '5000.00', 'Delivery intake of 10 boxes from Unilab Distribution Phils', '2026-11-01 08:30:00', '2026-11-01 08:30:00'),
('2', 'DR-20261101-002', '1', 'Unilab Distribution Phils', '2026-11-01', 'Xyra Andrea (Pharmacist)', '5500.00', 'Delivery intake of 10 boxes from Unilab Distribution Phils', '2026-11-01 08:45:00', '2026-11-01 08:45:00'),
('3', 'DR-20261101-003', '1', 'Unilab Distribution Phils', '2026-11-01', 'Xyra Andrea (Pharmacist)', '6000.00', 'Delivery intake of 10 boxes from Unilab Distribution Phils', '2026-11-01 09:00:00', '2026-11-01 09:00:00'),
('4', 'DR-20261101-004', '3', 'Zuellig Pharma Philippines', '2026-11-01', 'Xyra Andrea (Pharmacist)', '8500.00', 'Delivery intake of 10 boxes from Zuellig Pharma Philippines', '2026-11-01 09:15:00', '2026-11-01 09:15:00'),
('5', 'DR-20261101-005', '2', 'Pascual Laboratories Inc.', '2026-11-01', 'Xyra Andrea (Pharmacist)', '4800.00', 'Delivery intake of 10 boxes from Pascual Laboratories Inc.', '2026-11-01 09:30:00', '2026-11-01 09:30:00');

-- --------------------------------------------------------
-- Table structure for table `stock_movements`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `movement_code` varchar(255) NOT NULL,
  `timestamp` datetime NOT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `qty_change` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reference_id` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_movements_movement_code_unique` (`movement_code`),
  KEY `stock_movements_product_id_foreign` (`product_id`),
  CONSTRAINT `stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `stock_movements` (20 records)
INSERT INTO `stock_movements` (`id`, `movement_code`, `timestamp`, `product_id`, `product_name`, `type`, `qty_change`, `previous_stock`, `new_stock`, `reference_id`, `remarks`, `created_at`, `updated_at`) VALUES
('1', 'MOV-IN-1', '2026-11-01 08:30:00', '1', 'Biogesic 500mg Box (100s)', 'STOCK_IN', '10', '0', '10', 'DR-20261101-001', 'Received 10 Boxes via DR-20261101-001', '2026-11-01 08:30:00', '2026-11-01 08:30:00'),
('2', 'MOV-CNV-OUT-1', '2026-11-01 09:30:00', '1', 'Biogesic 500mg Box (100s)', 'Conversion Out', '-2', '10', '8', 'CNV-20261101-0001', 'Unboxed to retail (#CNV-20261101-0001)', '2026-11-01 09:30:00', '2026-11-01 09:30:00'),
('3', 'MOV-CNV-IN-1', '2026-11-01 09:30:00', '2', 'Biogesic 500mg Tablet', 'Conversion In', '200', '0', '200', 'CNV-20261101-0001', 'Credited from unboxing (#CNV-20261101-0001)', '2026-11-01 09:30:00', '2026-11-01 09:30:00'),
('4', 'MOV-SALE-1', '2026-11-01 10:15:00', '2', 'Biogesic 500mg Tablet', 'SALE', '-20', '200', '180', 'INV-20261101-0001', 'Sold 20 units via #INV-20261101-0001', '2026-11-01 10:15:00', '2026-11-01 10:15:00'),
('5', 'MOV-IN-2', '2026-11-01 08:45:00', '3', 'Neozep Forte Box (100s)', 'STOCK_IN', '10', '0', '10', 'DR-20261101-002', 'Received 10 Boxes via DR-20261101-002', '2026-11-01 08:45:00', '2026-11-01 08:45:00'),
('6', 'MOV-CNV-OUT-2', '2026-11-01 09:40:00', '3', 'Neozep Forte Box (100s)', 'Conversion Out', '-2', '10', '8', 'CNV-20261101-0002', 'Unboxed to retail (#CNV-20261101-0002)', '2026-11-01 09:40:00', '2026-11-01 09:40:00'),
('7', 'MOV-CNV-IN-2', '2026-11-01 09:40:00', '4', 'Neozep Forte Tablet', 'Conversion In', '200', '0', '200', 'CNV-20261101-0002', 'Credited from unboxing (#CNV-20261101-0002)', '2026-11-01 09:40:00', '2026-11-01 09:40:00'),
('8', 'MOV-SALE-2', '2026-11-01 11:00:00', '4', 'Neozep Forte Tablet', 'SALE', '-15', '200', '185', 'INV-20261101-0002', 'Sold 15 units via #INV-20261101-0002', '2026-11-01 11:00:00', '2026-11-01 11:00:00'),
('9', 'MOV-IN-3', '2026-11-01 09:00:00', '5', 'Bioflu 500mg Box (100s)', 'STOCK_IN', '10', '0', '10', 'DR-20261101-003', 'Received 10 Boxes via DR-20261101-003', '2026-11-01 09:00:00', '2026-11-01 09:00:00'),
('10', 'MOV-CNV-OUT-3', '2026-11-01 09:50:00', '5', 'Bioflu 500mg Box (100s)', 'Conversion Out', '-3', '10', '7', 'CNV-20261101-0003', 'Unboxed to retail (#CNV-20261101-0003)', '2026-11-01 09:50:00', '2026-11-01 09:50:00'),
('11', 'MOV-CNV-IN-3', '2026-11-01 09:50:00', '6', 'Bioflu 500mg Tablet', 'Conversion In', '300', '0', '300', 'CNV-20261101-0003', 'Credited from unboxing (#CNV-20261101-0003)', '2026-11-01 09:50:00', '2026-11-01 09:50:00'),
('12', 'MOV-SALE-3', '2026-11-01 13:20:00', '6', 'Bioflu 500mg Tablet', 'SALE', '-12', '300', '288', 'INV-20261101-0003', 'Sold 12 units via #INV-20261101-0003', '2026-11-01 13:20:00', '2026-11-01 13:20:00'),
('13', 'MOV-IN-4', '2026-11-01 09:15:00', '7', 'Alaxan FR Box (100s)', 'STOCK_IN', '10', '0', '10', 'DR-20261101-004', 'Received 10 Boxes via DR-20261101-004', '2026-11-01 09:15:00', '2026-11-01 09:15:00'),
('14', 'MOV-CNV-OUT-4', '2026-11-01 10:00:00', '7', 'Alaxan FR Box (100s)', 'Conversion Out', '-2', '10', '8', 'CNV-20261101-0004', 'Unboxed to retail (#CNV-20261101-0004)', '2026-11-01 10:00:00', '2026-11-01 10:00:00'),
('15', 'MOV-CNV-IN-4', '2026-11-01 10:00:00', '8', 'Alaxan FR Capsule', 'Conversion In', '200', '0', '200', 'CNV-20261101-0004', 'Credited from unboxing (#CNV-20261101-0004)', '2026-11-01 10:00:00', '2026-11-01 10:00:00'),
('16', 'MOV-SALE-4', '2026-11-01 14:45:00', '8', 'Alaxan FR Capsule', 'SALE', '-10', '200', '190', 'INV-20261101-0004', 'Sold 10 units via #INV-20261101-0004', '2026-11-01 14:45:00', '2026-11-01 14:45:00'),
('17', 'MOV-IN-5', '2026-11-01 09:30:00', '9', 'RiteMed Amoxicillin 500mg Box (100s)', 'STOCK_IN', '10', '0', '10', 'DR-20261101-005', 'Received 10 Boxes via DR-20261101-005', '2026-11-01 09:30:00', '2026-11-01 09:30:00'),
('18', 'MOV-CNV-OUT-5', '2026-11-01 10:15:00', '9', 'RiteMed Amoxicillin 500mg Box (100s)', 'Conversion Out', '-2', '10', '8', 'CNV-20261101-0005', 'Unboxed to retail (#CNV-20261101-0005)', '2026-11-01 10:15:00', '2026-11-01 10:15:00'),
('19', 'MOV-CNV-IN-5', '2026-11-01 10:15:00', '10', 'RiteMed Amoxicillin 500mg Capsule', 'Conversion In', '200', '0', '200', 'CNV-20261101-0005', 'Credited from unboxing (#CNV-20261101-0005)', '2026-11-01 10:15:00', '2026-11-01 10:15:00'),
('20', 'MOV-SALE-5', '2026-11-01 16:10:00', '10', 'RiteMed Amoxicillin 500mg Capsule', 'SALE', '-21', '200', '179', 'INV-20261101-0005', 'Sold 21 units via #INV-20261101-0005', '2026-11-01 16:10:00', '2026-11-01 16:10:00');

-- --------------------------------------------------------
-- Table structure for table `stock_out_items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_out_items`;
CREATE TABLE `stock_out_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stock_out_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `cost_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `batch_no` varchar(255) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_out_items_stock_out_id_foreign` (`stock_out_id`),
  KEY `stock_out_items_product_id_foreign` (`product_id`),
  CONSTRAINT `stock_out_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_out_items_stock_out_id_foreign` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `stock_outs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_outs`;
CREATE TABLE `stock_outs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ref_no` varchar(255) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `authorized_by` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_outs_ref_no_unique` (`ref_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `suppliers`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `active_pos` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `suppliers` (3 records)
INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`, `active_pos`, `created_at`, `updated_at`) VALUES
('1', 'Unilab Distribution Phils', 'Mr. Ramon Garcia', '0917-123-4567', 'orders@unilab.com.ph', 'Mandaluyong City, Metro Manila', '0', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('2', 'Pascual Laboratories Inc.', 'Ms. Elena Santos', '0918-987-6543', 'sales@pascual-lab.com', 'Balintawak, Quezon City', '0', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('3', 'Zuellig Pharma Philippines', 'Mr. Michael Tan', '0922-555-8888', 'supply@zuelligpharma.com', 'KM 14 West Service Rd, Parañaque City', '0', '2026-10-01 09:54:28', '2026-10-01 09:54:28');

-- --------------------------------------------------------
-- Table structure for table `uoms`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `uoms`;
CREATE TABLE `uoms` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `abbreviation` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uoms_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `uoms` (9 records)
INSERT INTO `uoms` (`id`, `name`, `abbreviation`, `description`, `created_at`, `updated_at`) VALUES
('1', 'Box', 'box', 'Standard packaging box / carton of 100 units', '2026-10-20 21:20:01', '2026-11-01 00:54:31'),
('2', 'Tablet', 'tab', 'Solid single-dose pharmaceutical tablet', '2026-10-20 21:20:01', '2026-10-20 21:20:01'),
('3', 'Capsule', 'cap', 'Gelatin encased single-dose medicine', '2026-10-20 21:20:01', '2026-10-20 21:20:01'),
('4', 'Strip', 'strip', 'Blister strip packaging of 10 units', '2026-10-20 21:20:01', '2026-11-01 00:54:31'),
('5', 'Bottle', 'btl', 'Liquid suspension, syrup, or oral drops', '2026-10-20 21:20:01', '2026-11-01 00:54:31'),
('6', 'Tube', 'tube', 'Topical ointment, cream, or gel container', '2026-10-20 21:20:01', '2026-10-20 21:20:01'),
('7', 'Sachet', 'sachet', 'Single-dose powder / oral rehydration packet', '2026-10-20 21:20:01', '2026-10-20 21:20:01'),
('8', 'Vial', 'vial', 'Sterile injectable liquid / reconstituted solution', '2026-10-20 21:20:01', '2026-10-20 21:20:01'),
('9', 'Ampoule', 'amp', 'Sealed glass capsule for single parenteral injection', '2026-10-20 21:20:01', '2026-10-20 21:20:01');

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'cashier',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users` (4 records)
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `remember_token`, `created_at`, `updated_at`) VALUES
('1', 'Xyra Andrea (Admin)', 'admin@pharmatrack.com', NULL, '$2y$10$2qBuQOrXa9qnf3SoQLEN9eruxgBQxQZYHzayDd7rG0wZHifMeONoi', 'admin', 'ou7DM4VDyY3o90r7BQQBExwJGYYMlnhXWWdecIgfcz8ZCaz0kQEqc403Vgmk', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('2', 'Xyra Andrea (Admin)', 'admin@pharmatrack.local', NULL, '$2y$10$2qBuQOrXa9qnf3SoQLEN9eruxgBQxQZYHzayDd7rG0wZHifMeONoi', 'admin', NULL, '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('3', 'Cashier Xyra', 'cashier@pharmatrack.local', NULL, '$2y$10$jkvO/wLk6AVtw95HQEtsteBqkxHi5E0cdscDBTDP9dfeqZeHbdlPC', 'cashier', NULL, '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('4', 'Cashier Juan', 'cashier@pharmatrack.com', NULL, '$2y$10$jkvO/wLk6AVtw95HQEtsteBqkxHi5E0cdscDBTDP9dfeqZeHbdlPC', 'cashier', NULL, '2026-10-13 16:45:43', '2026-10-13 16:45:43');

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
