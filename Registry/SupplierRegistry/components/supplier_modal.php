<!-- Component: Supplier Modal (Registry/SupplierRegistry/components/supplier_modal.php) -->
<div class="modal" id="modal-supplier" style="display: none;">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h4><i class="ri-truck-line"></i> Supplier Registration</h4>
        <button type="button" class="btn-close" onclick="closeSupplierModal()">&times;</button>
      </div>
      <form id="form-supplier" onsubmit="handleSupplierSubmit(event)">
        <div class="modal-body">
          <div class="form-group">
            <label>Company / Supplier Name *</label>
            <input type="text" id="supp-name" name="name" class="form-control" required placeholder="e.g. Unilab Distribution">
          </div>
          <div class="form-row">
            <div class="form-group col-6">
              <label>Contact Person</label>
              <input type="text" id="supp-contact" name="contact_person" class="form-control" placeholder="Account Rep">
            </div>
            <div class="form-group col-6">
              <label>Contact Number *</label>
              <input type="text" id="supp-phone" name="contact_number" class="form-control" required placeholder="09xxxxxxxxx">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-6">
              <label>Email Address</label>
              <input type="email" id="supp-email" name="email" class="form-control" placeholder="supplier@example.com">
            </div>
            <div class="form-group col-6">
              <label>Lead Time (Days)</label>
              <input type="number" id="supp-lead" name="lead_time_days" class="form-control" value="7">
            </div>
          </div>
          <div class="form-group">
            <label>Business Address</label>
            <textarea id="supp-address" name="address" class="form-control" rows="2" placeholder="Warehouse address..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeSupplierModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="ri-save-line"></i> Save Supplier</button>
        </div>
      </form>
    </div>
  </div>
</div>

