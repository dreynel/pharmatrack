<?php
/**
 * PharmaTrack - 5 Complete End-to-End Sample Workflows Seeder
 * Pipeline: Stock In -> Conversion (Bulk to Retail) -> POS Sale
 * Compliant with Philippine Pharmacy Laws (RA 9994 / RA 10754 20% discount + VAT exemption)
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';

try {
    $pdo = getDatabaseConnection();
    echo "Connected to database.\n";

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    $tablesToTruncate = [
        'sale_return_items',
        'sale_returns',
        'sale_items',
        'sales',
        'inventory',
        'stock_movements',
        'stock_in_items',
        'stock_ins',
        'stock_out_items',
        'stock_outs',
        'conversions',
        'purchase_order_items',
        'purchase_orders'
    ];

    echo "Truncating transactional tables...\n";
    foreach ($tablesToTruncate as $tbl) {
        $check = $pdo->query("SHOW TABLES LIKE '{$tbl}'")->fetchAll();
        if (!empty($check)) {
            $pdo->exec("TRUNCATE TABLE `{$tbl}`;");
            $pdo->exec("ALTER TABLE `{$tbl}` AUTO_INCREMENT = 1;");
        }
    }

    // Reset products base stock before starting workflows
    $pdo->exec("
        UPDATE products 
        SET stock = 0, 
            batch_no = NULL, 
            expiry_date = NULL, 
            status = 'Out of Stock', 
            daily_avg_sales = 0.00, 
            forecast_demand_30d = 0,
            is_bulk = 0,
            child_product_id = NULL,
            parent_product_id = NULL,
            conversion_rate = 1
    ");

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 5 Standard Medicine Pairs (Bulk Box -> Retail Tablet/Capsule)
    $workflows = [
        [
            'workflow_no' => 1,
            'brand' => 'Biogesic 500mg',
            'bulk_id' => 1,
            'bulk_name' => 'Biogesic 500mg Box (100s)',
            'bulk_cost' => 500.00,
            'bulk_price' => 700.00,
            'retail_id' => 2,
            'retail_name' => 'Biogesic 500mg Tablet',
            'retail_cost' => 5.00,
            'retail_price' => 8.00,
            'multiplier' => 100,
            'batch' => 'BG-2610A',
            'expiry' => '2028-10-31',
            'supplier_id' => 1,
            'supplier_name' => 'Unilab Distribution Phils',
            'stock_in_qty' => 10,
            'stock_in_ref' => 'DR-20261101-001',
            'stock_in_date' => '2026-11-01 08:30:00',
            'convert_qty' => 2,
            'convert_ref' => 'CNV-20261101-0001',
            'convert_date' => '2026-11-01 09:30:00',
            'sale_invoice' => 'INV-20261101-0001',
            'sale_date' => '2026-11-01 10:15:00',
            'customer_name' => 'Lola Remedios Santos',
            'customer_type' => 'senior',
            'customer_id_no' => 'OSCA-2024-8841',
            'sale_qty' => 20,
            'payment_method' => 'Cash',
            'amount_paid' => 120.00
        ],
        [
            'workflow_no' => 2,
            'brand' => 'Neozep Forte',
            'bulk_id' => 3,
            'bulk_name' => 'Neozep Forte Box (100s)',
            'bulk_cost' => 550.00,
            'bulk_price' => 750.00,
            'retail_id' => 4,
            'retail_name' => 'Neozep Forte Tablet',
            'retail_cost' => 5.50,
            'retail_price' => 9.00,
            'multiplier' => 100,
            'batch' => 'NZ-2610B',
            'expiry' => '2028-09-30',
            'supplier_id' => 1,
            'supplier_name' => 'Unilab Distribution Phils',
            'stock_in_qty' => 10,
            'stock_in_ref' => 'DR-20261101-002',
            'stock_in_date' => '2026-11-01 08:45:00',
            'convert_qty' => 2,
            'convert_ref' => 'CNV-20261101-0002',
            'convert_date' => '2026-11-01 09:40:00',
            'sale_invoice' => 'INV-20261101-0002',
            'sale_date' => '2026-11-01 11:00:00',
            'customer_name' => 'Roberto Tan',
            'customer_type' => 'pwd',
            'customer_id_no' => 'PWD-2023-4109',
            'sale_qty' => 15,
            'payment_method' => 'GCash',
            'amount_paid' => 96.43
        ],
        [
            'workflow_no' => 3,
            'brand' => 'Bioflu 500mg',
            'bulk_id' => 5,
            'bulk_name' => 'Bioflu 500mg Box (100s)',
            'bulk_cost' => 600.00,
            'bulk_price' => 800.00,
            'retail_id' => 6,
            'retail_name' => 'Bioflu 500mg Tablet',
            'retail_cost' => 6.00,
            'retail_price' => 9.50,
            'multiplier' => 100,
            'batch' => 'BF-2610C',
            'expiry' => '2028-11-30',
            'supplier_id' => 1,
            'supplier_name' => 'Unilab Distribution Phils',
            'stock_in_qty' => 10,
            'stock_in_ref' => 'DR-20261101-003',
            'stock_in_date' => '2026-11-01 09:00:00',
            'convert_qty' => 3,
            'convert_ref' => 'CNV-20261101-0003',
            'convert_date' => '2026-11-01 09:50:00',
            'sale_invoice' => 'INV-20261101-0003',
            'sale_date' => '2026-11-01 13:20:00',
            'customer_name' => 'Juan dela Cruz',
            'customer_type' => 'regular',
            'customer_id_no' => null,
            'sale_qty' => 12,
            'payment_method' => 'Cash',
            'amount_paid' => 200.00
        ],
        [
            'workflow_no' => 4,
            'brand' => 'Alaxan FR',
            'bulk_id' => 7,
            'bulk_name' => 'Alaxan FR Box (100s)',
            'bulk_cost' => 850.00,
            'bulk_price' => 1050.00,
            'retail_id' => 8,
            'retail_name' => 'Alaxan FR Capsule',
            'retail_cost' => 8.50,
            'retail_price' => 13.00,
            'multiplier' => 100,
            'batch' => 'AX-2610D',
            'expiry' => '2028-08-31',
            'supplier_id' => 3,
            'supplier_name' => 'Zuellig Pharma Philippines',
            'stock_in_qty' => 10,
            'stock_in_ref' => 'DR-20261101-004',
            'stock_in_date' => '2026-11-01 09:15:00',
            'convert_qty' => 2,
            'convert_ref' => 'CNV-20261101-0004',
            'convert_date' => '2026-11-01 10:00:00',
            'sale_invoice' => 'INV-20261101-0004',
            'sale_date' => '2026-11-01 14:45:00',
            'customer_name' => 'Lolo Ernesto Macaraeg',
            'customer_type' => 'senior',
            'customer_id_no' => 'OSCA-2025-1192',
            'sale_qty' => 10,
            'payment_method' => 'Cash',
            'amount_paid' => 100.00
        ],
        [
            'workflow_no' => 5,
            'brand' => 'RiteMed Amoxicillin 500mg',
            'bulk_id' => 9,
            'bulk_name' => 'RiteMed Amoxicillin 500mg Box (100s)',
            'bulk_cost' => 480.00,
            'bulk_price' => 650.00,
            'retail_id' => 10,
            'retail_name' => 'RiteMed Amoxicillin 500mg Capsule',
            'retail_cost' => 4.80,
            'retail_price' => 8.50,
            'multiplier' => 100,
            'batch' => 'AM-2610E',
            'expiry' => '2028-06-30',
            'supplier_id' => 2,
            'supplier_name' => 'Pascual Laboratories Inc.',
            'stock_in_qty' => 10,
            'stock_in_ref' => 'DR-20261101-005',
            'stock_in_date' => '2026-11-01 09:30:00',
            'convert_qty' => 2,
            'convert_ref' => 'CNV-20261101-0005',
            'convert_date' => '2026-11-01 10:15:00',
            'sale_invoice' => 'INV-20261101-0005',
            'sale_date' => '2026-11-01 16:10:00',
            'customer_name' => 'Maria Clara Santos',
            'customer_type' => 'regular',
            'customer_id_no' => null,
            'sale_qty' => 21,
            'payment_method' => 'Maya',
            'amount_paid' => 178.50
        ]
    ];

    echo "\nExecuting 5 Complete Workflows (Stock In -> Conversion -> POS Sale)...\n\n";

    $stkParentStmt = $pdo->prepare("
        INSERT INTO stock_ins (
            ref_no, supplier_id, supplier_name, date, total_amount, received_by, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'Xyra Andrea (Pharmacist)', ?, ?, ?)
    ");

    $stkChildStmt = $pdo->prepare("
        INSERT INTO stock_in_items (
            stock_in_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $convStmt = $pdo->prepare("
        INSERT INTO conversions (
            conv_code, date, source_product_id, source_product_name, source_uom, source_qty,
            target_product_id, target_product_name, target_uom, target_qty, multiplier,
            batch_no, expiry_date, operator, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, 'Box', ?,
            ?, ?, 'Piece', ?, ?,
            ?, ?, 'Xyra Andrea (Pharmacist)', 'Routine unboxing into retail dispensing bins.', ?, ?
        )
    ");

    $saleStmt = $pdo->prepare("
        INSERT INTO sales (
            invoice_no, cashier, subtotal, discount, discount_type,
            customer_type, customer_name, customer_id_no,
            total, vatable_sales, vat_amount, vat_exempt_sales, zero_rated_sales,
            payment_method, amount_paid, `change`, notes, created_at, updated_at
        ) VALUES (
            ?, 'Cashier Xyra', ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, 0.00,
            ?, ?, ?, 'POS Checkout Completed', ?, ?
        )
    ");

    $saleItemStmt = $pdo->prepare("
        INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, cost_price, batch_no, expiry_date, subtotal, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $movStmt = $pdo->prepare("
        INSERT INTO stock_movements (
            movement_code, timestamp, product_id, product_name, type,
            qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($workflows as $wf) {
        echo "=== WORKFLOW #{$wf['workflow_no']}: {$wf['brand']} ===\n";

        // -------------------------------------------------------------
        // STEP 1: STOCK IN DELIVERY (10 Boxes of Bulk Product)
        // -------------------------------------------------------------
        $stockInTotal = $wf['stock_in_qty'] * $wf['bulk_cost'];
        $stkParentStmt->execute([
            $wf['stock_in_ref'],
            $wf['supplier_id'],
            $wf['supplier_name'],
            substr($wf['stock_in_date'], 0, 10),
            $stockInTotal,
            "Delivery intake of {$wf['stock_in_qty']} boxes from {$wf['supplier_name']}",
            $wf['stock_in_date'],
            $wf['stock_in_date']
        ]);
        $stockInId = (int)$pdo->lastInsertId();

        $stkChildStmt->execute([
            $stockInId,
            $wf['bulk_id'],
            $wf['bulk_name'],
            $wf['stock_in_qty'],
            $wf['bulk_cost'],
            $wf['batch'],
            $wf['expiry'],
            $wf['stock_in_date'],
            $wf['stock_in_date']
        ]);

        // Post Inventory Ledger for Stock In
        $inLedger = postInventoryEntry($pdo, [
            'product_id' => $wf['bulk_id'],
            'product_name' => $wf['bulk_name'],
            'transaction_code' => 'StockIn',
            'transaction_id' => $stockInId,
            'reference_no' => $wf['stock_in_ref'],
            'quantity' => +$wf['stock_in_qty'],
            'impact' => +$wf['stock_in_qty'],
            'unit_cost' => $wf['bulk_cost'],
            'batch_no' => $wf['batch'],
            'expiry_date' => $wf['expiry'],
            'remarks' => "Stock-In delivery #{$wf['stock_in_ref']} from {$wf['supplier_name']}",
            'transacted_at' => $wf['stock_in_date']
        ]);

        $movStmt->execute([
            "MOV-IN-{$stockInId}",
            $wf['stock_in_date'],
            $wf['bulk_id'],
            $wf['bulk_name'],
            'STOCK_IN',
            +$wf['stock_in_qty'],
            $inLedger['previous_balance'],
            $inLedger['running_balance'],
            $wf['stock_in_ref'],
            "Received {$wf['stock_in_qty']} Boxes via {$wf['stock_in_ref']}",
            $wf['stock_in_date'],
            $wf['stock_in_date']
        ]);

        // Update bulk product metadata
        $pdo->prepare("
            UPDATE products 
            SET cost_price = ?,
                unit_price = ?,
                batch_no = ?,
                expiry_date = ?,
                updated_at = ?
            WHERE id = ?
        ")->execute([
            $wf['bulk_cost'],
            $wf['bulk_price'],
            $wf['batch'],
            $wf['expiry'],
            $wf['stock_in_date'],
            $wf['bulk_id']
        ]);

        echo "  [1. Stock In]   : +{$wf['stock_in_qty']} Boxes of {$wf['bulk_name']} (Ref: {$wf['stock_in_ref']}, Stock = {$inLedger['running_balance']})\n";

        // -------------------------------------------------------------
        // STEP 2: CONVERSION (Unboxing Bulk Boxes -> Retail Units)
        // -------------------------------------------------------------
        $targetProducedQty = $wf['convert_qty'] * $wf['multiplier'];

        // Link parent and child products
        $pdo->prepare("
            UPDATE products 
            SET is_bulk = 1, 
                child_product_id = ?, 
                conversion_rate = ?, 
                updated_at = ? 
            WHERE id = ?
        ")->execute([$wf['retail_id'], $wf['multiplier'], $wf['convert_date'], $wf['bulk_id']]);

        $pdo->prepare("
            UPDATE products 
            SET parent_product_id = ?, 
                cost_price = ?,
                unit_price = ?,
                batch_no = ?, 
                expiry_date = ?, 
                updated_at = ? 
            WHERE id = ?
        ")->execute([
            $wf['bulk_id'], 
            $wf['retail_cost'],
            $wf['retail_price'],
            $wf['batch'], 
            $wf['expiry'], 
            $wf['convert_date'], 
            $wf['retail_id']
        ]);

        $convStmt->execute([
            $wf['convert_ref'],
            $wf['convert_date'],
            $wf['bulk_id'],
            $wf['bulk_name'],
            $wf['convert_qty'],
            $wf['retail_id'],
            $wf['retail_name'],
            $targetProducedQty,
            $wf['multiplier'],
            $wf['batch'],
            $wf['expiry'],
            $wf['convert_date'],
            $wf['convert_date']
        ]);
        $convId = (int)$pdo->lastInsertId();

        // Ledger: Deduct bulk source boxes
        $convOutLedger = postInventoryEntry($pdo, [
            'product_id' => $wf['bulk_id'],
            'product_name' => $wf['bulk_name'],
            'transaction_code' => 'Conversion',
            'transaction_id' => $convId,
            'reference_no' => $wf['convert_ref'],
            'quantity' => -$wf['convert_qty'],
            'impact' => -$wf['convert_qty'],
            'unit_cost' => $wf['bulk_cost'],
            'batch_no' => $wf['batch'],
            'expiry_date' => $wf['expiry'],
            'remarks' => "Unboxed {$wf['convert_qty']} Boxes into {$targetProducedQty} {$wf['retail_name']} (#{$wf['convert_ref']})",
            'transacted_at' => $wf['convert_date']
        ]);

        // Ledger: Credit retail units
        $convInLedger = postInventoryEntry($pdo, [
            'product_id' => $wf['retail_id'],
            'product_name' => $wf['retail_name'],
            'transaction_code' => 'Conversion',
            'transaction_id' => $convId,
            'reference_no' => $wf['convert_ref'],
            'quantity' => +$targetProducedQty,
            'impact' => +$targetProducedQty,
            'unit_cost' => $wf['retail_cost'],
            'batch_no' => $wf['batch'],
            'expiry_date' => $wf['expiry'],
            'remarks' => "Received {$targetProducedQty} from {$wf['bulk_name']} (#{$wf['convert_ref']})",
            'transacted_at' => $wf['convert_date']
        ]);

        $movStmt->execute([
            "MOV-CNV-OUT-{$convId}",
            $wf['convert_date'],
            $wf['bulk_id'],
            $wf['bulk_name'],
            'Conversion Out',
            -$wf['convert_qty'],
            $convOutLedger['previous_balance'],
            $convOutLedger['running_balance'],
            $wf['convert_ref'],
            "Unboxed to retail (#{$wf['convert_ref']})",
            $wf['convert_date'],
            $wf['convert_date']
        ]);

        $movStmt->execute([
            "MOV-CNV-IN-{$convId}",
            $wf['convert_date'],
            $wf['retail_id'],
            $wf['retail_name'],
            'Conversion In',
            +$targetProducedQty,
            $convInLedger['previous_balance'],
            $convInLedger['running_balance'],
            $wf['convert_ref'],
            "Credited from unboxing (#{$wf['convert_ref']})",
            $wf['convert_date'],
            $wf['convert_date']
        ]);

        echo "  [2. Conversion] : -{$wf['convert_qty']} Boxes -> +{$targetProducedQty} Retail Units (Bulk Stock: {$convOutLedger['running_balance']}, Retail Stock: {$convInLedger['running_balance']})\n";

        // -------------------------------------------------------------
        // STEP 3: POS SALE (Customer Purchase & BIR Statutory Breakdown)
        // -------------------------------------------------------------
        $subtotal = round($wf['sale_qty'] * $wf['retail_price'], 2);
        $isSeniorOrPwd = in_array($wf['customer_type'], ['senior', 'pwd']);

        $discountAmount = 0.00;
        $discountType = 'Regular';
        $vatableSales = 0.00;
        $vatAmount = 0.00;
        $vatExemptSales = 0.00;
        $finalTotal = 0.00;

        if ($isSeniorOrPwd) {
            // RA 9994 / RA 10754 Statutory Rule:
            // Shelf prices are 12% VAT-inclusive. 100% VAT Exemption + 20% discount on the net base.
            $netBase = round($subtotal / 1.12, 2);
            $scDiscount = round($netBase * 0.20, 2);
            $vatRelief = round($subtotal - $netBase, 2);
            $discountAmount = round($vatRelief + $scDiscount, 2);
            $finalTotal = max(0, round($netBase - $scDiscount, 2));

            $vatableSales = 0.00;
            $vatAmount = 0.00;
            $vatExemptSales = $finalTotal;
            $discountType = ($wf['customer_type'] === 'senior') ? 'Senior Citizen (20%)' : 'PWD (20%)';
        } else {
            // Regular customer: 0% discount
            $discountAmount = 0.00;
            $discountType = 'Regular';
            $finalTotal = $subtotal;

            $vatableSales = round($finalTotal / 1.12, 2);
            $vatAmount = round($finalTotal - $vatableSales, 2);
            $vatExemptSales = 0.00;
        }

        $amountPaid = (float)$wf['amount_paid'];
        $change = max(0, round($amountPaid - $finalTotal, 2));

        $saleStmt->execute([
            $wf['sale_invoice'],
            $subtotal,
            $discountAmount,
            $discountType,
            $wf['customer_type'],
            $wf['customer_name'],
            $wf['customer_id_no'],
            $finalTotal,
            $vatableSales,
            $vatAmount,
            $vatExemptSales,
            $wf['payment_method'],
            $amountPaid,
            $change,
            $wf['sale_date'],
            $wf['sale_date']
        ]);
        $saleId = (int)$pdo->lastInsertId();

        $lineSubtotal = round($wf['sale_qty'] * $wf['retail_price'], 2);
        $saleItemStmt->execute([
            $saleId,
            $wf['retail_id'],
            $wf['retail_name'],
            $wf['sale_qty'],
            $wf['retail_price'],
            $wf['retail_cost'],
            $wf['batch'],
            $wf['expiry'],
            $lineSubtotal,
            $wf['sale_date'],
            $wf['sale_date']
        ]);

        // Post Inventory Outflow for POS Sale
        $saleLedger = postInventoryEntry($pdo, [
            'product_id' => $wf['retail_id'],
            'product_name' => $wf['retail_name'],
            'transaction_code' => 'POS',
            'transaction_id' => $saleId,
            'reference_no' => $wf['sale_invoice'],
            'quantity' => -$wf['sale_qty'],
            'impact' => -$wf['sale_qty'],
            'unit_cost' => $wf['retail_cost'],
            'batch_no' => $wf['batch'],
            'expiry_date' => $wf['expiry'],
            'remarks' => "POS Sale Invoice #{$wf['sale_invoice']} to {$wf['customer_name']}",
            'transacted_at' => $wf['sale_date']
        ]);

        $movStmt->execute([
            "MOV-SALE-{$saleId}",
            $wf['sale_date'],
            $wf['retail_id'],
            $wf['retail_name'],
            'SALE',
            -$wf['sale_qty'],
            $saleLedger['previous_balance'],
            $saleLedger['running_balance'],
            $wf['sale_invoice'],
            "Sold {$wf['sale_qty']} units via #{$wf['sale_invoice']}",
            $wf['sale_date'],
            $wf['sale_date']
        ]);

        echo "  [3. POS Sale]   : Sold {$wf['sale_qty']} units of {$wf['retail_name']} (Invoice: {$wf['sale_invoice']}, Customer: {$wf['customer_name']}, Disc: -₱{$discountAmount}, Total Due: ₱{$finalTotal}, Remaining Stock: {$saleLedger['running_balance']})\n\n";
    }

    // Refresh products catalog stock & status
    foreach (range(1, 10) as $pId) {
        syncProductStockFromInventory($pdo, $pId);
        $currStock = (int)$pdo->query("SELECT stock FROM products WHERE id = {$pId}")->fetchColumn();
        $status = ($currStock > 10) ? 'In Stock' : (($currStock > 0) ? 'Low Stock' : 'Out of Stock');
        $pdo->prepare("UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?")->execute([$status, $pId]);
    }

    echo "=== SUMMARY OF GENERATED WORKFLOW RECORDS ===\n";
    $tablesToCheck = [
        'stock_ins',
        'stock_in_items',
        'conversions',
        'sales',
        'sale_items',
        'inventory',
        'stock_movements',
        'products'
    ];

    foreach ($tablesToCheck as $tbl) {
        $count = $pdo->query("SELECT COUNT(*) FROM `{$tbl}`")->fetchColumn();
        printf("  - %-20s : %d records\n", $tbl, $count);
    }

    echo "\n=== PRODUCTS CATALOG CURRENT INVENTORY STATUS ===\n";
    $prods = $pdo->query("SELECT id, name, uom, stock, status, batch_no, expiry_date, is_bulk, conversion_rate FROM products ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($prods as $p) {
        printf("  [ID %2d] %-36s | %-7s | Stock: %3d | Status: %-12s | Batch: %-9s | Exp: %s\n",
            $p['id'], $p['name'], $p['uom'], $p['stock'], $p['status'], $p['batch_no'] ?? 'N/A', $p['expiry_date'] ?? 'N/A');
    }

    // Export fresh hostinger and clean dumps
    echo "\nExporting updated live database dumps...\n";
    require_once __DIR__ . '/export_database.php';

    echo "\nAll 5 sample workflows completed and synchronized successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
