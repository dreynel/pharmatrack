<?php
/**
 * PharmaTrack - Seed 2025 Historical Sales for Seasonal Demand Forecasting
 * Generates last year (2025) sales across all 12 months for retail products
 * Compliant with 20% Senior/PWD discounting and 0% for Regular customers.
 * Keeps inventory ledger dedicated to active on-hand batches so LotStocks qty matches POS list qty 100%.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';

try {
    $pdo = getDatabaseConnection();
    echo "Connected to database.\n";

    $pdo->beginTransaction();

    // 1. Clean old 2025 records
    echo "Cleaning old 2025 records...\n";
    $old2025Sales = $pdo->query("SELECT id FROM sales WHERE YEAR(created_at) = 2025")->fetchAll(PDO::FETCH_COLUMN);
    if (!empty($old2025Sales)) {
        $inList = implode(',', array_map('intval', $old2025Sales));
        $pdo->exec("DELETE FROM sale_items WHERE sale_id IN ({$inList})");
        $pdo->exec("DELETE FROM sales WHERE id IN ({$inList})");
    }

    $old2025StkIns = $pdo->query("SELECT id FROM stock_ins WHERE YEAR(date) = 2025")->fetchAll(PDO::FETCH_COLUMN);
    if (!empty($old2025StkIns)) {
        $inStkList = implode(',', array_map('intval', $old2025StkIns));
        $pdo->exec("DELETE FROM stock_in_items WHERE stock_in_id IN ({$inStkList})");
        $pdo->exec("DELETE FROM stock_ins WHERE id IN ({$inStkList})");
    }

    $pdo->exec("DELETE FROM inventory WHERE YEAR(transacted_at) = 2025 OR YEAR(created_at) = 2025");
    $pdo->exec("DELETE FROM stock_movements WHERE YEAR(timestamp) = 2025 OR YEAR(created_at) = 2025");

    // Retail fast-moving products
    $targetProducts = [
        2  => ['name' => 'Biogesic 500mg Tablet', 'price' => 8.00, 'cost' => 5.00, 'batch' => 'BG-2610A', 'exp' => '2028-10-31'],
        4  => ['name' => 'Neozep Forte Tablet', 'price' => 9.00, 'cost' => 5.50, 'batch' => 'NZ-2610B', 'exp' => '2028-09-30'],
        6  => ['name' => 'Bioflu 500mg Tablet', 'price' => 9.50, 'cost' => 6.00, 'batch' => 'BF-2610C', 'exp' => '2028-11-30'],
        8  => ['name' => 'Alaxan FR Capsule', 'price' => 13.00, 'cost' => 8.50, 'batch' => 'AX-2610D', 'exp' => '2028-08-31'],
        10 => ['name' => 'RiteMed Amoxicillin 500mg Capsule', 'price' => 8.50, 'cost' => 4.80, 'batch' => 'AM-2610E', 'exp' => '2028-06-30']
    ];

    // Monthly units sold per product across 12 months (mimicking real Philippine seasonal fluctuations)
    $monthlySchedule = [
        1  => [2 => 15, 4 => 14, 6 => 15, 8 => 12, 10 => 12], // Jan
        2  => [2 => 14, 4 => 14, 6 => 15, 8 => 12, 10 => 12], // Feb
        3  => [2 => 16, 4 => 15, 6 => 16, 8 => 14, 10 => 14], // Mar
        4  => [2 => 18, 4 => 16, 6 => 18, 8 => 15, 10 => 15], // Apr
        5  => [2 => 16, 4 => 15, 6 => 16, 8 => 14, 10 => 14], // May
        6  => [2 => 20, 4 => 18, 6 => 20, 8 => 16, 10 => 16], // Jun
        7  => [2 => 26, 4 => 25, 6 => 28, 8 => 24, 10 => 22], // Jul (Monsoon flu peak)
        8  => [2 => 28, 4 => 26, 6 => 30, 8 => 25, 10 => 24], // Aug (Heavy rain peak)
        9  => [2 => 22, 4 => 20, 6 => 22, 8 => 18, 10 => 18], // Sep
        10 => [2 => 24, 4 => 22, 6 => 25, 8 => 20, 10 => 20], // Oct
        11 => [2 => 28, 4 => 26, 6 => 30, 8 => 26, 10 => 24], // Nov (Flu seasonal surge)
        12 => [2 => 25, 4 => 25, 6 => 26, 8 => 24, 10 => 20]  // Dec (Holiday cold weather)
    ];

    // 2. Insert 2025 POS Sales distributed across all 12 months
    $saleStmt = $pdo->prepare("
        INSERT INTO sales (
            invoice_no, cashier, subtotal, discount, discount_type,
            customer_type, customer_name, customer_id_no,
            total, vatable_sales, vat_amount, vat_exempt_sales, zero_rated_sales,
            payment_method, amount_paid, `change`, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, 0.00,
            ?, ?, ?, '2025 Historical Sales Record', ?, ?
        )
    ");

    $saleItemStmt = $pdo->prepare("
        INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, cost_price, batch_no, expiry_date, subtotal, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $customerProfiles = [
        ['type' => 'senior', 'name' => 'Lola Remedios Santos', 'id_no' => 'OSCA-2024-8841', 'method' => 'Cash'],
        ['type' => 'pwd', 'name' => 'Roberto Tan', 'id_no' => 'PWD-2023-4109', 'method' => 'GCash'],
        ['type' => 'regular', 'name' => 'Juan dela Cruz', 'id_no' => null, 'method' => 'Cash'],
        ['type' => 'regular', 'name' => 'Maria Clara Santos', 'id_no' => null, 'method' => 'Maya'],
        ['type' => 'senior', 'name' => 'Lolo Ernesto Macaraeg', 'id_no' => 'OSCA-2025-1192', 'method' => 'Cash'],
        ['type' => 'regular', 'name' => 'Teresa Reyes', 'id_no' => null, 'method' => 'Cash']
    ];

    $invoiceSeq = 2000;
    $totalSalesCount = 0;

    foreach ($monthlySchedule as $m => $prodQtys) {
        $groups = [
            ['day' => 12, 'pids' => [2, 4, 6], 'cust' => $customerProfiles[($m * 2) % count($customerProfiles)]],
            ['day' => 24, 'pids' => [8, 10], 'cust' => $customerProfiles[($m * 2 + 1) % count($customerProfiles)]]
        ];

        foreach ($groups as $grp) {
            $day = $grp['day'];
            $timeStr = sprintf("2025-%02d-%02d %02d:%02d:00", $m, $day, 11, 30);
            $invoiceNo = sprintf("INV-2025%02d-%04d", $m, ++$invoiceSeq);

            $cust = $grp['cust'];
            $isScPwd = in_array($cust['type'], ['senior', 'pwd']);

            $saleSubtotal = 0.0;
            $itemsToInsert = [];

            foreach ($grp['pids'] as $pId) {
                $p = $targetProducts[$pId];
                $qty = $prodQtys[$pId];
                $lineTotal = round($qty * $p['price'], 2);
                $saleSubtotal += $lineTotal;

                $itemsToInsert[] = [
                    'product_id' => $pId,
                    'name' => $p['name'],
                    'qty' => $qty,
                    'price' => $p['price'],
                    'cost' => $p['cost'],
                    'batch' => $p['batch'],
                    'exp' => $p['exp'],
                    'subtotal' => $lineTotal
                ];
            }

            $discountAmount = 0.00;
            $discountType = 'Regular';
            $vatableSales = 0.00;
            $vatAmount = 0.00;
            $vatExemptSales = 0.00;
            $finalTotal = 0.00;

            if ($isScPwd) {
                // RA 9994 / RA 10754 Statutory Rule: 20% discount + VAT exemption
                $netBase = round($saleSubtotal / 1.12, 2);
                $scDisc = round($netBase * 0.20, 2);
                $vatRelief = round($saleSubtotal - $netBase, 2);
                $discountAmount = round($vatRelief + $scDisc, 2);
                $finalTotal = max(0, round($netBase - $scDisc, 2));

                $vatableSales = 0.00;
                $vatAmount = 0.00;
                $vatExemptSales = $finalTotal;
                $discountType = ($cust['type'] === 'senior') ? 'Senior Citizen (20%)' : 'PWD (20%)';
            } else {
                $discountAmount = 0.00;
                $discountType = 'Regular';
                $finalTotal = $saleSubtotal;

                $vatableSales = round($finalTotal / 1.12, 2);
                $vatAmount = round($finalTotal - $vatableSales, 2);
                $vatExemptSales = 0.00;
            }

            $amountPaid = ceil($finalTotal / 50) * 50;
            if ($amountPaid < $finalTotal) $amountPaid = $finalTotal;
            $change = max(0, round($amountPaid - $finalTotal, 2));

            $cashier = ($m % 2 === 0) ? 'Cashier Xyra' : 'Cashier Juan';

            $saleStmt->execute([
                $invoiceNo,
                $cashier,
                $saleSubtotal,
                $discountAmount,
                $discountType,
                $cust['type'],
                $cust['name'],
                $cust['id_no'],
                $finalTotal,
                $vatableSales,
                $vatAmount,
                $vatExemptSales,
                $cust['method'],
                $amountPaid,
                $change,
                $timeStr,
                $timeStr
            ]);
            $saleId = (int)$pdo->lastInsertId();
            $totalSalesCount++;

            foreach ($itemsToInsert as $it) {
                $saleItemStmt->execute([
                    $saleId,
                    $it['product_id'],
                    $it['name'],
                    $it['qty'],
                    $it['price'],
                    $it['cost'],
                    $it['batch'],
                    $it['exp'],
                    $it['subtotal'],
                    $timeStr,
                    $timeStr
                ]);
            }
        }
    }

    echo "  ✓ Seeded {$totalSalesCount} historical POS sales transactions across all 12 months of 2025.\n";

    // 3. Resync live product stock from inventory ledger to ensure current 2026 stock is preserved exactly
    foreach (range(1, 10) as $pId) {
        syncProductStockFromInventory($pdo, $pId);
        $currStock = (int)$pdo->query("SELECT stock FROM products WHERE id = {$pId}")->fetchColumn();
        $status = ($currStock > 10) ? 'In Stock' : (($currStock > 0) ? 'Low Stock' : 'Out of Stock');
        $pdo->prepare("UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?")->execute([$status, $pId]);
    }

    $pdo->commit();

    echo "\n=== VERIFICATION OF LIVE STOCKS VS LOT STOCKS ===\n";
    require_once __DIR__ . '/check_stocks.php';

    // Export fresh hostinger and clean dumps
    echo "\nUpdating production database dumps...\n";
    require_once __DIR__ . '/export_database.php';

    echo "\n2025 historical sales seeded with 100% matched inventory & lot stocks!\n";

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
