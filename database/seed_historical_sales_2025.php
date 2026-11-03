<?php
/**
 * Seeder: Inserts realistic 2025 historical sales for Year-Over-Year Demand Forecasting
 */
require_once __DIR__ . '/../config/db.php';
$pdo = getDatabaseConnection();

// Check if 2025 sales already exist
$chk = $pdo->query("SELECT COUNT(*) FROM sales WHERE YEAR(created_at) = 2025")->fetchColumn();
if ($chk > 50) {
    echo "2025 historical sales already present ({$chk} records).\n";
    exit;
}

$products = $pdo->query("SELECT id, name, category, unit_price, cost_price, batch_no, expiry_date, stock FROM products")->fetchAll(PDO::FETCH_ASSOC);

if (empty($products)) {
    echo "No products found.\n";
    exit;
}

echo "Seeding 2025 historical sales for " . count($products) . " products...\n";

$pdo->beginTransaction();

try {
    $saleInsert = $pdo->prepare("
        INSERT INTO sales (invoice_no, cashier, subtotal, discount, discount_type, customer_type, customer_name, total, payment_method, amount_paid, `change`, notes, created_at, updated_at)
        VALUES (?, 'Cashier Maria', ?, 0, 'none', 'Regular', 'Walk-in Customer', ?, 'Cash', ?, 0, 'Historical 2025 Sales Record', ?, ?)
    ");

    $itemInsert = $pdo->prepare("
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, cost_price, batch_no, expiry_date, subtotal, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $invInsert = $pdo->prepare("
        INSERT INTO inventory (entry_no, product_id, product_name, transaction_code, transaction_id, reference_no, qty_in, qty_out, quantity, previous_balance, running_balance, unit_cost, total_cost, batch_no, expiry_date, remarks, transacted_at, created_at, updated_at)
        VALUES (?, ?, ?, 'POS', ?, ?, 0, ?, ?, 100, 100, ?, ?, ?, ?, 'Historical 2025 POS checkout', ?, ?, ?)
    ");

    // Seed sales across months of 2025, especially October, November, December
    $months = [
        1 => ['days' => 28, 'surge' => 1.0],
        2 => ['days' => 28, 'surge' => 0.9],
        3 => ['days' => 28, 'surge' => 1.0],
        4 => ['days' => 28, 'surge' => 1.1],
        5 => ['days' => 28, 'surge' => 1.0],
        6 => ['days' => 28, 'surge' => 1.2], // Rainy start
        7 => ['days' => 28, 'surge' => 1.3], // Dengue/flu
        8 => ['days' => 28, 'surge' => 1.4], // Typhoons
        9 => ['days' => 28, 'surge' => 1.2],
        10 => ['days' => 28, 'surge' => 1.3],
        11 => ['days' => 28, 'surge' => 1.6], // High seasonal surge for cough/cold/flu
        12 => ['days' => 28, 'surge' => 1.5], // Holiday demand
    ];

    $invoiceSeq = 1000;
    $invSeq = 5000;

    foreach ($months as $m => $cfg) {
        $surge = $cfg['surge'];
        // Create 4 transaction batches per month (approx 1 per week)
        for ($w = 1; $w <= 4; $w++) {
            $day = min(28, ($w * 7) - rand(0, 3));
            $dateTime = sprintf("2025-%02d-%02d %02d:%02d:00", $m, $day, rand(9, 18), rand(10, 50));

            $invoiceNo = "INV-2025" . sprintf("%02d", $m) . "-" . (++$invoiceSeq);
            $invEntryNo = "INV-LOG-2025-" . (++$invSeq);

            // Pick 3 to 6 products for this sale
            $shuffled = $products;
            shuffle($shuffled);
            $selectedProds = array_slice($shuffled, 0, rand(3, 6));

            $subtotal = 0;
            $itemsData = [];

            foreach ($selectedProds as $p) {
                // Determine quantity based on product category & surge
                $baseQty = rand(4, 15);
                if (stripos($p['category'], 'antibiotic') !== false || stripos($p['category'], 'respiratory') !== false || stripos($p['name'], 'Paracetamol') !== false || stripos($p['name'], 'Biogesic') !== false) {
                    $baseQty = (int)round($baseQty * $surge * 1.5);
                } else {
                    $baseQty = (int)round($baseQty * $surge);
                }
                $qty = max(2, $baseQty);
                $uPrice = (float)$p['unit_price'];
                $cPrice = (float)$p['cost_price'];
                $lineTotal = round($qty * $uPrice, 2);
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product_id' => $p['id'],
                    'product_name' => $p['name'],
                    'quantity' => $qty,
                    'unit_price' => $uPrice,
                    'cost_price' => $cPrice,
                    'batch_no' => $p['batch_no'] ?: 'BATCH-2025',
                    'expiry_date' => $p['expiry_date'] ?: '2027-12-31',
                    'subtotal' => $lineTotal
                ];
            }

            // Insert sale
            $saleInsert->execute([
                $invoiceNo,
                $subtotal,
                $subtotal,
                $subtotal,
                $dateTime,
                $dateTime
            ]);
            $saleId = $pdo->lastInsertId();

            // Insert items & inventory entries
            foreach ($itemsData as $it) {
                $itemInsert->execute([
                    $saleId,
                    $it['product_id'],
                    $it['product_name'],
                    $it['quantity'],
                    $it['unit_price'],
                    $it['cost_price'],
                    $it['batch_no'],
                    $it['expiry_date'],
                    $it['subtotal'],
                    $dateTime,
                    $dateTime
                ]);

                $invInsert->execute([
                    "LOG-" . (++$invSeq),
                    $it['product_id'],
                    $it['product_name'],
                    $saleId,
                    $invoiceNo,
                    $it['quantity'],
                    -$it['quantity'],
                    $it['cost_price'],
                    round($it['quantity'] * $it['cost_price'], 2),
                    $it['batch_no'],
                    $it['expiry_date'],
                    $dateTime,
                    $dateTime,
                    $dateTime
                ]);
            }
        }
    }

    $pdo->commit();
    echo "Successfully seeded 2025 historical sales!\n";
} catch (Exception $e) {
    $pdo->rollBack();
    echo "Error seeding 2025 sales: " . $e->getMessage() . "\n";
}
