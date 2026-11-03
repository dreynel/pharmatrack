<?php
/**
 * PharmaTrack - Native PHP Helper Functions
 */

// Polyfills for PHP < 8.0
if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool {
        return $needle === '' || strpos($haystack, $needle) === 0;
    }
}
if (!function_exists('str_contains')) {
    function str_contains(string $haystack, string $needle): bool {
        return $needle === '' || strpos($haystack, $needle) !== false;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with(string $haystack, string $needle): bool {
        return $needle === '' || substr($haystack, -strlen($needle)) === $needle;
    }
}

function jsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function getJsonInput(): array {
    if (!empty($_POST) && is_array($_POST)) {
        return $_POST;
    }
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return [];
}

function sanitizeString(?string $str): string {
    return htmlspecialchars(trim((string)$str), ENT_QUOTES, 'UTF-8');
}

function generateRefNo(string $prefix = 'REF'): string {
    return $prefix . '-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));
}

/**
 * Recalculates a product's current stock from the sum of all (+/-) impacts in the `inventory` ledger table
 * and updates `products.stock` so the master catalog stays 100% synchronized.
 */
function syncProductStockFromInventory(PDO $pdo, int $productId): int {
    if ($productId <= 0) return 0;

    $sumStmt = $pdo->prepare("SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE product_id = ?");
    $sumStmt->execute([$productId]);
    $netStock = max(0, (int)$sumStmt->fetchColumn());

    $updStmt = $pdo->prepare("UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?");
    $updStmt->execute([$netStock, $productId]);

    return $netStock;
}

/**
 * Posts an accounting-style inventory ledger entry into the `inventory` table.
 * Standard accounting perpetual ledger columns:
 * - `qty_in`: Inflow / Debit units (e.g. StockIn, Conversion In, Opening Balance)
 * - `qty_out`: Outflow / Credit units (e.g. POS Sales, StockOut, Conversion Out)
 * - `quantity`: Signed net units (+qty_in or -qty_out)
 * - `impact`: Signed integer retained as alias for backwards compatibility
 * - `total_cost`: Signed valuation change (quantity * unit_cost)
 */
function postInventoryEntry(PDO $pdo, array $data): array {
    $productId = (int)($data['product_id'] ?? 0);
    $quantity = (int)($data['quantity'] ?? ($data['impact'] ?? ($data['qty'] ?? 0)));
    if ($productId <= 0 || $quantity === 0) {
        return ['entry_no' => null, 'previous_balance' => 0, 'running_balance' => 0];
    }

    $qtyIn = ($quantity > 0) ? $quantity : 0;
    $qtyOut = ($quantity < 0) ? abs($quantity) : 0;
    $impact = $quantity;

    $transactionCode = trim((string)($data['transaction_code'] ?? 'Adjustment'));
    $transactionId = !empty($data['transaction_id']) ? (int)$data['transaction_id'] : null;
    $referenceNo = !empty($data['reference_no']) ? trim((string)$data['reference_no']) : null;
    $productName = trim((string)($data['product_name'] ?? ''));
    $unitCost = (float)($data['unit_cost'] ?? 0);
    $batchNo = !empty($data['batch_no']) ? trim((string)$data['batch_no']) : null;
    $expiryDate = !empty($data['expiry_date']) ? trim((string)$data['expiry_date']) : null;
    $remarks = !empty($data['remarks']) ? trim((string)$data['remarks']) : null;
    $transactedAt = !empty($data['transacted_at']) ? trim((string)$data['transacted_at']) : date('Y-m-d H:i:s');

    if ($productName === '' || $unitCost <= 0) {
        $pStmt = $pdo->prepare("SELECT name, cost_price, batch_no, expiry_date FROM products WHERE id = ? LIMIT 1");
        $pStmt->execute([$productId]);
        $pRow = $pStmt->fetch();
        if ($pRow) {
            if ($productName === '') $productName = $pRow['name'];
            if ($unitCost <= 0) $unitCost = (float)$pRow['cost_price'];
            if ($batchNo === null) $batchNo = $pRow['batch_no'];
            if ($expiryDate === null) $expiryDate = $pRow['expiry_date'];
        }
    }

    $totalCost = round($quantity * $unitCost, 2);

    // Current ledger balance before this entry
    $balStmt = $pdo->prepare("SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE product_id = ?");
    $balStmt->execute([$productId]);
    $previousBalance = (int)$balStmt->fetchColumn();
    $runningBalance = $previousBalance + $quantity;

    $entryNo = 'INV-' . strtoupper(substr($transactionCode, 0, 3)) . '-' . date('YmdHis') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

    $insStmt = $pdo->prepare("
        INSERT INTO inventory (
            entry_no, product_id, product_name, transaction_code, transaction_id,
            reference_no, qty_in, qty_out, quantity, previous_balance, running_balance,
            unit_cost, total_cost, batch_no, expiry_date, remarks, transacted_at, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");
    $insStmt->execute([
        $entryNo,
        $productId,
        $productName,
        $transactionCode,
        $transactionId,
        $referenceNo,
        $qtyIn,
        $qtyOut,
        $quantity,
        $previousBalance,
        $runningBalance,
        $unitCost,
        $totalCost,
        $batchNo,
        $expiryDate,
        $remarks,
        $transactedAt
    ]);

    syncProductStockFromInventory($pdo, $productId);

    return [
        'id' => (int)$pdo->lastInsertId(),
        'entry_no' => $entryNo,
        'quantity' => $quantity,
        'qty_in' => $qtyIn,
        'qty_out' => $qtyOut,
        'impact' => $impact,
        'previous_balance' => $previousBalance,
        'running_balance' => $runningBalance
    ];
}

/**
 * Deletes inventory ledger entries associated with a specific transaction (e.g. when editing or voiding
 * a StockIn or StockOut parent document) and recalculates affected product balances.
 */
function deleteInventoryEntries(PDO $pdo, string $transactionCode, int $transactionId, ?string $referenceNo = null): void {
    $findSql = "SELECT DISTINCT product_id FROM inventory WHERE transaction_code = ? AND (transaction_id = ?";
    $params = [$transactionCode, $transactionId];
    if (!empty($referenceNo)) {
        $findSql .= " OR reference_no = ?";
        $params[] = $referenceNo;
    }
    $findSql .= ")";

    $findStmt = $pdo->prepare($findSql);
    $findStmt->execute($params);
    $productIds = $findStmt->fetchAll(PDO::FETCH_COLUMN);

    $delSql = "DELETE FROM inventory WHERE transaction_code = ? AND (transaction_id = ?";
    if (!empty($referenceNo)) {
        $delSql .= " OR reference_no = ?";
    }
    $delSql .= ")";

    $delStmt = $pdo->prepare($delSql);
    $delStmt->execute($params);

    foreach ($productIds as $pid) {
        syncProductStockFromInventory($pdo, (int)$pid);
    }
}

if (!function_exists('getProductBatches')) {
    /**
     * Returns available batches with positive balance for a product (or all products)
     * sorted in FEFO order (First-Expiring, First-Out).
     */
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
                CASE 
                    WHEN inv.expiry_date IS NULL THEN 1 
                    ELSE 0 
                END,
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

if (!function_exists('parseRatioValue')) {
    /**
     * Parses a conversion ratio in any common format:
     * e.g. "1:25", "25:1", "1/25", "1 to 25", 25, "25" -> returns integer 25.
     */
    function parseRatioValue($val, int $fallback = 1): int {
        if (is_int($val) && $val > 0) return $val;
        if (is_numeric($val) && (float)$val > 0) return (int)round((float)$val);
        if (!is_string($val) || trim($val) === '') return $fallback;
        $val = trim($val);

        if (strpos($val, ':') !== false) {
            $parts = array_filter(array_map('trim', explode(':', $val)), 'is_numeric');
            if (count($parts) === 2) {
                $p = array_values(array_map('floatval', $parts));
                if ($p[0] > 0 && $p[1] > 0) {
                    $ratio = (int)round(max($p[0], $p[1]) / min($p[0], $p[1]));
                    return $ratio > 0 ? $ratio : $fallback;
                }
            }
        }

        if (strpos($val, '/') !== false) {
            $parts = array_filter(array_map('trim', explode('/', $val)), 'is_numeric');
            if (count($parts) === 2) {
                $p = array_values(array_map('floatval', $parts));
                if ($p[0] > 0 && $p[1] > 0) {
                    $ratio = (int)round(max($p[0], $p[1]) / min($p[0], $p[1]));
                    return $ratio > 0 ? $ratio : $fallback;
                }
            }
        }

        if (stripos($val, 'to') !== false) {
            $parts = array_filter(array_map('trim', preg_split('/to/i', $val)), 'is_numeric');
            if (count($parts) === 2) {
                $p = array_values(array_map('floatval', $parts));
                if ($p[0] > 0 && $p[1] > 0) {
                    $ratio = (int)round(max($p[0], $p[1]) / min($p[0], $p[1]));
                    return $ratio > 0 ? $ratio : $fallback;
                }
            }
        }

        $clean = preg_replace('/[^0-9.]/', '', $val);
        $num = (float)$clean;
        return $num > 0 ? (int)round($num) : $fallback;
    }
}


