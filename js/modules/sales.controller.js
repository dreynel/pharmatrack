/**
 * PharmaTrack - Sales Logs & Transactions Controller
 * Xyra Andrea Pharmacy - Transaction Ledger & Thermal Receipt Archival
 */

class SalesController {
  constructor() {
    this.searchQuery = '';
    this.transactions = [];
    this.transactionsMap = new Map();
    this.boundListeners = false;
  }

  async init() {
    this.bindEvents();
    await this.render();
  }

  bindEvents() {
    if (this.boundListeners) return;

    // 1. Search Filter Listener
    const searchInput = document.getElementById('sales-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderTableRows();
      });
    }

    // 2. Refresh Button
    const refreshBtn = document.getElementById('btn-refresh-sales');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        const icon = refreshBtn.querySelector('i');
        if (icon) icon.classList.add('ri-spin');
        try {
          await this.render();
          if (window.SwalHelpers) {
            window.SwalHelpers.toast('Sales transactions updated', 'success');
          }
        } finally {
          refreshBtn.disabled = false;
          if (icon) icon.classList.remove('ri-spin');
        }
      });
    }

    // 3. Delegated Receipt and Return Click Handlers (prevents inline JSON injection bugs)
    const container = document.getElementById('sales-table-body');
    if (container) {
      container.addEventListener('click', (e) => {
        const receiptBtn = e.target.closest('.btn-view-receipt');
        if (receiptBtn) {
          const txnId = receiptBtn.dataset.id;
          if (txnId) this.viewReceipt(txnId);
          return;
        }

        const returnBtn = e.target.closest('.btn-process-return');
        if (returnBtn) {
          const txnId = returnBtn.dataset.id;
          if (txnId) this.processReturn(txnId);
          return;
        }
      });
    }

    this.boundListeners = true;
  }

  async render() {
    const container = document.getElementById('sales-table-body');
    if (!container) return;

    try {
      const txns = await window.mockApi.getTransactions();
      this.transactions = Array.isArray(txns) ? txns : [];
      this.transactionsMap.clear();

      for (const t of this.transactions) {
        if (t.id) this.transactionsMap.set(String(t.id), t);
        if (t.dbId) this.transactionsMap.set(String(t.dbId), t);
        if (t.invoice_no) this.transactionsMap.set(String(t.invoice_no), t);
      }

      this.renderTableRows();
    } catch (err) {
      console.error('[SalesController] Failed to render transactions:', err);
      container.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 2rem;"><i class="ri-error-warning-line" style="font-size: 1.5rem; display: block; margin-bottom: 0.3rem;"></i>Failed to load sales log: ${err.message || 'Server error'}</td></tr>`;
    }
  }

  renderTableRows() {
    const container = document.getElementById('sales-table-body');
    if (!container) return;

    if (!this.transactions || this.transactions.length === 0) {
      container.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-receipt-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No sales transactions recorded yet.</td></tr>`;
      return;
    }

    const filtered = this.searchQuery
      ? this.transactions.filter(t => {
          const q = this.searchQuery;
          const id = (t.id || '').toLowerCase();
          const cashier = (t.cashier || '').toLowerCase();
          const customer = (t.customerName || t.customer_name || '').toLowerCase();
          const payment = (t.paymentMethod || t.payment_method || '').toLowerCase();
          const ts = (t.timestamp || '').toLowerCase();
          return id.includes(q) || cashier.includes(q) || customer.includes(q) || payment.includes(q) || ts.includes(q);
        })
      : this.transactions;

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-search-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No transactions matching "${this.searchQuery}"</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(t => {
      const paymentMethod = t.paymentMethod || t.payment_method || 'Cash';
      let badgeClass = 'badge-info';
      if (paymentMethod.toLowerCase() === 'cash') badgeClass = 'badge-success';
      else if (paymentMethod.toLowerCase().includes('gcash')) badgeClass = 'badge-primary';
      else if (paymentMethod.toLowerCase().includes('maya')) badgeClass = 'badge-warning';

      const itemCount = t.items ? t.items.length : (t.items_count || 0);
      const customer = t.customerName || t.customer_name || 'Walk-in Customer';
      const customerType = t.customerType || t.customer_type || 'regular';
      const isDiscounted = customerType.toLowerCase() !== 'regular' || (t.discount && t.discount > 0);

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--primary); font-family: monospace; font-size: 0.95rem;">
              <i class="ri-file-text-line" style="margin-right: 2px;"></i>${t.id}
            </div>
          </td>
          <td style="font-size: 0.82rem; color: var(--text-muted, #64748b);">
            ${t.timestamp}
          </td>
          <td>
            <span style="font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px;">
              <i class="ri-user-smile-line" style="color: var(--primary);"></i> ${t.cashier}
            </span>
          </td>
          <td>
            <div style="font-size: 0.85rem; font-weight: 600;">${customer}</div>
            ${isDiscounted ? `<span style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; background: rgba(16, 185, 129, 0.12); color: #10b981; font-weight: 600;">${customerType.toUpperCase()}</span>` : ''}
          </td>
          <td>
            <span class="badge-pill badge-neutral" style="font-size: 0.78rem;">
              <i class="ri-shopping-bag-3-line"></i> ${itemCount} ${itemCount === 1 ? 'item' : 'items'}
            </span>
          </td>
          <td>
            <span class="badge-pill ${badgeClass}">
              ${paymentMethod}
            </span>
          </td>
          <td style="font-weight: 800; color: #10b981; font-size: 0.95rem;">
            ₱${parseFloat(t.total || 0).toFixed(2)}
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
              <button type="button" class="btn btn-sm btn-outline btn-view-receipt" data-id="${t.id}" title="View Official Receipt for ${t.id}">
                <i class="ri-file-paper-line"></i> Receipt
              </button>
              <button type="button" class="btn btn-sm btn-outline-warning btn-process-return" data-id="${t.id}" title="Process Customer Return / Refund for ${t.id}">
                <i class="ri-arrow-go-back-line"></i> Return
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async viewReceipt(txnOrId) {
    let txn = null;

    if (typeof txnOrId === 'string' || typeof txnOrId === 'number') {
      const key = String(txnOrId);
      txn = this.transactionsMap.get(key);

      // If txn not found in memory, or missing line items, fetch full details from API
      if (!txn || !Array.isArray(txn.items) || txn.items.length === 0) {
        try {
          if (window.mockApi && typeof window.mockApi.getTransactionById === 'function') {
            const fetched = await window.mockApi.getTransactionById(key);
            if (fetched) txn = fetched;
          }
        } catch (err) {
          console.warn('[SalesController] Could not fetch single transaction details:', err);
        }
      }
    } else if (typeof txnOrId === 'object' && txnOrId !== null) {
      txn = txnOrId;
      // If line items are missing from passed object, attempt fetch by ID
      if ((!Array.isArray(txn.items) || txn.items.length === 0) && (txn.id || txn.dbId)) {
        try {
          if (window.mockApi && typeof window.mockApi.getTransactionById === 'function') {
            const fetched = await window.mockApi.getTransactionById(txn.id || txn.dbId);
            if (fetched) txn = fetched;
          }
        } catch (err) {
          console.warn('[SalesController] Could not fetch single transaction details:', err);
        }
      }
    }

    if (!txn) {
      if (window.SwalHelpers) {
        window.SwalHelpers.toast('Receipt details could not be found.', 'error');
      } else {
        alert('Receipt details could not be found.');
      }
      return;
    }

    if (window.SwalHelpers && typeof window.SwalHelpers.showReceiptModal === 'function') {
      window.SwalHelpers.showReceiptModal(txn);
    }
  }

  async processReturn(txnOrId) {
    let txn = null;

    if (typeof txnOrId === 'string' || typeof txnOrId === 'number') {
      const key = String(txnOrId);
      txn = this.transactionsMap.get(key);

      if (!txn || !Array.isArray(txn.items) || txn.items.length === 0) {
        try {
          if (window.mockApi && typeof window.mockApi.getTransactionById === 'function') {
            const fetched = await window.mockApi.getTransactionById(key);
            if (fetched) txn = fetched;
          }
        } catch (err) {
          console.warn('[SalesController] Could not fetch single transaction for return:', err);
        }
      }
    } else if (typeof txnOrId === 'object' && txnOrId !== null) {
      txn = txnOrId;
      if ((!Array.isArray(txn.items) || txn.items.length === 0) && (txn.id || txn.dbId)) {
        try {
          if (window.mockApi && typeof window.mockApi.getTransactionById === 'function') {
            const fetched = await window.mockApi.getTransactionById(txn.id || txn.dbId);
            if (fetched) txn = fetched;
          }
        } catch (err) {
          console.warn('[SalesController] Could not fetch single transaction for return:', err);
        }
      }
    }

    if (!txn) {
      if (window.SwalHelpers) {
        window.SwalHelpers.toast('Transaction record could not be found.', 'error');
      } else {
        alert('Transaction record could not be found.');
      }
      return;
    }

    if (window.SwalHelpers && typeof window.SwalHelpers.showReturnModal === 'function') {
      window.SwalHelpers.showReturnModal(txn);
    }
  }
}

window.SalesController = SalesController;
