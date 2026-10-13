<?php
/**
 * View Entrypoint: Modules/Dashboard
 * Native PHP Domain Operational Dashboard & Executive Summary
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-dashboard">
  <div class="module-header">
    <div class="header-titles">
      <h2>Pharmacy Operations Dashboard</h2>
      <p>Real-time overview of revenue performance, current inventory assets, expiry monitoring, and stock alerts.</p>
    </div>
  </div>

  <div class="dashboard-content-wrap">
    <!-- Top KPI Cards -->
    <?php include __DIR__ . '/components/kpi_cards.php'; ?>

    <!-- Actionable Alert Panels & Recent Activity -->
    <?php include __DIR__ . '/components/alert_banners.php'; ?>
  </div>
</div>

