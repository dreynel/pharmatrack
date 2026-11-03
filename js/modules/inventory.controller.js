/**
 * PharmaTrack - Inventory Catalog Controller
 * Xyra Andrea Pharmacy - Stock Catalog, UOM, Batch, Expiry & Paginated Management
 */

class InventoryController {
  constructor() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.pageSize = parseInt(localStorage.getItem('inv_page_size'), 10) || 8;
  }

  async init() {
    if (!this.eventsBound) {
      this.bindEvents();
      this.eventsBound = true;
    }
    await this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('inventory-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }

    const addProductBtn = document.getElementById('add-medicine-btn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', async () => {
        const result = await SwalHelpers.showAddProductModal();
        if (result.isConfirmed && result.value) {
          await window.mockApi.addProduct(result.value);
          SwalHelpers.toast('New medicine registered in catalog!', 'success');
          if (window.appController) {
            await window.appController.refreshAllModules();
          }
        }
      });
    }

    const quickConvertShortcut = document.getElementById('btn-quick-convert-shortcut');
    if (quickConvertShortcut) {
      quickConvertShortcut.addEventListener('click', () => {
        if (window.appController) {
          window.appController.navigateTo('conversion');
        }
      });
    }

    const manageCategoriesBtn = document.getElementById('btn-manage-categories');
    if (manageCategoriesBtn) {
      manageCategoriesBtn.addEventListener('click', () => this.manageCategoriesModal());
    }

    const manageUomsBtn = document.getElementById('btn-manage-uoms');
    if (manageUomsBtn) {
      manageUomsBtn.addEventListener('click', () => this.manageUomsModal());
    }
  }

  goToPage(page) {
    this.currentPage = Math.max(1, page);
    this.render();
  }

  setPageSize(newSize) {
    const parsed = parseInt(newSize, 10) || 8;
    this.pageSize = parsed;
    localStorage.setItem('inv_page_size', parsed);
    this.currentPage = 1;
    this.render();
  }

  renderPagination(totalItems, totalPages, startIdx, endIdx) {
    const bar = document.getElementById('inventory-pagination-bar');
    if (!bar) return;

    if (totalItems === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';
    const sizes = [6, 8, 12, 25, 100];

    let pageButtons = '';
    for (let p = 1; p <= totalPages; p++) {
      pageButtons += `
        <button type="button" class="pos-page-btn ${p === this.currentPage ? 'active' : ''}" onclick="window.inventoryController.goToPage(${p})">
          ${p}
        </button>
      `;
    }

    bar.innerHTML = `
      <div class="pos-page-info">
        <span>Showing <strong>${startIdx + 1}–${endIdx}</strong> of <strong>${totalItems}</strong> medicines</span>
        <div class="pos-page-size-wrap">
          <label for="inv-page-size-select">Show:</label>
          <select id="inv-page-size-select" class="pos-page-size-select" onchange="window.inventoryController.setPageSize(this.value)">
            ${sizes.map(s => `<option value="${s}" ${this.pageSize === s ? 'selected' : ''}>${s === 100 ? 'All' : s + ' / page'}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="pos-page-controls">
        <button type="button" class="pos-page-btn" onclick="window.inventoryController.goToPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>
          <i class="ri-arrow-left-s-line"></i> Prev
        </button>
        ${pageButtons}
        <button type="button" class="pos-page-btn" onclick="window.inventoryController.goToPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>
          Next <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>
    `;
  }

  async render() {
    const products = await window.mockApi.getProducts();
    const container = document.getElementById('inventory-table-body');
    if (!container) return;

    const filtered = products.filter(p => {
      const q = this.searchQuery.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || 
             (p.genericName || '').toLowerCase().includes(q) ||
             (p.sku || '').toLowerCase().includes(q) ||
             (p.batchNo && p.batchNo.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-inbox-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No medicines found in inventory catalog.</td></tr>`;
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

    container.innerHTML = pageItems.map(p => {
      let badgeClass = 'badge-success';
      if (p.stock <= 0) badgeClass = 'badge-danger';
      else if (p.stock <= p.reorderPoint) badgeClass = 'badge-warning';

      const isBulkPill = p.isBulk ? `<span class="badge-pill badge-info" style="font-size: 0.7rem; margin-left: 4px;">BULK</span>` : '';

      return `
        <tr>
          <td><code style="color: var(--primary); font-weight: bold;">${p.sku}</code></td>
          <td>
            <strong>${p.name}</strong> ${isBulkPill}<br>
            <small style="color: var(--text-muted);">${p.genericName}</small>
          </td>
          <td><span class="badge-pill badge-info">${p.category}</span></td>
          <td><strong style="color: #475569;">${p.uom || 'Tablet'}</strong></td>
          <td>
            <strong>₱${p.unitPrice.toFixed(2)}</strong><br>
            <small style="color: var(--text-muted);">Cost: ₱${p.costPrice.toFixed(2)}</small>
          </td>
          <td>
            <strong style="font-size: 0.95rem;">${p.stock}</strong> <span style="font-size: 0.78rem; color: #64748b;">${p.uom || 'units'}</span>
          </td>
          <td><span class="badge-pill ${badgeClass}">${p.status}</span></td>
          <td>
            <div style="display: flex; gap: 0.35rem; align-items: center;">
              <button class="btn btn-sm btn-outline" title="Restock Stock" onclick="window.inventoryController.quickRestock(${p.id})">
                <i class="ri-add-line"></i> Restock
              </button>
              ${p.isBulk ? `
                <button class="btn btn-sm btn-primary" title="Unbox / Convert" onclick="window.conversionController.handleItemConversionModal(${p.id})">
                  <i class="ri-swap-line"></i> Unbox
                </button>
              ` : ''}
              <button class="btn btn-sm btn-outline" title="Edit Medicine" onclick="window.inventoryController.editProductModal(${p.id})" style="padding: 0.25rem 0.45rem; color: #0284c7; border-color: #cbd5e1;">
                <i class="ri-edit-line"></i>
              </button>
              <button class="btn btn-sm btn-outline" title="Delete Medicine" onclick="window.inventoryController.deleteProductConfirm(${p.id})" style="padding: 0.25rem 0.45rem; color: #ef4444; border-color: #cbd5e1;">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async quickRestock(productId) {
    const product = await window.mockApi.getProductById(productId);
    if (!product) return;

    const result = await SwalHelpers.showRestockModal(product);
    if (result.isConfirmed && result.value) {
      await window.mockApi.updateProductStock(productId, result.value);
      SwalHelpers.toast(`Added +${result.value} ${product.uom || 'units'} to ${product.name}`, 'success');
      if (window.appController) {
        await window.appController.refreshAllModules();
      } else {
        await this.render();
      }
    }
  }

  async manageCategoriesModal(force = false) {
    await SwalHelpers.showManageCategoriesModal(force);
    await this.render();
  }

  async manageUomsModal(force = false) {
    await SwalHelpers.showManageUomsModal(force);
    await this.render();
  }

  async editProductModal(productId) {
    const product = await window.mockApi.getProductById(productId);
    if (!product) return;

    const result = await SwalHelpers.showEditProductModal(product);
    if (result.isConfirmed && result.value) {
      try {
        await window.mockApi.updateProduct(productId, result.value);
        SwalHelpers.toast(`Medicine '${product.name}' updated successfully!`, 'success');
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        Swal.fire('Update Failed', err?.message || 'Could not update medicine', 'error');
      }
    }
  }

  async deleteProductConfirm(productId) {
    const product = await window.mockApi.getProductById(productId);
    if (!product) return;

    const confirmed = await SwalHelpers.confirm(
      `Delete "${product.name}"?`,
      `Are you sure you want to remove this medicine (${product.sku}) from the catalog? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const res = await window.mockApi.deleteProduct(productId);
        if (res && res.error) {
          Swal.fire('Delete Failed', res.error, 'error');
        } else {
          SwalHelpers.toast(`Medicine '${product.name}' removed from catalog.`, 'success');
          if (window.appController) {
            await window.appController.refreshAllModules();
          } else {
            await this.render();
          }
        }
      } catch (err) {
        Swal.fire('Delete Failed', err?.message || 'Could not delete product', 'error');
      }
    }
  }
}

window.InventoryController = InventoryController;
