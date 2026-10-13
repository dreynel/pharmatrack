<!-- Component: User Accounts Table (Registry/UserRegistry/components/user_table.php) -->
<div class="users-card glass-card" id="users-table-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-user-settings-line text-primary"></i> Pharmacy System Accounts</h3>
      <span class="text-sm text-muted">Manage staff accounts, roles (Admin / Cashier / Pharmacist), and terminal access</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" onclick="openUserModal()">
        <i class="ri-user-add-line"></i> Add User
      </button>
    </div>
  </div>

  <div class="table-responsive" style="max-height: 540px; overflow-y: auto;">
    <table class="custom-table" id="users-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email / Username</th>
          <th>Role</th>
          <th>Date Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="users-tbody">
        <!-- Rendered dynamically -->
      </tbody>
    </table>
  </div>
</div>

