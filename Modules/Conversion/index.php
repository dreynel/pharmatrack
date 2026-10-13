<?php
/**
 * View Entrypoint: Modules/Conversion
 * Native PHP Domain Unit Breakdown & Repackaging Interface
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-conversion">
  <div class="module-header">
    <div class="header-titles">
      <h2>Unit Conversion & Repackaging</h2>
      <p>Break down bulk cases/boxes into individual blisters and piece inventory with automated dual-ledger ledger entries.</p>
    </div>
  </div>

  <div class="conversion-content-wrap">
    <!-- Top: Interactive Conversion Calculator & Form -->
    <?php include __DIR__ . '/components/conversion_form.php'; ?>

    <!-- Bottom: Historical Conversion Log -->
    <?php include __DIR__ . '/components/conversion_history.php'; ?>
  </div>
</div>

