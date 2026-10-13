<?php
/**
 * View Entrypoint: Modules/StockMovements
 * Native PHP Domain Perpetual Stock Movements Ledger
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-stockmovements">
  <div class="module-header">
    <div class="header-titles">
      <h2>Stock Movement Ledger & Audit Trail</h2>
      <p>Continuous audit records showing exactly when, how, and why each medication stock level changed in the pharmacy.</p>
    </div>
  </div>

  <div class="movement-content-wrap">
    <?php include __DIR__ . '/components/movement_table.php'; ?>
  </div>
</div>

