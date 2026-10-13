<!-- Component: Stock Movements Ledger Table (Modules/StockMovements/components/movement_table.php) -->
<div class="movements-card glass-card" id="movements-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-swap-line text-primary"></i> Perpetual Inventory Ledger</h3>
      <span class="text-sm text-muted">Complete audit trail of all automated additions, deductions, conversions, and transactions</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-secondary btn-sm" onclick="exportMovementLedgerCSV()">
        <i class="ri-file-excel-2-line"></i> Export CSV
      </button>
    </div>
  </div>

  <div class="panel-filters-bar" style="padding: 0.75rem 1.25rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
    <div class="search-input-wrap" style="flex: 1; min-width: 240px;">
      <i class="ri-search-line"></i>
      <input type="text" id="mov-search-input" placeholder="Search product, movement code, reference..." oninput="filterMovementLedger()">
    </div>

    <div class="filter-group">
      <select id="mov-filter-type" class="form-control form-control-sm" onchange="filterMovementLedger()">
        <option value="">All Movement Types</option>
        <option value="RECEIVING">RECEIVING (Stock-In)</option>
        <option value="SALE">SALE (POS Checkout)</option>
        <option value="DISPOSAL">DISPOSAL (Stock-Out)</option>
        <option value="CONVERSION_IN">CONVERSION_IN (Unit Breakdown)</option>
        <option value="CONVERSION_OUT">CONVERSION_OUT (Box Breakdown)</option>
        <option value="ADJUSTMENT">ADJUSTMENT</option>
      </select>
    </div>
  </div>

  <div class="table-responsive" style="max-height: 580px; overflow-y: auto;">
    <table class="custom-table" id="movements-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Timestamp</th>
          <th>Medicine</th>
          <th>Type</th>
          <th>Qty Change</th>
          <th>Previous</th>
          <th>New Stock</th>
          <th>Ref No</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody id="movements-tbody">
        <!-- Rendered dynamically -->
      </tbody>
    </table>
  </div>
</div>

