<?php
/**
 * Action: Fetch Accounting-Style Inventory Ledger (`inventory` table)
 * Domain: Modules/StockMovements
 * Returns all positive (+) and negative (-) impact entries tagged by `transaction_code`
 * (e.g. POS, StockIn, StockOut, Conversion, OpeningBalance, Adjustment).
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 200;
$search = trim($_GET['search'] ?? '');
$txCode = trim($_GET['transaction_code'] ?? ($_GET['type'] ?? ''));
$productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;

$query = "SELECT * FROM inventory WHERE 1=1";
$params = [];

if (!empty($search)) {
    $query .= " AND (entry_no LIKE ? OR product_name LIKE ? OR transaction_code LIKE ? OR reference_no LIKE ? OR remarks LIKE ?)";
    $term = "%{$search}%";
    $params = array_merge($params, [$term, $term, $term, $term, $term]);
}

if (!empty($txCode) && strtoupper($txCode) !== 'ALL') {
    // Map legacy movement filter names if passed
    $codeMap = [
        'STOCK_IN' => 'StockIn',
        'STOCK_OUT' => 'StockOut',
        'POS_SALE' => 'POS',
        'SALE' => 'POS',
        'CONVERT_IN' => 'Conversion',
        'CONVERT_OUT' => 'Conversion',
    ];
    $normalizedCode = $codeMap[strtoupper($txCode)] ?? $txCode;
    $query .= " AND transaction_code = ?";
    $params[] = $normalizedCode;
}

if ($productId > 0) {
    $query .= " AND product_id = ?";
    $params[] = $productId;
}

$query .= " ORDER BY transacted_at DESC, id DESC LIMIT " . max(1, min($limit, 500));

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $movements = array_map(function(array $r) {
        return [
            'id' => (int)$r['id'],
            'entry_no' => $r['entry_no'],
            'movement_code' => $r['entry_no'],
            'product_id' => (int)$r['product_id'],
            'product_name' => $r['product_name'],
            'transaction_code' => $r['transaction_code'],
            'transaction_id' => $r['transaction_id'] ? (int)$r['transaction_id'] : null,
            'type' => $r['transaction_code'],
            'qty_in' => (int)($r['qty_in'] ?? max(0, (int)$r['quantity'])),
            'qty_out' => (int)($r['qty_out'] ?? abs(min(0, (int)$r['quantity']))),
            'quantity' => (int)$r['quantity'],
            'impact' => (int)$r['quantity'],
            'qty_change' => (int)$r['quantity'],
            'previous_balance' => (int)$r['previous_balance'],
            'previous_stock' => (int)$r['previous_balance'],
            'running_balance' => (int)$r['running_balance'],
            'new_stock' => (int)$r['running_balance'],
            'reference_no' => $r['reference_no'] ?? '',
            'reference_id' => $r['reference_no'] ?? '',
            'unit_cost' => (float)$r['unit_cost'],
            'total_cost' => (float)($r['total_cost'] ?? round((int)$r['quantity'] * (float)$r['unit_cost'], 2)),
            'batch_no' => $r['batch_no'],
            'expiry_date' => $r['expiry_date'],
            'remarks' => $r['remarks'] ?? '',
            'transacted_at' => $r['transacted_at'],
            'timestamp' => $r['transacted_at']
        ];
    }, $rows);

    jsonResponse([
        'success' => true,
        'count' => count($movements),
        'inventory' => $movements,
        'movements' => $movements
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
