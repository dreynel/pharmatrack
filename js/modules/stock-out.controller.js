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
      container.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5"><i class="ri-delete-bin-line fs-1 d-block mb-2 text-danger opacity-50"></i>No Stock Out records found matching your query.</td></tr>`;
      if (docContainer) {
        docContainer.innerHTML = `
          <div class="doc-empty-state">
            <i class="ri-delete-bin-line text-danger opacity-50"></i>
            <h4>No Disposal Voucher Selected</h4>
            <p>Click on any disposal voucher on the right to inspect its itemized batch write-offs, or record a new stock deduction.</p>
            <button class="btn btn-sm btn-danger" onclick="window.stockOutController.handleStockOutModal()">
              <i class="ri-indeterminate-circle-line"></i> Record New Stock Out
            </button>
          </div>
        `;
      }
      return;
    }

    // Auto-select first item if current selection is invalid or null
    const hasSelection = filtered.some(l => String(l.id || l.ref_no || l.refNo) === String(this.selectedLogId));
    if (!hasSelection) {
      this.selectedLogId = filtered[0].id || filtered[0].ref_no || filtered[0].refNo;
    }

    // Render Right Panel: Table of Disposal Vouchers (Main Parent Records List)
    container.innerHTML = filtered.map(log => {
      const logKey = log.id || log.ref_no || log.refNo;
      const isSelected = String(logKey) === String(this.selectedLogId);
      const items = log.items || [];
      const refNo = log.ref_no || log.refNo || 'N/A';
      const reason = log.reason || 'Disposal';
      const authBy = log.authorized_by || log.authorizedBy || 'Pharmacist';
      const totalLossValuation = log.total_loss_cost != null ? Number(log.total_loss_cost) : (log.total_amount != null ? Number(log.total_amount) : items.reduce((acc, i) => acc + (Number(i.quantity ?? i.qty ?? 0) * Number(i.cost_price ?? i.costPrice ?? i.cost ?? 0)), 0));

      let badgeClasses = 'bg-danger-subtle text-danger border border-danger-subtle';
      const reasonLower = reason.toLowerCase();
      if (reasonLower.includes('damaged')) badgeClasses = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      else if (reasonLower.includes('internal') || reasonLower.includes('clinic')) badgeClasses = 'bg-success-subtle text-success border border-success-subtle';
      else if (reasonLower.includes('supplier') || reasonLower.includes('rtv')) badgeClasses = 'bg-primary-subtle text-primary border border-primary-subtle';

      return `
        <tr class="stock-selectable-row ${isSelected ? 'active-stockout-row' : ''}" 
            data-log-id="${logKey}"
            onclick="window.stockOutController.selectRecord('${logKey}')"
            title="Click to view children batches and voucher details in left panel">
          <td class="py-2 px-3">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="font-monospace fw-bold text-danger">${this.escapeHtml(refNo)}</span>
              <span class="stockout-active-badge-slot">
                ${isSelected ? '<span class="stock-active-badge stock-active-badge-out">← Viewing</span>' : ''}
              </span>
            </div>
          </td>
          <td class="small text-muted py-2 px-3 text-nowrap">${log.date}</td>
          <td class="py-2 px-3">
            <span class="badge ${badgeClasses} text-nowrap">
              ${this.escapeHtml(reason)}
            </span>
          </td>
          <td class="py-2 px-3 fw-bold small text-danger text-nowrap">
            ₱${totalLossValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td class="py-2 px-3 small text-dark font-medium text-nowrap text-truncate" style="max-width: 140px;" title="${this.escapeHtml(authBy)}">
            ${this.escapeHtml(authBy)}
          </td>
          <td class="py-2 px-2 text-end text-nowrap" onclick="event.stopPropagation()">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2" title="Edit Parent Voucher" onclick="window.stockOutController.editSelectedRecord('${logKey}')">
                <i class="ri-edit-line"></i>
              </button>
              <button type="button" class="btn btn-outline-danger btn-sm py-1 px-2" title="Delete Voucher (Restore Inventory)" onclick="window.stockOutController.deleteSelectedRecord('${logKey}')">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Left Panel: Active Parent Disposal Voucher & Children Details
    const activeLog = filtered.find(l => String(l.id || l.ref_no || l.refNo) === String(this.selectedLogId)) || filtered[0];
    this.renderDocumentSlip(activeLog);
  }

  /**
   * Fast, in-memory record selector:
   * Instantly highlights the clicked parent in the right table and updates the children on the left without API refetch!
   */
  selectRecord(id) {
    if (String(this.selectedLogId) === String(id)) return;
    this.selectedLogId = id;

    // 1. Instantly update active highlight in the right panel table
    const tableBody = document.getElementById('stockout-table-body');
    if (tableBody) {
      tableBody.querySelectorAll('tr.stock-selectable-row').forEach(row => {
        const rowId = row.getAttribute('data-log-id');
        const isActive = String(rowId) === String(id);
        if (isActive) {
          row.classList.add('active-stockout-row');
          const badgeSlot = row.querySelector('.stockout-active-badge-slot');
          if (badgeSlot) {
            badgeSlot.innerHTML = `<span class="stock-active-badge stock-active-badge-out">← Viewing</span>`;
          }
        } else {
          row.classList.remove('active-stockout-row');
          const badgeSlot = row.querySelector('.stockout-active-badge-slot');
          if (badgeSlot) {
            badgeSlot.innerHTML = '';
          }
        }
      });
    }

    // 2. Instantly render the left panel details per selected parent
    const selectedLog = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(id));
    if (selectedLog) {
      this.renderDocumentSlip(selectedLog);
    }

    // 3. Smooth scroll to left panel if on mobile/small stacked screens
    const docContainer = document.getElementById('stockout-document-container');
    if (docContainer && window.innerWidth < 1200) {
      docContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderDocumentSlip(log) {
    const container = document.getElementById('stockout-document-container');
    if (!container) return;

    if (!log) {
      container.innerHTML = `
        <div class="doc-empty-state">
          <i class="ri-delete-bin-line text-danger opacity-50"></i>
          <h4>No Voucher Selected</h4>
          <p>Click on any disposal voucher on the right to inspect its batch and authorization breakdown.</p>
          <button class="btn btn-sm btn-danger" onclick="window.stockOutController.handleStockOutModal()">
            <i class="ri-indeterminate-circle-line"></i> Record Stock Out
          </button>
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

    let badgeClasses = 'bg-danger-subtle text-danger border border-danger-subtle';
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('damaged')) badgeClasses = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    else if (reasonLower.includes('internal') || reasonLower.includes('clinic')) badgeClasses = 'bg-success-subtle text-success border border-success-subtle';
    else if (reasonLower.includes('supplier') || reasonLower.includes('rtv')) badgeClasses = 'bg-primary-subtle text-primary border border-primary-subtle';

    const itemsRows = items.map((item, idx) => {
      const name = item.product_name || item.name || 'Unnamed Product';
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const cost = Number(item.cost_price ?? item.costPrice ?? item.cost ?? 0);
      const batchNo = item.batch_no || item.batchNo || 'N/A';
      const lineTotal = qty * cost;
      totalLossValuation += lineTotal;

      return `
        <tr>
          <td class="text-center text-muted fw-bold">${idx + 1}</td>
          <td>
            <strong class="text-dark d-block text-truncate" style="max-width: 180px;">${this.escapeHtml(name)}</strong>
            <small class="text-muted d-flex align-items-center gap-1 mt-0.5">
              <i class="ri-qr-code-line text-danger opacity-75"></i> Batch: <code class="font-monospace text-danger bg-light px-1 py-0.5 rounded border border-light-subtle">${this.escapeHtml(batchNo)}</code>
            </small>
          </td>
          <td class="text-center text-nowrap">
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold">
              -${qty} units
            </span>
          </td>
          <td class="text-end text-muted text-nowrap">₱${cost.toFixed(2)}</td>
          <td class="text-end fw-bold text-danger text-nowrap">₱${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="doc-slip doc-slip-danger">
        <!-- Document Parent Header & Action Toolbar -->
        <div class="doc-header">
          <div class="doc-header-title">
            <div class="doc-header-badges">
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle text-uppercase fw-bold">
                Parent Voucher #${this.escapeHtml(refNo)}
              </span>
              <span class="badge ${badgeClasses}">
                <i class="ri-close-circle-line"></i> ${this.escapeHtml(reason)}
              </span>
            </div>
            <h4>
              <i class="ri-file-reduce-line text-danger"></i> Inventory Disposal Voucher
            </h4>
          </div>

          <!-- Parent Action Buttons: Add, Edit, Delete -->
          <div class="doc-actions-toolbar">
            <button 
              type="button"
              class="btn btn-sm btn-outline-danger"
              title="Record New Stock Out Voucher"
              onclick="window.stockOutController.handleStockOutModal()"
            >
              <i class="ri-add-line"></i> Record New
            </button>
            <button 
              type="button"
              class="btn btn-sm btn-outline-secondary"
              title="Edit Parent Voucher Details"
              onclick="window.stockOutController.editSelectedRecord('${logKey}')"
            >
              <i class="ri-edit-line"></i> Edit
            </button>
            <button 
              type="button"
              class="btn btn-sm btn-outline-danger"
              title="Delete Voucher (Restore Inventory)"
              onclick="window.stockOutController.deleteSelectedRecord('${logKey}')"
            >
              <i class="ri-delete-bin-line"></i> Delete
            </button>
          </div>
        </div>

        <!-- Document Parent Metadata Grid (Bootstrap Grid) -->
        <div class="row g-2 p-3 bg-light-subtle rounded-3 border border-danger-subtle mb-3">
          <div class="col-6">
            <div class="doc-meta-item">
              <label>Voucher Ref #</label>
              <div class="doc-meta-code text-danger">${this.escapeHtml(refNo)}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="doc-meta-item">
              <label>Date Authorized</label>
              <div class="doc-meta-val">${this.escapeHtml(date)}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="doc-meta-item">
              <label>Deduction Reason</label>
              <div class="doc-meta-val fw-bold text-danger">${this.escapeHtml(reason)}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="doc-meta-item">
              <label>Authorized Pharmacist</label>
              <div class="doc-meta-val">${this.escapeHtml(authorizedBy)}</div>
            </div>
          </div>
          ${notes ? `
          <div class="col-12 pt-2 border-top border-danger-subtle">
            <div class="doc-meta-item">
              <label>Audit & Disposal Notes</label>
              <div class="small text-muted">${this.escapeHtml(notes)}</div>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Children Line Items Section (Highlighting Parent-Child Hierarchy) -->
        <div class="mb-3">
          <div class="doc-section-title">
            <strong>
              <i class="ri-git-commit-line text-danger"></i> Children Line Items (${totalItems})
            </strong>
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle">
              -${totalUnits} units total
            </span>
          </div>

          <div class="doc-items-table-wrapper">
            <table class="doc-items-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 35px;">#</th>
                  <th>Medicine & Batch</th>
                  <th class="text-center">Pulled Qty</th>
                  <th class="text-end">Unit Cost</th>
                  <th class="text-end">Loss Valuation</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows || '<tr><td colspan="5" class="text-center py-4 text-muted">No write-off items attached</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Grand Total Summary Bar -->
        <div class="doc-valuation-card doc-valuation-card-danger">
          <div>
            <div class="doc-val-label">Total Write-Off Valuation</div>
            <div class="doc-val-subtitle">${totalItems} line items · ${totalUnits} units removed from stock</div>
          </div>
          <div class="doc-val-amount">
            ₱${totalLossValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <!-- Document Footer Actions -->
        <div class="doc-footer-actions">
          <button 
            type="button"
            class="btn btn-sm btn-outline-secondary" 
            onclick="window.stockOutController.printSlip('${logKey}')"
          >
            <i class="ri-printer-line"></i> Print Disposal Slip
          </button>
          <button 
            type="button"
            class="btn btn-sm btn-danger" 
            onclick="window.stockOutController.viewModalDetails('${logKey}')"
          >
            <i class="ri-zoom-in-line"></i> Full Voucher Dialog
          </button>
        </div>
      </div>
    `;
  }

  async handleStockOutModal() {
    const products = await window.mockApi.getProducts();
    const result = await SwalHelpers.showStockOutModal(products);

    if (result.isConfirmed && result.value) {
      try {
        await window.mockApi.processStockOut(result.value);
        this.selectedLogId = result.value.refNo || result.value.ref_no;
        SwalHelpers.toast(`Stock Out recorded: ${this.selectedLogId}`, 'info');
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

    const result = await SwalHelpers.showEditStockOutParentModal(log);
    if (result.isConfirmed && result.value) {
      try {
        await window.mockApi.updateStockOut(log.id || log.ref_no || log.refNo, result.value);
        this.selectedLogId = result.value.refNo || result.value.ref_no || log.id;
        SwalHelpers.toast(`Voucher #${this.selectedLogId} updated successfully!`, 'success');
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
            <strong style="color: #0f172a;">${this.escapeHtml(item.product_name || item.name || 'Unnamed')}</strong><br>
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
      width: '700px',
      html: `
        <div style="text-align: left; font-size: 0.88rem;">
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div><strong>Reason:</strong> ${this.escapeHtml(log.reason)}</div>
              <div><strong>Date:</strong> ${log.date}</div>
              <div><strong>Authorized By:</strong> ${this.escapeHtml(auth)}</div>
              <div><strong>Voucher Ref #:</strong> <span style="font-family: monospace; color: #ef4444; font-weight: 700;">${this.escapeHtml(ref)}</span></div>
            </div>
            ${log.notes || log.remarks ? `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #fca5a5; font-size: 0.8rem; color: #7f1d1d;"><strong>Notes:</strong> ${this.escapeHtml(log.notes || log.remarks)}</div>` : ''}
          </div>

          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
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
