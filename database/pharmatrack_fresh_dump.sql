-- =====================================================================
-- PharmaTrack Clean Production Database Dump
-- Target: Hostinger / Local MySQL / MariaDB (Fresh Clean Installation)
-- Generated: 2026-11-02 20:19:15
-- Inventory & Stock Records: Clean (0 records, stock = 0)
-- Master Data: Users (4), Categories, UOMs, Suppliers, Products
-- Architecture: Reverse DROP order + Deferred FK constraints (100% phpMyAdmin safe)
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Drop Existing Tables (Reverse Dependency Order)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `purchase_order_items`;
DROP TABLE IF EXISTS `purchase_orders`;
DROP TABLE IF EXISTS `sale_return_items`;
DROP TABLE IF EXISTS `sale_returns`;
DROP TABLE IF EXISTS `sale_items`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `stock_out_items`;
DROP TABLE IF EXISTS `stock_outs`;
DROP TABLE IF EXISTS `stock_in_items`;
DROP TABLE IF EXISTS `stock_ins`;
DROP TABLE IF EXISTS `stock_movements`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `conversions`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `uoms`;
DROP TABLE IF EXISTS `categories`;

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `categories`
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
-- Table structure for table `uoms`
-- --------------------------------------------------------
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

-- Dumping data for table `uoms`
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
-- Table structure for table `suppliers`
-- --------------------------------------------------------
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

-- Dumping data for table `suppliers`
INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`, `active_pos`, `created_at`, `updated_at`) VALUES
('1', 'Unilab Distribution Phils', 'Mr. Ramon Garcia', '0917-123-4567', 'orders@unilab.com.ph', 'Mandaluyong City, Metro Manila', '0', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('2', 'Pascual Laboratories Inc.', 'Ms. Elena Santos', '0918-987-6543', 'sales@pascual-lab.com', 'Balintawak, Quezon City', '0', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('3', 'Zuellig Pharma Philippines', 'Mr. Michael Tan', '0922-555-8888', 'supply@zuelligpharma.com', 'KM 14 West Service Rd, Parañaque City', '0', '2026-10-01 09:54:28', '2026-10-01 09:54:28');

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
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

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `remember_token`, `created_at`, `updated_at`) VALUES
('1', 'Xyra Andrea (Admin)', 'admin@pharmatrack.com', NULL, '$2y$10$2qBuQOrXa9qnf3SoQLEN9eruxgBQxQZYHzayDd7rG0wZHifMeONoi', 'admin', 'ou7DM4VDyY3o90r7BQQBExwJGYYMlnhXWWdecIgfcz8ZCaz0kQEqc403Vgmk', '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('2', 'Xyra Andrea (Admin)', 'admin@pharmatrack.local', NULL, '$2y$10$2qBuQOrXa9qnf3SoQLEN9eruxgBQxQZYHzayDd7rG0wZHifMeONoi', 'admin', NULL, '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('3', 'Cashier Xyra', 'cashier@pharmatrack.local', NULL, '$2y$10$jkvO/wLk6AVtw95HQEtsteBqkxHi5E0cdscDBTDP9dfeqZeHbdlPC', 'cashier', NULL, '2026-10-01 09:54:28', '2026-10-01 09:54:28'),
('4', 'Cashier Juan', 'cashier@pharmatrack.com', NULL, '$2y$10$jkvO/wLk6AVtw95HQEtsteBqkxHi5E0cdscDBTDP9dfeqZeHbdlPC', 'cashier', NULL, '2026-10-13 16:45:43', '2026-10-13 16:45:43');

-- --------------------------------------------------------
-- Table structure for table `products`
-- --------------------------------------------------------
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
  KEY `products_barcode_index` (`barcode`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `products`
INSERT INTO `products` (`id`, `sku`, `barcode`, `name`, `generic_name`, `category_id`, `category`, `uom`, `unit_price`, `cost_price`, `stock`, `reorder_point`, `batch_no`, `expiry_date`, `daily_avg_sales`, `forecast_demand_30d`, `status`, `is_bulk`, `parent_product_id`, `child_product_id`, `conversion_rate`, `created_at`, `updated_at`) VALUES
('1', 'SKU-BIO-BOX', '480001661101', 'Biogesic 500mg Box (100s)', 'Paracetamol', '1', 'Analgesics', 'Box', '700.00', '500.00', '0', '3', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:31', '2026-11-02 06:52:46'),
('2', 'SKU-BIO-TAB', '480001661102', 'Biogesic 500mg Tablet', 'Paracetamol', '1', 'Analgesics', 'Tablet', '8.00', '5.00', '0', '20', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 06:52:46'),
('3', 'SKU-NZP-BOX', '480001662201', 'Neozep Forte Box (100s)', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Box', '750.00', '550.00', '0', '3', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 06:52:46'),
('4', 'SKU-NZP-TAB', '480001662202', 'Neozep Forte Tablet', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Tablet', '9.00', '5.50', '0', '20', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 06:52:47'),
('5', 'SKU-BFL-BOX', '480001663301', 'Bioflu 500mg Box (100s)', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Box', '800.00', '600.00', '0', '3', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 07:17:37'),
('6', 'SKU-BFL-TAB', '480001663302', 'Bioflu 500mg Tablet', 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol', '3', 'Respiratory', 'Tablet', '9.50', '6.00', '0', '20', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 11:19:17'),
('7', 'SKU-ALX-BOX', '480001664401', 'Alaxan FR Box (100s)', 'Paracetamol + Ibuprofen (325mg/200mg)', '1', 'Analgesics', 'Box', '1100.00', '850.00', '0', '3', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 11:05:23'),
('8', 'SKU-ALX-CAP', '480001664402', 'Alaxan FR Capsule', 'Paracetamol + Ibuprofen (325mg/200mg)', '1', 'Analgesics', 'Capsule', '13.00', '8.50', '0', '20', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 07:17:37'),
('9', 'SKU-AMX-BOX', '480001665501', 'RiteMed Amoxicillin 500mg Box (100s)', 'Amoxicillin Trihydrate', '2', 'Antibiotics', 'Box', '750.00', '480.00', '0', '3', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 06:52:49'),
('10', 'SKU-AMX-CAP', '480001665502', 'RiteMed Amoxicillin 500mg Capsule', 'Amoxicillin Trihydrate', '2', 'Antibiotics', 'Capsule', '8.50', '4.80', '0', '20', NULL, NULL, '0.00', '0', 'Out of Stock', '0', NULL, NULL, '1', '2026-11-01 00:54:32', '2026-11-02 06:52:50');

-- --------------------------------------------------------
-- Table structure for table `conversions`
-- --------------------------------------------------------
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
  KEY `conversions_target_product_id_foreign` (`target_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `inventory`
