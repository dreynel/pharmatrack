<?php
/**
 * View Entrypoint: Modules/POS
 * Native PHP Domain Point-of-Sale (POS) Interface
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-pos">
  <div class="module-header">
    <div class="header-titles">
      <h2>Point of Sale (POS) & Checkout Terminal</h2>
      <p>Real-time drug dispensing, Senior/PWD statutory discount deduction, automated receipt generation, and live inventory sync.</p>
    </div>
  </div>

  <div class="pos-layout-grid">
    <!-- Left: Product Catalog & Quick Picker -->
    <?php include __DIR__ . '/components/product_picker.php'; ?>

    <!-- Right: Current Transaction & Cart Summary -->
    <?php include __DIR__ . '/components/cart_panel.php'; ?>
  </div>

  <!-- Receipt Printable Modal -->
  <?php include __DIR__ . '/components/receipt_modal.php'; ?>
</div>

