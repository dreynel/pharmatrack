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
    if (!this.eventsBound) {
      this.bindEvents();
      this.eventsBound = true;
    }
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
      const txCode = (m.transactionCode || m.type || '').toUpperCase();
      const filterVal = (this.filterType || 'ALL').toUpperCase();
      const matchType = filterVal === 'ALL' || txCode === filterVal;
      const q = this.searchQuery.toLowerCase();
      const matchSearch = (m.productName || '').toLowerCase().includes(q) ||
                          (m.referenceNo || m.referenceId || '').toLowerCase().includes(q) ||
                          (m.transactionCode || '').toLowerCase().includes(q) ||
                          (m.entryNo || m.id || '').toLowerCase().includes(q) ||
                          (m.remarks || '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-history-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No inventory ledger entries found matching criteria.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(m => {
      const txCode = m.transactionCode || m.type || 'StockIn';
      const qty = Number(m.quantity ?? (m.impact ?? (m.qtyChange ?? 0)));
      const isPositive = qty > 0;
      const isNegative = qty < 0;

      let badgeClass = 'badge-stockin';
      let typeLabel = txCode;

      const upper = txCode.toUpperCase();
      if (upper === 'POS' || upper === 'POS_SALE') {
        badgeClass = 'badge-sale';
        typeLabel = 'POS';
      } else if (upper === 'STOCKIN' || upper === 'STOCK_IN') {
        badgeClass = 'badge-stockin';
        typeLabel = 'StockIn';
      } else if (upper === 'STOCKOUT' || upper === 'STOCK_OUT') {
        badgeClass = 'badge-stockout';
        typeLabel = 'StockOut';
      } else if (upper === 'CONVERSION' || upper === 'CONVERT_IN' || upper === 'CONVERT_OUT') {
        badgeClass = isPositive ? 'badge-convert-in' : 'badge-convert-out';
        typeLabel = 'Conversion';
      } else if (upper === 'OPENINGBALANCE') {
        badgeClass = 'badge-stockin';
        typeLabel = 'OpeningBalance';
      } else if (upper === 'ADJUSTMENT') {
        badgeClass = isPositive ? 'badge-convert-in' : 'badge-stockout';
        typeLabel = 'Adjustment';
      }

      const changeColor = isPositive ? '#10b981' : (isNegative ? '#ef4444' : '#64748b');
      const changePrefix = isPositive ? '+' : '';
      const batchDisplay = (m.batchNo || m.batch_no) ? `
        <span class="badge-pill" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; font-weight: 700; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
          <i class="ri-barcode-box-line"></i> ${m.batchNo || m.batch_no}
        </span>
        ${(m.expiryDate || m.expiry_date) ? `<div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;"><i class="ri-calendar-line"></i> Exp: ${m.expiryDate || m.expiry_date}</div>` : ''}
      ` : `<span style="color: #94a3b8; font-size: 0.75rem;">—</span>`;

      return `
        <tr>
          <td><code style="font-weight: bold; color: var(--text-muted);">${m.entryNo || m.id}</code></td>
          <td>${m.timestamp}</td>
          <td><strong>${m.productName}</strong></td>
          <td>${batchDisplay}</td>
          <td><span class="badge-pill ${badgeClass}">${typeLabel}</span></td>
          <td>${m.previousBalance ?? m.previousStock}</td>
          <td><strong style="color: ${changeColor}; font-size: 0.95rem;">${changePrefix}${qty}</strong></td>
          <td><strong>${m.runningBalance ?? m.newStock}</strong></td>
          <td><code style="color: var(--primary); font-weight: bold;">${m.referenceNo || m.referenceId}</code></td>
          <td><small style="color: var(--text-muted);">${m.remarks}</small></td>
        </tr>
      `;
    }).join('');
  }
}

window.MovementsController = MovementsController;

