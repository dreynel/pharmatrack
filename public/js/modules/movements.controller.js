/**
 * PharmaTrack - Stock Movements Ledger Controller
 * Xyra Andrea Pharmacy - Consolidated Inventory Movement Audit Trail
 */

class MovementsController {
  constructor() {
    this.filterType = 'ALL';
    this.searchQuery = '';
  }

  async init() {
    this.bindEvents();
    await this.render();
  }

  bindEvents() {
    const movSearch = document.getElementById('movement-search-input');
    const movFilter = document.getElementById('movement-type-filter');

    if (movSearch) {
      movSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    if (movFilter) {
      movFilter.addEventListener('change', (e) => {
        this.filterType = e.target.value;
        this.render();
      });
    }
  }

  async render() {
    const movements = await window.mockApi.getStockMovements();
    const container = document.getElementById('movement-table-body');
    if (!container) return;

    const filtered = movements.filter(m => {
      const matchType = this.filterType === 'ALL' || m.type === this.filterType;
      const q = this.searchQuery.toLowerCase();
      const matchSearch = m.productName.toLowerCase().includes(q) ||
                          m.referenceId.toLowerCase().includes(q) ||
                          m.remarks.toLowerCase().includes(q);
      return matchType && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-history-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No stock movements found matching criteria.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(m => {
      let badgeClass = 'badge-stockin';
      let typeLabel = 'STOCK IN';

      if (m.type === 'STOCK_OUT') {
        badgeClass = 'badge-stockout';
        typeLabel = 'STOCK OUT';
      } else if (m.type === 'POS_SALE') {
        badgeClass = 'badge-sale';
        typeLabel = 'POS SALE';
      } else if (m.type === 'CONVERT_IN') {
        badgeClass = 'badge-convert-in';
        typeLabel = 'CONVERT IN';
      } else if (m.type === 'CONVERT_OUT') {
        badgeClass = 'badge-convert-out';
        typeLabel = 'CONVERT OUT';
      }

      const isPositive = m.qtyChange > 0;
      const changeColor = isPositive ? '#10b981' : '#ef4444';
      const changePrefix = isPositive ? '+' : '';

      return `
        <tr>
          <td><code style="font-weight: bold; color: var(--text-muted);">${m.id}</code></td>
          <td>${m.timestamp}</td>
          <td><strong>${m.productName}</strong></td>
          <td><span class="badge-pill ${badgeClass}">${typeLabel}</span></td>
          <td>${m.previousStock}</td>
          <td><strong style="color: ${changeColor}; font-size: 0.95rem;">${changePrefix}${m.qtyChange}</strong></td>
          <td><strong>${m.newStock}</strong></td>
          <td><code style="color: var(--primary); font-weight: bold;">${m.referenceId}</code></td>
          <td><small style="color: var(--text-muted);">${m.remarks}</small></td>
        </tr>
      `;
    }).join('');
  }
}

window.MovementsController = MovementsController;

