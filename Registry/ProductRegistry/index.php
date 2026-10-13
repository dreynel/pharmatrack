<?php
/**
 * Master View Entry Point
 * Domain: Registry/ProductRegistry
 */
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/session.php';
?>
<section class="registry-product-section" id="registry-product-container">
  <?php include __DIR__ . '/components/product_table.php'; ?>
  <?php include __DIR__ . '/components/product_modal.php'; ?>
</section>

