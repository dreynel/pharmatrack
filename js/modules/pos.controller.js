/**
 * PharmaTrack - Point of Sale (POS) Controller
 * Xyra Andrea Pharmacy - Fast Dispensing, Barcode Scan, Thermal Receipts
 */

class PosController {
  constructor() {
    this.cart = [];
    this.activeCategory = 'All';
    this.discountPercent = 0;
    this.products = [];
  }

  async init() {
    this.products = await window.mockApi.getProducts();
    this.renderCategoryPills();
    this.renderProductsGrid();
    this.bindEvents();
    this.updateCartUI();
  }

  bindEvents() {
    const searchInput = document.getElementById('pos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        this.renderProductsGrid(query);
      });
    }

    const discountSelect = document.getElementById('pos-discount-select');
    if (discountSelect) {
      discountSelect.addEventListener('change', (e) => {
        this.discountPercent = parseFloat(e.target.value) || 0;
        this.updateCartUI();
      });
    }

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (this.cart.length === 0) return;
        this.cart = [];
        this.updateCartUI();
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

  renderCategoryPills() {
    const categories = ['All', ...new Set(this.products.map(p => p.category))];
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    container.innerHTML = categories.map(cat => `
      <button class="cat-btn ${cat === this.activeCategory ? 'active' : ''}" data-cat="${cat}">
        ${cat}
      </button>
    `).join('');

    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeCategory = e.target.getAttribute('data-cat');
        container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.renderProductsGrid();
      });
    });
  }

  async render() {
    await this.refreshProducts();
  }

  async refreshProducts() {
    this.products = await window.mockApi.getProducts();
    this.renderCategoryPills();
    this.renderProductsGrid();
  }

  renderProductsGrid(query = '') {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    const filtered = this.products.filter(p => {
      const matchesCat = this.activeCategory === 'All' || p.category === this.activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(query) || 
                            p.genericName.toLowerCase().includes(query) || 
                            p.barcode.includes(query);
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">
          <i class="ri-search-line" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: #94a3b8;"></i>
          <p>No medicines found matching criteria.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(product => {
      let badgeClass = 'badge-success';
      if (product.stock <= 0) badgeClass = 'badge-danger';
      else if (product.stock <= product.reorderPoint) badgeClass = 'badge-warning';

      let iconClass = 'ri-capsule-fill';
      if (product.category === 'Antibiotics') iconClass = 'ri-medicine-bottle-fill';
      else if (product.category === 'Vitamins & Supplements') iconClass = 'ri-heart-pulse-fill';
      else if (product.category === 'First Aid') iconClass = 'ri-first-aid-kit-fill';
      else if (product.category === 'Respiratory') iconClass = 'ri-health-book-fill';

      return `
        <div class="product-card" data-id="${product.id}">
          <div class="product-header-row">
            <div class="product-avatar">
              <i class="${iconClass}"></i>
            </div>
            <span class="badge-pill ${badgeClass} product-badge">${product.status}</span>
          </div>

          <div class="product-info">
            <h4>${product.name}</h4>
            <p>${product.genericName}</p>
          </div>

          <div class="product-price-row">
            <div>
              <div class="product-price">₱${product.unitPrice.toFixed(2)}</div>
              <div style="font-size: 0.73rem; color: var(--text-muted); font-weight: 600;">Stock: ${product.stock} ${product.uom || 'units'}</div>
            </div>
            <div class="product-add-btn" title="Add to Sale">
              <i class="ri-add-line"></i>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.getAttribute('data-id'));
        this.addToCart(id);
      });
    });
  }

  scanBarcode(barcode) {
    const product = this.products.find(p => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase());
    if (product) {
      this.addToCart(product.id);
      SwalHelpers.toast(`Scanned: ${product.name}`, 'success');
    } else {
      SwalHelpers.toast(`Barcode ${barcode} not found`, 'error');
    }
  }

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      SwalHelpers.toast(`${product.name} is Out of Stock!`, 'error');
      return;
    }

    const existingItem = this.cart.find(item => item.productId === productId);
    if (existingItem) {
      if (existingItem.qty >= product.stock) {
        SwalHelpers.toast(`Cannot exceed available stock (${product.stock} ${product.uom || 'units'})`, 'warning');
        return;
      }
      existingItem.qty += 1;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.unitPrice,
        qty: 1
      });
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
      if (newQty > product.stock) {
        SwalHelpers.toast(`Only ${product.stock} units available in stock`, 'warning');
        return;
      }
      item.qty = newQty;
      this.updateCartUI();
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.productId !== productId);
    this.updateCartUI();
  }

  updateCartUI() {
    const container = document.getElementById('pos-cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount-val');
    const totalEl = document.getElementById('cart-total');
    const countBadge = document.getElementById('cart-count-badge');
    const checkoutBtn = document.getElementById('checkout-btn');

    const mobileCountEl = document.getElementById('mobile-cart-items-count');
    const mobileTotalEl = document.getElementById('mobile-cart-total-val');

    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
          <i class="ri-shopping-bag-line" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: #94a3b8;"></i>
          <p style="font-size: 0.88rem;">Cart is empty.<br>Select items on the left to add to sale.</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.innerText = '₱0.00';
      if (discountEl) discountEl.innerText = '-₱0.00';
      if (totalEl) totalEl.innerText = '₱0.00';
      if (countBadge) countBadge.innerText = '0 items';
      if (checkoutBtn) checkoutBtn.disabled = true;

      if (mobileCountEl) mobileCountEl.innerText = '0 items in cart';
      if (mobileTotalEl) mobileTotalEl.innerText = '₱0.00';
      return;
    }

    let subtotal = 0;
    let totalQty = 0;

    container.innerHTML = this.cart.map(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      totalQty += item.qty;

      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <h5>${item.name}</h5>
            <span>₱${item.price.toFixed(2)} × ${item.qty} = ₱${itemTotal.toFixed(2)}</span>
          </div>
          <div class="cart-qty-controls">
            <button onclick="window.posController.updateQty(${item.productId}, -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="window.posController.updateQty(${item.productId}, 1)">+</button>
            <button onclick="window.posController.removeFromCart(${item.productId})" style="background: rgba(239,68,68,0.12); color: #ef4444; border-color: rgba(239,68,68,0.2); margin-left: 0.2rem;">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    const discountVal = (subtotal * this.discountPercent) / 100;
    const finalTotal = Math.max(0, subtotal - discountVal);

    if (subtotalEl) subtotalEl.innerText = `₱${subtotal.toFixed(2)}`;
    if (discountEl) discountEl.innerText = `-₱${discountVal.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `₱${finalTotal.toFixed(2)}`;
    if (countBadge) countBadge.innerText = `${totalQty} items`;
    if (checkoutBtn) checkoutBtn.disabled = false;

    if (mobileCountEl) mobileCountEl.innerText = `${totalQty} items in cart`;
    if (mobileTotalEl) mobileTotalEl.innerText = `₱${finalTotal.toFixed(2)}`;
  }

  async handleCheckout() {
    if (this.cart.length === 0) return;

    let subtotal = 0;
    this.cart.forEach(i => subtotal += (i.price * i.qty));

    const result = await SwalHelpers.showPaymentModal(this.cart, subtotal, this.discountPercent);

    if (result.isConfirmed && result.value) {
      const salePayload = {
        items: this.cart,
        ...result.value
      };

      try {
        const completedTxn = await window.mockApi.processSale(salePayload);
        
        await this.refreshProducts();
        
        this.cart = [];
        this.updateCartUI();

        const posCartPanel = document.getElementById('pos-cart-panel');
        if (posCartPanel) posCartPanel.classList.remove('mobile-active');

        if (window.appController) {
          await window.appController.refreshAllModules();
        }

        SwalHelpers.showReceiptModal(completedTxn);

      } catch (err) {
        Swal.fire('Error', 'Failed to process sale transaction.', 'error');
      }
    }
  }
}

window.PosController = PosController;

