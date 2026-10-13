/**
 * PharmaTrack - Sales Logs & Transactions Controller
 * Xyra Andrea Pharmacy - Transaction Ledger & Thermal Receipt Archival
 */

class SalesController {
  constructor() {
    this.searchQuery = '';
  }

  async init() {
    await this.render();
  }

  async render() {
    const txns = await window.mockApi.getTransactions();
    const container = document.getElementById('sales-table-body');
    if (!container) return;

    if (txns.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-receipt-line" style="font-size: 1.8rem; display: block; margin-bottom: 0.3rem;"></i>No sales transactions recorded yet.</td></tr>`;
      return;
    }

    container.innerHTML = txns.map(t => `
      <tr>
        <td><strong style="color: var(--primary);">${t.id}</strong></td>
        <td>${t.timestamp}</td>
        <td>${t.cashier}</td>
        <td>${t.items ? t.items.length : 0} items</td>
        <td><span class="badge-pill badge-info">${t.paymentMethod}</span></td>
        <td style="font-weight: 800; color: #10b981;">₱${parseFloat(t.total || 0).toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick='window.salesController.viewReceipt(${JSON.stringify(t)})'>
            <i class="ri-file-paper-line"></i> View Receipt
          </button>
        </td>
      </tr>
    `).join('');
  }

  viewReceipt(txn) {
    SwalHelpers.showReceiptModal(txn);
  }
}

window.SalesController = SalesController;

