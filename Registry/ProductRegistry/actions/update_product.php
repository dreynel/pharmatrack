<?php
/**
 * Action: Update Product
 * Domain: Registry/ProductRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();
$input = getJsonInput();

$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));
if (!$id) {
    jsonResponse(['success' => false, 'error' => 'Product ID is required.'], 400);
}

try {
    // Support stock increment / direct restock
    $stockIncrement = (int)($input['stock_increment'] ?? ($input['quantity'] ?? ($_POST['stock_increment'] ?? 0)));
    if ($stockIncrement > 0) {
        $checkStmt = $pdo->prepare("SELECT name, stock FROM products WHERE id = ? FOR UPDATE");
        $checkStmt->execute([$id]);
        $prod = $checkStmt->fetch();

        if ($prod) {
            $prevStock = (int)$prod['stock'];
            $newStock = $prevStock + $stockIncrement;

            $pdo->prepare("UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?")
                ->execute([$newStock, $id]);

            $movCode = generateRefNo('MOV');
            $pdo->prepare("
                INSERT INTO stock_movements (
                    movement_code, timestamp, product_id, product_name, type,
                    qty_change, previous_stock, new_stock, reference_id, remarks, created_at, updated_at
                ) VALUES (
                    ?, NOW(), ?, ?, 'RECEIVING', ?, ?, ?, ?, 'Direct restock increment', NOW(), NOW()
                )
            ")->execute([$movCode, $id, $prod['name'], $stockIncrement, $prevStock, $newStock, 'RESTOCK-' . $id]);

            jsonResponse([
                'success' => true,
                'message' => "Stock successfully replenished (+{$stockIncrement} units).",
                'new_stock' => $newStock
            ]);
        }
    }

    $stmt = $pdo->prepare("
        UPDATE products SET 
            name = COALESCE(?, name),
            generic_name = COALESCE(?, generic_name),
            category = COALESCE(?, category),
            category_id = COALESCE(?, category_id),
            barcode = COALESCE(?, barcode),
            uom = COALESCE(?, uom),
            unit_price = COALESCE(?, unit_price),
            cost_price = COALESCE(?, cost_price),
            stock = COALESCE(?, stock),
            reorder_point = COALESCE(?, reorder_point),
            batch_no = COALESCE(?, batch_no),
            expiry_date = COALESCE(?, expiry_date),
            updated_at = NOW()
        WHERE id = ?
    ");

    $stmt->execute([
        $input['name'] ?? null,
        $input['generic_name'] ?? ($input['genericName'] ?? null),
        $input['category'] ?? null,
        isset($input['category_id']) ? (int)$input['category_id'] : (isset($input['categoryId']) ? (int)$input['categoryId'] : null),
        $input['barcode'] ?? null,
        $input['uom'] ?? null,
        isset($input['unit_price']) ? (float)$input['unit_price'] : (isset($input['unitPrice']) ? (float)$input['unitPrice'] : null),
        isset($input['cost_price']) ? (float)$input['cost_price'] : (isset($input['costPrice']) ? (float)$input['costPrice'] : null),
        isset($input['stock']) ? (int)$input['stock'] : null,
        isset($input['reorder_point']) ? (int)$input['reorder_point'] : (isset($input['reorderPoint']) ? (int)$input['reorderPoint'] : null),
        $input['batch_no'] ?? ($input['batchNo'] ?? null),
        $input['expiry_date'] ?? ($input['expiryDate'] ?? null),
        $id
    ]);

    $fetchStmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $fetchStmt->execute([$id]);
    $updatedProduct = $fetchStmt->fetch();

    jsonResponse([
        'success' => true,
        'product' => $updatedProduct,
        'data' => $updatedProduct,
        'message' => 'Product successfully updated.'
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}

