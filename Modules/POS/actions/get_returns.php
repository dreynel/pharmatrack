<?php
/**
 * Action: Fetch Customer Returns List
 * Domain: Modules/POS
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$saleId = isset($_GET['sale_id']) ? (int)$_GET['sale_id'] : 0;
$invoiceNo = trim($_GET['invoice_no'] ?? '');

$query = "SELECT * FROM sale_returns WHERE 1=1";
$params = [];

if ($saleId > 0) {
    $query .= " AND sale_id = ?";
    $params[] = $saleId;
} elseif (!empty($invoiceNo)) {
    $query .= " AND invoice_no = ?";
    $params[] = $invoiceNo;
}

$query .= " ORDER BY id DESC LIMIT 50";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $returns = $stmt->fetchAll();

    if (!empty($returns)) {
        $returnIds = array_column($returns, 'id');
        $placeholders = implode(',', array_fill(0, count($returnIds), '?'));
        $itemStmt = $pdo->prepare("
            SELECT * FROM sale_return_items
            WHERE sale_return_id IN ($placeholders)
            ORDER BY id ASC
        ");
        $itemStmt->execute($returnIds);
        $allItems = $itemStmt->fetchAll();

        $itemsByReturn = [];
        foreach ($allItems as $it) {
            $itemsByReturn[$it['sale_return_id']][] = [
                'id' => (int)$it['id'],
                'productId' => (int)$it['product_id'],
                'product_id' => (int)$it['product_id'],
                'name' => $it['product_name'],
                'product_name' => $it['product_name'],
                'qty' => (int)$it['quantity'],
                'quantity' => (int)$it['quantity'],
                'price' => (float)$it['unit_price'],
                'unit_price' => (float)$it['unit_price'],
                'subtotal' => (float)$it['subtotal'],
                'batch_no' => $it['batch_no'] ?? '',
                'expiry_date' => $it['expiry_date'] ?? '',
                'restocked' => (bool)$it['restocked']
            ];
        }

        foreach ($returns as &$ret) {
            $retId = (int)$ret['id'];
            $ret['id'] = (string)$ret['return_no'];
            $ret['db_id'] = $retId;
            $ret['refund_amount'] = (float)$ret['refund_amount'];
            $ret['refundAmount'] = (float)$ret['refund_amount'];
            $ret['restocked'] = (bool)$ret['restocked'];
            $ret['timestamp'] = $ret['created_at'];
            $ret['items'] = $itemsByReturn[$retId] ?? [];
            $ret['items_count'] = count($ret['items']);
        }
        unset($ret);
    }

    jsonResponse([
        'success' => true,
        'count' => count($returns),
        'returns' => $returns,
        'data' => $returns
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
