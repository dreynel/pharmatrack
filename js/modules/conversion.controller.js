/**
 * PharmaTrack - Item Conversion Controller
 * Xyra Andrea Pharmacy - Wholesale Bulk Unboxing & Repackaging into Retail UOM
 */

class ConversionController {
  constructor() {
    this.searchQuery = '';
  }

  async init() {
    this.bindEvents();
    await this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('conversion-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderHistoryTable();
      });
    }

    const openConvBtn = document.getElementById('btn-open-conversion-modal');
    if (openConvBtn) {
      openConvBtn.addEventListener('click', () => this.handleItemConversionModal());
    }
  }

  async render() {
    await this.renderQuickCards();
    await this.renderHistoryTable();
  }

  async renderQuickCards() {
    const products = await window.mockApi.getProducts();
    const cardsContainer = document.getElementById('conversion-quick-cards');
    if (!cardsContainer) return;

    const bulkProducts = products.filter(p => p.isBulk && p.childProductId);

    if (bulkProducts.length === 0) {
      cardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 1.5rem;">No linked bulk products found for conversion.</div>`;
      return;
    }

    cardsContainer.innerHTML = bulkProducts.map(bulk => {
      const retail = products.find(p => p.id === bulk.childProductId) || { name: 'Retail Unit', stock: 0, uom: 'Tablet' };
      const rate = bulk.conversionRate || 100;

      return `
        <div class="conversion-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span class="badge-pill badge-info" style="font-size: 0.7rem; margin-bottom: 0.4rem;">Bulk Pack Link</span>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0;">${bulk.name}</h4>
            </div>
            <span class="badge-pill badge-success" style="font-size: 0.75rem;">1 : ${rate}</span>
          </div>

          <div class="conversion-card-flow">
            <div class="conversion-flow-node">
              <strong>${bulk.stock} ${bulk.uom}</strong>
              <small>Wholesale Bulk</small>
            </div>
            <div class="conversion-arrow">➔</div>
            <div class="conversion-flow-node" style="text-align: right;">
              <strong style="color: #10b981;">${retail.stock} ${retail.uom}</strong>
              <small>${retail.name.split(' ')[0]} Retail</small>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-outline" style="flex: 1;" onclick="window.conversionController.handleItemConversionModal(${bulk.id})">
              <i class="ri-settings-4-line"></i> Custom
            </button>
            <button class="btn btn-sm btn-primary" style="flex: 1;" onclick="window.conversionController.quickUnboxOne(${bulk.id})">
              <i class="ri-inbox-unarchive-line"></i> Unbox 1 Box
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  async renderHistoryTable() {
    const logs = await window.mockApi.getConversionLogs();
    const tableContainer = document.getElementById('conversion-table-body');
    if (!tableContainer) return;

    const filtered = logs.filter(l => {
      const q = this.searchQuery.toLowerCase();
      return l.id.toLowerCase().includes(q) ||
             l.sourceProductName.toLowerCase().includes(q) ||
             l.targetProductName.toLowerCase().includes(q) ||
             l.operator.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      tableContainer.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-history-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No conversion operations logged.</td></tr>`;
      return;
    }

    tableContainer.innerHTML = filtered.map(log => `
      <tr>
        <td><strong style="color: var(--primary);">${log.id}</strong></td>
        <td>${log.date}</td>
        <td>
          <span class="badge-pill badge-warning" style="font-weight: 700;">-${log.sourceQty} ${log.sourceUom || 'Box'}</span><br>
          <small style="color: var(--text-main); font-weight: 600;">${log.sourceProductName}</small>
        </td>
        <td>
          <span class="badge-pill badge-success" style="font-weight: 700;">+${log.targetQty} ${log.targetUom || 'Tablet'}</span><br>
          <small style="color: var(--text-main); font-weight: 600;">${log.targetProductName}</small>
        </td>
        <td><span class="badge-pill badge-info">1 : ${log.multiplier}</span></td>
        <td>
          <code>${log.batchNo || 'N/A'}</code><br>
          <small style="color: var(--text-muted);">${log.expiryDate || 'N/A'}</small>
        </td>
        <td>${log.operator}</td>
        <td><small style="color: var(--text-muted);">${log.notes || 'N/A'}</small></td>
      </tr>
    `).join('');
  }

  async quickUnboxOne(bulkId) {
    const products = await window.mockApi.getProducts();
    const bulk = products.find(p => p.id === bulkId);
    if (!bulk) return;

    if (bulk.stock < 1) {
      SwalHelpers.toast(`${bulk.name} is out of stock!`, 'error');
      return;
    }

    const retail = products.find(p => p.id === bulk.childProductId);
    if (!retail) {
      SwalHelpers.toast('No linked retail product found', 'error');
      return;
    }

    const rate = bulk.conversionRate || 100;

    const confirm = await Swal.fire({
      title: '📦 Unbox 1 Bulk Container?',
      html: `
        <div style="text-align: left;">
          <p>You are about to unbox:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.8rem;">
            <strong>-1 ${bulk.uom}</strong> of ${bulk.name}<br>
            <span style="color: #10b981; font-weight: bold;">+${rate} ${retail.uom}</span> to ${retail.name}
          </div>
          <small style="color: #64748b;">Batch ${bulk.batchNo} and Expiry ${bulk.expiryDate} will be preserved.</small>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm Unbox',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      await window.mockApi.processItemConversion({
        sourceProductId: bulk.id,
        targetProductId: retail.id,
        sourceQty: 1,
        operator: 'Xyra Andrea (Pharmacist)',
        notes: `Quick 1-box conversion (+${rate} ${retail.uom})`
      });

      SwalHelpers.toast(`Unboxed 1 Box into +${rate} ${retail.uom}!`, 'success');
      if (window.appController) {
        await window.appController.refreshAllModules();
      }
    }
  }

  async handleItemConversionModal(preselectedId = null) {
    const products = await window.mockApi.getProducts();

    const result = await SwalHelpers.showItemConversionModal(products, preselectedId);
    if (result && result.isConfirmed && result.value) {
      await window.mockApi.processItemConversion(result.value);
      SwalHelpers.toast('Item converted successfully!', 'success');
      if (window.appController) {
        await window.appController.refreshAllModules();
      }
    }
  }
}

window.ConversionController = ConversionController;

