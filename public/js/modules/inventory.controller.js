/**
 * PharmaTrack - Inventory Catalog Controller
 * Xyra Andrea Pharmacy - Stock Catalog, UOM, Batch & Expiry Management
 */

class InventoryController {
  constructor() {
    this.searchQuery = '';
  }

  async init() {
    this.bindEvents();
    await this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('inventory-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
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
  }

  async render() {
    const products = await window.mockApi.getProducts();
    const container = document.getElementById('inventory-table-body');
    if (!container) return;

    const filtered = products.filter(p => {
      const q = this.searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             p.genericName.toLowerCase().includes(q) ||
             p.sku.toLowerCase().includes(q) ||
             (p.batchNo && p.batchNo.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-inbox-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No medicines found in inventory catalog.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(p => {
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
          <td><code>${p.batchNo || 'N/A'}</code></td>
          <td>${p.expiryDate || 'N/A'}</td>
          <td><span class="badge-pill ${badgeClass}">${p.status}</span></td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-sm btn-outline" title="Restock Stock" onclick="window.inventoryController.quickRestock(${p.id})">
                <i class="ri-add-line"></i> Restock
              </button>
              ${p.isBulk ? `
                <button class="btn btn-sm btn-primary" title="Unbox / Convert" onclick="window.conversionController.handleItemConversionModal(${p.id})">
                  <i class="ri-swap-line"></i> Unbox
                </button>
              ` : ''}
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
      }
    }
  }
}

window.InventoryController = InventoryController;

