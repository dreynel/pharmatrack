/**
 * PharmaTrack - Point of Sale (POS) Controller
 * Xyra Andrea Pharmacy - Fast Dispensing, Barcode Scan, Multi-View Layout (Cards, Grid, List, Table), Thermal Receipts
 */

class PosController {
  constructor() {
    this.cart = [];
    this.activeCategory = 'All';
    this.discountPercent = 0;
    this.discountType = 'Regular';
    this.currentCalculations = {};
    this.products = [];
    this.searchQuery = '';
    this.viewMode = localStorage.getItem('pos_view_mode') || 'cards';
    this.currentPage = 1;
    this.pageSize = parseInt(localStorage.getItem('pos_page_size'), 10) || 8;
  }

  async init() {
    if (!this.eventsBound) {
      this.bindEvents();
      this.eventsBound = true;
    }
    await this.refreshProducts();
    this.updateCartUI();
  }

  async render() {
    await this.refreshProducts();
  }

  async refreshProducts() {
    try {
      this.products = await window.mockApi.getProducts();
      this.syncViewSwitcherUI();
      this.renderCategoryPills();
      this.renderProductsGrid(this.searchQuery);
    } catch (err) {
      console.error('[PosController] Error refreshing products:', err);
    }
  }

  bindEvents() {
    const searchInput = document.getElementById('pos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.renderProductsGrid(this.searchQuery);
      });
    }

    // View Mode Switcher (Cards, Grid, List, Table)
    const viewSwitcher = document.getElementById('pos-view-switcher');
    if (viewSwitcher) {
      viewSwitcher.querySelectorAll('.pos-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-pos-view');
          if (mode) {
            this.setViewMode(mode);
          }
        });
      });
    }

    const discountSelect = document.getElementById('pos-discount-select');
    if (discountSelect) {
      discountSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '20_pwd' || val === 'pwd') {
          this.discountPercent = 20;
          this.discountType = 'PWD';
        } else if (val === '20' || val === '20_senior' || val === 'senior') {
          this.discountPercent = 20;
          this.discountType = 'Senior';
        } else {
          this.discountPercent = 0;
          this.discountType = 'Regular';
        }
        this.updateCartUI();
      });
    }

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (this.cart.length === 0) return;
        this.cart = [];
        this.updateCartUI();
        if (window.SoundFX && typeof window.SoundFX.playSuccess === 'function') {
          window.SoundFX.playSuccess();
        }
        SwalHelpers.toast('Cart cleared', 'info');
      });
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.handleCheckout());
    }

    const barcodeInput = document.getElementById('barcode-scan-input');
    if (barcodeInput) {
      barcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const barcode = e.target.value.trim();
          if (barcode) {
            this.scanBarcode(barcode);
            e.target.value = '';
          }
        }
      });
    }

    const openCartMobileBtn = document.getElementById('open-cart-mobile-btn');
    const closeCartMobileBtn = document.getElementById('close-cart-mobile-btn');
    const posCartPanel = document.getElementById('pos-cart-panel');

    if (openCartMobileBtn && posCartPanel) {
      openCartMobileBtn.addEventListener('click', () => {
        posCartPanel.classList.add('mobile-active');
        if (closeCartMobileBtn) closeCartMobileBtn.style.display = 'block';
      });
    }

    if (closeCartMobileBtn && posCartPanel) {
      closeCartMobileBtn.addEventListener('click', () => {
        posCartPanel.classList.remove('mobile-active');
      });
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    localStorage.setItem('pos_view_mode', mode);
    this.syncViewSwitcherUI();
    this.renderProductsGrid(this.searchQuery);
  }

  syncViewSwitcherUI() {
    const viewSwitcher = document.getElementById('pos-view-switcher');
    if (viewSwitcher) {
      viewSwitcher.querySelectorAll('.pos-view-btn').forEach(btn => {
        const isMatch = btn.getAttribute('data-pos-view') === this.viewMode;
        btn.classList.toggle('active', isMatch);
      });
    }

    const grid = document.getElementById('pos-products-grid');
    if (grid) {
      grid.className = `product-grid view-${this.viewMode}`;
    }
  }

  getCategoryTabIcon(cat) {
    if (cat === 'All') return 'ri-apps-2-fill';
    if (cat === 'Antibiotics') return 'ri-medicine-bottle-fill';
    if (cat === 'Vitamins' || cat === 'Vitamins & Supplements') return 'ri-heart-pulse-fill';
    if (cat === 'First Aid') return 'ri-first-aid-kit-fill';
    if (cat === 'Respiratory' || cat === 'Antihistamine') return 'ri-lungs-line';
    if (cat === 'Antihypertensive' || cat === 'Antidiabetic') return 'ri-pulse-line';
    if (cat === 'Gastrointestinal') return 'ri-flask-fill';
    return 'ri-capsule-fill';
  }

  renderCategoryPills() {
    const uniqueCats = [...new Set(this.products.map(p => p.category).filter(Boolean))];
    const categories = ['All', ...uniqueCats];
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    container.innerHTML = categories.map(cat => {
      const count = cat === 'All'
        ? this.products.length
        : this.products.filter(p => p.category === cat).length;
      const icon = this.getCategoryTabIcon(cat);
      const label = cat === 'All' ? 'All Medicines' : cat;

      return `
        <button type="button" class="cat-btn ${cat === this.activeCategory ? 'active' : ''}" data-cat="${cat}">
          <i class="${icon}"></i>
          <span>${label}</span>
          <span class="cat-count">${count}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-cat');
        this.currentPage = 1;
        container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderProductsGrid(this.searchQuery);
      });
    });
  }

  async render() {
    await this.refreshProducts();
  }

  async refreshProducts() {
    this.products = await window.mockApi.getProducts();
    this.renderCategoryPills();
    this.renderProductsGrid(this.searchQuery);
  }

  getProductVisualMeta(product) {
    let badgeClass = 'badge-success';
    if (product.stock <= 0) badgeClass = 'badge-danger';
    else if (product.stock <= product.reorderPoint) badgeClass = 'badge-warning';

    let iconClass = 'ri-capsule-fill';
    if (product.category === 'Antibiotics') iconClass = 'ri-medicine-bottle-fill';
    else if (product.category === 'Vitamins' || product.category === 'Vitamins & Supplements') iconClass = 'ri-heart-pulse-fill';
    else if (product.category === 'First Aid') iconClass = 'ri-first-aid-kit-fill';
    else if (product.category === 'Respiratory' || product.category === 'Antihistamine') iconClass = 'ri-lungs-line';
    else if (product.category === 'Antihypertensive' || product.category === 'Antidiabetic') iconClass = 'ri-pulse-line';

    return { badgeClass, iconClass };
  }

  goToPage(page) {
    this.currentPage = Math.max(1, page);
    this.renderProductsGrid(this.searchQuery);
    const grid = document.getElementById('pos-products-grid');
    if (grid) grid.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setPageSize(newSize) {
    const parsed = parseInt(newSize, 10) || 8;
    this.pageSize = parsed;
    localStorage.setItem('pos_page_size', parsed);
    this.currentPage = 1;
    this.renderProductsGrid(this.searchQuery);
  }

  renderPagination(totalItems, totalPages, startIdx, endIdx) {
    const bar = document.getElementById('pos-pagination-bar');
    if (!bar) return;

    if (totalItems === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';
    const sizes = [6, 8, 12, 24, 100];

    let pageButtons = '';
    for (let p = 1; p <= totalPages; p++) {
      pageButtons += `
        <button type="button" class="pos-page-btn ${p === this.currentPage ? 'active' : ''}" onclick="window.posController.goToPage(${p})">
          ${p}
        </button>
      `;
    }

    bar.innerHTML = `
      <div class="pos-page-info">
        <span>Showing <strong>${startIdx + 1}–${endIdx}</strong> of <strong>${totalItems}</strong> medicines</span>
        <div class="pos-page-size-wrap">
          <label for="pos-page-size-select">Show:</label>
          <select id="pos-page-size-select" class="pos-page-size-select" onchange="window.posController.setPageSize(this.value)">
            ${sizes.map(s => `<option value="${s}" ${this.pageSize === s ? 'selected' : ''}>${s === 100 ? 'All' : s + ' / page'}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="pos-page-controls">
        <button type="button" class="pos-page-btn" onclick="window.posController.goToPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>
          <i class="ri-arrow-left-s-line"></i> Prev
        </button>
        ${pageButtons}
        <button type="button" class="pos-page-btn" onclick="window.posController.goToPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>
          Next <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>
    `;
  }

  renderProductsGrid(query = this.searchQuery) {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    grid.className = `product-grid view-${this.viewMode}`;
    const q = (query || '').toLowerCase();

    const filtered = this.products.filter(p => {
      const matchesCat = this.activeCategory === 'All' || p.category === this.activeCategory;
      const matchesSearch = (p.name || '').toLowerCase().includes(q) || 
                            (p.genericName || '').toLowerCase().includes(q) || 
                            (p.sku || '').toLowerCase().includes(q) ||
                            (p.barcode || '').includes(q);
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b; background: #fff; border-radius: 14px; border: 1px dashed #cbd5e1;">
          <i class="ri-search-line" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: #94a3b8;"></i>
          <p style="margin: 0; font-weight: 600;">No medicines found matching criteria.</p>
        </div>
      `;
      this.renderPagination(0, 1, 0, 0);
      return;
    }

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, totalItems);
    const pageItems = filtered.slice(startIdx, endIdx);

    this.renderPagination(totalItems, totalPages, startIdx, endIdx);

    // 1. TABLE VIEW
    if (this.viewMode === 'table') {
      grid.innerHTML = `
        <div class="pos-table-wrapper">
          <table class="custom-table pos-items-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Medicine & Generic Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit Price</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${pageItems.map(product => {
                const { badgeClass, iconClass } = this.getProductVisualMeta(product);
                return `
                  <tr class="pos-product-trigger ${product.stock <= 0 ? 'out-of-stock-row' : ''}" data-id="${product.id}">
                    <td><code style="font-size: 0.76rem; color: #475569;">${product.sku || 'N/A'}</code></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <div class="product-avatar" style="width: 32px; height: 32px; font-size: 1rem; border-radius: 8px;">
                          <i class="${iconClass}"></i>
                        </div>
                        <div>
                          <div style="font-weight: 700; color: var(--text-main); font-size: 0.88rem; line-height: 1.2;">${product.name}</div>
                          <div style="font-size: 0.74rem; color: var(--text-muted); font-style: italic;">${product.genericName || 'Generic'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge-pill badge-info" style="font-size: 0.7rem;">${product.category}</span></td>
                    <td>
                      <span class="badge-pill ${badgeClass}" style="font-size: 0.72rem;">
                        ${product.stock} ${product.uom || 'units'}
                      </span>
                      ${product.batchNo ? `<div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;"><i class="ri-barcode-box-line"></i> Lot: ${product.batchNo}</div>` : ''}
                    </td>
                    <td><strong style="color: var(--primary); font-family: var(--font-heading); font-size: 1rem;">₱${product.unitPrice.toFixed(2)}</strong></td>
                    <td style="text-align: right;">
                      <div class="pos-quick-qty-wrap" onclick="event.stopPropagation()">
                        <input
                          type="number"
                          class="pos-quick-qty-input"
                          id="pos-quick-qty-${product.id}"
                          min="1"
                          max="${Math.max(1, product.stock)}"
                          value="1"
                          inputmode="numeric"
                          title="Quantity to add"
                          onfocus="this.select()"
                          onkeydown="if(event.key==='Enter'){event.preventDefault(); window.posController.addCustomQtyFromRow(${product.id});}"
                          ${product.stock <= 0 ? 'disabled' : ''}
                        >
                        <button type="button" class="btn btn-sm btn-primary pos-row-add-btn" onclick="window.posController.addCustomQtyFromRow(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                          <i class="ri-add-line"></i> Add
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    // 2. LIST VIEW
    else if (this.viewMode === 'list') {
      grid.innerHTML = pageItems.map(product => {
        const { badgeClass, iconClass } = this.getProductVisualMeta(product);
        return `
          <div class="product-card pos-list-item pos-product-trigger ${product.stock <= 0 ? 'out-of-stock-card' : ''}" data-id="${product.id}">
            <div class="pos-list-left">
              <div class="product-avatar">
                <i class="${iconClass}"></i>
              </div>
              <div class="pos-list-info">
                <div class="pos-list-title-row">
                  <h4>${product.name}</h4>
                  <span class="badge-pill badge-info" style="font-size: 0.68rem; padding: 0.18rem 0.55rem;">${product.category}</span>
                </div>
                <p>${product.genericName || 'Standard Formulation'} • <code style="font-size: 0.72rem;">${product.sku || ''}</code></p>
              </div>
            </div>

            <div class="pos-list-right">
              <div class="pos-list-stock">
                <span class="badge-pill ${badgeClass}" style="font-size: 0.72rem;">${product.stock} ${product.uom || 'units'}</span>
                ${product.batchNo ? `<div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;"><i class="ri-barcode-box-line"></i> Lot: ${product.batchNo}</div>` : ''}
              </div>
              <div class="pos-list-price">₱${product.unitPrice.toFixed(2)}</div>
              <div class="pos-quick-qty-wrap" onclick="event.stopPropagation()">
                <input
                  type="number"
                  class="pos-quick-qty-input"
                  id="pos-quick-qty-${product.id}"
                  min="1"
                  max="${Math.max(1, product.stock)}"
                  value="1"
                  inputmode="numeric"
                  title="Quantity to add"
                  onfocus="this.select()"
                  onkeydown="if(event.key==='Enter'){event.preventDefault(); window.posController.addCustomQtyFromRow(${product.id});}"
                  ${product.stock <= 0 ? 'disabled' : ''}
                >
                <div class="product-add-btn" title="Add to Sale" onclick="window.posController.addCustomQtyFromRow(${product.id})">
                  <i class="ri-add-line"></i>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    // 3. COMPACT GRID (TILES) VIEW
    else if (this.viewMode === 'grid') {
      grid.innerHTML = pageItems.map(product => {
        const { badgeClass, iconClass } = this.getProductVisualMeta(product);
        return `
          <div class="product-card pos-compact-tile pos-product-trigger ${product.stock <= 0 ? 'out-of-stock-card' : ''}" data-id="${product.id}">
            <div class="pos-tile-top">
              <span class="pos-tile-icon"><i class="${iconClass}"></i></span>
              <span class="badge-pill ${badgeClass}" style="font-size: 0.66rem; padding: 0.15rem 0.45rem;">${product.stock} ${product.uom || ''}</span>
            </div>
            <div class="pos-tile-body">
              <h4 title="${product.name}">${product.name}</h4>
              <small>${product.genericName}</small>
            </div>
            <div class="pos-tile-bottom">
              <span class="pos-tile-price">₱${product.unitPrice.toFixed(2)}</span>
              <span class="pos-tile-plus"><i class="ri-add-line"></i></span>
            </div>
          </div>
        `;
      }).join('');
    }
    // 4. DETAILED CARDS VIEW (Default)
    else {
      grid.innerHTML = pageItems.map(product => {
        const { badgeClass, iconClass } = this.getProductVisualMeta(product);
        return `
          <div class="product-card pos-product-trigger ${product.stock <= 0 ? 'out-of-stock-card' : ''}" data-id="${product.id}">
            <div class="product-header-row">
              <div class="product-avatar">
                <i class="${iconClass}"></i>
              </div>
              <span class="badge-pill ${badgeClass} product-badge">${product.status || (product.stock > 0 ? 'In Stock' : 'Out of Stock')}</span>
            </div>

            <div class="product-info">
              <h4>${product.name}</h4>
              <p>${product.genericName}</p>
            </div>

            <div class="product-price-row">
              <div>
                <div class="product-price">₱${product.unitPrice.toFixed(2)}</div>
                <div style="font-size: 0.73rem; color: var(--text-muted); font-weight: 600;">
                  Stock: ${product.stock} ${product.uom || 'units'}
                  ${product.batchNo ? ` • <span style="color: var(--primary);"><i class="ri-barcode-box-line"></i> ${product.batchNo}</span>` : ''}
                </div>
              </div>
              <div class="product-add-btn" title="Add to Sale">
                <i class="ri-add-line"></i>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    grid.querySelectorAll('.pos-product-trigger').forEach(elem => {
      elem.addEventListener('click', () => {
        const id = parseInt(elem.getAttribute('data-id'));
        this.addToCart(id, 1);
      });
    });
  }

  addCustomQtyFromRow(productId) {
    const qtyInput = document.getElementById(`pos-quick-qty-${productId}`);
    const requestedQty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
    this.addToCart(productId, Math.max(1, requestedQty));
    if (qtyInput) qtyInput.value = '1';
  }

  scanBarcode(barcode) {
    const product = this.products.find(p => p.barcode === barcode || (p.sku && p.sku.toLowerCase() === barcode.toLowerCase()));
    if (product) {
      this.addToCart(product.id, 1);
      SwalHelpers.toast(`Scanned: ${product.name}`, 'success');
    } else {
      SwalHelpers.toast(`Barcode ${barcode} not found`, 'error');
    }
  }

  async addToCart(productId, addQty = 1) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      SwalHelpers.toast(`${product.name} is Out of Stock!`, 'error');
      return;
    }

    const qtyToAdd = Math.max(1, parseInt(addQty, 10) || 1);
    const existingIndex = this.cart.findIndex(item => item.productId === productId);

    if (existingIndex > -1) {
      const existingItem = this.cart[existingIndex];
      if (existingItem.qty >= product.stock) {
        SwalHelpers.toast(`Cannot exceed available stock (${product.stock} ${product.uom || 'units'})`, 'warning');
        return;
      }
      const nextQty = existingItem.qty + qtyToAdd;
      if (nextQty > product.stock) {
        existingItem.qty = product.stock;
        SwalHelpers.toast(`Capped at maximum available stock (${product.stock} ${product.uom || 'units'})`, 'warning');
      } else {
        existingItem.qty = nextQty;
      }

      // Move existing item to TOP (index 0) of cart as requested
      this.cart.splice(existingIndex, 1);
      this.cart.unshift(existingItem);

      if (!existingItem.batches || existingItem.batches.length === 0) {
        try {
          existingItem.batches = await window.mockApi.getProductBatches(product.id);
        } catch (e) {
          existingItem.batches = [];
        }
        if ((!existingItem.batches || existingItem.batches.length === 0) && product.batchNo) {
          existingItem.batches = [{
            batchNo: product.batchNo,
            displayBatch: product.batchNo,
            expiryDate: product.expiryDate || '',
            availableStock: product.stock
          }];
        }
        if (!existingItem.selectedBatchNo && existingItem.batches.length > 0) {
          existingItem.selectedBatchNo = existingItem.batches[0].batchNo;
          existingItem.selectedExpiryDate = existingItem.batches[0].expiryDate;
        }
      }
    } else {
      const initialQty = Math.min(qtyToAdd, product.stock);
      if (qtyToAdd > product.stock) {
        SwalHelpers.toast(`Only ${product.stock} ${product.uom || 'units'} available in stock`, 'warning');
      }

      let batches = [];
      try {
        batches = await window.mockApi.getProductBatches(product.id);
      } catch (e) {
        batches = [];
      }
      if ((!batches || batches.length === 0) && product.batchNo) {
        batches = [{
          batchNo: product.batchNo,
          displayBatch: product.batchNo,
          expiryDate: product.expiryDate || '',
          availableStock: product.stock
        }];
      }
      const firstBatch = (batches && batches.length > 0) ? batches[0] : null;

      // Add new item at TOP (index 0) of cart
      this.cart.unshift({
        productId: product.id,
        name: product.name,
        price: product.unitPrice,
        qty: initialQty,
        batches: batches || [],
        selectedBatchNo: firstBatch ? firstBatch.batchNo : (product.batchNo || ''),
        selectedExpiryDate: firstBatch ? firstBatch.expiryDate : (product.expiryDate || '')
      });
    }

    this.updateCartUI();

    // Scroll cart container to top so the newly added item is immediately visible at the top
    const cartContainer = document.getElementById('pos-cart-items');
    if (cartContainer) {
      cartContainer.scrollTop = 0;
    }
  }

  selectItemBatch(productId, batchNo) {
    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;
    const found = (item.batches || []).find(b => b.batchNo === batchNo);
    item.selectedBatchNo = batchNo;
    item.selectedExpiryDate = found ? found.expiryDate : '';

    if (found && item.qty > found.availableStock) {
      SwalHelpers.toast(`Warning: Cart qty (${item.qty}) exceeds available batch stock (${found.availableStock} in ${batchNo || 'batch'})`, 'warning');
    }

    this.updateCartUI();
  }

  updateQty(productId, delta) {
    const item = this.cart.find(i => i.productId === productId);
    const product = this.products.find(p => p.id === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      this.removeFromCart(productId);
    } else {
      if (product && newQty > product.stock) {
        SwalHelpers.toast(`Only ${product.stock} units available in stock`, 'warning');
        return;
      }
      item.qty = newQty;
      this.updateCartUI();
    }
  }

  // Live handler while typing inside .cart-qty-input (preserves input focus)
  handleQtyInput(productId, inputEl) {
    const item = this.cart.find(i => i.productId === productId);
    const product = this.products.find(p => p.id === productId);
    if (!item) return;

    const raw = inputEl.value.trim();
    if (raw === '') return; // Let user finish typing

    let parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 1) return;

    const maxStock = product ? product.stock : 9999;
    if (parsed > maxStock) {
      parsed = maxStock;
      inputEl.value = maxStock;
      SwalHelpers.toast(`Only ${maxStock} ${product?.uom || 'units'} available in stock`, 'warning');
    }

    item.qty = parsed;

    // Update this row's line-total display without re-creating the DOM input
    const linePriceEl = document.getElementById(`cart-item-calc-${productId}`);
    if (linePriceEl) {
      const itemTotal = item.price * item.qty;
      linePriceEl.textContent = `₱${itemTotal.toFixed(2)}`;
    }
    const subCalcEl = document.getElementById(`cart-item-subcalc-${productId}`);
    if (subCalcEl) {
      subCalcEl.textContent = `${item.qty} × ₱${item.price.toFixed(2)}`;
    }

    this.updateCartSummaryTotals();
  }

  // Commit handler on blur / Enter / change
  setExactQty(productId, rawValue) {
    const item = this.cart.find(i => i.productId === productId);
    const product = this.products.find(p => p.id === productId);
    if (!item) return;

    const parsed = parseInt(rawValue, 10);
    if (rawValue !== '' && parsed === 0) {
      this.removeFromCart(productId);
      return;
    }

    let validQty = (isNaN(parsed) || parsed < 1) ? 1 : parsed;
    const maxStock = product ? product.stock : 9999;

    if (validQty > maxStock) {
      validQty = maxStock;
      SwalHelpers.toast(`Only ${maxStock} ${product?.uom || 'units'} available in stock`, 'warning');
    }

    item.qty = validQty;
    this.updateCartUI();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.productId !== productId);
    this.updateCartUI();
  }

  updateCartSummaryTotals() {
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount-val');
    const vatableSalesEl = document.getElementById('cart-vatable-sales');
    const vatAmountEl = document.getElementById('cart-vat-amount');
    const vatExemptRow = document.getElementById('cart-vat-exempt-row');
    const vatExemptSalesEl = document.getElementById('cart-vat-exempt-sales');
    const totalEl = document.getElementById('cart-total');
    const countBadge = document.getElementById('cart-count-badge');
    const checkoutBtn = document.getElementById('checkout-btn');
    const mobileCountEl = document.getElementById('mobile-cart-items-count');
    const mobileTotalEl = document.getElementById('mobile-cart-total-val');

    let subtotal = 0;
    let totalQty = 0;
    this.cart.forEach(item => {
      subtotal += item.price * item.qty;
      totalQty += item.qty;
    });

    const isSeniorOrPwd = this.discountType === 'Senior' || this.discountType === 'PWD';

    let discountVal = 0;
    let vatableSales = 0;
    let vatAmount = 0;
    let vatExemptSales = 0;
    let finalTotal = 0;

    if (isSeniorOrPwd) {
      // Under RA 9994 (Senior Citizens) & RA 10754 (PWD):
      // Prices are VAT-inclusive (12%). The sale is 100% VAT-exempt PLUS 20% discount on the net base.
      const netVatExemptBase = subtotal / 1.12;
      const vatRelief = subtotal - netVatExemptBase;
      const scDiscount = netVatExemptBase * 0.20;
      discountVal = vatRelief + scDiscount;
      finalTotal = Math.max(0, netVatExemptBase - scDiscount);

      vatableSales = 0;
      vatAmount = 0;
      vatExemptSales = finalTotal;

      if (vatExemptRow) vatExemptRow.style.display = 'flex';
      if (vatExemptSalesEl) vatExemptSalesEl.innerText = `₱${vatExemptSales.toFixed(2)}`;
    } else {
      // Only Senior and PWD are eligible for discounting (20%). Regular customers have 0% discount.
      this.discountPercent = 0;
      this.discountType = 'Regular';
      discountVal = 0;
      finalTotal = Math.max(0, subtotal);

      // Philippine Standard 12% VAT
      vatableSales = finalTotal / 1.12;
      vatAmount = finalTotal - vatableSales;
      vatExemptSales = 0;

      if (vatExemptRow) vatExemptRow.style.display = 'none';
    }

    if (subtotalEl) subtotalEl.innerText = `₱${subtotal.toFixed(2)}`;
    if (discountEl) discountEl.innerText = `-₱${discountVal.toFixed(2)}`;
    if (vatableSalesEl) vatableSalesEl.innerText = `₱${vatableSales.toFixed(2)}`;
    if (vatAmountEl) vatAmountEl.innerText = `₱${vatAmount.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `₱${finalTotal.toFixed(2)}`;
    if (countBadge) countBadge.innerText = `${totalQty} items`;
    if (checkoutBtn) checkoutBtn.disabled = this.cart.length === 0;

    if (mobileCountEl) mobileCountEl.innerText = `${totalQty} items in cart`;
    if (mobileTotalEl) mobileTotalEl.innerText = `₱${finalTotal.toFixed(2)}`;

    this.currentCalculations = {
      subtotal,
      discountVal,
      finalTotal,
      vatableSales,
      vatAmount,
      vatExemptSales,
      isSeniorOrPwd,
      discountType: this.discountType,
      discountPercent: this.discountPercent
    };
  }

  updateCartUI() {
    const container = document.getElementById('pos-cart-items');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
          <i class="ri-shopping-bag-line" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: #94a3b8;"></i>
          <p style="font-size: 0.88rem;">Cart is empty.<br>Select items on the left to add to sale.</p>
        </div>
      `;
      this.updateCartSummaryTotals();
      return;
    }

    container.innerHTML = this.cart.map(item => {
      const itemTotal = item.price * item.qty;
      const product = this.products.find(p => p.id === item.productId);
      const maxStock = product ? product.stock : 9999;

      const hasBatches = item.batches && item.batches.length > 0;
      const selectedBatch = hasBatches ? (item.batches.find(b => b.batchNo === item.selectedBatchNo) || item.batches[0]) : null;

      let expiryStatusBadge = '';
      if (selectedBatch && selectedBatch.expiryDate) {
        const expTime = new Date(selectedBatch.expiryDate).getTime();
        const nowTime = new Date().getTime();
        const daysLeft = Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          expiryStatusBadge = `<span class="cart-badge cart-badge-expired"><i class="ri-alarm-warning-line"></i> Expired (${selectedBatch.expiryDate})</span>`;
        } else if (daysLeft <= 90) {
          expiryStatusBadge = `<span class="cart-badge cart-badge-exp-soon"><i class="ri-time-line"></i> Exp: ${daysLeft}d</span>`;
        } else if (hasBatches && selectedBatch.batchNo === item.batches[0].batchNo) {
          expiryStatusBadge = `<span class="cart-badge cart-badge-fefo"><i class="ri-star-fill"></i> FEFO Priority</span>`;
        } else {
          expiryStatusBadge = `<span class="cart-badge cart-badge-stock"><i class="ri-calendar-line"></i> Exp: ${selectedBatch.expiryDate}</span>`;
        }
      }

      const effectiveLotStock = (selectedBatch && selectedBatch.availableStock !== undefined)
        ? selectedBatch.availableStock
        : (product ? product.stock : item.qty);

      const batchStockBadge = `<span class="cart-badge cart-badge-stock" title="Available stock in this lot"><i class="ri-stack-line"></i> Lot Stock: ${effectiveLotStock}</span>`;
      const overStockBadge = effectiveLotStock < item.qty
        ? `<span class="cart-badge cart-badge-danger" title="Quantity in cart exceeds this batch balance"><i class="ri-error-warning-line"></i> Exceeds Lot (${effectiveLotStock})</span>`
        : '';

      const batchOpts = hasBatches
        ? item.batches.map((b, idx) => {
            const isFefo = idx === 0 ? '⭐ [FEFO] ' : '';
            return `<option value="${b.batchNo}" ${b.batchNo === item.selectedBatchNo ? 'selected' : ''}>${isFefo}${b.displayBatch} (Exp: ${b.expiryDate || 'N/A'} - ${b.availableStock} in stock)</option>`;
          }).join('')
        : `<option value="${product?.batchNo || ''}">Lot ${product?.batchNo || 'Default'} (${product ? product.stock : item.qty} in stock)</option>`;

      return `
        <div class="cart-item" data-product-id="${item.productId}">
          <!-- Top Row: Name, UOM/Category, and Line Total -->
          <div class="cart-item-header">
            <div class="cart-item-title-box">
              <h5 class="cart-item-name" title="${item.name}">${item.name}</h5>
              <div class="cart-item-meta">
                <span class="cart-item-unit-price">₱${item.price.toFixed(2)}</span>
                ${product?.uom ? `<span class="cart-item-uom">/${product.uom}</span>` : ''}
                ${product?.category ? `<span class="cart-item-category-tag">${product.category}</span>` : ''}
              </div>
            </div>
            <div class="cart-item-price-box">
              <span class="cart-item-line-total" id="cart-item-calc-${item.productId}">₱${itemTotal.toFixed(2)}</span>
              <span class="cart-item-sub-calc" id="cart-item-subcalc-${item.productId}">${item.qty} × ₱${item.price.toFixed(2)}</span>
            </div>
          </div>

          <!-- Middle Row: Lot Selector & Stepper Controls -->
          <div class="cart-item-body">
            <div class="cart-item-batch-row">
              <div class="cart-batch-select-wrap" title="Select batch to dispense">
                <i class="ri-barcode-box-line cart-batch-icon"></i>
                <select class="pos-cart-batch-select" onchange="window.posController.selectItemBatch(${item.productId}, this.value)">
                  ${batchOpts}
                </select>
              </div>
            </div>

            <div class="cart-qty-controls">
              <button type="button" class="cart-qty-btn" title="Decrease Qty" onclick="window.posController.updateQty(${item.productId}, -1)">-</button>
              <input
                type="number"
                class="cart-qty-input"
                min="1"
                max="${maxStock}"
                inputmode="numeric"
                value="${item.qty}"
                title="Direct quantity edit (Available: ${maxStock})"
                onfocus="this.select()"
                oninput="window.posController.handleQtyInput(${item.productId}, this)"
                onchange="window.posController.setExactQty(${item.productId}, this.value)"
                onkeydown="if(event.key==='Enter'){this.blur();}"
              >
              <button type="button" class="cart-qty-btn" title="Increase Qty" onclick="window.posController.updateQty(${item.productId}, 1)">+</button>
              <button type="button" class="cart-qty-btn cart-remove-btn" title="Remove from cart" onclick="window.posController.removeFromCart(${item.productId})">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>

          <!-- Bottom Row: Clinical Expiry & Lot Badges -->
          <div class="cart-item-footer">
            <div class="cart-item-badges">
              ${expiryStatusBadge}
              ${batchStockBadge}
              ${overStockBadge}
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.updateCartSummaryTotals();
  }

  async handleCheckout() {
    if (this.cart.length === 0) return;

    this.updateCartSummaryTotals();
    const calc = this.currentCalculations || {};
    const subtotal = calc.subtotal !== undefined ? calc.subtotal : this.cart.reduce((s, i) => s + (i.price * i.qty), 0);

    const result = await SwalHelpers.showPaymentModal(this.cart, calc, this.discountPercent);

    if (result.isConfirmed && result.value) {
      const isSeniorOrPwd = this.discountType === 'Senior' || this.discountType === 'PWD';
      const custType = isSeniorOrPwd ? this.discountType.toLowerCase() : 'regular';
      const discType = isSeniorOrPwd ? this.discountType : 'Regular';

      const salePayload = {
        items: this.cart.map(item => ({
          productId: item.productId,
          product_id: item.productId,
          id: item.productId,
          name: item.name,
          price: item.price,
          unit_price: item.price,
          qty: item.qty,
          quantity: item.qty,
          batchNo: item.selectedBatchNo || '',
          batch_no: item.selectedBatchNo || '',
          expiryDate: item.selectedExpiryDate || '',
          expiry_date: item.selectedExpiryDate || ''
        })),
        customer_type: custType,
        customerType: custType,
        customer_name: result.value.customerName || (isSeniorOrPwd ? (this.discountType + ' Customer') : 'Walk-in Customer'),
        customerName: result.value.customerName || (isSeniorOrPwd ? (this.discountType + ' Customer') : 'Walk-in Customer'),
        customer_id_no: isSeniorOrPwd ? (result.value.customerIdNo || '') : '',
        customerIdNo: isSeniorOrPwd ? (result.value.customerIdNo || '') : '',
        paymentMethod: result.value.paymentMethod,
        payment_method: result.value.paymentMethod,
        amountPaid: Number(result.value.amountPaid || 0),
        amount_paid: Number(result.value.amountPaid || 0),
        amount_tendered: Number(result.value.amountPaid || 0),
        change: Number(result.value.change || 0),
        subtotal: Number(result.value.subtotal || subtotal),
        discount: isSeniorOrPwd ? Number(result.value.discount || calc.discountVal || 0) : 0,
        discount_percent: isSeniorOrPwd ? 20 : 0,
        discount_type: discType,
        total: Number(result.value.total || 0),
        vatable_sales: Number(result.value.vatableSales ?? calc.vatableSales ?? 0),
        vat_amount: Number(result.value.vatAmount ?? calc.vatAmount ?? 0),
        vat_exempt_sales: Number(result.value.vatExemptSales ?? calc.vatExemptSales ?? 0),
        zero_rated_sales: Number(result.value.zeroRatedSales ?? 0)
      };

      try {
        const completedTxn = await window.mockApi.processSale(salePayload);

        // Normalize completedTxn structure with complete BIR Standard VAT metadata
        const receiptData = {
          id: completedTxn?.id || completedTxn?.invoice_no || ('INV-' + Date.now()),
          timestamp: completedTxn?.timestamp || completedTxn?.created_at || new Date().toLocaleString(),
          cashier: completedTxn?.cashier || 'Cashier',
          customerName: completedTxn?.customerName || completedTxn?.customer_name || salePayload.customer_name,
          customerType: completedTxn?.customerType || completedTxn?.customer_type || salePayload.customer_type,
          customerIdNo: completedTxn?.customerIdNo || completedTxn?.customer_id_no || salePayload.customer_id_no,
          items: Array.isArray(completedTxn?.items) && completedTxn.items.length > 0 ? completedTxn.items : salePayload.items,
          subtotal: Number(completedTxn?.subtotal ?? salePayload.subtotal),
          discount: Number(completedTxn?.discount ?? salePayload.discount),
          discountType: completedTxn?.discountType || completedTxn?.discount_type || salePayload.discount_type,
          total: Number(completedTxn?.total ?? salePayload.total),
          vatableSales: Number(completedTxn?.vatableSales ?? completedTxn?.vatable_sales ?? salePayload.vatable_sales),
          vatAmount: Number(completedTxn?.vatAmount ?? completedTxn?.vat_amount ?? salePayload.vat_amount),
          vatExemptSales: Number(completedTxn?.vatExemptSales ?? completedTxn?.vat_exempt_sales ?? salePayload.vat_exempt_sales),
          zeroRatedSales: Number(completedTxn?.zeroRatedSales ?? completedTxn?.zero_rated_sales ?? 0),
          paymentMethod: completedTxn?.paymentMethod || completedTxn?.payment_method || salePayload.paymentMethod,
          amountPaid: Number(completedTxn?.amountPaid ?? completedTxn?.amount_paid ?? salePayload.amountPaid),
          change: Number(completedTxn?.change ?? salePayload.change)
        };
        
        await this.refreshProducts();
        
        this.cart = [];
        this.updateCartUI();
        if (window.SoundFX && typeof window.SoundFX.playSuccess === 'function') {
          window.SoundFX.playSuccess();
        }

        const posCartPanel = document.getElementById('pos-cart-panel');
        if (posCartPanel) posCartPanel.classList.remove('mobile-active');

        if (window.appController) {
          await window.appController.refreshAllModules();
        }

        SwalHelpers.showReceiptModal(receiptData);

      } catch (err) {
        console.error('POS Checkout error:', err);
        Swal.fire('Error', err?.message || 'Failed to process sale transaction.', 'error');
      }
    }
  }
}

window.PosController = PosController;
