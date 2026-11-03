/**
 * PharmaTrack - Stock Out (Disposals & Write-Offs) Controller
 * Xyra Andrea Pharmacy - Expired, Damaged, and Pulled-Out Medication Tracking
 * 2-Panel Split Architecture:
 *   - Right Panel: Main Record (Parent Disposal Vouchers List)
 *   - Left Panel: Details per Parent (Itemized Children Batches & Disposal Slip)
 * Responsive, Instant On-Click Children Display & Full Parent CRUD
 */

class StockOutController {
  constructor() {
    this.searchQuery = '';
    this.selectedLogId = null;
    this.currentLogs = [];
    this.isInitialized = false;
  }

  async init() {
    if (!this.isInitialized) {
      this.bindEvents();
      this.isInitialized = true;
    }
    await this.render();
  }

  bindEvents() {
    const searchInput = document.getElementById('stockout-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const openStockOutBtn = document.getElementById('btn-open-stockout-modal');
    if (openStockOutBtn) {
      openStockOutBtn.addEventListener('click', () => this.handleStockOutModal());
    }
  }

  async render() {
    const logs = await window.mockApi.getStockOutLogs();
    const container = document.getElementById('stockout-table-body');
    const docContainer = document.getElementById('stockout-document-container');
    if (!container) return;

    // Mini KPIs
    const totalCount = logs.length;
    let expiredUnits = 0;
    let clinicUnits = 0;

    logs.forEach(l => {
      const reasonLower = (l.reason || '').toLowerCase();
      const units = (l.items || []).reduce((acc, i) => acc + Number(i.quantity ?? i.qty ?? 0), 0);
      if (reasonLower.includes('expired')) {
        expiredUnits += units;
      } else if (reasonLower.includes('clinic') || reasonLower.includes('internal')) {
        clinicUnits += units;
      }
    });

    const countKpi = document.getElementById('stkout-kpi-count');
    const expKpi = document.getElementById('stkout-kpi-expired');
    const clinicKpi = document.getElementById('stkout-kpi-clinic');

    if (countKpi) countKpi.innerText = totalCount;
    if (expKpi) expKpi.innerText = `${expiredUnits} units`;
    if (clinicKpi) clinicKpi.innerText = `${clinicUnits} units`;

    const filtered = logs.filter(l => {
      const q = this.searchQuery;
      if (!q) return true;
      const ref = (l.ref_no || l.refNo || '').toLowerCase();
      const reason = (l.reason || '').toLowerCase();
      const auth = (l.authorized_by || l.authorizedBy || '').toLowerCase();
      return ref.includes(q) || reason.includes(q) || auth.includes(q);
    });

    this.currentLogs = filtered;

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5">No documents found.</td></tr>`;
      if (docContainer) {
        docContainer.innerHTML = `
          <div class="doc-empty-state">
            <i class="ri-file-text-line"></i>
            <h4>No Document Selected</h4>
            <p>Select a document from the list on the left.</p>
          </div>
        `;
      }
      return;
    }

    const hasSelection = filtered.some(l => String(l.id || l.ref_no || l.refNo) === String(this.selectedLogId));
    if (!hasSelection) {
      this.selectedLogId = filtered[0].id || filtered[0].ref_no || filtered[0].refNo;
    }

    // Left Panel: Clean 4-column Parent Documents List
    container.innerHTML = filtered.map(log => {
      const logKey = log.id || log.ref_no || log.refNo;
      const isSelected = String(logKey) === String(this.selectedLogId);
      const items = log.items || [];
      const refNo = log.ref_no || log.refNo || 'N/A';
      const reason = log.reason || 'Disposal';
      const totalLossValuation = log.total_loss_cost != null ? Number(log.total_loss_cost) : (log.total_amount != null ? Number(log.total_amount) : items.reduce((acc, i) => acc + (Number(i.quantity ?? i.qty ?? 0) * Number(i.cost_price ?? i.costPrice ?? i.cost ?? 0)), 0));

      return `
        <tr class="stock-selectable-row ${isSelected ? 'active-stockout-row' : ''}" 
            data-log-id="${logKey}"
            onclick="window.stockOutController.selectRecord('${logKey}')">
          <td>
            <div class="font-monospace fw-bold text-dark">${this.escapeHtml(refNo)}</div>
            <small class="text-muted">${this.escapeHtml(log.date)}</small>
          </td>
          <td>
            <div class="text-truncate" style="max-width: 150px;" title="${this.escapeHtml(reason)}">
              ${this.escapeHtml(reason)}
            </div>
          </td>
          <td class="text-center text-muted">${items.length}</td>
          <td class="text-end fw-semibold text-nowrap">
            ₱${totalLossValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    }).join('');

    // Right Panel: Minimal Short Bond Paper Document Sheet
    const activeLog = filtered.find(l => String(l.id || l.ref_no || l.refNo) === String(this.selectedLogId)) || filtered[0];
    this.renderDocumentSlip(activeLog);
  }

  selectRecord(id) {
    if (String(this.selectedLogId) === String(id)) return;
    this.selectedLogId = id;

    const tableBody = document.getElementById('stockout-table-body');
    if (tableBody) {
      tableBody.querySelectorAll('tr.stock-selectable-row').forEach(row => {
        const rowId = row.getAttribute('data-log-id');
        row.classList.toggle('active-stockout-row', String(rowId) === String(id));
      });
    }

    const selectedLog = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(id));
    if (selectedLog) {
      this.renderDocumentSlip(selectedLog);
    }
  }

  renderDocumentSlip(log) {
    const container = document.getElementById('stockout-document-container');
    if (!container) return;

    if (!log) {
      container.innerHTML = `
        <div class="doc-empty-state">
          <i class="ri-file-text-line"></i>
          <h4>No Document Selected</h4>
          <p>Select a document from the list on the left.</p>
        </div>
      `;
      return;
    }

    const items = log.items || [];
    const totalItems = items.length;
    const totalUnits = items.reduce((acc, i) => acc + Number(i.quantity ?? i.qty ?? 0), 0);
    const refNo = log.ref_no || log.refNo || 'N/A';
    const reason = log.reason || 'Disposal';
    const date = log.date || 'N/A';
    const authorizedBy = log.authorized_by || log.authorizedBy || 'Pharmacist';
    const notes = log.notes || log.remarks || '';
    const logKey = log.id || log.ref_no || log.refNo;

    let totalLossValuation = 0;

    const itemsRows = items.map(item => {
      const name = item.product_name || item.name || 'Unnamed Product';
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const cost = Number(item.cost_price ?? item.costPrice ?? item.cost ?? 0);
      const batchNo = item.batch_no || item.batchNo || 'N/A';
      const lineTotal = qty * cost;
      totalLossValuation += lineTotal;

      return `
        <tr>
          <td>
            <div class="fw-semibold text-dark">${this.escapeHtml(name)}</div>
            <small class="text-muted">Batch: ${this.escapeHtml(batchNo)}</small>
          </td>
          <td class="text-center fw-semibold text-danger">-${qty}</td>
          <td class="text-end text-muted">₱${cost.toFixed(2)}</td>
          <td class="text-end fw-semibold">₱${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="doc-slip">
        <div class="doc-header">
          <div>
            <h4>${this.escapeHtml(refNo)}</h4>
            <div class="doc-header-sub">${this.escapeHtml(date)}</div>
          </div>
          <div class="doc-actions-toolbar">
            <button type="button" class="doc-icon-btn" title="Print" onclick="window.stockOutController.printSlip('${logKey}')">
              <i class="ri-printer-line"></i>
            </button>
            <button type="button" class="doc-icon-btn" title="Edit" onclick="window.stockOutController.editSelectedRecord('${logKey}')">
              <i class="ri-edit-line"></i>
            </button>
            <button type="button" class="doc-icon-btn danger" title="Delete" onclick="window.stockOutController.deleteSelectedRecord('${logKey}')">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>

        <div class="doc-meta-box">
          <div class="doc-meta-item">
            <label>Reason</label>
            <div class="doc-meta-val">${this.escapeHtml(reason)}</div>
          </div>
          <div class="doc-meta-item">
            <label>Authorized By</label>
            <div class="doc-meta-val">${this.escapeHtml(authorizedBy)}</div>
          </div>
          ${notes ? `
          <div class="doc-meta-notes">
            <div class="doc-meta-item">
              <label>Remarks</label>
              <div class="small text-muted">${this.escapeHtml(notes)}</div>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="doc-items-table-wrapper">
          <table class="doc-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Qty</th>
                <th class="text-end">Cost</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="4" class="text-center py-4 text-muted">No items</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="doc-bottom-sheet-footer">
          <div class="doc-bottom-meta">${totalItems} ${totalItems === 1 ? 'item' : 'items'} (${totalUnits} units)</div>
          <div class="doc-bottom-total">Total: ₱${totalLossValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>
    `;
  }

  async handleStockOutModal() {
    const products = await window.mockApi.getProducts();
    const result = await SwalHelpers.showStockOutModal(products);

    if (result && result.isConfirmed && result.value) {
      try {
        const saved = await window.mockApi.processStockOut(result.value);
        this.selectedLogId = saved?.id || saved?.stock_out_id || result.value.refNo || result.value.ref_no;
        SwalHelpers.toast(`Stock Out Document recorded: ${result.value.refNo || result.value.ref_no}`, 'info');
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Action Failed', text: err.message });
      }
    }
  }

  async editSelectedRecord(id) {
    const logId = id || this.selectedLogId;
    const log = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(logId));
    if (!log) return;

    const products = await window.mockApi.getProducts();
    const result = await SwalHelpers.showEditStockOutParentModal(log, products);
    if (result.isConfirmed && result.value) {
      try {
        await window.mockApi.updateStockOut(log.id, result.value);
        this.selectedLogId = log.id;
        SwalHelpers.toast(`Voucher #${result.value.refNo || log.refNo} & children updated!`, 'success');
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
      }
    }
  }

  async deleteSelectedRecord(id) {
    const logId = id || this.selectedLogId;
    const log = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(logId));
    if (!log) return;

    const ref = log.ref_no || log.refNo;
    const confirm = await Swal.fire({
      title: `Delete Voucher ${ref}?`,
      text: `Are you sure you want to delete this disposal voucher? This will automatically restore the deducted medicine stock back to your inventory products.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete & Restore Stock',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        await window.mockApi.deleteStockOut(log.id || log.ref_no || log.refNo);
        SwalHelpers.toast(`Voucher #${ref} deleted and stock restored!`, 'success');
        this.selectedLogId = null;
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message });
      }
    }
  }

