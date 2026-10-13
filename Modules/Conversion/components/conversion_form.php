<!-- Component: Conversion Execution Form (Modules/Conversion/components/conversion_form.php) -->
<div class="conversion-form-card glass-card" id="conversion-form-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-arrow-left-right-line text-primary"></i> Bulk-to-Piece Breakdown</h3>
      <span class="text-sm text-muted">Convert wholesale boxes / packs into dispensed single units or blister packs</span>
    </div>
  </div>

  <form id="form-conversion" onsubmit="handleConversionSubmit(event)">
    <div class="form-body" style="padding: 1.25rem;">
      <div class="form-row">
        <div class="form-group col-md-6">
          <label>Source Item (Bulk / Box) *</label>
          <select id="conv-source-item" name="source_product_id" class="form-control" required onchange="handleConversionSourceSelect(this.value)">
            <option value="">-- Select Wholesale Item --</option>
            <!-- Populated dynamically -->
          </select>
          <span class="text-xs text-muted" id="conv-source-stock-hint">Current Stock: --</span>
        </div>

        <div class="form-group col-md-6">
          <label>Target Item (Single Piece / Dispensing Unit) *</label>
          <select id="conv-target-item" name="target_product_id" class="form-control" required>
            <option value="">-- Select Retail Piece --</option>
            <!-- Populated dynamically -->
          </select>
          <span class="text-xs text-muted" id="conv-target-stock-hint">Current Stock: --</span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group col-md-4">
          <label>Boxes to Break Down *</label>
          <input type="number" id="conv-source-qty" name="source_qty" class="form-control" min="1" value="1" required oninput="recalcConversionYield()">
        </div>

        <div class="form-group col-md-4">
          <label>Conversion Multiplier (Pieces/Box) *</label>
          <input type="number" id="conv-multiplier" name="multiplier" class="form-control" min="1" value="100" required oninput="recalcConversionYield()">
        </div>

        <div class="form-group col-md-4">
          <label>Calculated Total Output</label>
          <div class="form-control" style="background: rgba(16, 185, 129, 0.1); border-color: #10b981; font-weight: 700; color: #10b981;" id="conv-output-display">
            100 Pieces
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group col-md-6">
          <label>Pharmacist / Operator</label>
          <input type="text" id="conv-operator" name="operator" class="form-control" placeholder="Pharmacist on duty">
        </div>
        <div class="form-group col-md-6">
          <label>Remarks / Conversion Notes</label>
          <input type="text" id="conv-notes" name="notes" class="form-control" placeholder="E.g., Batch opened for prescription dispensing">
        </div>
      </div>

      <div class="form-actions" style="display: flex; justify-content: flex-end; margin-top: 1rem;">
        <button type="submit" class="btn btn-primary" id="btn-execute-conversion">
          <i class="ri-check-line"></i> Confirm & Execute Conversion
        </button>
      </div>
    </div>
  </form>
</div>

