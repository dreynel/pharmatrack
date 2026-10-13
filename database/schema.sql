-- MariaDB dump 10.17  Distrib 10.4.11-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: pharmatrack_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Analgesics','Pain relievers, antipyretics, and fever control medications','2026-09-30 17:54:28','2026-09-30 17:54:28'),(2,'Antibiotics','Antibacterial and prescription anti-infectives','2026-09-30 17:54:28','2026-09-30 17:54:28'),(3,'Respiratory','Decongestants, antitussives, and antihistamines for colds/cough','2026-09-30 17:54:28','2026-09-30 17:54:28'),(4,'Vitamins & Supplements','Daily dietary multivitamins, minerals, and immune boosters','2026-09-30 17:54:28','2026-09-30 17:54:28'),(5,'Cardiovascular','Hypertension, heart care, and maintenance medications','2026-09-30 17:54:28','2026-09-30 17:54:28'),(6,'Antihistamines','Allergy relief, anti-itch, and non-drowsy formulations','2026-09-30 17:54:28','2026-09-30 17:54:28'),(7,'First Aid','Antiseptics, rubbing alcohol, bandages, and clinical supplies','2026-09-30 17:54:28','2026-09-30 17:54:28'),(8,'Gastrointestinal','Antacids, anti-diarrheal, and digestive health medications','2026-09-30 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversions`
--

DROP TABLE IF EXISTS `conversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conv_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime NOT NULL,
  `source_product_id` bigint unsigned DEFAULT NULL,
  `source_product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_uom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Box',
  `source_qty` int NOT NULL DEFAULT '1',
  `target_product_id` bigint unsigned DEFAULT NULL,
  `target_product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_uom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Piece',
  `target_qty` int NOT NULL DEFAULT '100',
  `multiplier` int NOT NULL DEFAULT '100',
  `batch_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `operator` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversions_conv_code_unique` (`conv_code`),
  KEY `conversions_source_product_id_foreign` (`source_product_id`),
  KEY `conversions_target_product_id_foreign` (`target_product_id`),
  CONSTRAINT `conversions_source_product_id_foreign` FOREIGN KEY (`source_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `conversions_target_product_id_foreign` FOREIGN KEY (`target_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversions`
--

LOCK TABLES `conversions` WRITE;
/*!40000 ALTER TABLE `conversions` DISABLE KEYS */;
INSERT INTO `conversions` VALUES (1,'CONV-8821','2026-09-28 01:54:28',2,'Biogesic Paracetamol 500mg (Box of 100)','Box (100s)',2,1,'Biogesic Paracetamol 500mg','Tablet',200,100,'B-2024-098','2027-11-15','Xyra Andrea (Pharmacist)','Unboxed 2 bulk cartons into 200 individual blister tablets for POS counter','2026-09-27 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `conversions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_09_30_000001_create_suppliers_and_categories_tables',1),(5,'2026_09_30_000002_create_products_table',1),(6,'2026_09_30_000003_create_sales_tables',1),(7,'2026_09_30_000004_create_stock_in_tables',1),(8,'2026_09_30_000005_create_stock_out_tables',1),(9,'2026_09_30_000006_create_conversions_and_movements_tables',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `generic_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Box',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `cost_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock` int NOT NULL DEFAULT '0',
  `reorder_point` int NOT NULL DEFAULT '10',
  `batch_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `daily_avg_sales` decimal(8,2) NOT NULL DEFAULT '0.00',
  `forecast_demand_30d` int NOT NULL DEFAULT '0',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'In Stock',
  `is_bulk` tinyint(1) NOT NULL DEFAULT '0',
  `parent_product_id` bigint unsigned DEFAULT NULL,
  `child_product_id` bigint unsigned DEFAULT NULL,
  `conversion_rate` int NOT NULL DEFAULT '100',
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'MED-001','4800012345678','Biogesic Paracetamol 500mg','Paracetamol',1,'Analgesics','Tablet',7.50,4.50,450,100,'B-2024-098','2027-11-15',0.33,10,'In Stock',0,2,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(2,'BLK-001','4800012345601','Biogesic Paracetamol 500mg (Box of 100)','Paracetamol (Bulk)',1,'Analgesics','Box (100s)',700.00,420.00,24,5,'B-2024-098','2027-11-15',2.00,67,'In Stock',1,NULL,1,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(3,'MED-002','4800012345679','Amoxil Amoxicillin 500mg Capsule','Amoxicillin',2,'Antibiotics','Capsule',15.00,9.00,35,50,'B-2024-112','2026-10-20',22.00,746,'Low Stock',0,4,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(4,'BLK-002','4800012345602','Amoxil Amoxicillin 500mg (Box of 100)','Amoxicillin (Bulk)',2,'Antibiotics','Box (100s)',1400.00,850.00,12,4,'B-2024-112','2026-10-20',1.00,32,'In Stock',1,NULL,3,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(5,'MED-003','4800012345680','Neozep Forte Tablet','Phenylephrine HCl + Chlorphenamine',3,'Respiratory','Tablet',9.00,5.50,320,80,'B-2024-145','2026-10-21',0.33,11,'Expiring Soon',0,NULL,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(6,'MED-004','4800012345681','Conzace Soft Gel Capsule','Multivitamins + Zinc',4,'Vitamins & Supplements','Capsule',16.50,11.00,580,120,'B-2024-204','2028-01-30',0.17,6,'In Stock',0,7,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(7,'BLK-004','4800012345604','Conzace Soft Gel Capsule (Box of 100)','Multivitamins + Zinc (Bulk)',4,'Vitamins & Supplements','Box (100s)',1550.00,1050.00,18,5,'B-2024-204','2028-01-30',2.00,65,'In Stock',1,NULL,6,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(8,'MED-005','4800012345682','Alaxan FR Capsule','Ibuprofen + Paracetamol',1,'Analgesics','Capsule',11.00,7.00,12,60,'B-2024-055','2027-05-18',25.00,833,'Critical Low',0,NULL,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(9,'MED-006','4800012345683','Norvasc Amlodipine 5mg Tablet','Amlodipine Besilate',5,'Cardiovascular','Tablet',22.00,14.00,210,40,'B-2024-301','2027-08-12',15.00,504,'In Stock',0,NULL,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(10,'MED-007','4800012345684','Allerkid Cetirizine 10mg','Cetirizine Dihydrochloride',6,'Antihistamines','Tablet',14.50,8.50,180,50,'B-2024-188','2026-12-05',18.00,562,'In Stock',0,NULL,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(11,'SUP-001','4800012345685','Rhea Isopropyl Alcohol 70% 500ml','Isopropyl Alcohol',7,'First Aid','Bottle',85.00,55.00,95,30,'B-2024-402','2029-03-01',0.07,2,'In Stock',0,NULL,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54'),(12,'MED-009','4800012345686','Kremil-S Antacid Chewable Tablet','Aluminum Hydroxide + Magnesium Hydroxide + Simethicone',8,'Gastrointestinal','Tablet',8.50,5.00,280,60,'B-2024-511','2027-09-25',20.00,636,'In Stock',0,NULL,NULL,100,'2026-09-30 17:54:28','2026-09-30 18:05:54');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `po_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` bigint unsigned DEFAULT NULL,
  `supplier_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suggested_qty` int NOT NULL DEFAULT '0',
  `order_qty` int NOT NULL DEFAULT '0',
  `unit_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `expected_delivery` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_orders_po_number_unique` (`po_number`),
  KEY `purchase_orders_supplier_id_foreign` (`supplier_id`),
  KEY `purchase_orders_product_id_foreign` (`product_id`),
  CONSTRAINT `purchase_orders_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_orders_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,'PO-20260828-4412',1,'Unilab Distribution Phils',8,'Alaxan FR Capsule',100,100,7.00,700.00,'Pending','2026-10-04','Critical stock replenishment triggered by AI forecasting safety buffer.','2026-09-30 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sale_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `cost_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_items_sale_id_foreign` (`sale_id`),
  KEY `sale_items_product_id_foreign` (`product_id`),
  CONSTRAINT `sale_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sale_items_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (1,1,1,'Biogesic Paracetamol 500mg',10,7.50,4.50,75.00,'2026-09-30 17:54:28','2026-09-30 17:54:28'),(2,1,6,'Conzace Soft Gel Capsule',5,16.50,11.00,82.50,'2026-09-30 17:54:28','2026-09-30 17:54:28'),(3,2,11,'Rhea Isopropyl Alcohol 70% 500ml',2,85.00,55.00,170.00,'2026-09-30 17:54:28','2026-09-30 17:54:28'),(4,2,5,'Neozep Forte Tablet',10,9.00,5.50,90.00,'2026-09-30 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cashier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cash',
  `amount_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `change` decimal(12,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_invoice_no_unique` (`invoice_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,'TXN-98421','Cashier Xyra',157.50,0.00,'None','Regular',NULL,NULL,157.50,'Cash',200.00,42.50,NULL,'2026-09-30 13:54:28','2026-09-30 17:54:28'),(2,'TXN-98420','Admin Andrea',260.00,13.00,'Senior Citizen','Senior Citizen','Lola Remedios Cruz','SC-2019-8812',247.00,'GCash',247.00,0.00,NULL,'2026-09-30 11:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('cwWHm9ejs85qnjT47J4wHnfWPc3PycIYmQN9p0JO',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.9549','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQVRLMk5vSlR6QkdKVDFJZmVaS0pYSFFwb1FoN0NmcFk5aVpndjVZSSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9sb2dpbiI7czo1OiJyb3V0ZSI7czo1OiJsb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1790819704),('QOPZnMsQ2MWuwkLQAMTVGNv6WWKvPPoqar1NflPx',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','YTo1OntzOjY6Il90b2tlbiI7czo0MDoiT3FDZVJRalZ1M1ljSjdBRmZYSzk4bkJ1MmdBRE9SVm45emgxQmoxZyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMCI7czo1OiJyb3V0ZSI7czo0OiJob21lIjt9czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTtzOjE3OiJwYXNzd29yZF9oYXNoX3dlYiI7czo2NDoiNTVlZmE0ODIwMmZiYWJlMjY2MWMzYjgwZTE2NDFkNzU2OTg0NDYxMjE3NGFhOWYzNzcwNjA5MjZjYjlkNTg5ZiI7fQ==',1790822161);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_in_items`
--

DROP TABLE IF EXISTS `stock_in_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_in_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stock_in_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `cost_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `batch_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_in_items_stock_in_id_foreign` (`stock_in_id`),
  KEY `stock_in_items_product_id_foreign` (`product_id`),
  CONSTRAINT `stock_in_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_in_items_stock_in_id_foreign` FOREIGN KEY (`stock_in_id`) REFERENCES `stock_ins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_in_items`
--

LOCK TABLES `stock_in_items` WRITE;
/*!40000 ALTER TABLE `stock_in_items` DISABLE KEYS */;
INSERT INTO `stock_in_items` VALUES (1,1,2,'Biogesic Paracetamol 500mg (Box of 100)',20,420.00,'B-2024-098','2027-11-15','2026-09-30 17:54:28','2026-09-30 17:54:28'),(2,1,7,'Conzace Soft Gel Capsule (Box of 100)',10,1050.00,'B-2024-204','2028-01-30','2026-09-30 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `stock_in_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_ins`
--

DROP TABLE IF EXISTS `stock_ins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_ins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ref_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` bigint unsigned DEFAULT NULL,
  `supplier_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `received_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_ins_ref_no_unique` (`ref_no`),
  KEY `stock_ins_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `stock_ins_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_ins`
--

LOCK TABLES `stock_ins` WRITE;
/*!40000 ALTER TABLE `stock_ins` DISABLE KEYS */;
INSERT INTO `stock_ins` VALUES (1,'DR-2026-8891',1,'Unilab Distribution Phils','2026-09-26','Xyra Andrea',18900.00,'Standard replenishment batch for analgesics and vitamins.','2026-09-25 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `stock_ins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_movements` (
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,'MOV-99201','2026-09-30 21:54:28',1,'Biogesic Paracetamol 500mg','POS_SALE',-10,460,450,'TXN-98421','Sold at POS Counter (Receipt #TXN-98421)','2026-09-30 17:54:28','2026-09-30 17:54:28'),(2,'MOV-99200','2026-09-30 19:54:28',11,'Rhea Isopropyl Alcohol 70% 500ml','POS_SALE',-2,97,95,'TXN-98420','Sold at POS Counter (Receipt #TXN-98420)','2026-09-30 17:54:28','2026-09-30 17:54:28'),(3,'MOV-99199','2026-09-30 01:54:28',11,'Rhea Isopropyl Alcohol 70% 500ml','STOCK_OUT',-2,99,97,'SO-2026-108','Stock Out: Internal Clinic Use - Auth: Xyra Andrea','2026-09-30 17:54:28','2026-09-30 17:54:28'),(4,'MOV-99198','2026-09-28 01:54:28',1,'Biogesic Paracetamol 500mg','CONVERT_IN',200,260,460,'CONV-8821','Received 200 Tablet from Biogesic Box of 100 (CONV-8821)','2026-09-30 17:54:28','2026-09-30 17:54:28'),(5,'MOV-99197','2026-09-28 01:54:28',2,'Biogesic Paracetamol 500mg (Box of 100)','CONVERT_OUT',-2,26,24,'CONV-8821','Converted 2 Box (100s) to 200 Tablet','2026-09-30 17:54:28','2026-09-30 17:54:28'),(6,'MOV-99196','2026-09-26 01:54:28',2,'Biogesic Paracetamol 500mg (Box of 100)','STOCK_IN',20,4,24,'DR-2026-8891','Received from Unilab Distribution Phils (Batch B-2024-098)','2026-09-30 17:54:28','2026-09-30 17:54:28'),(10,'MOV-20261013-1DAA','2026-10-13 09:07:46',NULL,'Cefalexin 500mg Capsule 119','RECEIVING',25,80,105,'RESTOCK-14','Direct restock increment','2026-10-13 01:07:46','2026-10-13 01:07:46'),(11,'MOV-20261013-ADCE','2026-10-13 09:07:46',NULL,'Cefalexin 500mg Capsule 119','RECEIVING',50,105,155,'DR-HTTP-2876','Stock-in delivery intake batch #DR-HTTP-2876','2026-10-13 01:07:46','2026-10-13 01:07:46'),(12,'MOV-20261013-8EE9','2026-10-13 09:07:46',NULL,'Cefalexin 500mg Capsule 119','DISPOSAL',-15,105,90,'SO-HTTP-2199','Stock disposal: Damaged Seal - #SO-HTTP-2199','2026-10-13 01:07:46','2026-10-13 01:07:46');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_out_items`
--

DROP TABLE IF EXISTS `stock_out_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_out_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stock_out_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `cost_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `batch_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_out_items_stock_out_id_foreign` (`stock_out_id`),
  KEY `stock_out_items_product_id_foreign` (`product_id`),
  CONSTRAINT `stock_out_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_out_items_stock_out_id_foreign` FOREIGN KEY (`stock_out_id`) REFERENCES `stock_outs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_out_items`
--

LOCK TABLES `stock_out_items` WRITE;
/*!40000 ALTER TABLE `stock_out_items` DISABLE KEYS */;
INSERT INTO `stock_out_items` VALUES (1,1,5,'Neozep Forte Tablet',20,5.50,'B-2023-011','2026-09-30 17:54:28','2026-09-30 17:54:28'),(2,2,11,'Rhea Isopropyl Alcohol 70% 500ml',2,55.00,'B-2024-402','2026-09-30 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `stock_out_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_outs`
--

DROP TABLE IF EXISTS `stock_outs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_outs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ref_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `authorized_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_outs_ref_no_unique` (`ref_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_outs`
--

LOCK TABLES `stock_outs` WRITE;
/*!40000 ALTER TABLE `stock_outs` DISABLE KEYS */;
INSERT INTO `stock_outs` VALUES (1,'SO-2026-102','Expired Medicine Disposal','2026-09-29','Xyra Andrea (Manager)','Near-expiry batches pulled from shelf following DOH protocol.','2026-09-28 17:54:28','2026-09-30 17:54:28'),(2,'SO-2026-108','Internal Clinic Use','2026-09-30','Xyra Andrea (Manager)','Pharmacy counter disinfection and sanitization station refill.','2026-09-29 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `stock_outs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `active_pos` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Unilab Distribution Phils','Mr. Ramon Garcia','0917-123-4567','orders@unilab.com.ph','Mandaluyong City, Metro Manila',2,'2026-09-30 17:54:28','2026-09-30 17:54:28'),(2,'Pascual Laboratories Inc.','Ms. Elena Santos','0918-987-6543','sales@pascual-lab.com','Balintawak, Quezon City',1,'2026-09-30 17:54:28','2026-09-30 17:54:28'),(3,'Zuellig Pharma Philippines','Mr. Michael Tan','0922-555-8888','supply@zuelligpharma.com','KM 14 West Service Rd, Parañaque City',0,'2026-09-30 17:54:28','2026-09-30 17:54:28');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cashier',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Xyra Andrea (Admin)','admin@pharmatrack.com',NULL,'$2y$10$2qBuQOrXa9qnf3SoQLEN9eruxgBQxQZYHzayDd7rG0wZHifMeONoi','admin','ou7DM4VDyY3o90r7BQQBExwJGYYMlnhXWWdecIgfcz8ZCaz0kQEqc403Vgmk','2026-09-30 17:54:28','2026-09-30 17:54:28'),(2,'Xyra Andrea (Admin)','admin@pharmatrack.local',NULL,'$2y$10$2qBuQOrXa9qnf3SoQLEN9eruxgBQxQZYHzayDd7rG0wZHifMeONoi','admin',NULL,'2026-09-30 17:54:28','2026-09-30 17:54:28'),(3,'Cashier Xyra','cashier@pharmatrack.local',NULL,'$2y$10$jkvO/wLk6AVtw95HQEtsteBqkxHi5E0cdscDBTDP9dfeqZeHbdlPC','cashier',NULL,'2026-09-30 17:54:28','2026-09-30 17:54:28'),(4,'Cashier Juan','cashier@pharmatrack.com',NULL,'$2y$10$jkvO/wLk6AVtw95HQEtsteBqkxHi5E0cdscDBTDP9dfeqZeHbdlPC','cashier',NULL,'2026-10-13 00:45:43','2026-10-13 00:45:43');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-13 12:11:47
