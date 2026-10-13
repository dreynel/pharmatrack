<!-- Component: User Account Modal (Registry/UserRegistry/components/user_modal.php) -->
<div class="modal" id="modal-user" style="display: none;">
  <div class="modal-backdrop" onclick="closeUserModal()"></div>
  <div class="modal-content modal-md">
    <div class="modal-header">
      <h3 class="modal-title" id="user-modal-title"><i class="ri-user-add-line text-primary"></i> Add Staff Account</h3>
      <button class="modal-close" onclick="closeUserModal()"><i class="ri-close-line"></i></button>
    </div>

    <form id="form-user" onsubmit="handleUserSubmit(event)">
      <div class="modal-body">
        <input type="hidden" id="user-id" name="id">

        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="user-name" name="name" class="form-control" placeholder="E.g., Juan Dela Cruz" required>
        </div>

        <div class="form-group">
          <label>Email / Login Identifier *</label>
          <input type="email" id="user-email" name="email" class="form-control" placeholder="user@pharmatrack.com" required>
        </div>

        <div class="form-row">
          <div class="form-group col-md-6">
            <label>Assigned Role *</label>
            <select id="user-role" name="role" class="form-control" required>
              <option value="cashier">Cashier</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div class="form-group col-md-6">
            <label>Password <span class="text-xs text-muted" id="user-pw-hint">(Default: password123)</span></label>
            <input type="password" id="user-password" name="password" class="form-control" placeholder="••••••••">
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="btn-save-user">Save Account</button>
      </div>
    </form>
  </div>
</div>

