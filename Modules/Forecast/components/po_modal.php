<!-- Component: PO Generation Modal (Modules/Forecast/components/po_modal.php) -->
<div class="modal" id="modal-forecast-po" style="display: none;">
  <div class="modal-backdrop" onclick="closeForecastPoModal()"></div>
  <div class="modal-content modal-md">
    <div class="modal-header">
      <h3 class="modal-title"><i class="ri-file-list-3-line text-primary"></i> Generate Purchase Order</h3>
      <button class="modal-close" onclick="closeForecastPoModal()"><i class="ri-close-line"></i></button>
    </div>

    <form id="form-forecast-po" onsubmit="handleForecastPoSubmit(event)">
      <div class="modal-body">
        <input type="hidden" id="fpo-product-id" name="product_id">

        <div class="form-group">
          <label>Selected Medicine</label>
          <input type="text" id="fpo-product-name" class="form-control" readonly>
        </div>

        <div class="form-row">
          <div class="form-group col-md-6">
            <label>Current Stock</label>
            <input type="text" id="fpo-current-stock" class="form-control" readonly>
          </div>
          <div class="form-group col-md-6">
            <label>Suggested Replenishment</label>
            <input type="text" id="fpo-suggested-qty" class="form-control" readonly>
          </div>
        </div>

        <div class="form-group">
          <label>Assign Supplier</label>
          <select id="fpo-supplier-id" name="supplier_id" class="form-control">
            <option value="">-- Select Preferred Supplier --</option>
            <!-- Dynamically populated -->
          </select>
        </div>

        <div class="form-row">
          <div class="form-group col-md-6">
            <label>Order Quantity *</label>
            <input type="number" id="fpo-order-qty" name="order_qty" class="form-control" min="1" required oninput="recalcPoTotal()">
          </div>
          <div class="form-group col-md-6">
            <label>Estimated Unit Cost (₱) *</label>
            <input type="number" id="fpo-unit-cost" name="unit_cost" step="0.01" class="form-control" required oninput="recalcPoTotal()">
          </div>
        </div>

        <div class="po-summary-box" style="background: rgba(59, 130, 246, 0.08); border-radius: 6px; padding: 0.75rem 1rem; margin-top: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="text-sm font-semibold">Total PO Estimated Cost:</span>
            <span class="text-lg font-bold text-primary" id="fpo-total-display">₱0.00</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeForecastPoModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="btn-save-po">Create Purchase Order</button>
      </div>
    </form>
  </div>
</div>

