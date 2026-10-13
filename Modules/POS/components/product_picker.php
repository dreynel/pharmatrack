<!-- Component: POS Product Picker (Modules/POS/components/product_picker.php) -->
<div class="pos-picker-panel glass-card" id="pos-picker-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-shopping-basket-2-line text-primary"></i> Pharmacy Catalog</h3>
      <span class="text-sm text-muted">Scan barcode or click any medicine to add to active cart</span>
    </div>
    <div class="picker-search-box">
      <div class="search-input-wrap">
        <i class="ri-search-line"></i>
        <input type="text" id="pos-search-input" placeholder="Search by name, generic, barcode..." oninput="filterPosCatalog(this.value)" autofocus>
      </div>
    </div>
  </div>

  <!-- Category Pills Filter -->
  <div class="category-pills-bar" id="pos-category-pills">
    <button class="pill active" onclick="filterPosByCategory('all')">All Products</button>
    <!-- Dynamic category pills populated via JS -->
  </div>

  <!-- Product Grid / Quick List -->
  <div class="pos-catalog-grid" id="pos-catalog-grid">
    <!-- Populated dynamically via JS -->
  </div>
</div>

