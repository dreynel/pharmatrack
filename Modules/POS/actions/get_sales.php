<?php
/**
 * Action: Fetch Recent Sales Transactions
 * Domain: Modules/POS
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$search = trim($_GET['search'] ?? '');
$date = trim($_GET['date'] ?? '');

$query = "
    SELECT 
        s.*,
        COUNT(si.id) as items_count,
        COALESCE(SUM(si.quantity), 0) as total_units
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE 1=1
";

$params = [];

if (!empty($search)) {
    $query .= " AND (s.invoice_no LIKE ? OR s.customer_name LIKE ? OR s.cashier LIKE ?)";
    $term = "%{$search}%";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

if (!empty($date)) {
    $query .= " AND DATE(s.created_at) = ?";
    $params[] = $date;
}

$query .= " GROUP BY s.id ORDER BY s.id DESC LIMIT " . max(1, min($limit, 200));

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $sales = $stmt->fetchAll();

    if (!empty($sales)) {
        $saleIds = array_map(function($s) { return (int)$s['id']; }, $sales);
        $itemsBySale = [];

        if (!empty($saleIds)) {
            $inPlaceholders = implode(',', array_fill(0, count($saleIds), '?'));
            $itemStmt = $pdo->prepare("
                SELECT 
                    si.*,
                    si.product_name as name,
                    si.quantity as qty,
                    si.unit_price as price,
                    si.batch_no as batchNo,
                    si.expiry_date as expiryDate
                FROM sale_items si
                WHERE si.sale_id IN ($inPlaceholders)
                ORDER BY si.id ASC
            ");
            $itemStmt->execute($saleIds);
            $allItems = $itemStmt->fetchAll();

            foreach ($allItems as $it) {
                $qty = (int)($it['qty'] ?? ($it['quantity'] ?? 1));
                $price = (float)($it['price'] ?? ($it['unit_price'] ?? 0));
                $pName = (string)($it['name'] ?? ($it['product_name'] ?? 'Item'));
                $bNo = (string)($it['batchNo'] ?? ($it['batch_no'] ?? ''));
                $exp = (string)($it['expiryDate'] ?? ($it['expiry_date'] ?? ''));

                $itemsBySale[$it['sale_id']][] = [
                    'id' => (int)$it['id'],
                    'productId' => (int)($it['product_id'] ?? 0),
                    'product_id' => (int)($it['product_id'] ?? 0),
                    'name' => $pName,
                    'product_name' => $pName,
                    'qty' => $qty,
                    'quantity' => $qty,
                    'price' => $price,
                    'unit_price' => $price,
                    'batchNo' => $bNo,
                    'batch_no' => $bNo,
                    'expiryDate' => $exp,
                    'expiry_date' => $exp,
                    'subtotal' => (float)($it['subtotal'] ?? ($qty * $price))
                ];
            }
        }

        foreach ($sales as &$sale) {
            $saleId = (int)$sale['id'];
            $invoiceNo = !empty($sale['invoice_no']) ? (string)$sale['invoice_no'] : (string)$saleId;
            $subtotal = (float)($sale['subtotal'] ?? $sale['total'] ?? 0);
            $discount = (float)($sale['discount'] ?? ($sale['discount_amount'] ?? 0));
            $total = (float)($sale['total'] ?? 0);
            $amountPaid = (float)($sale['amount_paid'] ?? ($sale['amount_tendered'] ?? $total));
            $change = (float)($sale['change'] ?? ($sale['change_amount'] ?? 0));

            $sale['db_id'] = $saleId;
            $sale['sale_id'] = $saleId;
            $sale['id'] = $invoiceNo;
            $sale['invoice_no'] = $invoiceNo;
            $sale['timestamp'] = $sale['created_at'] ?? '';
            $sale['customerName'] = (string)($sale['customer_name'] ?? 'Walk-in Customer');
            $sale['customer_name'] = $sale['customerName'];
            $sale['customerType'] = (string)($sale['customer_type'] ?? 'regular');
            $sale['customer_type'] = $sale['customerType'];
            $sale['customer_id_no'] = (string)($sale['customer_id_no'] ?? '');
            $sale['paymentMethod'] = (string)($sale['payment_method'] ?? 'Cash');
            $sale['payment_method'] = $sale['paymentMethod'];
            $sale['discountType'] = (string)($sale['discount_type'] ?? 'None');
            $sale['discount_type'] = $sale['discountType'];
            $sale['discount'] = $discount;
            $sale['discountAmount'] = $discount;
            $sale['discount_amount'] = $discount;
            $sale['subtotal'] = $subtotal;
            $sale['total'] = $total;
            $sale['amountPaid'] = $amountPaid;
            $sale['amount_paid'] = $amountPaid;
            $sale['amountTendered'] = $amountPaid;
            $sale['amount_tendered'] = $amountPaid;
            $sale['change'] = $change;
            $sale['changeAmount'] = $change;
            $sale['change_amount'] = $change;
            $sale['items'] = $itemsBySale[$saleId] ?? [];
            $sale['items_count'] = count($sale['items']);
        }
        unset($sale);
    }

    jsonResponse([
        'success' => true,
        'count' => count($sales),
        'data' => $sales,
        'transactions' => $sales,
        'sales' => $sales
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}


