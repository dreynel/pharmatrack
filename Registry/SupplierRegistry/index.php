<?php
/**
 * Master View Entry Point
 * Domain: Registry/SupplierRegistry
 */
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/session.php';
?>
<section class="registry-supplier-section" id="registry-supplier-container">
  <?php include __DIR__ . '/components/supplier_table.php'; ?>
  <?php include __DIR__ . '/components/supplier_modal.php'; ?>
</section>

