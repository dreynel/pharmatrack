<!-- Component: Product Table Component (Registry/ProductRegistry/components/product_table.php) -->
<div class="glass-card">
  <div class="card-header">
    <div>
      <h3><i class="ri-medicine-bottle-fill text-primary"></i> Master Medicine Catalog</h3>
      <span class="text-sm text-muted">Complete listing of pharmaceutical items registered for Xyra Andrea Pharmacy</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" onclick="openAddProductModal()">
        <i class="ri-add-line"></i> Add New Medicine
      </button>
    </div>
  </div>

  <div class="table-responsive">
    <table class="custom-table" id="product-registry-table">
      <thead>
        <tr>
          <th>SKU / Barcode</th>
          <th>Medicine Name</th>
          <th>Category</th>
          <th>Unit Price</th>
          <th>Stock on Hand</th>
          <th>Expiry Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="product-registry-rows">
        <!-- Rendered via actions/get_products.php or server include -->
      </tbody>
    </table>
  </div>
</div>

