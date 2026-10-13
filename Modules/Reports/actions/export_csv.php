<?php
/**
 * Action: Export Report Data to CSV
 * Domain: Modules/Reports
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$type = sanitizeString($_GET['type'] ?? 'sales');

$filename = "pharmatrack_{$type}_" . date('Ymd_His') . ".csv";

header('Content-Type: text/csv; charset=utf-8');
header("Content-Disposition: attachment; filename=\"{$filename}\"");

$output = fopen('php://output', 'w');

if ($type === 'valuation') {
    fputcsv($output, ['SKU', 'Medicine Name', 'Category', 'Stock Qty', 'Cost Price', 'Unit Price', 'Cost Valuation', 'Retail Valuation']);
    $stmt = $pdo->query("SELECT sku, name, category, stock, cost_price, unit_price, ROUND(stock*cost_price, 2) as cost_val, ROUND(stock*unit_price, 2) as ret_val FROM products ORDER BY name ASC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }
} elseif ($type === 'movements') {
    fputcsv($output, ['Movement Code', 'Timestamp', 'Product Name', 'Type', 'Qty Change', 'Previous Stock', 'New Stock', 'Reference ID', 'Remarks']);
    $stmt = $pdo->query("SELECT movement_code, timestamp, product_name, type, qty_change, previous_stock, new_stock, reference_id, remarks FROM stock_movements ORDER BY id DESC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }
} else {
    // Default sales export
    fputcsv($output, ['Invoice No', 'Date', 'Cashier', 'Customer Type', 'Subtotal', 'Discount', 'Total', 'Payment Method']);
    $stmt = $pdo->query("SELECT invoice_no, created_at, cashier, customer_type, subtotal, discount, total, payment_method FROM sales ORDER BY id DESC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }
}

fclose($output);
exit;

