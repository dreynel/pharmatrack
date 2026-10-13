<?php
/**
 * View Entrypoint: Modules/StockOut
 * Native PHP Domain Split-Screen Interface
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-stockout">
  <div class="module-header">
    <div class="header-titles">
      <h2>Stock-Out & Disposal Management</h2>
      <p>Log inventory shrinkages, expired medications, damages, and audit adjustments with direct ledger reconciliation.</p>
    </div>
  </div>

  <div class="split-screen-layout">
    <!-- Left: Detail Child Panel -->
    <?php include __DIR__ . '/components/child_panel.php'; ?>
    <!-- Right: Parent Records Panel -->
    <?php include __DIR__ . '/components/parent_panel.php'; ?>
  </div>

  <!-- Modal -->
  <?php include __DIR__ . '/components/stock_out_modal.php'; ?>
</div>

