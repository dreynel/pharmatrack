<?php
/**
 * Action: Fetch Single Sale & Itemized Receipt
 * Domain: Modules/POS
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$idInput = trim((string)($_GET['id'] ?? ($_GET['invoice_no'] ?? '')));

if ($idInput === '') {
    jsonResponse(['success' => false, 'error' => 'Sale ID or invoice number is required.'], 400);
}

try {
    // 1. Fetch Parent Sale Header (by id or invoice_no)
    if (is_numeric($idInput)) {
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE id = ? OR invoice_no = ? LIMIT 1");
        $stmt->execute([(int)$idInput, $idInput]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE invoice_no = ? OR id = ? LIMIT 1");
        $stmt->execute([$idInput, $idInput]);
    }
    $sale = $stmt->fetch();

    if (!$sale) {
        jsonResponse(['success' => false, 'error' => 'Sale not found.'], 404);
    }

    $saleId = (int)$sale['id'];

    // 2. Fetch Itemized Products
    $itemStmt = $pdo->prepare("
        SELECT 
            si.*,
            si.product_name as name,
            si.quantity as qty,
            si.unit_price as price,
            si.batch_no as batchNo,
            si.expiry_date as expiryDate,
            p.sku,
            p.category,
            p.uom
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
    ");
    $itemStmt->execute([$saleId]);
    $items = $itemStmt->fetchAll();

    $subtotal = (float)($sale['subtotal'] ?? $sale['total'] ?? 0);
    $discount = (float)($sale['discount'] ?? ($sale['discount_amount'] ?? 0));
    $total = (float)($sale['total'] ?? 0);
    $amountPaid = (float)($sale['amount_paid'] ?? ($sale['amount_tendered'] ?? $total));
    $change = (float)($sale['change'] ?? ($sale['change_amount'] ?? 0));

    $formattedItems = array_map(function($it) {
        $qty = (int)($it['qty'] ?? ($it['quantity'] ?? 1));
        $price = (float)($it['price'] ?? ($it['unit_price'] ?? 0));
        $sub = (float)($it['subtotal'] ?? ($qty * $price));
        $batch = (string)($it['batchNo'] ?? ($it['batch_no'] ?? ''));
        $exp = (string)($it['expiryDate'] ?? ($it['expiry_date'] ?? ''));
        $pName = (string)($it['name'] ?? ($it['product_name'] ?? 'Item'));

        return [
            'id' => (int)$it['id'],
            'productId' => (int)($it['product_id'] ?? 0),
            'product_id' => (int)($it['product_id'] ?? 0),
            'name' => $pName,
            'product_name' => $pName,
            'qty' => $qty,
            'quantity' => $qty,
            'price' => $price,
            'unit_price' => $price,
            'batchNo' => $batch,
            'batch_no' => $batch,
            'expiryDate' => $exp,
            'expiry_date' => $exp,
            'subtotal' => $sub,
            'sku' => (string)($it['sku'] ?? ''),
            'category' => (string)($it['category'] ?? ''),
            'uom' => (string)($it['uom'] ?? '')
        ];
    }, $items);

    // BIR Standard 12% VAT calculations
    $custType = strtolower((string)($sale['customer_type'] ?? 'regular'));
    $isScPwd = in_array($custType, ['senior', 'pwd']) || stripos((string)($sale['discount_type'] ?? ''), 'senior') !== false || stripos((string)($sale['discount_type'] ?? ''), 'pwd') !== false;

    $vatableSales = isset($sale['vatable_sales']) && (float)$sale['vatable_sales'] > 0 ? (float)$sale['vatable_sales'] : 0.0;
    $vatAmount = isset($sale['vat_amount']) && (float)$sale['vat_amount'] > 0 ? (float)$sale['vat_amount'] : 0.0;
    $vatExemptSales = isset($sale['vat_exempt_sales']) && (float)$sale['vat_exempt_sales'] > 0 ? (float)$sale['vat_exempt_sales'] : 0.0;
    $zeroRatedSales = isset($sale['zero_rated_sales']) ? (float)$sale['zero_rated_sales'] : 0.0;

    if ($vatableSales == 0.0 && $vatAmount == 0.0 && $vatExemptSales == 0.0) {
        if ($isScPwd) {
            $vatableSales = 0.0;
            $vatAmount = 0.0;
            $vatExemptSales = $total;
        } else {
            $vatableSales = round($total / 1.12, 2);
            $vatAmount = round($total - $vatableSales, 2);
            $vatExemptSales = 0.0;
        }
    }

    $formattedSale = [
        'id' => (string)($sale['invoice_no'] ?: $sale['id']),
        'db_id' => $saleId,
        'sale_id' => $saleId,
        'invoice_no' => (string)($sale['invoice_no'] ?: $sale['id']),
        'cashier' => (string)($sale['cashier'] ?? 'Pharmacist'),
        'customer_name' => (string)($sale['customer_name'] ?? 'Walk-in Customer'),
        'customerName' => (string)($sale['customer_name'] ?? 'Walk-in Customer'),
        'customer_type' => (string)($sale['customer_type'] ?? 'regular'),
        'customerType' => (string)($sale['customer_type'] ?? 'regular'),
        'customer_id_no' => (string)($sale['customer_id_no'] ?? ''),
        'customerIdNo' => (string)($sale['customer_id_no'] ?? ''),
        'payment_method' => (string)($sale['payment_method'] ?? 'Cash'),
        'paymentMethod' => (string)($sale['payment_method'] ?? 'Cash'),
        'discount_type' => (string)($sale['discount_type'] ?? 'None'),
        'discountType' => (string)($sale['discount_type'] ?? 'None'),
        'discount' => $discount,
        'discount_amount' => $discount,
        'discountAmount' => $discount,
        'subtotal' => $subtotal,
        'total' => $total,
        'vatable_sales' => $vatableSales,
        'vatableSales' => $vatableSales,
        'vat_amount' => $vatAmount,
        'vatAmount' => $vatAmount,
        'vat_exempt_sales' => $vatExemptSales,
        'vatExemptSales' => $vatExemptSales,
        'zero_rated_sales' => $zeroRatedSales,
        'zeroRatedSales' => $zeroRatedSales,
        'amount_paid' => $amountPaid,
        'amountPaid' => $amountPaid,
        'amount_tendered' => $amountPaid,
        'amountTendered' => $amountPaid,
        'change' => $change,
        'change_amount' => $change,
        'changeAmount' => $change,
        'notes' => (string)($sale['notes'] ?? ''),
        'timestamp' => (string)($sale['created_at'] ?? ''),
        'created_at' => (string)($sale['created_at'] ?? ''),
        'items' => $formattedItems,
        'items_count' => count($formattedItems)
    ];

    jsonResponse([
        'success' => true,
        'sale' => $formattedSale,
        'transaction' => $formattedSale,
        'items' => $formattedItems
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}


