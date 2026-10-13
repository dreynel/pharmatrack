<!-- Component: Parent Stock-Out Batches Panel (Modules/StockOut/components/parent_panel.php) -->
<div class="split-panel-parent glass-card" id="stockout-parent-panel">
  <div class="card-header">
    <div>
      <h3><i class="ri-delete-bin-7-line text-danger"></i> Stock-Out / Disposal Records (Parent)</h3>
      <span class="text-sm text-muted">Select a disposal entry to view item details on the side panel</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-danger" onclick="openStockOutModal()">
        <i class="ri-add-line"></i> Record Stock-Out
      </button>
    </div>
  </div>

  <div class="panel-search-bar" style="padding: 0.75rem 1.25rem;">
    <div class="search-input-wrap">
      <i class="ri-search-line"></i>
      <input type="text" id="stockout-parent-search" placeholder="Search Ref No, Reason, Authorized By..." oninput="filterStockOutParent(this.value)">
    </div>
  </div>

  <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
    <table class="custom-table" id="stockout-parent-table">
      <thead>
        <tr>
          <th>Ref No</th>
          <th>Date</th>
          <th>Reason</th>
          <th>Total Cost</th>
          <th>Items Count</th>
          <th>Authorized By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="stockout-parent-tbody">
        <!-- Rendered dynamically -->
      </tbody>
    </table>
  </div>
</div>

