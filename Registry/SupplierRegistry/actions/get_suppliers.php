<?php
/**
 * Action: Get All Suppliers with Delivery & PO Summary Metrics
 * Domain: Registry/SupplierRegistry
 */
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';
require_once __DIR__ . '/../../../config/session.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query("
        SELECT 
            s.id,
            s.name,
            s.contact_person,
            s.phone,
            s.email,
            s.address,
            s.active_pos,
            s.created_at,
            s.updated_at,
            COUNT(si.id) AS deliveries_count,
            COALESCE(SUM(si.total_amount), 0) AS total_supplied_cost,
            MAX(si.date) AS last_delivery_date
        FROM suppliers s
        LEFT JOIN stock_ins si ON (si.supplier_id = s.id OR si.supplier_name = s.name)
        GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.address, s.active_pos, s.created_at, s.updated_at
        ORDER BY s.name ASC
    ");
    $rows = $stmt->fetchAll();

    $suppliers = array_map(function(array $r) {
        return [
            'id' => (int)$r['id'],
            'name' => $r['name'],
            'contact_person' => $r['contact_person'] ?? '',
            'phone' => $r['phone'] ?? '',
            'email' => $r['email'] ?? '',
            'address' => $r['address'] ?? '',
            'active_pos' => (int)($r['active_pos'] ?? 0),
            'deliveries_count' => (int)($r['deliveries_count'] ?? 0),
            'total_supplied_cost' => round((float)($r['total_supplied_cost'] ?? 0), 2),
            'last_delivery_date' => $r['last_delivery_date'] ?? null,
            'created_at' => $r['created_at'],
            'updated_at' => $r['updated_at']
        ];
    }, $rows);

    jsonResponse([
        'success' => true,
        'count' => count($suppliers),
        'suppliers' => $suppliers,
        'data' => $suppliers
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
