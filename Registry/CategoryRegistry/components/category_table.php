<!-- Component: Category Master Table (Registry/CategoryRegistry/components/category_table.php) -->
<div class="categories-card glass-card" id="categories-table-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-folder-settings-line text-primary"></i> Medication Categories</h3>
      <span class="text-sm text-muted">Organize pharmacy catalog by therapeutic classes, generics, and packaging types</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" onclick="openCategoryModal()">
        <i class="ri-add-line"></i> Add Category
      </button>
    </div>
  </div>

  <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
    <table class="custom-table" id="categories-table">
      <thead>
        <tr>
          <th>Category Name</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="categories-tbody">
        <!-- Rendered dynamically -->
      </tbody>
    </table>
  </div>
</div>

