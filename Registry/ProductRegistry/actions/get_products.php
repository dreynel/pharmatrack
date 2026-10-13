<?php
/**
 * Action: Get All Products / Low Stock / Expiring
 * Domain: Registry/ProductRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$productId = (int)($_GET['product_id'] ?? ($_GET['id'] ?? 0));
$filter = $_GET['filter'] ?? 'all';
$search = $_GET['search'] ?? '';

function formatProductRow(array $p): array {
    $p['category_name'] = $p['category_name'] ?? ($p['category'] ?? 'General');
    $p['category'] = $p['category_name'];
    $p['genericName'] = $p['generic_name'] ?? '';
    $p['unitPrice'] = (float)($p['unit_price'] ?? 0);
    $p['costPrice'] = (float)($p['cost_price'] ?? 0);
    $p['reorderPoint'] = (int)($p['reorder_point'] ?? 0);
    $p['batchNo'] = $p['batch_no'] ?? '';
    $p['expiryDate'] = $p['expiry_date'] ?? '';
    $p['isBulk'] = !empty($p['is_bulk']);
    $p['conversionRate'] = (int)($p['conversion_rate'] ?? 1);
    return $p;
}

try {
    if ($productId > 0) {
        $stmt = $pdo->prepare("
            SELECT p.*, COALESCE(c.name, p.category, 'General') as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
            LIMIT 1
        ");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        if ($product) {
            $formatted = formatProductRow($product);
            jsonResponse([
                'success' => true,
                'data' => $formatted,
                'product' => $formatted
            ]);
        } else {
            jsonResponse(['success' => false, 'error' => 'Product not found.'], 404);
        }
    }

    $sql = "SELECT p.*, COALESCE(c.name, p.category, 'General') as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (p.name LIKE ? OR p.generic_name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)";
        $term = "%{$search}%";
        $params = array_merge($params, [$term, $term, $term, $term]);
    }

    if ($filter === 'low-stock') {
        $sql .= " AND p.stock <= p.reorder_point";
    } elseif ($filter === 'expiring') {
        $sql .= " AND p.expiry_date IS NOT NULL AND p.expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)";
    }

    $sql .= " ORDER BY p.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = array_map('formatProductRow', $stmt->fetchAll());

    jsonResponse([
        'success' => true,
        'count' => count($products),
        'data' => $products
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

