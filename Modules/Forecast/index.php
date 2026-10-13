<?php
/**
 * View Entrypoint: Modules/Forecast
 * Native PHP Domain Demand Forecasting & Inventory Reorder Planning
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-forecast">
  <div class="module-header">
    <div class="header-titles">
      <h2>Demand Forecasting & Replenishment Planning</h2>
      <p>Calculates item sales velocity from previous sales history to forecast stock runout dates and generate replenishment orders.</p>
    </div>
  </div>

  <div class="forecast-content-wrap">
    <?php include __DIR__ . '/components/forecast_table.php'; ?>
  </div>

  <!-- PO Generator Modal -->
  <?php include __DIR__ . '/components/po_modal.php'; ?>
</div>