  async viewModalDetails(id) {
    const log = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(id));
    if (!log) return;

    const items = log.items || [];
    let totalLoss = 0;
    const rows = items.map((item, i) => {
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const cost = Number(item.cost_price ?? item.costPrice ?? item.cost ?? 0);
      const sub = qty * cost;
      totalLoss += sub;
      return `
        <tr style="border-bottom: 1px solid #fee2e2;">
          <td style="padding: 0.6rem 0.75rem; text-align: center; color: #94a3b8;">${i + 1}</td>
          <td style="padding: 0.6rem 0.75rem;">
            <strong style="color: var(--text-main, #0f172a);">${this.escapeHtml(item.product_name || item.name || 'Unnamed')}</strong><br>
            <small style="color: #64748b;">Batch: <code style="font-family: monospace; color: #ef4444;">${this.escapeHtml(item.batch_no || item.batchNo || 'N/A')}</code></small>
          </td>
          <td style="padding: 0.6rem 0.75rem; text-align: center; font-weight: 700; color: #ef4444;">-${qty}</td>
          <td style="padding: 0.6rem 0.75rem; text-align: right;">₱${cost.toFixed(2)}</td>
          <td style="padding: 0.6rem 0.75rem; text-align: right; font-weight: 700; color: #b91c1c;">₱${sub.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const ref = log.ref_no || log.refNo || 'N/A';
    const auth = log.authorized_by || log.authorizedBy || 'Pharmacist';

    Swal.fire({
      title: `📄 Disposal Voucher: ${ref}`,
      width: '980px',
      html: `
        <div style="text-align: left; font-size: 0.88rem;">
          <div style="background: var(--bg-card-hover, #fef2f2); border: 1px solid var(--border-color, #fecaca); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div><strong>Reason:</strong> ${this.escapeHtml(log.reason)}</div>
              <div><strong>Date:</strong> ${log.date}</div>
              <div><strong>Authorized By:</strong> ${this.escapeHtml(auth)}</div>
              <div><strong>Voucher Ref #:</strong> <span style="font-family: monospace; color: #ef4444; font-weight: 700;">${this.escapeHtml(ref)}</span></div>
            </div>
            ${log.notes || log.remarks ? `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #fca5a5; font-size: 0.8rem; color: #ef4444;"><strong>Notes:</strong> ${this.escapeHtml(log.notes || log.remarks)}</div>` : ''}
          </div>

          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main, #0f172a); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="ri-delete-bin-line" style="color: #ef4444;"></i> Itemized Deductions & Write-Offs (${items.length}):
          </h4>

          <div style="max-height: 260px; overflow-y: auto; border: 1px solid #fecaca; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead style="background: #fff5f5; border-bottom: 1px solid #fecaca; color: #991b1b; font-size: 0.75rem;">
                <tr>
                  <th style="padding: 0.5rem; text-align: center;">#</th>
                  <th style="padding: 0.5rem; text-align: left;">Medicine & Batch</th>
                  <th style="padding: 0.5rem; text-align: center;">Deducted Qty</th>
                  <th style="padding: 0.5rem; text-align: right;">Unit Cost</th>
                  <th style="padding: 0.5rem; text-align: right;">Loss Valuation</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; background: #fef2f2; border: 1px solid #fee2e2; padding: 0.85rem 1.1rem; border-radius: 10px;">
            <span style="font-weight: 700; color: #991b1b;">Total Disposal Valuation:</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: #b91c1c;">₱${totalLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      `,
      confirmButtonText: 'Close Dialog',
      confirmButtonColor: '#ef4444'
    });
  }

  printSlip(id) {
    const log = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(id));
    if (!log) return;

    const ref = log.ref_no || log.refNo || 'N/A';
    const auth = log.authorized_by || log.authorizedBy || 'Pharmacist';
    const items = log.items || [];
    let totalLoss = 0;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print disposal vouchers.');
      return;
    }

    const itemsHtml = items.map((i, idx) => {
      const qty = Number(i.quantity ?? i.qty ?? 0);
      const cost = Number(i.cost_price ?? i.costPrice ?? i.cost ?? 0);
      const sub = qty * cost;
      totalLoss += sub;
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">
            <strong>${this.escapeHtml(i.product_name || i.name || 'Unnamed')}</strong><br>
            <small>Batch: ${this.escapeHtml(i.batch_no || i.batchNo || 'N/A')}</small>
          </td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #ef4444; font-weight: bold;">-${qty}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₱${cost.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₱${sub.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Disposal Voucher - ${this.escapeHtml(ref)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; }
          .header { border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px; }
          .meta-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background: #fee2e2; border: 1px solid #fca5a5; padding: 8px; text-align: left; }
          .total-box { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; color: #b91c1c; }
          .sign-box { margin-top: 40px; display: flex; justify-content: space-between; }
          .sign-line { width: 200px; border-top: 1px solid #000; text-align: center; font-size: 12px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0; color: #b91c1c;">XYRA ANDREA PHARMACY</h2>
          <p style="margin: 3px 0 0 0; font-size: 13px; color: #64748b;">Community Drugstore | Official Inventory Disposal & Loss Voucher</p>
        </div>

        <div class="meta-box">
          <table style="border: none; margin: 0;">
            <tr>
              <td style="border: none; padding: 4px;"><strong>Voucher Ref #:</strong> ${this.escapeHtml(ref)}</td>
              <td style="border: none; padding: 4px;"><strong>Date Authorized:</strong> ${log.date}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 4px;"><strong>Deduction Reason:</strong> ${this.escapeHtml(log.reason)}</td>
              <td style="border: none; padding: 4px;"><strong>Authorized By:</strong> ${this.escapeHtml(auth)}</td>
            </tr>
          </table>
        </div>

        <h3>Itemized Write-Off Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 40px;">#</th>
              <th>Description & Batch</th>
              <th style="text-align: center; width: 80px;">Pulled Qty</th>
              <th style="text-align: right; width: 100px;">Unit Cost</th>
              <th style="text-align: right; width: 110px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          Total Disposal Valuation: ₱${totalLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>

        <div class="sign-box">
          <div class="sign-line">Pulled & Counted By</div>
          <div class="sign-line">Authorized Pharmacist / Manager</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.StockOutController = StockOutController;
