<?php
/**
 * View Entrypoint: Registry/CategoryRegistry
 * Native PHP Domain Medication Categories Registry
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-categoryregistry">
  <div class="module-header">
    <div class="header-titles">
      <h2>Medication Category Registry</h2>
      <p>Configure drug classification groups, therapeutics, and catalog tags for rapid POS lookup and reporting.</p>
    </div>
  </div>

  <div class="categories-content-wrap">
    <?php include __DIR__ . '/components/category_table.php'; ?>
  </div>

  <!-- Category Modal -->
  <?php include __DIR__ . '/components/category_modal.php'; ?>
</div>

