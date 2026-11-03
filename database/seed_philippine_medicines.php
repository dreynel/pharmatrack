<?php
/**
 * PharmaTrack - Database Cleaner & Philippine Medicines Seeder
 * 
 * Cleans: sales, sale_items, inventory, stock_movements, conversions,
 *         stock_ins, stock_in_items, stock_outs, stock_out_items, purchase_orders, products
 * 
 * Seeds 5 Iconic Philippine Medicines with full lifecycle operations:
 *   1. Biogesic 500mg (Paracetamol) - Unilab
 *   2. Neozep Forte (Phenylephrine + Chlorphenamine + Paracetamol) - Unilab
 *   3. Bioflu 500mg (Phenylephrine + Chlorphenamine + Paracetamol) - Unilab
 *   4. Alaxan FR (Paracetamol + Ibuprofen) - Unilab
 *   5. RiteMed Amoxicillin 500mg (Amoxicillin Trihydrate) - RiteMed / Pascual
 * 
 * Operations Performed to All 5:
 *   - Master Products Catalog Setup (Bulk Box & Retail Dispensing Unit Pairs)
 *   - Conversion Rules Configured (1 Box = 100 Tablets / Capsules)
 *   - Stock In (Official Supplier Delivery Receipt from Unilab / Zuellig)
 *   - Conversion / Unboxing (Breakdown of 2 Boxes into 200 Dispensing Units)
 *   - POS Sales Transactions (Multi-day retail sales, senior citizen discount, cash/GCash)
 *   - Stock Out Disposal (Disposal voucher for clinical write-off / damaged foil packaging)
 *   - Full Perpetual Accounting Inventory Ledger & Stock Movements Sync
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';

try {
    $pdo = getDatabaseConnection();
    echo "========================================================\n";
    echo "  PHARMATRACK: DATABASE CLEANER & SEEDER\n";
    echo "========================================================\n";
    echo "Connected to database successfully.\n\n";

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // 1. TRUNCATE ALL TRANSACTIONAL TABLES & PRODUCTS
    $tablesToTruncate = [
        'purchase_order_items',
        'purchase_orders',
        'sale_items',
        'sales',
        'stock_out_items',
        'stock_outs',
        'stock_in_items',
        'stock_ins',
        'stock_movements',
        'inventory',
        'conversions',
        'products'
    ];

    echo "[1/7] Cleaning transactional tables and products catalog...\n";
    foreach ($tablesToTruncate as $tbl) {
        $check = $pdo->query("SHOW TABLES LIKE '{$tbl}'")->fetchAll();
        if (!empty($check)) {
            $pdo->exec("TRUNCATE TABLE `{$tbl}`;");
            $pdo->exec("ALTER TABLE `{$tbl}` AUTO_INCREMENT = 1;");
            echo "  ✓ Truncated: {$tbl}\n";
        }
    }

    // 2. VERIFY / SEED BASE LOOKUP TABLES (Categories, UOMs, Suppliers, Users)
    echo "\n[2/7] Verifying standard Philippine drugstore lookups...\n";

    // Standard Categories
    $categories = [
        ['id' => 1, 'name' => 'Analgesics', 'desc' => 'Pain relievers, antipyretics, and fever control medications'],
        ['id' => 2, 'name' => 'Antibiotics', 'desc' => 'Antibacterial and prescription anti-infectives'],
        ['id' => 3, 'name' => 'Respiratory', 'desc' => 'Decongestants, antitussives, and antihistamines for colds/cough'],
        ['id' => 4, 'name' => 'Vitamins & Supplements', 'desc' => 'Daily dietary multivitamins, minerals, and immune boosters'],
        ['id' => 5, 'name' => 'Cardiovascular', 'desc' => 'Hypertension, heart care, and maintenance medications'],
        ['id' => 6, 'name' => 'Antihistamines', 'desc' => 'Allergy relief, anti-itch, and non-drowsy formulations'],
        ['id' => 7, 'name' => 'First Aid', 'desc' => 'Antiseptics, rubbing alcohol, bandages, and clinical supplies'],
        ['id' => 8, 'name' => 'Gastrointestinal', 'desc' => 'Antacids, anti-diarrheal, and digestive health medications']
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE description = VALUES(description)");
    foreach ($categories as $c) {
        $catStmt->execute([$c['id'], $c['name'], $c['desc']]);
    }

    // Standard UOMs
    $uoms = [
        ['id' => 1, 'name' => 'Box', 'abbr' => 'box', 'desc' => 'Standard packaging box / carton of 100 units'],
        ['id' => 2, 'name' => 'Tablet', 'abbr' => 'tab', 'desc' => 'Solid single-dose pharmaceutical tablet'],
        ['id' => 3, 'name' => 'Capsule', 'abbr' => 'cap', 'desc' => 'Gelatin encased single-dose medicine'],
        ['id' => 4, 'name' => 'Strip', 'abbr' => 'strip', 'desc' => 'Blister strip packaging of 10 units'],
        ['id' => 5, 'name' => 'Bottle', 'abbr' => 'btl', 'desc' => 'Liquid suspension, syrup, or oral drops'],
        ['id' => 6, 'name' => 'Tube', 'abbr' => 'tube', 'desc' => 'Topical ointment, cream, or gel container'],
        ['id' => 7, 'name' => 'Sachet', 'abbr' => 'sachet', 'desc' => 'Single-dose powder / oral rehydration packet']
    ];
    $uomStmt = $pdo->prepare("INSERT INTO uoms (id, name, abbreviation, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE abbreviation = VALUES(abbreviation), description = VALUES(description)");
    foreach ($uoms as $u) {
        $uomStmt->execute([$u['id'], $u['name'], $u['abbr'], $u['desc']]);
    }

    // Standard Suppliers
    $suppliers = [
        ['id' => 1, 'name' => 'Unilab Distribution Phils', 'contact' => 'Mr. Ramon Garcia', 'phone' => '0917-123-4567', 'email' => 'orders@unilab.com.ph', 'addr' => 'Mandaluyong City, Metro Manila'],
        ['id' => 2, 'name' => 'Pascual Laboratories Inc.', 'contact' => 'Ms. Elena Santos', 'phone' => '0918-987-6543', 'email' => 'sales@pascual-lab.com', 'addr' => 'Balintawak, Quezon City'],
        ['id' => 3, 'name' => 'Zuellig Pharma Philippines', 'contact' => 'Mr. Michael Tan', 'phone' => '0922-555-8888', 'email' => 'supply@zuelligpharma.com', 'addr' => 'KM 14 West Service Rd, Parañaque City']
    ];
    $supStmt = $pdo->prepare("INSERT INTO suppliers (id, name, contact_person, phone, email, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE contact_person = VALUES(contact_person), phone = VALUES(phone), email = VALUES(email), address = VALUES(address)");
    foreach ($suppliers as $s) {
        $supStmt->execute([$s['id'], $s['name'], $s['contact'], $s['phone'], $s['email'], $s['addr']]);
    }

    echo "  ✓ Categories, UOMs, and Suppliers verified.\n";

    // 3. SEED 5 TYPICAL PHILIPPINE MEDICINE MASTERLIST (PAIRED BULK & RETAIL)
    echo "\n[3/7] Seeding 5 Typical Philippine Medicines (Bulk Box & Retail Units)...\n";

    $medicineDefs = [
        [
            'brand' => 'Biogesic 500mg',
            'generic' => 'Paracetamol',
            'category_id' => 1,
            'category_name' => 'Analgesics',
            'bulk' => [
                'id' => 1,
                'sku' => 'SKU-BIO-BOX',
                'barcode' => '480001661101',
                'name' => 'Biogesic 500mg Box (100s)',
                'uom' => 'Box',
                'unit_price' => 700.00,
                'cost_price' => 500.00,
                'reorder' => 3
            ],
            'retail' => [
                'id' => 2,
                'sku' => 'SKU-BIO-TAB',
                'barcode' => '480001661102',
                'name' => 'Biogesic 500mg Tablet',
                'uom' => 'Tablet',
                'unit_price' => 8.00,
                'cost_price' => 5.00,
                'reorder' => 20
            ],
            'batch' => 'BG-2610A',
            'expiry' => '2028-10-31',
            'supplier_id' => 1,
            'supplier_name' => 'Unilab Distribution Phils'
        ],
        [
            'brand' => 'Neozep Forte',
            'generic' => 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol',
            'category_id' => 3,
            'category_name' => 'Respiratory',
            'bulk' => [
                'id' => 3,
                'sku' => 'SKU-NZP-BOX',
                'barcode' => '480001662201',
                'name' => 'Neozep Forte Box (100s)',
                'uom' => 'Box',
                'unit_price' => 750.00,
                'cost_price' => 550.00,
                'reorder' => 3
            ],
            'retail' => [
                'id' => 4,
                'sku' => 'SKU-NZP-TAB',
                'barcode' => '480001662202',
                'name' => 'Neozep Forte Tablet',
                'uom' => 'Tablet',
                'unit_price' => 9.00,
                'cost_price' => 5.50,
                'reorder' => 20
            ],
            'batch' => 'NZ-2610B',
            'expiry' => '2028-09-30',
            'supplier_id' => 1,
            'supplier_name' => 'Unilab Distribution Phils'
        ],
        [
            'brand' => 'Bioflu 500mg',
            'generic' => 'Phenylephrine HCl + Chlorphenamine Maleate + Paracetamol',
            'category_id' => 3,
            'category_name' => 'Respiratory',
            'bulk' => [
                'id' => 5,
                'sku' => 'SKU-BFL-BOX',
                'barcode' => '480001663301',
                'name' => 'Bioflu 500mg Box (100s)',
                'uom' => 'Box',
                'unit_price' => 800.00,
                'cost_price' => 600.00,
                'reorder' => 3
            ],
            'retail' => [
                'id' => 6,
                'sku' => 'SKU-BFL-TAB',
                'barcode' => '480001663302',
                'name' => 'Bioflu 500mg Tablet',
                'uom' => 'Tablet',
                'unit_price' => 9.50,
                'cost_price' => 6.00,
                'reorder' => 20
            ],
            'batch' => 'BF-2610C',
            'expiry' => '2028-11-30',
            'supplier_id' => 1,
            'supplier_name' => 'Unilab Distribution Phils'
        ],
        [
            'brand' => 'Alaxan FR',
            'generic' => 'Paracetamol + Ibuprofen (325mg/200mg)',
            'category_id' => 1,
            'category_name' => 'Analgesics',
            'bulk' => [
                'id' => 7,
                'sku' => 'SKU-ALX-BOX',
                'barcode' => '480001664401',
                'name' => 'Alaxan FR Box (100s)',
                'uom' => 'Box',
                'unit_price' => 1100.00,
                'cost_price' => 850.00,
                'reorder' => 3
            ],
            'retail' => [
                'id' => 8,
                'sku' => 'SKU-ALX-CAP',
                'barcode' => '480001664402',
                'name' => 'Alaxan FR Capsule',
                'uom' => 'Capsule',
                'unit_price' => 13.00,
                'cost_price' => 8.50,
                'reorder' => 20
            ],
            'batch' => 'AX-2610D',
            'expiry' => '2028-08-31',
            'supplier_id' => 1,
            'supplier_name' => 'Unilab Distribution Phils'
        ],
        [
            'brand' => 'RiteMed Amoxicillin 500mg',
            'generic' => 'Amoxicillin Trihydrate',
            'category_id' => 2,
            'category_name' => 'Antibiotics',
            'bulk' => [
                'id' => 9,
                'sku' => 'SKU-AMX-BOX',
                'barcode' => '480001665501',
                'name' => 'RiteMed Amoxicillin 500mg Box (100s)',
                'uom' => 'Box',
                'unit_price' => 750.00,
                'cost_price' => 480.00,
                'reorder' => 3
            ],
            'retail' => [
                'id' => 10,
                'sku' => 'SKU-AMX-CAP',
                'barcode' => '480001665502',
                'name' => 'RiteMed Amoxicillin 500mg Capsule',
                'uom' => 'Capsule',
                'unit_price' => 8.50,
                'cost_price' => 4.80,
                'reorder' => 20
            ],
            'batch' => 'AM-2610E',
            'expiry' => '2028-06-30',
            'supplier_id' => 2,
            'supplier_name' => 'Pascual Laboratories Inc.'
        ]
    ];

    $prodInsert = $pdo->prepare("
        INSERT INTO products (
            id, sku, barcode, name, generic_name, category_id, category, uom,
            unit_price, cost_price, stock, reorder_point, batch_no, expiry_date,
            is_bulk, parent_product_id, child_product_id, conversion_rate, status, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, 0, ?, ?, ?,
            ?, ?, ?, 100, 'In Stock', NOW(), NOW()
        )
    ");

    foreach ($medicineDefs as $med) {
        $bulk = $med['bulk'];
        $retail = $med['retail'];

        // Insert Bulk SKU
        $prodInsert->execute([
            $bulk['id'],
            $bulk['sku'],
            $bulk['barcode'],
            $bulk['name'],
            $med['generic'],
            $med['category_id'],
            $med['category_name'],
            $bulk['uom'],
            $bulk['unit_price'],
            $bulk['cost_price'],
            $bulk['reorder'],
            $med['batch'],
            $med['expiry'],
            1, // is_bulk
            null, // parent_product_id
            $retail['id'], // child_product_id
        ]);

        // Insert Retail SKU
        $prodInsert->execute([
            $retail['id'],
            $retail['sku'],
            $retail['barcode'],
            $retail['name'],
            $med['generic'],
            $med['category_id'],
            $med['category_name'],
            $retail['uom'],
            $retail['unit_price'],
            $retail['cost_price'],
            $retail['reorder'],
            $med['batch'],
            $med['expiry'],
            0, // is_bulk
            $bulk['id'], // parent_product_id
            null // child_product_id
        ]);

        echo "  ✓ Configured Pair #{$bulk['id']}-#{$retail['id']}: {$med['brand']} (1 Box = 100 {$retail['uom']})\n";
    }

    // 4. PERFORM STOCK IN FOR ALL 5 MEDICINES
    echo "\n[4/7] Performing Stock In Delivery Receipts (Wholesale Inflow)...\n";

    // Stock In #1: Delivery from Unilab Distribution Phils (Medicines 1, 2, 3, 4)
    $stkIn1Ref = 'DR-20261025-001';
    $stkIn1Date = '2026-10-25';
    $stkIn1SupId = 1;
    $stkIn1SupName = 'Unilab Distribution Phils';
    $stkIn1Receiver = 'Xyra Andrea (Pharmacist)';

    $stkIn1Items = [
        ['product_id' => 1, 'name' => 'Biogesic 500mg Box (100s)', 'qty' => 10, 'cost' => 500.00, 'batch' => 'BG-2610A', 'expiry' => '2028-10-31'],
        ['product_id' => 3, 'name' => 'Neozep Forte Box (100s)', 'qty' => 10, 'cost' => 550.00, 'batch' => 'NZ-2610B', 'expiry' => '2028-09-30'],
        ['product_id' => 5, 'name' => 'Bioflu 500mg Box (100s)', 'qty' => 10, 'cost' => 600.00, 'batch' => 'BF-2610C', 'expiry' => '2028-11-30'],
        ['product_id' => 7, 'name' => 'Alaxan FR Box (100s)', 'qty' => 10, 'cost' => 850.00, 'batch' => 'AX-2610D', 'expiry' => '2028-08-31']
    ];

    $totalVal1 = 0;
    foreach ($stkIn1Items as $item) $totalVal1 += ($item['qty'] * $item['cost']);

    $pdo->prepare("
        INSERT INTO stock_ins (id, ref_no, supplier_id, supplier_name, date, received_by, total_amount, notes, created_at, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, 'Initial quarterly pharmacy wholesale replenishment.', NOW(), NOW())
    ")->execute([$stkIn1Ref, $stkIn1SupId, $stkIn1SupName, $stkIn1Date, $stkIn1Receiver, $totalVal1]);

    $stkItemStmt = $pdo->prepare("
        INSERT INTO stock_in_items (stock_in_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    foreach ($stkIn1Items as $item) {
        $stkItemStmt->execute([1, $item['product_id'], $item['name'], $item['qty'], $item['cost'], $item['batch'], $item['expiry']]);
        postInventoryEntry($pdo, [
            'product_id' => $item['product_id'],
            'product_name' => $item['name'],
            'transaction_code' => 'StockIn',
            'transaction_id' => 1,
            'reference_no' => $stkIn1Ref,
            'impact' => +$item['qty'],
            'unit_cost' => $item['cost'],
            'batch_no' => $item['batch'],
            'expiry_date' => $item['expiry'],
            'remarks' => "Stock In delivery from {$stkIn1SupName}",
            'transacted_at' => "{$stkIn1Date} 08:30:00"
        ]);
        $pdo->prepare("INSERT INTO stock_movements (movement_code, timestamp, product_id, product_name, type, qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, 'Stock In', ?, 0, ?, ?, 'Initial delivery receipt', NOW(), NOW())")
            ->execute(["MOV-STKIN-1-{$item['product_id']}", "{$stkIn1Date} 08:30:00", $item['product_id'], $item['name'], +$item['qty'], $item['qty'], $stkIn1Ref]);
    }
    echo "  ✓ Stock In #1 ({$stkIn1Ref}): Received 4 items from {$stkIn1SupName} (₱" . number_format($totalVal1, 2) . ")\n";

    // Stock In #2: Delivery from Pascual Laboratories (Medicine 5: Amoxicillin)
    $stkIn2Ref = 'DR-20261025-002';
    $stkIn2Date = '2026-10-25';
    $stkIn2SupId = 2;
    $stkIn2SupName = 'Pascual Laboratories Inc.';
    $stkIn2Receiver = 'Xyra Andrea (Pharmacist)';

    $stkIn2Items = [
        ['product_id' => 9, 'name' => 'RiteMed Amoxicillin 500mg Box (100s)', 'qty' => 10, 'cost' => 480.00, 'batch' => 'AM-2610E', 'expiry' => '2028-06-30']
    ];

    $totalVal2 = 10 * 480.00;
    $pdo->prepare("
        INSERT INTO stock_ins (id, ref_no, supplier_id, supplier_name, date, received_by, total_amount, notes, created_at, updated_at)
        VALUES (2, ?, ?, ?, ?, ?, ?, 'Prescription antibiotics inventory receipt.', NOW(), NOW())
    ")->execute([$stkIn2Ref, $stkIn2SupId, $stkIn2SupName, $stkIn2Date, $stkIn2Receiver, $totalVal2]);

    foreach ($stkIn2Items as $item) {
        $stkItemStmt->execute([2, $item['product_id'], $item['name'], $item['qty'], $item['cost'], $item['batch'], $item['expiry']]);
        postInventoryEntry($pdo, [
            'product_id' => $item['product_id'],
            'product_name' => $item['name'],
            'transaction_code' => 'StockIn',
            'transaction_id' => 2,
            'reference_no' => $stkIn2Ref,
            'impact' => +$item['qty'],
            'unit_cost' => $item['cost'],
            'batch_no' => $item['batch'],
            'expiry_date' => $item['expiry'],
            'remarks' => "Stock In delivery from {$stkIn2SupName}",
            'transacted_at' => "{$stkIn2Date} 09:15:00"
        ]);
        $pdo->prepare("INSERT INTO stock_movements (movement_code, timestamp, product_id, product_name, type, qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, 'Stock In', ?, 0, ?, ?, 'Initial delivery receipt', NOW(), NOW())")
            ->execute(["MOV-STKIN-2-{$item['product_id']}", "{$stkIn2Date} 09:15:00", $item['product_id'], $item['name'], +$item['qty'], $item['qty'], $stkIn2Ref]);
    }
    echo "  ✓ Stock In #2 ({$stkIn2Ref}): Received 1 item from {$stkIn2SupName} (₱" . number_format($totalVal2, 2) . ")\n";

    // 5. PERFORM CONVERSION / UNBOXING FOR ALL 5 MEDICINES
    echo "\n[5/7] Performing Conversion (Breakdown of 2 Boxes -> 200 Tablets/Capsules for each)...\n";

    $convIns = $pdo->prepare("
        INSERT INTO conversions (
            id, conv_code, date, source_product_id, source_product_name, source_uom, source_qty,
            target_product_id, target_product_name, target_uom, target_qty, multiplier,
            batch_no, expiry_date, operator, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, 'Box', 2,
            ?, ?, ?, 200, 100,
            ?, ?, 'Xyra Andrea (Pharmacist)', 'Routine unboxing of 2 boxes into dispensing bins.', NOW(), NOW()
        )
    ");

    $convId = 1;
    foreach ($medicineDefs as $med) {
        $bulk = $med['bulk'];
        $retail = $med['retail'];
        $convCode = sprintf("CNV-20261026-%04d", $convId);
        $convDate = "2026-10-26 10:" . sprintf("%02d", $convId * 5) . ":00";

        $convIns->execute([
            $convId,
            $convCode,
            $convDate,
            $bulk['id'],
            $bulk['name'],
            $retail['id'],
            $retail['name'],
            $retail['uom'],
            $med['batch'],
            $med['expiry']
        ]);

        // Inventory: Deduct 2 Bulk Boxes (-2)
        postInventoryEntry($pdo, [
            'product_id' => $bulk['id'],
            'product_name' => $bulk['name'],
            'transaction_code' => 'Conversion',
            'transaction_id' => $convId,
            'reference_no' => $convCode,
            'impact' => -2,
            'unit_cost' => $bulk['cost_price'],
            'batch_no' => $med['batch'],
            'expiry_date' => $med['expiry'],
            'remarks' => "Unboxed 2 Boxes into 200 {$retail['uom']}",
            'transacted_at' => $convDate
        ]);

        // Inventory: Credit 200 Retail Units (+200)
        postInventoryEntry($pdo, [
            'product_id' => $retail['id'],
            'product_name' => $retail['name'],
            'transaction_code' => 'Conversion',
            'transaction_id' => $convId,
            'reference_no' => $convCode,
            'impact' => +200,
            'unit_cost' => $retail['cost_price'],
            'batch_no' => $med['batch'],
            'expiry_date' => $med['expiry'],
            'remarks' => "Credited 200 {$retail['uom']} from unboxing 2 Boxes",
            'transacted_at' => $convDate
        ]);

        // Stock movements
        $pdo->prepare("INSERT INTO stock_movements (movement_code, timestamp, product_id, product_name, type, qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, 'Conversion Out', -2, 10, 8, ?, 'Unboxed to retail', NOW(), NOW())")
            ->execute(["MOV-CNV-OUT-{$convId}", $convDate, $bulk['id'], $bulk['name'], $convCode]);
        $pdo->prepare("INSERT INTO stock_movements (movement_code, timestamp, product_id, product_name, type, qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, 'Conversion In', +200, 0, 200, ?, 'Credited from unboxing', NOW(), NOW())")
            ->execute(["MOV-CNV-IN-{$convId}", $convDate, $retail['id'], $retail['name'], $convCode]);

        echo "  ✓ Conversion #{$convId} ({$convCode}): -2 Boxes {$bulk['name']} -> +200 {$retail['uom']} {$retail['name']}\n";
        $convId++;
    }

    // 6. PERFORM POS SALES TRANSACTIONS ACROSS ALL 5 MEDICINES
    echo "\n[6/7] Performing POS Sales Transactions (Retail Sales Across Multi-Day Timeline)...\n";

    $salesData = [
        [
            'id' => 1,
            'invoice_no' => 'INV-20261027-0001',
            'date' => '2026-10-27 11:20:00',
            'cashier' => 'Cashier Xyra',
            'customer_type' => 'regular',
            'customer_name' => 'Walk-in Customer',
            'customer_id_no' => null,
            'discount' => 0.00,
            'payment_method' => 'Cash',
            'items' => [
                ['product_id' => 2, 'name' => 'Biogesic 500mg Tablet', 'qty' => 10, 'price' => 8.00, 'cost' => 5.00, 'batch' => 'BG-2610A', 'expiry' => '2028-10-31'],
                ['product_id' => 4, 'name' => 'Neozep Forte Tablet', 'qty' => 8, 'price' => 9.00, 'cost' => 5.50, 'batch' => 'NZ-2610B', 'expiry' => '2028-09-30']
            ]
        ],
        [
            'id' => 2,
            'invoice_no' => 'INV-20261028-0002',
            'date' => '2026-10-28 14:15:00',
            'cashier' => 'Cashier Juan',
            'customer_type' => 'senior',
            'customer_name' => 'Lola Remedios Santos',
            'customer_id_no' => 'OSCA-2024-8841',
            'discount' => 34.60, // 20% senior discount on subtotal 173.00
            'payment_method' => 'Cash',
            'items' => [
                ['product_id' => 6, 'name' => 'Bioflu 500mg Tablet', 'qty' => 10, 'price' => 9.50, 'cost' => 6.00, 'batch' => 'BF-2610C', 'expiry' => '2028-11-30'],
                ['product_id' => 8, 'name' => 'Alaxan FR Capsule', 'qty' => 6, 'price' => 13.00, 'cost' => 8.50, 'batch' => 'AX-2610D', 'expiry' => '2028-08-31']
            ]
        ],
        [
            'id' => 3,
            'invoice_no' => 'INV-20261029-0003',
            'date' => '2026-10-29 09:45:00',
            'cashier' => 'Cashier Xyra',
            'customer_type' => 'regular',
            'customer_name' => 'Roberto Dizon',
            'customer_id_no' => null,
            'discount' => 0.00,
            'payment_method' => 'GCash',
            'items' => [
                ['product_id' => 10, 'name' => 'RiteMed Amoxicillin 500mg Capsule', 'qty' => 21, 'price' => 8.50, 'cost' => 4.80, 'batch' => 'AM-2610E', 'expiry' => '2028-06-30']
            ]
        ],
        [
            'id' => 4,
            'invoice_no' => 'INV-20261030-0004',
            'date' => '2026-10-30 16:30:00',
            'cashier' => 'Cashier Juan',
            'customer_type' => 'regular',
            'customer_name' => 'Maria Theresa Cruz',
            'customer_id_no' => null,
            'discount' => 0.00,
            'payment_method' => 'Cash',
            'items' => [
                ['product_id' => 2, 'name' => 'Biogesic 500mg Tablet', 'qty' => 15, 'price' => 8.00, 'cost' => 5.00, 'batch' => 'BG-2610A', 'expiry' => '2028-10-31'],
                ['product_id' => 4, 'name' => 'Neozep Forte Tablet', 'qty' => 10, 'price' => 9.00, 'cost' => 5.50, 'batch' => 'NZ-2610B', 'expiry' => '2028-09-30'],
                ['product_id' => 6, 'name' => 'Bioflu 500mg Tablet', 'qty' => 8, 'price' => 9.50, 'cost' => 6.00, 'batch' => 'BF-2610C', 'expiry' => '2028-11-30']
            ]
        ],
        [
            'id' => 5,
            'invoice_no' => 'INV-20261031-0005',
            'date' => '2026-10-31 18:00:00',
            'cashier' => 'Cashier Xyra',
            'customer_type' => 'regular',
            'customer_name' => 'Antonio Mendoza',
            'customer_id_no' => null,
            'discount' => 0.00,
            'payment_method' => 'GCash',
            'items' => [
                ['product_id' => 8, 'name' => 'Alaxan FR Capsule', 'qty' => 12, 'price' => 13.00, 'cost' => 8.50, 'batch' => 'AX-2610D', 'expiry' => '2028-08-31'],
                ['product_id' => 10, 'name' => 'RiteMed Amoxicillin 500mg Capsule', 'qty' => 14, 'price' => 8.50, 'cost' => 4.80, 'batch' => 'AM-2610E', 'expiry' => '2028-06-30']
            ]
        ],
        [
            'id' => 6,
            'invoice_no' => 'INV-20261101-0006',
            'date' => '2026-11-01 08:15:00',
            'cashier' => 'Cashier Xyra',
            'customer_type' => 'regular',
            'customer_name' => 'Walk-in Customer',
            'customer_id_no' => null,
            'discount' => 0.00,
            'payment_method' => 'Cash',
            'items' => [
                ['product_id' => 2, 'name' => 'Biogesic 500mg Tablet', 'qty' => 8, 'price' => 8.00, 'cost' => 5.00, 'batch' => 'BG-2610A', 'expiry' => '2028-10-31'],
                ['product_id' => 4, 'name' => 'Neozep Forte Tablet', 'qty' => 6, 'price' => 9.00, 'cost' => 5.50, 'batch' => 'NZ-2610B', 'expiry' => '2028-09-30'],
                ['product_id' => 6, 'name' => 'Bioflu 500mg Tablet', 'qty' => 6, 'price' => 9.50, 'cost' => 6.00, 'batch' => 'BF-2610C', 'expiry' => '2028-11-30']
            ]
        ]
    ];

    $saleIns = $pdo->prepare("
        INSERT INTO sales (
            id, invoice_no, cashier, subtotal, discount, discount_type, customer_type,
            customer_name, customer_id_no, total, payment_method, amount_paid, `change`, notes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, 0.00, 'Completed retail checkout', ?, ?
        )
    ");

    $saleItemIns = $pdo->prepare("
        INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, cost_price, batch_no, expiry_date, subtotal, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    ");

    foreach ($salesData as $s) {
        $subtotal = 0.0;
        foreach ($s['items'] as $it) {
            $subtotal += ($it['qty'] * $it['price']);
        }
        $finalTotal = max(0, $subtotal - $s['discount']);
        $amountPaid = ceil($finalTotal / 50) * 50; // realistic round bill paid
        if ($amountPaid < $finalTotal) $amountPaid = $finalTotal;

        $saleIns->execute([
            $s['id'],
            $s['invoice_no'],
            $s['cashier'],
            $subtotal,
            $s['discount'],
            $s['discount'] > 0 ? 'senior' : null,
            $s['customer_type'],
            $s['customer_name'],
            $s['customer_id_no'],
            $finalTotal,
            $s['payment_method'],
            $amountPaid,
            $s['date'],
            $s['date']
        ]);

        foreach ($s['items'] as $it) {
            $lineSub = $it['qty'] * $it['price'];
            $saleItemIns->execute([
                $s['id'],
                $it['product_id'],
                $it['name'],
                $it['qty'],
                $it['price'],
                $it['cost'],
                $it['batch'],
                $it['expiry'],
                $lineSub,
                $s['date'],
                $s['date']
            ]);

            // Deduct from inventory
            postInventoryEntry($pdo, [
                'product_id' => $it['product_id'],
                'product_name' => $it['name'],
                'transaction_code' => 'POS',
                'transaction_id' => $s['id'],
                'reference_no' => $s['invoice_no'],
                'impact' => -$it['qty'],
                'unit_cost' => $it['cost'],
                'batch_no' => $it['batch'],
                'expiry_date' => $it['expiry'],
                'remarks' => "POS Sale: {$s['invoice_no']}",
                'transacted_at' => $s['date']
            ]);

            $pdo->prepare("INSERT INTO stock_movements (movement_code, timestamp, product_id, product_name, type, qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, 'POS Sale', ?, 0, 0, ?, 'Retail sale deduction', NOW(), NOW())")
                ->execute(["MOV-POS-{$s['id']}-{$it['product_id']}", $s['date'], $it['product_id'], $it['name'], -$it['qty'], $s['invoice_no']]);
        }

        echo "  ✓ Sales #{$s['id']} ({$s['invoice_no']}): {$s['payment_method']} ₱" . number_format($finalTotal, 2) . " [{$s['customer_name']}]\n";
    }

    // 7. PERFORM STOCK OUT (DISPOSAL) ACROSS ALL 5 RETAIL MEDICINES
    echo "\n[7/7] Performing Stock Out Disposal Voucher (Clinical Write-off)...\n";

    $dispRef = 'DISP-20261030-001';
    $dispDate = '2026-10-30';
    $dispReason = 'Damaged Foil Packaging';
    $dispAuth = 'Xyra Andrea (Pharmacist)';
    $dispNotes = 'Damaged outer blister foil packaging detected during monthly shelf audit. Disposed per standard pharmacy procedure.';

    $pdo->prepare("
        INSERT INTO stock_outs (id, ref_no, reason, date, authorized_by, notes, created_at, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, NOW(), NOW())
    ")->execute([$dispRef, $dispReason, $dispDate, $dispAuth, $dispNotes]);

    $dispItems = [
        ['product_id' => 2, 'name' => 'Biogesic 500mg Tablet', 'qty' => 2, 'cost' => 5.00, 'batch' => 'BG-2610A', 'expiry' => '2028-10-31'],
        ['product_id' => 4, 'name' => 'Neozep Forte Tablet', 'qty' => 2, 'cost' => 5.50, 'batch' => 'NZ-2610B', 'expiry' => '2028-09-30'],
        ['product_id' => 6, 'name' => 'Bioflu 500mg Tablet', 'qty' => 2, 'cost' => 6.00, 'batch' => 'BF-2610C', 'expiry' => '2028-11-30'],
        ['product_id' => 8, 'name' => 'Alaxan FR Capsule', 'qty' => 2, 'cost' => 8.50, 'batch' => 'AX-2610D', 'expiry' => '2028-08-31'],
        ['product_id' => 10, 'name' => 'RiteMed Amoxicillin 500mg Capsule', 'qty' => 2, 'cost' => 4.80, 'batch' => 'AM-2610E', 'expiry' => '2028-06-30']
    ];

    $dispItemStmt = $pdo->prepare("
        INSERT INTO stock_out_items (stock_out_id, product_id, product_name, quantity, cost_price, batch_no, expiry_date, created_at, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    foreach ($dispItems as $it) {
        $dispItemStmt->execute([$it['product_id'], $it['name'], $it['qty'], $it['cost'], $it['batch'], $it['expiry']]);

        // Deduct from inventory
        postInventoryEntry($pdo, [
            'product_id' => $it['product_id'],
            'product_name' => $it['name'],
            'transaction_code' => 'StockOut',
            'transaction_id' => 1,
            'reference_no' => $dispRef,
            'impact' => -$it['qty'],
            'unit_cost' => $it['cost'],
            'batch_no' => $it['batch'],
            'expiry_date' => $it['expiry'],
            'remarks' => "Disposal: {$dispReason}",
            'transacted_at' => "{$dispDate} 17:00:00"
        ]);

        $pdo->prepare("INSERT INTO stock_movements (movement_code, timestamp, product_id, product_name, type, qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at) VALUES (?, ?, ?, ?, 'Stock Out', ?, 0, 0, ?, 'Damaged packaging write-off', NOW(), NOW())")
            ->execute(["MOV-STKOUT-1-{$it['product_id']}", "{$dispDate} 17:00:00", $it['product_id'], $it['name'], -$it['qty'], $dispRef]);
    }
    echo "  ✓ Stock Out #1 ({$dispRef}): Disposed 2 units each for all 5 retail medicines [{$dispReason}]\n";

    // 8. FINAL CATALOG STOCK SYNCHRONIZATION & METRIC CALCULATIONS
    echo "\n[8/8] Synchronizing Product Catalog Balances & Forecasting Metrics...\n";

    $allProducts = $pdo->query("SELECT id, name, uom, is_bulk, reorder_point FROM products ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($allProducts as $p) {
        $pId = (int)$p['id'];
        $netStock = syncProductStockFromInventory($pdo, $pId);

        // Calculate sales stats for 30-day forecast and daily average sales
        $salesStmt = $pdo->prepare("SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE product_id = ?");
        $salesStmt->execute([$pId]);
        $totalSold = (int)$salesStmt->fetchColumn();

        // 6 days span in sample data
        $dailyAvg = round($totalSold / 6.0, 2);
        $forecast30 = (int)round($dailyAvg * 30);

        $status = ($netStock > $p['reorder_point']) ? 'In Stock' : (($netStock > 0) ? 'Low Stock' : 'Out of Stock');

        $pdo->prepare("
            UPDATE products 
            SET stock = ?, 
                status = ?, 
                daily_avg_sales = ?, 
                forecast_demand_30d = ?,
                updated_at = NOW() 
            WHERE id = ?
        ")->execute([$netStock, $status, $dailyAvg, $forecast30, $pId]);
    }

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 9. DISPLAY COMPREHENSIVE VERIFICATION AUDIT
    echo "\n========================================================\n";
    echo "  LIVE DATABASE VERIFICATION AUDIT\n";
    echo "========================================================\n";

    $verifyProd = $pdo->query("
        SELECT 
            p.id, p.sku, p.name, p.uom, p.stock, p.unit_price, p.cost_price, p.status,
            p.is_bulk, p.batch_no, p.expiry_date,
            (SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE product_id = p.id) as ledger_stock,
            (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE product_id = p.id) as total_sold
        FROM products p 
        ORDER BY p.id ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    printf("%-4s | %-12s | %-38s | %-7s | %-6s | %-6s | %-10s | %-10s\n", "ID", "SKU", "Medicine Name", "UOM", "Stock", "Ledger", "Sold", "Status");
    printf("%s\n", str_repeat("-", 108));

    foreach ($verifyProd as $vp) {
        printf(
            "%-4d | %-12s | %-38s | %-7s | %-6d | %-6d | %-10d | %-10s\n",
            $vp['id'],
            $vp['sku'],
            substr($vp['name'], 0, 38),
            $vp['uom'],
            $vp['stock'],
            $vp['ledger_stock'],
            $vp['total_sold'],
            $vp['status']
        );
    }

    echo "\n--- SUMMARY ROW COUNTS ---\n";
    $auditTables = [
        'products' => 'Master Products Catalog',
        'inventory' => 'Accounting Perpetual Ledger Entries',
        'stock_ins' => 'Stock-In Delivery Receipts',
        'stock_in_items' => 'Delivered Children Line Items',
        'conversions' => 'Unboxing / Conversion Records',
        'sales' => 'POS Invoices Completed',
        'sale_items' => 'Sold Line Items',
        'stock_outs' => 'Stock-Out Disposal Vouchers',
        'stock_out_items' => 'Disposal Children Line Items',
        'stock_movements' => 'Stock Movement Audit Logs'
    ];

    foreach ($auditTables as $t => $label) {
        $count = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
        printf("  • %-35s (%s): %d rows\n", $label, $t, $count);
    }

    echo "\nDatabase cleaning and seeding of 5 typical Philippine medicines completed successfully!\n";

} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    }
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
