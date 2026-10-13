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
      container.innerHTML = `<tr><td colspan="6" class="text-center text-slate-500 py-10"><i class="ri-inbox-archive-line text-3xl block mb-2 text-slate-400"></i>No Stock In receipts found matching your query.</td></tr>`;
      if (docContainer) {
        docContainer.innerHTML = `
          <div class="doc-empty-state bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
            <i class="ri-file-download-line text-4xl block mb-3 text-slate-300"></i>
            <h4 class="text-base font-bold text-slate-800 mb-1">No Shipment Selected</h4>
            <p class="text-xs text-slate-500 max-w-xs mx-auto mb-4">Click on any delivery receipt on the right to load its details into this panel, or create a new delivery receipt.</p>
            <button class="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition" onclick="window.stockInController.handleStockInModal()">
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
      const totalAmount = Number(log.total_amount ?? log.totalAmount ?? 0);
      const receivedBy = log.received_by || log.receivedBy || 'Pharmacist';

      return `
        <tr class="stock-selectable-row cursor-pointer transition-all duration-150 ${isSelected ? 'active-stock-row bg-teal-50/80 border-l-4 border-teal-600 shadow-xs' : 'hover:bg-slate-50'}" 
            data-log-id="${logKey}"
            onclick="window.stockInController.selectRecord('${logKey}')"
            title="Click to view children batches and receipt details in left panel">
          <td class="py-3 px-3.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-xs font-bold text-teal-700">${this.escapeHtml(refNo)}</span>
              <span class="stock-active-badge-slot">
                ${isSelected ? '<span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded shadow-xs">← Viewing Children</span>' : ''}
              </span>
            </div>
          </td>
          <td class="text-xs text-slate-600 py-3 px-3.5 whitespace-nowrap">${log.date}</td>
          <td class="py-3 px-3.5">
            <span class="text-xs font-semibold text-slate-800 block line-clamp-1" title="${this.escapeHtml(supplierName)}">
              ${this.escapeHtml(supplierName)}
            </span>
          </td>
          <td class="py-3 px-3.5 font-bold text-xs text-teal-600 whitespace-nowrap">
            ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td class="py-3 px-3.5 text-xs text-slate-700 font-medium whitespace-nowrap">
            ${this.escapeHtml(receivedBy)}
          </td>
          <td class="py-3 px-2 text-right whitespace-nowrap" onclick="event.stopPropagation()">
            <div class="inline-flex items-center gap-1">
              <button type="button" class="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Edit Parent Shipment" onclick="window.stockInController.editSelectedRecord('${logKey}')">
                <i class="ri-edit-line text-sm"></i>
              </button>
              <button type="button" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Shipment (Reverse Stock)" onclick="window.stockInController.deleteSelectedRecord('${logKey}')">
                <i class="ri-delete-bin-line text-sm"></i>
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
          row.classList.add('active-stock-row', 'bg-teal-50/80', 'border-l-4', 'border-teal-600', 'shadow-xs');
          row.classList.remove('hover:bg-slate-50');
          const badgeSlot = row.querySelector('.stock-active-badge-slot');
          if (badgeSlot) {
            badgeSlot.innerHTML = `<span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded shadow-xs">← Viewing Children</span>`;
          }
        } else {
          row.classList.remove('active-stock-row', 'bg-teal-50/80', 'border-l-4', 'border-teal-600', 'shadow-xs');
          row.classList.add('hover:bg-slate-50');
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
    if (docContainer && window.innerWidth < 1024) {
      docContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderDocumentSlip(log) {
    const container = document.getElementById('stockin-document-container');
    if (!container) return;

    if (!log) {
      container.innerHTML = `
        <div class="doc-empty-state bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
          <i class="ri-file-download-line text-4xl block mb-3 text-slate-300"></i>
          <h4 class="text-base font-bold text-slate-800 mb-1">No Shipment Selected</h4>
          <p class="text-xs text-slate-500 max-w-xs mx-auto mb-4">Click on any delivery receipt on the right to inspect its itemized batch breakdown.</p>
          <button class="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition" onclick="window.stockInController.handleStockInModal()">
            <i class="ri-add-line"></i> Receive New Shipment
          </button>
        </div>
      `;
      return;
    }

    const items = log.items || [];
    const totalItems = items.length;
    const totalUnits = items.reduce((acc, i) => acc + Number(i.quantity ?? i.qty ?? 0), 0);
    const totalAmount = Number(log.total_amount ?? log.totalAmount ?? 0);
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
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-2.5 px-3 text-slate-400 font-bold text-center w-8 text-xs">${idx + 1}</td>
          <td class="py-2.5 px-3">
            <strong class="text-slate-800 block text-xs font-semibold leading-snug">${this.escapeHtml(name)}</strong>
            <span class="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <i class="ri-qr-code-line text-slate-400"></i> Batch: <code class="font-mono text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">${this.escapeHtml(batchNo)}</code>
            </span>
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
              <i class="ri-calendar-line text-[11px] text-slate-400"></i> ${this.escapeHtml(expiryDate)}
            </span>
          </td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <span class="inline-flex items-center gap-0.5 font-bold text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
              +${qty} units
            </span>
          </td>
          <td class="py-2.5 px-3 text-right text-xs text-slate-600 whitespace-nowrap">₱${cost.toFixed(2)}</td>
          <td class="py-2.5 px-3 text-right text-xs font-bold text-slate-800 whitespace-nowrap">₱${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="doc-slip bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 relative overflow-hidden transition-all duration-200">
        <!-- Top Colored Border Accent -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-teal-700"></div>

        <!-- Document Parent Header & Action Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-200 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Parent Record #${this.escapeHtml(refNo)}
              </span>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <i class="ri-checkbox-circle-fill text-[11px]"></i> Goods Received
              </span>
            </div>
            <h4 class="text-base font-extrabold text-slate-900 font-heading mt-1 flex items-center gap-2">
              <i class="ri-file-check-line text-teal-600 text-lg"></i> Delivery Receipt Voucher
            </h4>
          </div>

          <!-- Parent Action Buttons: Add, Edit, Delete -->
          <div class="flex items-center gap-1.5">
            <button 
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold border border-teal-200 transition cursor-pointer"
              title="Add New Delivery Receipt"
              onclick="window.stockInController.handleStockInModal()"
            >
              <i class="ri-add-line"></i> Add New
            </button>
            <button 
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition cursor-pointer"
              title="Edit Parent Shipment Details"
              onclick="window.stockInController.editSelectedRecord('${logKey}')"
            >
              <i class="ri-edit-line text-slate-500"></i> Edit
            </button>
            <button 
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold border border-red-200 transition cursor-pointer"
              title="Delete This Shipment (Reverse Inventory)"
              onclick="window.stockInController.deleteSelectedRecord('${logKey}')"
            >
              <i class="ri-delete-bin-line"></i> Delete
            </button>
          </div>
        </div>

        <!-- Document Parent Metadata Grid -->
        <div class="grid grid-cols-2 gap-3 bg-slate-50/90 p-4 rounded-xl border border-slate-100 mb-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">DR / Reference #</label>
            <span class="font-mono text-sm font-bold text-teal-700">${this.escapeHtml(refNo)}</span>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date Received</label>
            <span class="text-xs font-semibold text-slate-700">${this.escapeHtml(date)}</span>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Supplier / Distributor</label>
            <span class="text-xs font-semibold text-slate-900 line-clamp-1" title="${this.escapeHtml(supplierName)}">${this.escapeHtml(supplierName)}</span>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Received & Inspected By</label>
            <span class="text-xs font-semibold text-slate-700 line-clamp-1">${this.escapeHtml(receivedBy)}</span>
          </div>
          ${notes ? `
          <div class="col-span-2 pt-2 border-t border-slate-200/50">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Remarks / Verification Note</label>
            <span class="text-xs text-slate-600 font-medium">${this.escapeHtml(notes)}</span>
          </div>
          ` : ''}
        </div>

        <!-- Children Line Items Section (Highlighting Parent-Child Hierarchy) -->
        <div class="mb-4">
          <div class="flex items-center justify-between gap-2 mb-2 px-1">
            <div>
              <strong class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <i class="ri-git-commit-line text-teal-600 text-sm"></i> Children Line Items (${totalItems})
              </strong>
              <span class="text-[11px] text-slate-400 block">Itemized inventory intake linked to parent DR #${this.escapeHtml(refNo)}</span>
            </div>
            <span class="text-xs text-teal-700 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60 whitespace-nowrap">
              +${totalUnits} units total
            </span>
          </div>

          <div class="max-h-[220px] overflow-y-auto rounded-xl border border-slate-200/90 shadow-2xs">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="py-2.5 px-3 text-center">#</th>
                  <th class="py-2.5 px-3">Medicine & Batch</th>
                  <th class="py-2.5 px-3">Expiry</th>
                  <th class="py-2.5 px-3 text-center">Qty</th>
                  <th class="py-2.5 px-3 text-right">Cost</th>
                  <th class="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                ${itemsRows || '<tr><td colspan="6" class="text-center py-6 text-slate-400">No items attached to this receipt</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Grand Total Summary Bar -->
        <div class="flex justify-between items-center bg-gradient-to-r from-slate-50 to-teal-50/40 p-4 rounded-xl border border-slate-200 mb-4">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Delivery Valuation</div>
            <small class="text-[11px] text-slate-400 font-medium">${totalItems} line items · ${totalUnits} total units received</small>
          </div>
          <div class="text-xl font-extrabold text-teal-700 font-heading">
            ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <!-- Document Footer Actions -->
        <div class="flex items-center justify-between gap-3 pt-2">
          <button 
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer" 
            onclick="window.stockInController.printSlip('${logKey}')"
          >
            <i class="ri-printer-line text-sm text-slate-500"></i> Print Receiving Slip
          </button>
          <button 
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-500/20 transition cursor-pointer" 
            onclick="window.stockInController.viewModalDetails('${logKey}')"
          >
            <i class="ri-zoom-in-line text-sm"></i> Full Slip Dialog
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
