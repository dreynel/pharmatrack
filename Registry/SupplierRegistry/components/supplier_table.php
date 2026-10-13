<!-- Component: Supplier Table (Registry/SupplierRegistry/components/supplier_table.php) -->
<div class="glass-card">
  <div class="card-header">
    <div>
      <h3><i class="ri-truck-fill text-primary"></i> Registered Drug Distributors & Suppliers</h3>
      <span class="text-sm text-muted">Active distributors supplying medicines to Xyra Andrea Pharmacy</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" onclick="openSupplierModal()">
        <i class="ri-add-line"></i> Register Supplier
      </button>
    </div>
  </div>

  <div class="table-responsive">
    <table class="custom-table" id="supplier-registry-table">
      <thead>
        <tr>
          <th>Supplier / Company</th>
          <th>Contact Person</th>
          <th>Contact Number</th>
          <th>Email</th>
          <th>Lead Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="supplier-registry-tbody">
        <!-- Rendered via actions/get_suppliers.php -->
      </tbody>
    </table>
  </div>
</div>

