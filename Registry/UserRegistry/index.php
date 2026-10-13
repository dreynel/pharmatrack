<?php
/**
 * View Entrypoint: Registry/UserRegistry
 * Native PHP Domain Staff Accounts & Access Control
 */
require_once __DIR__ . '/../../config/session.php';
requireLogin();
?>
<div class="module-container" id="module-userregistry">
  <div class="module-header">
    <div class="header-titles">
      <h2>User Registry & Role Management</h2>
      <p>Configure staff logins, enforce role-based access, and oversee system authorization.</p>
    </div>
  </div>

  <div class="users-content-wrap">
    <?php include __DIR__ . '/components/user_table.php'; ?>
  </div>

  <!-- User Edit/Add Modal -->
  <?php include __DIR__ . '/components/user_modal.php'; ?>
</div>

