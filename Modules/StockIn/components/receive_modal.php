<!-- Component: Receive Delivery Modal Form (Modules/StockIn/components/receive_modal.php) -->
<div class="modal" id="modal-stockin" style="display: none;">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h4><i class="ri-inbox-archive-line"></i> Receive Supplier Delivery</h4>
        <button type="button" class="btn-close" onclick="closeReceiveDeliveryModal()">&times;</button>
      </div>
      <form id="form-stockin" onsubmit="handleStockInSubmit(event)">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group col-4">
              <label>Reference / Invoice No *</label>
              <input type="text" id="stockin-ref" name="ref_no" class="form-control" required placeholder="e.g. INV-88210">
            </div>
            <div class="form-group col-4">
              <label>Supplier *</label>
              <select id="stockin-supplier" name="supplier_id" class="form-control" required>
                <option value="">Select Supplier...</option>
              </select>
            </div>
            <div class="form-group col-4">
              <label>Date Received *</label>
              <input type="date" id="stockin-date" name="date" class="form-control" required value="<?php echo date('Y-m-d'); ?>">
            </div>
          </div>

          <div class="delivery-items-header" style="display: flex; justify-content: space-between; align-items: center; margin: 1.25rem 0 0.5rem;">
            <h5><i class="ri-medicine-bottle-line"></i> Medicine Items</h5>
            <button type="button" class="btn btn-sm btn-outline-primary" onclick="addStockInRow()">
              <i class="ri-add-line"></i> Add Item Line
            </button>
          </div>

          <div class="table-responsive">
            <table class="custom-table" id="stockin-entry-table">
              <thead>
                <tr>
                  <th style="width: 35%;">Medicine</th>
                  <th style="width: 15%;">Batch No</th>
                  <th style="width: 18%;">Expiry</th>
                  <th style="width: 12%;">Qty</th>
                  <th style="width: 14%;">Cost (₱)</th>
                  <th style="width: 6%;"></th>
                </tr>
              </thead>
              <tbody id="stockin-entry-tbody">
                <!-- Dynamic entry rows -->
              </tbody>
            </table>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label>Notes / Remarks</label>
            <textarea id="stockin-notes" name="notes" class="form-control" rows="2" placeholder="Optional delivery notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeReceiveDeliveryModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-check-line"></i> Save Delivery</button>
        </div>
      </form>
    </div>
  </div>
</div>

