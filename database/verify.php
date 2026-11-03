<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDatabaseConnection();
echo "--- PRODUCTS ---" . PHP_EOL;
$prods = $pdo->query("SELECT id, sku, name, uom, stock, batch_no, expiry_date, status, is_bulk, child_product_id, conversion_rate FROM products")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($prods, JSON_PRETTY_PRINT) . PHP_EOL;

echo "--- INVENTORY ---" . PHP_EOL;
$inv = $pdo->query("SELECT id, product_id, product_name, transaction_code, quantity, unit_cost, batch_no, expiry_date FROM inventory ORDER BY id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($inv, JSON_PRETTY_PRINT) . PHP_EOL;

echo "--- CONVERSIONS ---" . PHP_EOL;
$conv = $pdo->query("SELECT * FROM conversions ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($conv, JSON_PRETTY_PRINT) . PHP_EOL;

