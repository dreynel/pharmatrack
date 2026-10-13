<!-- Component: Parent Receiving Batches Panel (Modules/StockIn/components/parent_panel.php) -->
<div class="split-panel-parent glass-card" id="stockin-parent-panel">
  <div class="card-header">
    <div>
      <h3><i class="ri-inbox-archive-fill text-primary"></i> Receiving Records (Parent)</h3>
      <span class="text-sm text-muted">Select a delivery invoice below to view itemized medicine batches on the left</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" onclick="openReceiveDeliveryModal()">
        <i class="ri-add-line"></i> Receive Delivery
      </button>
    </div>
  </div>

  <div class="panel-search-bar" style="padding: 0.75rem 1.25rem;">
    <div class="search-input-wrap">
      <i class="ri-search-line"></i>
      <input type="text" id="stockin-parent-search" placeholder="Search PO / Reference No, Supplier..." oninput="filterStockInParent(this.value)">
    </div>
  </div>

  <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
    <table class="custom-table" id="stockin-parent-table">
      <thead>
        <tr>
          <th>Ref No</th>
          <th>Date</th>
          <th>Supplier</th>
          <th>Total Cost</th>
          <th>Items</th>
          <th>Received By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="stockin-parent-tbody">
        <!-- Rows dynamically bound to trigger child inspection on click -->
      </tbody>
    </table>
  </div>
</div>

