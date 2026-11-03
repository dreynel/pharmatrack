<?php
/**
 * Action: Process POS Checkout & Sales Transaction
 * Domain: Modules/POS
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

if (!function_exists('getProductBatches')) {
    function getProductBatches(PDO $pdo, int $productId = 0): array {
        $sql = "
            SELECT 
                inv.product_id,
                COALESCE(p.name, inv.product_name) AS product_name,
                COALESCE(inv.batch_no, 'UNASSIGNED') AS batch_no,
                inv.expiry_date,
                SUM(inv.quantity) AS available_stock,
                MAX(inv.unit_cost) AS unit_cost
            FROM inventory inv
            LEFT JOIN products p ON inv.product_id = p.id
            WHERE 1=1
        ";
        $params = [];
        if ($productId > 0) {
            $sql .= " AND inv.product_id = ?";
            $params[] = $productId;
        }
        $sql .= "
            GROUP BY inv.product_id, product_name, COALESCE(inv.batch_no, 'UNASSIGNED'), inv.expiry_date
            HAVING available_stock > 0
            ORDER BY 
                CASE WHEN inv.expiry_date IS NULL THEN 1 ELSE 0 END,
                inv.expiry_date ASC, 
                batch_no ASC
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function($r) {
            return [
                'productId' => (int)$r['product_id'],
                'productName' => $r['product_name'],
                'batchNo' => $r['batch_no'] === 'UNASSIGNED' ? '' : $r['batch_no'],
                'batch_no' => $r['batch_no'] === 'UNASSIGNED' ? '' : $r['batch_no'],
                'displayBatch' => $r['batch_no'] === 'UNASSIGNED' ? 'Default / No Batch' : $r['batch_no'],
                'expiryDate' => $r['expiry_date'] ?: '',
                'expiry_date' => $r['expiry_date'] ?: '',
                'availableStock' => (int)$r['available_stock'],
                'stock' => (int)$r['available_stock'],
                'unitCost' => (float)$r['unit_cost']
            ];
        }, $rows);
    }
}

$pdo = getDatabaseConnection();
$input = getJsonInput();

$items = $input['items'] ?? [];
$paymentMethod = sanitizeString($input['payment_method'] ?? ($input['paymentMethod'] ?? 'Cash'));
$amountPaid = (float)($input['amount_paid'] ?? ($input['amountPaid'] ?? ($input['amount_tendered'] ?? ($input['amountTendered'] ?? 0))));
$discountType = sanitizeString($input['discount_type'] ?? ($input['discountType'] ?? 'None'));
$customerType = sanitizeString($input['customer_type'] ?? ($input['customerType'] ?? 'regular'));
$customerName = sanitizeString($input['customer_name'] ?? ($input['customerName'] ?? ''));
$customerIdNo = sanitizeString($input['customer_id_no'] ?? ($input['customerIdNo'] ?? ''));
$notes = sanitizeString($input['notes'] ?? '');
$cashier = sanitizeString($input['cashier'] ?? ($_SESSION['user']['name'] ?? ($_SESSION['user']['username'] ?? 'Cashier')));

if (empty($items) || !is_array($items)) {
    jsonResponse(['success' => false, 'error' => 'Cart is empty. Please select products to purchase.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Calculate and verify subtotal and stock
    $calculatedSubtotal = 0.0;
    $preparedItems = [];

    $fetchProdStmt = $pdo->prepare("SELECT id, name, unit_price, cost_price, stock FROM products WHERE id = ? FOR UPDATE");

    foreach ($items as $item) {
        $productId = (int)($item['productId'] ?? ($item['product_id'] ?? ($item['id'] ?? 0)));
        $qty = (int)($item['qty'] ?? ($item['quantity'] ?? 1));

        if ($productId <= 0 || $qty <= 0) {
            throw new Exception("Invalid item in transaction cart.");
        }

        $fetchProdStmt->execute([$productId]);
        $prod = $fetchProdStmt->fetch();

        if (!$prod) {
            throw new Exception("Product #{$productId} not found.");
        }

        if ($prod['stock'] < $qty) {
            throw new Exception("Insufficient stock for '{$prod['name']}'. Available: {$prod['stock']}, requested: {$qty}.");
        }

        $unitPrice = (float)$prod['unit_price'];
        $costPrice = (float)$prod['cost_price'];
        $lineTotal = round($unitPrice * $qty, 2);
        $calculatedSubtotal += $lineTotal;

        // Resolve item batch and expiry (FEFO fallback if not specified or exact match if specified)
        $batchNo = trim((string)($item['batch_no'] ?? ($item['batchNo'] ?? '')));
        $expiryDate = trim((string)($item['expiry_date'] ?? ($item['expiryDate'] ?? '')));

        $activeBatches = getProductBatches($pdo, $productId);
        $matchedBatch = null;

        if ($batchNo !== '' && !empty($activeBatches)) {
            foreach ($activeBatches as $ab) {
                if ($ab['batchNo'] === $batchNo) {
                    $matchedBatch = $ab;
                    break;
                }
            }
        }

        // If batch was omitted or not found in active batches, pick first FEFO batch
        if (!$matchedBatch && !empty($activeBatches)) {
            $matchedBatch = $activeBatches[0];
            $batchNo = $matchedBatch['batchNo'];
        }

        if ($matchedBatch) {
            if ($expiryDate === '' && !empty($matchedBatch['expiryDate'])) {
                $expiryDate = $matchedBatch['expiryDate'];
            }
            if (!empty($matchedBatch['unitCost']) && $matchedBatch['unitCost'] > 0) {
                $costPrice = (float)$matchedBatch['unitCost'];
            }
        }

        // Fallback to product catalog master batch/expiry if still empty
        if ($batchNo === '' && !empty($prod['batch_no'])) {
            $batchNo = trim((string)$prod['batch_no']);
        }
        if ($expiryDate === '' && !empty($prod['expiry_date'])) {
            $expiryDate = trim((string)$prod['expiry_date']);
        }

        $preparedItems[] = [
            'product' => $prod,
            'productId' => (int)$prod['id'],
            'product_id' => (int)$prod['id'],
            'name' => $prod['name'],
            'product_name' => $prod['name'],
            'quantity' => $qty,
            'qty' => $qty,
            'unit_price' => $unitPrice,
            'price' => $unitPrice,
            'cost_price' => $costPrice,
            'batch_no' => $batchNo,
            'batchNo' => $batchNo,
            'expiry_date' => $expiryDate,
            'expiryDate' => $expiryDate,
            'subtotal' => $lineTotal
        ];
    }

    // 2. Compute Philippine Standard (BIR) VAT & Discounts (RA 9994 / RA 10754 / RR 16-2005)
    $isSeniorOrPwd = in_array(strtolower($customerType), ['senior', 'pwd']) || stripos($discountType, 'senior') !== false || stripos($discountType, 'pwd') !== false;

    $discountAmount = 0.0;
    $vatableSales = 0.0;
    $vatAmount = 0.0;
    $vatExemptSales = 0.0;
    $zeroRatedSales = 0.0;

    if ($isSeniorOrPwd) {
        // Under RA 9994 (Senior Citizens) & RA 10754 (PWD):
        // Shelf prices are 12% VAT-inclusive. The customer receives 100% VAT-Exemption plus 20% discount on the net base.
        $netBase = round($calculatedSubtotal / 1.12, 2);
        $scDiscount = round($netBase * 0.20, 2);
        $vatRelief = round($calculatedSubtotal - $netBase, 2);

        $discountAmount = round($vatRelief + $scDiscount, 2);
        $finalTotal = max(0, round($netBase - $scDiscount, 2));

        $vatableSales = 0.00;
        $vatAmount = 0.00;
        $vatExemptSales = $finalTotal;
    } else {
        // Only Senior Citizens and PWD customers are eligible for discounting (20%).
        // Regular customers receive 0% discount.
        $discountAmount = 0.00;
        $discountType = 'Regular';
        $customerType = 'regular';
        $finalTotal = max(0, round($calculatedSubtotal, 2));

        // BIR Standard 12% VAT:
        // VATable Sales = Final Total / 1.12
        // VAT Amount (12%) = Final Total - VATable Sales
        $vatableSales = round($finalTotal / 1.12, 2);
        $vatAmount = round($finalTotal - $vatableSales, 2);
        $vatExemptSales = 0.00;
    }

    // For non-cash transactions (GCash, Maya, Card), if amount tendered was omitted, default to final total
    if ($amountPaid <= 0 && $paymentMethod !== 'Cash') {
        $amountPaid = $finalTotal;
    }

    if ($paymentMethod === 'Cash' && $amountPaid < $finalTotal) {
        throw new Exception("Amount paid (₱" . number_format($amountPaid, 2) . ") is less than total due (₱" . number_format($finalTotal, 2) . ").");
    }

    $change = max(0, round($amountPaid - $finalTotal, 2));
    $invoiceNo = generateRefNo('INV');

    // 3. Insert Parent Sale with BIR Tax Breakdown Fields
    $saleStmt = $pdo->prepare("
        INSERT INTO sales (
            invoice_no, cashier, subtotal, discount, discount_type,
            customer_type, customer_name, customer_id_no,
            total, vatable_sales, vat_amount, vat_exempt_sales, zero_rated_sales,
            payment_method, amount_paid, `change`, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, NOW(), NOW()
        )
    ");
    $saleStmt->execute([
        $invoiceNo, $cashier, $calculatedSubtotal, $discountAmount, $discountType,
        $customerType, $customerName, $customerIdNo,
        $finalTotal, $vatableSales, $vatAmount, $vatExemptSales, $zeroRatedSales,
        $paymentMethod, $amountPaid, $change, $notes
    ]);
    $saleId = $pdo->lastInsertId();

    // 4. Insert Sale Items, Deduct Inventory & Record Stock Movement Ledger
    $insertItemStmt = $pdo->prepare("
        INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, cost_price, batch_no, expiry_date, subtotal, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $movementStmt = null;
    try {
        $movementStmt = $pdo->prepare("
            INSERT INTO stock_movements (
                movement_code, timestamp, product_id, product_name, type,
                qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
            ) VALUES (?, NOW(), ?, ?, 'SALE', ?, ?, ?, ?, ?, NOW(), NOW())
        ");
    } catch (Throwable $t) {
        $movementStmt = null;
    }

    foreach ($preparedItems as $pItem) {
        $prod = $pItem['product'];
        $qty = $pItem['quantity'];
        $itemBatch = !empty($pItem['batch_no']) ? $pItem['batch_no'] : null;
        $itemExpiry = !empty($pItem['expiry_date']) ? $pItem['expiry_date'] : null;

        $insertItemStmt->execute([
            $saleId, $prod['id'], $prod['name'], $qty,
            $pItem['unit_price'], $pItem['cost_price'],
            $itemBatch, $itemExpiry,
            $pItem['subtotal']
        ]);

        // Post negative (-) impact entry to accounting `inventory` table tagged with transaction_code = 'POS'
        // postInventoryEntry automatically calls syncProductStockFromInventory to update products.stock
        $ledEntry = postInventoryEntry($pdo, [
            'product_id' => (int)$prod['id'],
            'product_name' => $prod['name'],
            'transaction_code' => 'POS',
            'transaction_id' => (int)$saleId,
            'reference_no' => $invoiceNo,
            'impact' => -$qty,
            'unit_cost' => $pItem['cost_price'],
            'batch_no' => $itemBatch,
            'expiry_date' => $itemExpiry,
            'remarks' => "POS Sale Invoice #{$invoiceNo}" . ($itemBatch ? " (Batch: {$itemBatch})" : "")
        ]);

        $prevStock = (int)$ledEntry['previous_balance'];
        $newStock = (int)$ledEntry['running_balance'];
        $movCode = $ledEntry['entry_no'] ?: generateRefNo('MOV');

        if ($movementStmt) {
            try {
                $movementStmt->execute([
                    $movCode, $prod['id'], $prod['name'],
                    -$qty, $prevStock, $newStock, $invoiceNo,
                    "Sold via invoice #{$invoiceNo}"
                ]);
            } catch (Throwable $movErr) {
                // Stock movement error shouldn't abort transaction since inventory table is already updated
            }
        }
    }

    $pdo->commit();

    $receiptItems = array_map(function($pi) {
        return [
            'productId' => (int)$pi['productId'],
            'product_id' => (int)$pi['productId'],
            'name' => (string)$pi['name'],
            'product_name' => (string)$pi['name'],
            'qty' => (int)$pi['qty'],
            'quantity' => (int)$pi['qty'],
            'price' => (float)$pi['price'],
            'unit_price' => (float)$pi['unit_price'],
            'batchNo' => (string)($pi['batch_no'] ?? ''),
            'batch_no' => (string)($pi['batch_no'] ?? ''),
            'expiryDate' => (string)($pi['expiry_date'] ?? ''),
            'expiry_date' => (string)($pi['expiry_date'] ?? ''),
            'subtotal' => (float)$pi['subtotal']
        ];
    }, $preparedItems);

    $nowTimestamp = date('Y-m-d H:i:s');

    jsonResponse([
        'success' => true,
        'message' => 'Sale completed successfully.',
        'sale' => [
            'id' => $invoiceNo,
            'db_id' => (int)$saleId,
            'sale_id' => (int)$saleId,
            'invoice_no' => $invoiceNo,
            'cashier' => $cashier,
            'customer_name' => $customerName,
            'customerName' => $customerName,
            'customer_type' => $customerType,
            'customerType' => $customerType,
            'customer_id_no' => $customerIdNo,
            'customerIdNo' => $customerIdNo,
            'subtotal' => $calculatedSubtotal,
            'discount' => $discountAmount,
            'discount_type' => $discountType,
            'discountType' => $discountType,
            'total' => $finalTotal,
            'vatable_sales' => $vatableSales,
            'vatableSales' => $vatableSales,
            'vat_amount' => $vatAmount,
            'vatAmount' => $vatAmount,
            'vat_exempt_sales' => $vatExemptSales,
            'vatExemptSales' => $vatExemptSales,
            'zero_rated_sales' => $zeroRatedSales,
            'zeroRatedSales' => $zeroRatedSales,
            'paymentMethod' => $paymentMethod,
            'payment_method' => $paymentMethod,
            'amountPaid' => $amountPaid,
            'amount_paid' => $amountPaid,
            'change' => $change,
            'timestamp' => $nowTimestamp,
            'created_at' => $nowTimestamp,
            'items' => $receiptItems,
            'items_count' => count($preparedItems)
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}

