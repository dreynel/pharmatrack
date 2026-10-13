<!-- Component: Category Modal (Registry/CategoryRegistry/components/category_modal.php) -->
<div class="modal" id="modal-category" style="display: none;">
  <div class="modal-backdrop" onclick="closeCategoryModal()"></div>
  <div class="modal-content modal-sm">
    <div class="modal-header">
      <h3 class="modal-title" id="cat-modal-title"><i class="ri-folder-add-line text-primary"></i> Add Category</h3>
      <button class="modal-close" onclick="closeCategoryModal()"><i class="ri-close-line"></i></button>
    </div>

    <form id="form-category" onsubmit="handleCategorySubmit(event)">
      <div class="modal-body">
        <input type="hidden" id="cat-id" name="id">

        <div class="form-group">
          <label>Category Name *</label>
          <input type="text" id="cat-name" name="name" class="form-control" placeholder="E.g., Antibiotics, Analgesics" required>
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea id="cat-description" name="description" class="form-control" rows="3" placeholder="Category purpose or classification remarks"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeCategoryModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="btn-save-cat">Save Category</button>
      </div>
    </form>
  </div>
</div>

