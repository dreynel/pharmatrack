<!-- Component: Child Detail Panel per Parent Record (Modules/StockIn/components/child_panel.php) -->
<div class="split-panel-child glass-card" id="stockin-child-panel">
  <div class="card-header">
    <div>
      <div class="badge-parent-ref" id="stockin-active-badge">No Batch Selected</div>
      <h3 id="stockin-child-title"><i class="ri-list-check text-primary"></i> Delivery Item Details (Child)</h3>
      <span class="text-sm text-muted" id="stockin-child-subtitle">Click any parent record to view its medicines</span>
    </div>
  </div>

  <div class="child-content-area" id="stockin-child-content" style="padding: 1rem 1.25rem;">
    <div class="empty-state" id="stockin-child-empty">
      <i class="ri-cursor-line" style="font-size: 2.5rem; color: #94a3b8;"></i>
      <p style="margin-top: 0.5rem; color: #64748b; font-weight: 600;">Select a receiving record to inspect medicines</p>
    </div>

    <div class="table-responsive" id="stockin-child-table-wrap" style="display: none;">
      <table class="custom-table" id="stockin-child-table">
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Batch No</th>
            <th>Expiry Date</th>
            <th>Qty</th>
            <th>Cost (₱)</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody id="stockin-child-tbody">
          <!-- Populated dynamically via actions/get_stock_in_items.php -->
        </tbody>
      </table>
    </div>
  </div>
</div>

