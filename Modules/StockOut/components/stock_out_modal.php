<!-- Component: Stock-Out Entry Modal (Modules/StockOut/components/stock_out_modal.php) -->
<div class="modal" id="modal-stockout" style="display: none;">
  <div class="modal-backdrop" onclick="closeStockOutModal()"></div>
  <div class="modal-content modal-lg">
    <div class="modal-header">
      <h3 class="modal-title"><i class="ri-delete-bin-7-line text-danger"></i> Record Stock Disposal / Removal</h3>
      <button class="modal-close" onclick="closeStockOutModal()"><i class="ri-close-line"></i></button>
    </div>

    <form id="form-stockout" onsubmit="handleStockOutSubmit(event)">
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group col-md-4">
            <label>Reference No *</label>
            <input type="text" id="so-ref-no" name="ref_no" class="form-control" placeholder="Auto-generated" readonly>
          </div>
          <div class="form-group col-md-4">
            <label>Reason *</label>
            <select id="so-reason" name="reason" class="form-control" required>
              <option value="Expired">Expired</option>
              <option value="Damaged / Broken">Damaged / Broken</option>
              <option value="Recall">Manufacturer Recall</option>
              <option value="Inventory Adjustment">Inventory Adjustment</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group col-md-4">
            <label>Date *</label>
            <input type="date" id="so-date" name="date" class="form-control" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group col-md-6">
            <label>Authorized By</label>
            <input type="text" id="so-authorized-by" name="authorized_by" class="form-control" placeholder="Pharmacist / Inventory Manager">
          </div>
          <div class="form-group col-md-6">
            <label>Notes / Disposal Details</label>
            <input type="text" id="so-notes" name="notes" class="form-control" placeholder="Waste disposal reference or audit note">
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 1rem 0;">

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600;"><i class="ri-medicine-bottle-line text-primary"></i> Disposed Items</h4>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addStockOutItemRow()">
            <i class="ri-add-line"></i> Add Medicine
          </button>
        </div>

        <div class="table-responsive" style="max-height: 240px; overflow-y: auto;">
          <table class="custom-table" id="stockout-items-entry-table">
            <thead>
              <tr>
                <th style="width: 45%;">Medicine</th>
                <th style="width: 25%;">Batch No</th>
                <th style="width: 20%;">Qty</th>
                <th style="width: 10%;"></th>
              </tr>
            </thead>
            <tbody id="stockout-items-entry-tbody">
              <!-- Dynamically populated rows -->
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeStockOutModal()">Cancel</button>
        <button type="submit" class="btn btn-danger" id="btn-save-stockout">Save & Deduct Inventory</button>
      </div>
    </form>
  </div>
</div>

