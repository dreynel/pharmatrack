<!-- Component: Dashboard Alert Banners & Urgent Action Lists (Modules/Dashboard/components/alert_banners.php) -->
<div class="dashboard-split-panels" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
  <!-- Left Panel: Critical Low Stock Items -->
  <div class="glass-card" id="dashboard-critical-stock-panel">
    <div class="card-header">
      <div>
        <h3><i class="ri-alarm-warning-line text-warning"></i> Urgent Stock Depletions</h3>
        <span class="text-sm text-muted">Items at or below reorder threshold</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="navigateToModule('forecast')">
        View Forecast
      </button>
    </div>
    <div class="table-responsive">
      <table class="custom-table" id="dashboard-critical-stock-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Medicine Name</th>
            <th>Current Stock</th>
            <th>Reorder Point</th>
          </tr>
        </thead>
        <tbody id="dashboard-critical-stock-tbody">
          <!-- Dynamically populated -->
        </tbody>
      </table>
    </div>
  </div>

  <!-- Right Panel: Recent Sales Feed -->
  <div class="glass-card" id="dashboard-recent-sales-panel">
    <div class="card-header">
      <div>
        <h3><i class="ri-file-list-3-line text-primary"></i> Recent Transactions</h3>
        <span class="text-sm text-muted">Latest completed sales checkout entries</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="navigateToModule('pos')">
        Open POS
      </button>
    </div>
    <div class="table-responsive">
      <table class="custom-table" id="dashboard-recent-sales-table">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Customer</th>
            <th>Total Amount</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody id="dashboard-recent-sales-tbody">
          <!-- Dynamically populated -->
        </tbody>
      </table>
    </div>
  </div>
</div>

