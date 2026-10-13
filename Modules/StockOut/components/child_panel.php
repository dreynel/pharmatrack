<!-- Component: Child Disposed Items Panel (Modules/StockOut/components/child_panel.php) -->
<div class="split-panel-child glass-card" id="stockout-child-panel">
  <div class="card-header">
    <div>
      <h3 id="stockout-child-title"><i class="ri-list-check-2 text-warning"></i> Disposed Items (Child)</h3>
      <span class="text-sm text-muted" id="stockout-child-subtitle">No disposal record selected</span>
    </div>
    <div class="card-actions">
      <span class="badge badge-secondary" id="stockout-child-badge">0 items</span>
    </div>
  </div>

  <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
    <table class="custom-table" id="stockout-child-table">
      <thead>
        <tr>
          <th>Medicine Name</th>
          <th>Batch No</th>
          <th>Qty Disposed</th>
          <th>Unit Cost</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody id="stockout-child-tbody">
        <tr>
          <td colspan="5" class="text-center text-muted py-4">Click a disposal record from the table to inspect item breakdown</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

