<?php
/**
 * Action: Execute Bulk to Piece Conversion (Breakdown)
 * Domain: Modules/Conversion
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

if (!function_exists('parseRatioValue')) {
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

$pdo = getDatabaseConnection();
$input = getJsonInput();

$sourceId = (int)($input['source_product_id'] ?? ($input['sourceProductId'] ?? ($input['from_product_id'] ?? ($input['fromProductId'] ?? ($input['source_id'] ?? ($input['sourceId'] ?? 0))))));
$targetId = (int)($input['target_product_id'] ?? ($input['targetProductId'] ?? ($input['to_product_id'] ?? ($input['toProductId'] ?? ($input['target_id'] ?? ($input['targetId'] ?? 0))))));
$sourceQty = (int)($input['source_qty'] ?? ($input['sourceQty'] ?? ($input['from_qty'] ?? ($input['fromQty'] ?? ($input['qty'] ?? 1)))));
$rawMultiplier = $input['multiplier'] ?? ($input['conversionRate'] ?? ($input['conversion_rate'] ?? ($input['rate'] ?? ($input['ratio'] ?? ''))));
$multiplier = parseRatioValue($rawMultiplier, 0);
$inputTargetQty = (int)($input['target_qty'] ?? ($input['targetQty'] ?? ($input['to_qty'] ?? ($input['toQty'] ?? 0))));

$batchNo = sanitizeString($input['batch_no'] ?? ($input['batchNo'] ?? ($input['source_batch_no'] ?? ($input['sourceBatchNo'] ?? ''))));
$expiryDate = sanitizeString($input['expiry_date'] ?? ($input['expiryDate'] ?? ''));
$notes = sanitizeString($input['notes'] ?? '');
$operator = sanitizeString($input['operator'] ?? ($_SESSION['user']['name'] ?? 'Pharmacist'));

if ($sourceId <= 0 || $targetId <= 0 || $sourceQty <= 0) {
    jsonResponse(['success' => false, 'error' => 'Please specify valid source product, target product, and quantity.'], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch Source Product
    $sourceStmt = $pdo->prepare("SELECT * FROM products WHERE id = ? FOR UPDATE");
    $sourceStmt->execute([$sourceId]);
    $sourceProd = $sourceStmt->fetch();

    if (!$sourceProd) {
        throw new Exception("Source product not found.");
    }

    if ($sourceProd['stock'] < $sourceQty) {
        throw new Exception("Insufficient stock for source item '{$sourceProd['name']}'. In stock: {$sourceProd['stock']}, requested: {$sourceQty}.");
    }

    // 2. Fetch Target Product
    $targetStmt = $pdo->prepare("SELECT * FROM products WHERE id = ? FOR UPDATE");
    $targetStmt->execute([$targetId]);
    $targetProd = $targetStmt->fetch();

    if (!$targetProd) {
        throw new Exception("Target product not found.");
    }

    // Determine target quantity and multiplier (honoring explicitly inputted to_qty/target_qty or 1:25 ratio)
    if ($inputTargetQty > 0) {
        $targetQty = $inputTargetQty;
        if ($sourceQty > 0) {
            $multiplier = (int)round($targetQty / $sourceQty);
        }
    } else {
        if ($multiplier <= 0) {
            $multiplier = parseRatioValue($sourceProd['conversion_rate'] ?? 25, 25);
            if ($multiplier <= 0) $multiplier = 25;
        }
        $targetQty = $sourceQty * $multiplier;
    }

    if ($targetQty <= 0) {
        throw new Exception("Target receiving quantity must be greater than zero.");
    }

    // Keep source product conversion_rate and child link in sync
    if ($multiplier > 0) {
        $pdo->prepare("
            UPDATE products 
            SET conversion_rate = ?, 
                child_product_id = COALESCE(child_product_id, ?),
                is_bulk = 1,
                updated_at = NOW() 
            WHERE id = ?
        ")->execute([$multiplier, $targetId, $sourceId]);

        $pdo->prepare("
            UPDATE products 
            SET parent_product_id = COALESCE(parent_product_id, ?),
                updated_at = NOW() 
            WHERE id = ?
        ")->execute([$sourceId, $targetId]);
    }

    $convCode = generateRefNo('CNV');

    // Resolve source batch & expiry (exact match if batch specified, or FEFO fallback)
    $activeBatches = getProductBatches($pdo, $sourceId);
    $matchedBatch = null;

    if (!empty($batchNo) && !empty($activeBatches)) {
        foreach ($activeBatches as $ab) {
            if ($ab['batchNo'] === $batchNo) {
                $matchedBatch = $ab;
                break;
            }
        }
    }

    // Fallback to first FEFO active batch if not selected or not found
    if (!$matchedBatch && !empty($activeBatches)) {
        $matchedBatch = $activeBatches[0];
        if (empty($batchNo)) {
            $batchNo = $matchedBatch['batchNo'];
        }
    }

    if ($matchedBatch) {
        if (empty($expiryDate) && !empty($matchedBatch['expiryDate'])) {
            $expiryDate = $matchedBatch['expiryDate'];
        }
    }

    // Master product catalog fallbacks if still empty
    if (empty($batchNo) && !empty($sourceProd['batch_no'])) {
        $batchNo = $sourceProd['batch_no'];
    }
    if (empty($expiryDate) && !empty($sourceProd['expiry_date'])) {
        $expiryDate = $sourceProd['expiry_date'];
    }

    // Verify source batch stock if batch specified
    if (!empty($batchNo)) {
        $batchStockStmt = $pdo->prepare("SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE product_id = ? AND batch_no = ?");
        $batchStockStmt->execute([$sourceId, $batchNo]);
        $batchStock = (int)$batchStockStmt->fetchColumn();
        if ($batchStock > 0 && $batchStock < $sourceQty) {
            throw new Exception("Insufficient stock for batch '{$batchNo}'. Available in batch: {$batchStock}, requested: {$sourceQty}.");
        }
    }

    // 3. Carry on selected batch number and expiry date to the destination (target) product
    if (!empty($batchNo)) {
        $updateTargetMeta = $pdo->prepare("
            UPDATE products 
            SET batch_no = ?,
                expiry_date = COALESCE(?, expiry_date),
                updated_at = NOW()
            WHERE id = ?
        ");
        $updateTargetMeta->execute([$batchNo, !empty($expiryDate) ? $expiryDate : null, $targetId]);
    }

    // 4. Insert Conversion Record
    $convStmt = $pdo->prepare("
        INSERT INTO conversions (
            conv_code, date, source_product_id, source_product_name, source_uom, source_qty,
            target_product_id, target_product_name, target_uom, target_qty, multiplier,
            batch_no, expiry_date, operator, notes, created_at, updated_at
        ) VALUES (
            ?, NOW(), ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, NOW(), NOW()
        )
    ");
    $convStmt->execute([
        $convCode,
        $sourceId, $sourceProd['name'], $sourceProd['uom'] ?? 'Box', $sourceQty,
        $targetId, $targetProd['name'], $targetProd['uom'] ?? 'Piece', $targetQty, $multiplier,
        $batchNo, $expiryDate, $operator, $notes
    ]);
    $convId = (int)$pdo->lastInsertId();

    // 5. Post accounting entries to `inventory` table:
    // Source Bulk Outflow: exactly -$sourceQty (matching from_qty)
    $ledOut = postInventoryEntry($pdo, [
        'product_id' => $sourceId,
        'product_name' => $sourceProd['name'],
        'transaction_code' => 'Conversion',
        'transaction_id' => $convId,
        'reference_no' => $convCode,
        'quantity' => -$sourceQty,
        'impact' => -$sourceQty,
        'unit_cost' => (float)($sourceProd['cost_price'] ?? 0),
        'batch_no' => $batchNo,
        'expiry_date' => $expiryDate,
        'remarks' => "Converted {$sourceQty} {$sourceProd['uom']} into {$targetQty} {$targetProd['uom']} (#{$convCode})"
    ]);

    // Calculate unit cost for target if unassigned
    $targetUnitCost = (float)($targetProd['cost_price'] ?? 0);
    if ($targetUnitCost <= 0 && $multiplier > 0) {
        $targetUnitCost = round((float)($sourceProd['cost_price'] ?? 0) / $multiplier, 2);
    }

    // Target Retail Inflow: exactly +$targetQty (matching to_qty)
    $ledIn = postInventoryEntry($pdo, [
        'product_id' => $targetId,
        'product_name' => $targetProd['name'],
        'transaction_code' => 'Conversion',
        'transaction_id' => $convId,
        'reference_no' => $convCode,
        'quantity' => +$targetQty,
        'impact' => +$targetQty,
        'unit_cost' => $targetUnitCost,
        'batch_no' => $batchNo,
        'expiry_date' => $expiryDate,
        'remarks' => "Received {$targetQty} {$targetProd['uom']} from {$sourceProd['name']} (#{$convCode})"
    ]);

    // Ensure catalog master stocks are synchronized
    syncProductStockFromInventory($pdo, $sourceId);
    syncProductStockFromInventory($pdo, $targetId);

    // 6. Record Stock Movement for backwards-compatibility (if legacy table exists)
    try {
        $movementStmt = $pdo->prepare("
            INSERT INTO stock_movements (
                movement_code, timestamp, product_id, product_name, type,
                qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
            ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $movCodeOut = $ledOut['entry_no'] ?: generateRefNo('MOV');
        $movementStmt->execute([
            $movCodeOut, $sourceId, $sourceProd['name'], 'CONVERT_OUT',
            -$sourceQty, $ledOut['previous_balance'], $ledOut['running_balance'],
            $convCode, "Broken down into {$targetQty} {$targetProd['uom']}"
        ]);

        $movCodeIn = $ledIn['entry_no'] ?: generateRefNo('MOV');
        $movementStmt->execute([
            $movCodeIn, $targetId, $targetProd['name'], 'CONVERT_IN',
            $targetQty, $ledIn['previous_balance'], $ledIn['running_balance'],
            $convCode, "Received from breakdown of {$sourceQty} {$sourceProd['uom']}"
        ]);
    } catch (Throwable $t) {
        // Ignored if stock_movements was dropped in favor of inventory sub-ledger
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => "Successfully broke down {$sourceQty} {$sourceProd['uom']} into {$targetQty} {$targetProd['uom']}.",
        'conversion' => [
            'id' => $convId,
            'conv_code' => $convCode,
            'source_product_name' => $sourceProd['name'],
            'source_qty' => $sourceQty,
            'target_product_name' => $targetProd['name'],
            'target_qty' => $targetQty,
            'multiplier' => $multiplier,
            'batch_no' => $batchNo,
            'expiry_date' => $expiryDate
        ]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}

