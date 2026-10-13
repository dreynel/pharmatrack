/**
 * PharmaTrack - Stock In (Goods Receiving) Controller
 * Xyra Andrea Pharmacy - Supplier Delivery Receipts, DR Logging & Cost Tracking
 * 2-Panel Split Architecture:
 *   - Right Panel: Main Record (Parent Delivery Receipts List)
 *   - Left Panel: Details per Parent (Itemized Children Batches & Document Slip)
 * Responsive, Instant On-Click Children Display & Full Parent CRUD
 */

class StockInController {
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
    const searchInput = document.getElementById('stockin-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const openStockInBtn = document.getElementById('btn-open-stockin-modal');
    if (openStockInBtn) {
      openStockInBtn.addEventListener('click', () => this.handleStockInModal());
    }
  }

  async render() {
    const logs = await window.mockApi.getStockInLogs();
    const container = document.getElementById('stockin-table-body');
    const docContainer = document.getElementById('stockin-document-container');
    if (!container) return;

    // Mini KPIs
    const totalDeliveriesCount = logs.length;
    let totalDeliveryVal = 0;
    const supplierCounts = {};

    logs.forEach(l => {
      totalDeliveryVal += Number(l.total_amount ?? l.totalAmount ?? 0);
      const sup = l.supplier_name || l.supplierName || 'General';
      supplierCounts[sup] = (supplierCounts[sup] || 0) + 1;
    });

    let topSupplier = 'Unilab';
    let maxSupCount = 0;
    for (const [sup, count] of Object.entries(supplierCounts)) {
      if (count > maxSupCount) {
        maxSupCount = count;
        topSupplier = sup;
      }
    }

    const countKpi = document.getElementById('stkin-kpi-count');
    const valueKpi = document.getElementById('stkin-kpi-value');
    const supKpi = document.getElementById('stkin-kpi-distributor');

    if (countKpi) countKpi.innerText = totalDeliveriesCount;
    if (valueKpi) valueKpi.innerText = `₱${totalDeliveryVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (supKpi) supKpi.innerText = topSupplier.split(' ')[0];

    const filtered = logs.filter(l => {
      const q = this.searchQuery;
      if (!q) return true;
      const ref = (l.ref_no || l.refNo || '').toLowerCase();
      const sup = (l.supplier_name || l.supplierName || '').toLowerCase();
      const rec = (l.received_by || l.receivedBy || '').toLowerCase();
      return ref.includes(q) || sup.includes(q) || rec.includes(q);
    });

    this.currentLogs = filtered;

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5"><i class="ri-inbox-archive-line fs-1 d-block mb-2 text-secondary opacity-50"></i>No Stock In receipts found matching your query.</td></tr>`;
      if (docContainer) {
        docContainer.innerHTML = `
          <div class="doc-empty-state">
            <i class="ri-file-download-line"></i>
            <h4>No Shipment Selected</h4>
            <p>Click on any delivery receipt on the right to inspect its itemized batch breakdown, or record a new delivery receipt.</p>
            <button class="btn btn-sm btn-primary" onclick="window.stockInController.handleStockInModal()">
              <i class="ri-add-line"></i> Receive New Shipment
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

    // Render Right Panel: Table of Shipments (Main Parent Records List)
    container.innerHTML = filtered.map(log => {
      const logKey = log.id || log.ref_no || log.refNo;
      const isSelected = String(logKey) === String(this.selectedLogId);
      const items = log.items || [];
      const refNo = log.ref_no || log.refNo || 'N/A';
      const supplierName = log.supplier_name || log.supplierName || 'General Distributor';
      const totalAmount = Number(log.total_amount ?? log.totalAmount ?? log.total_cost ?? 0);
      const receivedBy = log.received_by || log.receivedBy || 'Pharmacist';

      return `
        <tr class="stock-selectable-row ${isSelected ? 'active-stock-row' : ''}" 
            data-log-id="${logKey}"
            onclick="window.stockInController.selectRecord('${logKey}')"
            title="Click to view children batches and receipt details in left panel">
          <td class="py-2 px-3">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="font-monospace fw-bold text-primary">${this.escapeHtml(refNo)}</span>
              <span class="stock-active-badge-slot">
                ${isSelected ? '<span class="stock-active-badge stock-active-badge-in">← Viewing</span>' : ''}
              </span>
            </div>
          </td>
          <td class="small text-muted py-2 px-3 text-nowrap">${log.date}</td>
          <td class="py-2 px-3">
            <span class="small fw-semibold text-dark text-truncate d-inline-block" style="max-width: 170px;" title="${this.escapeHtml(supplierName)}">
              ${this.escapeHtml(supplierName)}
            </span>
          </td>
          <td class="py-2 px-3 fw-bold small text-primary text-nowrap">
            ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td class="py-2 px-3 small text-dark font-medium text-nowrap">
            ${this.escapeHtml(receivedBy)}
          </td>
          <td class="py-2 px-2 text-end text-nowrap" onclick="event.stopPropagation()">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2" title="Edit Parent Shipment" onclick="window.stockInController.editSelectedRecord('${logKey}')">
                <i class="ri-edit-line"></i>
              </button>
              <button type="button" class="btn btn-outline-danger btn-sm py-1 px-2" title="Delete Shipment (Reverse Stock)" onclick="window.stockInController.deleteSelectedRecord('${logKey}')">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Left Panel: Active Parent Document & Children Details
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
    const tableBody = document.getElementById('stockin-table-body');
    if (tableBody) {
      tableBody.querySelectorAll('tr.stock-selectable-row').forEach(row => {
        const rowId = row.getAttribute('data-log-id');
        const isActive = String(rowId) === String(id);
        if (isActive) {
          row.classList.add('active-stock-row');
          const badgeSlot = row.querySelector('.stock-active-badge-slot');
          if (badgeSlot) {
            badgeSlot.innerHTML = `<span class="stock-active-badge stock-active-badge-in">← Viewing</span>`;
          }
        } else {
          row.classList.remove('active-stock-row');
          const badgeSlot = row.querySelector('.stock-active-badge-slot');
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
    const docContainer = document.getElementById('stockin-document-container');
    if (docContainer && window.innerWidth < 1200) {
      docContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderDocumentSlip(log) {
    const container = document.getElementById('stockin-document-container');
    if (!container) return;

    if (!log) {
      container.innerHTML = `
        <div class="doc-empty-state">
          <i class="ri-file-download-line"></i>
          <h4>No Shipment Selected</h4>
          <p>Click on any delivery receipt on the right to inspect its itemized batch breakdown.</p>
          <button class="btn btn-sm btn-primary" onclick="window.stockInController.handleStockInModal()">
            <i class="ri-add-line"></i> Receive New Shipment
          </button>
        </div>
      `;
      return;
    }

    const items = log.items || [];
    const totalItems = items.length;
    const totalUnits = items.reduce((acc, i) => acc + Number(i.quantity ?? i.qty ?? 0), 0);
    const totalAmount = Number(log.total_amount ?? log.totalAmount ?? log.total_cost ?? 0);
    const refNo = log.ref_no || log.refNo || 'N/A';
    const supplierName = log.supplier_name || log.supplierName || 'General Distributor';
    const date = log.date || 'N/A';
    const receivedBy = log.received_by || log.receivedBy || 'Staff';
    const notes = log.notes || log.remarks || '';
    const logKey = log.id || log.ref_no || log.refNo;

    const itemsRows = items.map((item, idx) => {
      const name = item.product_name || item.name || 'Unnamed Product';
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const cost = Number(item.cost_price ?? item.costPrice ?? item.cost ?? 0);
      const batchNo = item.batch_no || item.batchNo || 'N/A';
      const expiryDate = item.expiry_date || item.expiryDate || 'N/A';
      const lineTotal = qty * cost;

      return `
        <tr>
          <td class="text-center text-muted fw-bold">${idx + 1}</td>
          <td>
            <strong class="text-dark d-block text-truncate" style="max-width: 180px;">${this.escapeHtml(name)}</strong>
            <small class="text-muted d-flex align-items-center gap-1 mt-0.5">
              <i class="ri-qr-code-line text-secondary"></i> Batch: <code class="font-monospace text-primary bg-light px-1 py-0.5 rounded border border-light-subtle">${this.escapeHtml(batchNo)}</code>
            </small>
          </td>
          <td class="text-nowrap">
            <span class="badge bg-light text-secondary border">
              <i class="ri-calendar-line"></i> ${this.escapeHtml(expiryDate)}
            </span>
          </td>
          <td class="text-center text-nowrap">
            <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold">
              +${qty}
            </span>
          </td>
          <td class="text-end text-muted text-nowrap">₱${cost.toFixed(2)}</td>
          <td class="text-end fw-bold text-dark text-nowrap">₱${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="doc-slip">
        <!-- Document Parent Header & Action Toolbar -->
        <div class="doc-header">
          <div class="doc-header-title">
            <div class="doc-header-badges">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle text-uppercase fw-bold">
                Parent DR #${this.escapeHtml(refNo)}
              </span>
              <span class="badge bg-success-subtle text-success border border-success-subtle">
                <i class="ri-checkbox-circle-fill"></i> Goods Received
              </span>
            </div>
            <h4>
              <i class="ri-file-check-line text-primary"></i> Delivery Receipt Voucher
            </h4>
          </div>

          <!-- Parent Action Buttons: Add, Edit, Delete -->
          <div class="doc-actions-toolbar">
            <button 
              type="button"
              class="btn btn-sm btn-outline-primary"
              title="Add New Delivery Receipt"
              onclick="window.stockInController.handleStockInModal()"
            >
              <i class="ri-add-line"></i> Add New
            </button>
            <button 
              type="button"
              class="btn btn-sm btn-outline-secondary"
              title="Edit Parent Shipment Details"
              onclick="window.stockInController.editSelectedRecord('${logKey}')"
            >
              <i class="ri-edit-line"></i> Edit
            </button>
            <button 
              type="button"
              class="btn btn-sm btn-outline-danger"
              title="Delete This Shipment (Reverse Inventory)"
              onclick="window.stockInController.deleteSelectedRecord('${logKey}')"
            >
              <i class="ri-delete-bin-line"></i> Delete
            </button>
          </div>
        </div>

        <!-- Document Parent Metadata Grid (Bootstrap Grid) -->
        <div class="row g-2 p-3 bg-light rounded-3 border mb-3">
          <div class="col-6">
            <div class="doc-meta-item">
              <label>DR / Reference #</label>
              <div class="doc-meta-code">${this.escapeHtml(refNo)}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="doc-meta-item">
              <label>Date Received</label>
              <div class="doc-meta-val">${this.escapeHtml(date)}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="doc-meta-item">
              <label>Supplier / Distributor</label>
              <div class="doc-meta-val text-truncate" title="${this.escapeHtml(supplierName)}">${this.escapeHtml(supplierName)}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="doc-meta-item">
              <label>Received & Inspected By</label>
              <div class="doc-meta-val">${this.escapeHtml(receivedBy)}</div>
            </div>
          </div>
          ${notes ? `
          <div class="col-12 pt-2 border-top">
            <div class="doc-meta-item">
              <label>Remarks / Verification Note</label>
              <div class="small text-muted">${this.escapeHtml(notes)}</div>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Children Line Items Section (Highlighting Parent-Child Hierarchy) -->
        <div class="mb-3">
          <div class="doc-section-title">
            <strong>
              <i class="ri-git-commit-line text-primary"></i> Children Line Items (${totalItems})
            </strong>
            <span class="badge bg-success-subtle text-success border border-success-subtle">
              +${totalUnits} units total
            </span>
          </div>

          <div class="doc-items-table-wrapper">
            <table class="doc-items-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 35px;">#</th>
                  <th>Medicine & Batch</th>
                  <th>Expiry</th>
                  <th class="text-center">Qty</th>
                  <th class="text-end">Cost</th>
                  <th class="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows || '<tr><td colspan="6" class="text-center py-4 text-muted">No items attached to this receipt</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Grand Total Summary Bar -->
        <div class="doc-valuation-card">
          <div>
            <div class="doc-val-label">Total Delivery Valuation</div>
            <div class="doc-val-subtitle">${totalItems} line items · ${totalUnits} total units received</div>
          </div>
          <div class="doc-val-amount">
            ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <!-- Document Footer Actions -->
        <div class="doc-footer-actions">
          <button 
            type="button"
            class="btn btn-sm btn-outline-secondary" 
            onclick="window.stockInController.printSlip('${logKey}')"
          >
            <i class="ri-printer-line"></i> Print Receiving Slip
          </button>
          <button 
            type="button"
            class="btn btn-sm btn-primary" 
            onclick="window.stockInController.viewModalDetails('${logKey}')"
          >
            <i class="ri-zoom-in-line"></i> Full Slip Dialog
          </button>
        </div>
      </div>
    `;
  }

  async handleStockInModal() {
    const products = await window.mockApi.getProducts();
    const suppliers = await window.mockApi.getSuppliers();

    const result = await SwalHelpers.showStockInModal(products, suppliers);
    if (result.isConfirmed && result.value) {
      await window.mockApi.processStockIn(result.value);
      this.selectedLogId = result.value.refNo || result.value.ref_no;
      SwalHelpers.toast(`Stock In recorded: ${this.selectedLogId}`, 'success');
      if (window.appController) {
        await window.appController.refreshAllModules();
      } else {
        await this.render();
      }
    }
  }

  async editSelectedRecord(id) {
    const logId = id || this.selectedLogId;
    const log = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(logId));
    if (!log) return;

    const suppliers = await window.mockApi.getSuppliers();
    const result = await SwalHelpers.showEditStockInParentModal(log, suppliers);

    if (result.isConfirmed && result.value) {
      try {
        await window.mockApi.updateStockIn(log.id || log.ref_no || log.refNo, result.value);
        this.selectedLogId = result.value.refNo || result.value.ref_no || log.id;
        SwalHelpers.toast(`Shipment #${this.selectedLogId} updated successfully!`, 'success');
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
      title: `Delete Shipment ${ref}?`,
      text: `Are you sure you want to delete this delivery receipt? This will automatically reverse the stock quantities that were added to your inventory products.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete & Reverse Stock',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        await window.mockApi.deleteStockIn(log.id || log.ref_no || log.refNo);
        SwalHelpers.toast(`Shipment #${ref} deleted and stock reversed!`, 'success');
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
    const rows = items.map((item, i) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 0.6rem 0.75rem; text-align: center; color: #94a3b8;">${i + 1}</td>
        <td style="padding: 0.6rem 0.75rem;">
          <strong style="color: #0f172a;">${this.escapeHtml(item.product_name || item.name || 'Unnamed')}</strong><br>
          <small style="color: #64748b;">Batch: <code style="font-family: monospace; color: #00a896;">${this.escapeHtml(item.batch_no || item.batchNo || 'N/A')}</code> | Exp: ${this.escapeHtml(item.expiry_date || item.expiryDate || 'N/A')}</small>
        </td>
        <td style="padding: 0.6rem 0.75rem; text-align: center; font-weight: 700; color: #00a896;">+${item.quantity ?? item.qty ?? 0}</td>
        <td style="padding: 0.6rem 0.75rem; text-align: right;">₱${Number(item.cost_price ?? item.costPrice ?? item.cost ?? 0).toFixed(2)}</td>
        <td style="padding: 0.6rem 0.75rem; text-align: right; font-weight: 700;">₱${(Number(item.quantity ?? item.qty ?? 0) * Number(item.cost_price ?? item.costPrice ?? item.cost ?? 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    const ref = log.ref_no || log.refNo || 'N/A';
    const sup = log.supplier_name || log.supplierName || 'General Distributor';
    const rec = log.received_by || log.receivedBy || 'Staff';
    const totalAmount = Number(log.total_amount ?? log.totalAmount ?? 0);

    Swal.fire({
      title: `📄 Delivery Receipt: ${ref}`,
      width: '700px',
      html: `
        <div style="text-align: left; font-size: 0.88rem;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div><strong>Supplier:</strong> ${this.escapeHtml(sup)}</div>
              <div><strong>Date:</strong> ${log.date}</div>
              <div><strong>Received By:</strong> ${this.escapeHtml(rec)}</div>
              <div><strong>Reference #:</strong> <span style="font-family: monospace; color: #00a896; font-weight: 700;">${this.escapeHtml(ref)}</span></div>
            </div>
            ${log.notes || log.remarks ? `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1; font-size: 0.8rem; color: #64748b;"><strong>Notes:</strong> ${this.escapeHtml(log.notes || log.remarks)}</div>` : ''}
          </div>

          <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="ri-list-check" style="color: #00a896;"></i> Children Line Items Received (${items.length}):
          </h4>

          <div style="max-height: 260px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.75rem;">
                <tr>
                  <th style="padding: 0.5rem; text-align: center;">#</th>
                  <th style="padding: 0.5rem; text-align: left;">Medicine & Batch</th>
                  <th style="padding: 0.5rem; text-align: center;">Qty</th>
                  <th style="padding: 0.5rem; text-align: right;">Unit Cost</th>
                  <th style="padding: 0.5rem; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; background: #f0fdfa; border: 1px solid #ccfbf1; padding: 0.85rem 1.1rem; border-radius: 10px;">
            <span style="font-weight: 700; color: #115e59;">Total Delivery Valuation:</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: #0f766e;">₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      `,
      confirmButtonText: 'Close Dialog',
      confirmButtonColor: '#00a896'
    });
  }

  printSlip(id) {
    const log = this.currentLogs.find(l => String(l.id || l.ref_no || l.refNo) === String(id));
    if (!log) return;

    const ref = log.ref_no || log.refNo || 'N/A';
    const sup = log.supplier_name || log.supplierName || 'General Distributor';
    const rec = log.received_by || log.receivedBy || 'Staff';
    const items = log.items || [];
    const totalAmount = Number(log.total_amount ?? log.totalAmount ?? 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receiving slips.');
      return;
    }

    const itemsHtml = items.map((i, idx) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">
          <strong>${this.escapeHtml(i.product_name || i.name || 'Unnamed')}</strong><br>
          <small>Batch: ${this.escapeHtml(i.batch_no || i.batchNo || 'N/A')} | Exp: ${this.escapeHtml(i.expiry_date || i.expiryDate || 'N/A')}</small>
        </td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">+${i.quantity ?? i.qty ?? 0}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₱${Number(i.cost_price ?? i.costPrice ?? i.cost ?? 0).toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₱${(Number(i.quantity ?? i.qty ?? 0) * Number(i.cost_price ?? i.costPrice ?? i.cost ?? 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Goods Receiving Slip - ${this.escapeHtml(ref)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; }
          .header { border-bottom: 2px solid #00a896; padding-bottom: 12px; margin-bottom: 20px; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          .total-box { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; }
          .sign-box { margin-top: 40px; display: flex; justify-content: space-between; }
          .sign-line { width: 200px; border-top: 1px solid #000; text-align: center; font-size: 12px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0; color: #0f766e;">XYRA ANDREA PHARMACY</h2>
          <p style="margin: 3px 0 0 0; font-size: 13px; color: #64748b;">Community Drugstore | Official Goods Receiving Voucher</p>
        </div>

        <div class="meta-box">
          <table style="border: none; margin: 0;">
            <tr>
              <td style="border: none; padding: 4px;"><strong>DR / Ref #:</strong> ${this.escapeHtml(ref)}</td>
              <td style="border: none; padding: 4px;"><strong>Date Received:</strong> ${log.date}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 4px;"><strong>Supplier:</strong> ${this.escapeHtml(sup)}</td>
              <td style="border: none; padding: 4px;"><strong>Received By:</strong> ${this.escapeHtml(rec)}</td>
            </tr>
          </table>
        </div>

        <h3>Itemized Batch Receipts</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 40px;">#</th>
              <th>Description & Batch</th>
              <th style="text-align: center; width: 80px;">Qty</th>
              <th style="text-align: right; width: 100px;">Unit Cost</th>
              <th style="text-align: right; width: 110px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          Total Valuation: ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>

        <div class="sign-box">
          <div class="sign-line">Received & Inspected By</div>
          <div class="sign-line">Authorized Pharmacist</div>
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

window.StockInController = StockInController;