-- --------------------------------------------------------
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
  KEY `inventory_reference_no_index` (`reference_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `stock_movements`
-- --------------------------------------------------------
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
  KEY `stock_movements_product_id_foreign` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `stock_ins`
-- --------------------------------------------------------
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
  KEY `stock_ins_supplier_id_foreign` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `stock_in_items`
-- --------------------------------------------------------
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
  KEY `stock_in_items_product_id_foreign` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `stock_outs`
-- --------------------------------------------------------
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
-- Table structure for table `stock_out_items`
-- --------------------------------------------------------
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
  KEY `stock_out_items_product_id_foreign` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sales`
-- --------------------------------------------------------
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sale_items`
-- --------------------------------------------------------
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
  KEY `sale_items_product_id_foreign` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sale_returns`
-- --------------------------------------------------------
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
-- Table structure for table `sale_return_items`
-- --------------------------------------------------------
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
-- Table structure for table `purchase_orders`
-- --------------------------------------------------------
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
  KEY `purchase_orders_product_id_foreign` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Foreign Key Constraints (Deferred for Safe Import)
-- --------------------------------------------------------
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_child_product_id_foreign` FOREIGN KEY (`child_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_parent_product_id_foreign` FOREIGN KEY (`parent_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

ALTER TABLE `conversions`
  ADD CONSTRAINT `conversions_source_product_id_foreign` FOREIGN KEY (`source_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conversions_target_product_id_foreign` FOREIGN KEY (`target_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

ALTER TABLE `stock_ins`
  ADD CONSTRAINT `stock_ins_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

ALTER TABLE `stock_in_items`
  ADD CONSTRAINT `stock_in_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `stock_in_items_stock_in_id_foreign` FOREIGN KEY (`stock_in_id`) REFERENCES `stock_ins` (`id`) ON DELETE CASCADE;

ALTER TABLE `stock_out_items`
  ADD CONSTRAINT `stock_out_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `stock_out_items_stock_out_id_foreign` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs` (`id`) ON DELETE CASCADE;

ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sale_items_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
