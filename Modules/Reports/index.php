<?php
/**
 * View Entrypoint: Modules/Reports
 * Native PHP Domain Pharmacy Financial & Operational Reports
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-reports">
  <div class="module-header">
    <div class="header-titles">
      <h2>Pharmacy Analytics & Operational Reports</h2>
      <p>Audit sales revenue, inventory valuation, stock shrinkage/losses, and product movement velocity.</p>
    </div>
  </div>

  <div class="reports-content-wrap">
    <!-- Filter Controls -->
    <?php include __DIR__ . '/components/report_filters.php'; ?>

    <!-- Results Table & Summary Cards -->
    <?php include __DIR__ . '/components/report_table.php'; ?>
  </div>
</div>

