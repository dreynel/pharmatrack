<?php
/**
 * Master View Entry Point
 * Domain: Modules/StockIn
 * Split-screen master-detail layout (Child details left, Parent records right)
 */
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/session.php';
?>
<section class="module-stockin-section" id="module-stockin-container">
  <div class="split-view-container" style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 1.25rem; align-items: start;">
    <!-- Left Panel: Child Details per Parent Record -->
    <?php include __DIR__ . '/components/child_panel.php'; ?>

    <!-- Right Panel: Parent Main Records -->
    <?php include __DIR__ . '/components/parent_panel.php'; ?>
  </div>

  <!-- Intake Modal -->
  <?php include __DIR__ . '/components/receive_modal.php'; ?>
</section>

