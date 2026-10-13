<!-- Component: Product Modal Component (Registry/ProductRegistry/components/product_modal.php) -->
<div class="modal" id="modal-product" style="display: none;">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h4 id="product-modal-title"><i class="ri-add-circle-line"></i> Register Medicine</h4>
        <button type="button" class="btn-close" onclick="closeProductModal()">&times;</button>
      </div>
      <form id="form-product-registry" onsubmit="handleProductSubmit(event)">
        <input type="hidden" id="prod-id" name="id">
        <div class="modal-body">
          <div class="form-group">
            <label>Brand / Trade Name *</label>
            <input type="text" id="prod-name" name="name" class="form-control" required placeholder="e.g. Biogesic 500mg">
          </div>
          <div class="form-group">
            <label>Generic Name</label>
            <input type="text" id="prod-generic" name="generic_name" class="form-control" placeholder="e.g. Paracetamol">
          </div>
          <div class="form-row">
            <div class="form-group col-6">
              <label>Barcode / SKU</label>
              <input type="text" id="prod-barcode" name="barcode" class="form-control" placeholder="Scan or type barcode">
            </div>
            <div class="form-group col-6">
              <label>Category</label>
              <select id="prod-category" name="category" class="form-control">
                <option value="Analgesic">Analgesic</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Antihistamine">Antihistamine</option>
                <option value="Vitamins">Vitamins</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-6">
              <label>Selling Price (₱) *</label>
              <input type="number" step="0.01" id="prod-price" name="unit_price" class="form-control" required placeholder="0.00">
            </div>
            <div class="form-group col-6">
              <label>Cost Price (₱)</label>
              <input type="number" step="0.01" id="prod-cost" name="cost_price" class="form-control" placeholder="0.00">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-6">
              <label>Reorder Point</label>
              <input type="number" id="prod-reorder" name="reorder_point" class="form-control" value="10">
            </div>
            <div class="form-group col-6">
              <label>Expiration Date</label>
              <input type="date" id="prod-expiry" name="expiry_date" class="form-control">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeProductModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-save-line"></i> Save Medicine</button>
        </div>
      </form>
    </div>
  </div>
</div>

