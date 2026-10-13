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
      container.innerHTML = `<tr><td colspan="6" class="text-center text-slate-500 py-10"><i class="ri-delete-bin-line text-3xl block mb-2 text-slate-400"></i>No Stock Out records found matching your query.</td></tr>`;
      if (docContainer) {
        docContainer.innerHTML = `
          <div class="doc-empty-state bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
            <i class="ri-delete-bin-line text-4xl block mb-3 text-slate-300"></i>
            <h4 class="text-base font-bold text-slate-800 mb-1">No Disposal Voucher Selected</h4>
            <p class="text-xs text-slate-500 max-w-xs mx-auto mb-4">Click on any disposal voucher on the right to inspect its itemized batch write-offs, or record a new stock deduction.</p>
            <button class="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition" onclick="window.stockOutController.handleStockOutModal()">
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
      const totalLossValuation = log.total_amount != null ? Number(log.total_amount) : items.reduce((acc, i) => acc + (Number(i.quantity ?? i.qty ?? 0) * Number(i.cost_price ?? i.costPrice ?? i.cost ?? 0)), 0);

      let badgeClasses = 'text-red-700 bg-red-50 border-red-200';
      const reasonLower = reason.toLowerCase();
      if (reasonLower.includes('damaged')) badgeClasses = 'text-amber-700 bg-amber-50 border-amber-200';
      else if (reasonLower.includes('internal') || reasonLower.includes('clinic')) badgeClasses = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      else if (reasonLower.includes('supplier') || reasonLower.includes('rtv')) badgeClasses = 'text-blue-700 bg-blue-50 border-blue-200';

      return `
        <tr class="stock-selectable-row cursor-pointer transition-all duration-150 ${isSelected ? 'active-stockout-row bg-red-50/80 border-l-4 border-red-500 shadow-xs' : 'hover:bg-slate-50'}" 
            data-log-id="${logKey}"
            onclick="window.stockOutController.selectRecord('${logKey}')"
            title="Click to view children batches and voucher details in left panel">
          <td class="py-3 px-3.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-xs font-bold text-red-600">${this.escapeHtml(refNo)}</span>
              <span class="stockout-active-badge-slot">
                ${isSelected ? '<span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded shadow-xs">← Viewing Children</span>' : ''}
              </span>
            </div>
          </td>
          <td class="text-xs text-slate-600 py-3 px-3.5 whitespace-nowrap">${log.date}</td>
          <td class="py-3 px-3.5">
            <span class="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses} whitespace-nowrap">
              ${this.escapeHtml(reason)}
            </span>
          </td>
          <td class="py-3 px-3.5 font-bold text-xs text-red-600 whitespace-nowrap">
            ₱${totalLossValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td class="py-3 px-3.5 text-xs text-slate-700 font-medium whitespace-nowrap line-clamp-1" title="${this.escapeHtml(authBy)}">
            ${this.escapeHtml(authBy)}
          </td>
          <td class="py-3 px-2 text-right whitespace-nowrap" onclick="event.stopPropagation()">
            <div class="inline-flex items-center gap-1">
              <button type="button" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Edit Parent Voucher" onclick="window.stockOutController.editSelectedRecord('${logKey}')">
                <i class="ri-edit-line text-sm"></i>
              </button>
              <button type="button" class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Voucher (Restore Inventory)" onclick="window.stockOutController.deleteSelectedRecord('${logKey}')">
                <i class="ri-delete-bin-line text-sm"></i>
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
          row.classList.add('active-stockout-row', 'bg-red-50/80', 'border-l-4', 'border-red-500', 'shadow-xs');
          row.classList.remove('hover:bg-slate-50');
          const badgeSlot = row.querySelector('.stockout-active-badge-slot');
          if (badgeSlot) {
            badgeSlot.innerHTML = `<span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded shadow-xs">← Viewing Children</span>`;
          }
        } else {
          row.classList.remove('active-stockout-row', 'bg-red-50/80', 'border-l-4', 'border-red-500', 'shadow-xs');
          row.classList.add('hover:bg-slate-50');
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
    if (docContainer && window.innerWidth < 1024) {
      docContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderDocumentSlip(log) {
    const container = document.getElementById('stockout-document-container');
    if (!container) return;

    if (!log) {
      container.innerHTML = `
        <div class="doc-empty-state bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
          <i class="ri-delete-bin-line text-4xl block mb-3 text-slate-300"></i>
          <h4 class="text-base font-bold text-slate-800 mb-1">No Voucher Selected</h4>
          <p class="text-xs text-slate-500 max-w-xs mx-auto mb-4">Click on any disposal voucher on the right to inspect its batch and authorization breakdown.</p>
          <button class="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition" onclick="window.stockOutController.handleStockOutModal()">
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

    let badgeClasses = 'text-red-700 bg-red-50 border-red-200';
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('damaged')) badgeClasses = 'text-amber-700 bg-amber-50 border-amber-200';
    else if (reasonLower.includes('internal') || reasonLower.includes('clinic')) badgeClasses = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    else if (reasonLower.includes('supplier') || reasonLower.includes('rtv')) badgeClasses = 'text-blue-700 bg-blue-50 border-blue-200';

    const itemsRows = items.map((item, idx) => {
      const name = item.product_name || item.name || 'Unnamed Product';
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const cost = Number(item.cost_price ?? item.costPrice ?? item.cost ?? 0);
      const batchNo = item.batch_no || item.batchNo || 'N/A';
      const lineTotal = qty * cost;
      totalLossValuation += lineTotal;

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-2.5 px-3 text-slate-400 font-bold text-center w-8 text-xs">${idx + 1}</td>
          <td class="py-2.5 px-3">
            <strong class="text-slate-800 block text-xs font-semibold leading-snug">${this.escapeHtml(name)}</strong>
            <span class="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <i class="ri-qr-code-line text-slate-400"></i> Batch: <code class="font-mono text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-100">${this.escapeHtml(batchNo)}</code>
            </span>
          </td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <span class="inline-flex items-center gap-0.5 font-bold text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/50">
              -${qty} units
            </span>
          </td>
          <td class="py-2.5 px-3 text-right text-xs text-slate-600 whitespace-nowrap">₱${cost.toFixed(2)}</td>
          <td class="py-2.5 px-3 text-right text-xs font-bold text-red-700 whitespace-nowrap">₱${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="doc-slip doc-slip-danger bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 relative overflow-hidden transition-all duration-200">
        <!-- Top Colored Border Accent -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-700"></div>

        <!-- Document Parent Header & Action Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-200 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                Parent Voucher #${this.escapeHtml(refNo)}
              </span>
              <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses}">
                <i class="ri-close-circle-line"></i> ${this.escapeHtml(reason)}
              </span>
            </div>
            <h4 class="text-base font-extrabold text-slate-900 font-heading mt-1 flex items-center gap-2">
              <i class="ri-file-reduce-line text-red-600 text-lg"></i> Inventory Disposal Voucher
            </h4>
          </div>

          <!-- Parent Action Buttons: Add, Edit, Delete -->
          <div class="flex items-center gap-1.5">
            <button 
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition cursor-pointer"
              title="Record New Stock Out Voucher"
              onclick="window.stockOutController.handleStockOutModal()"
            >
              <i class="ri-add-line"></i> Record New
            </button>
            <button 
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition cursor-pointer"
              title="Edit Parent Voucher Details"
              onclick="window.stockOutController.editSelectedRecord('${logKey}')"
            >
              <i class="ri-edit-line text-slate-500"></i> Edit
            </button>
            <button 
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-red-600 rounded-lg text-xs font-bold border border-red-200 transition cursor-pointer"
              title="Delete Voucher (Restore Inventory)"
              onclick="window.stockOutController.deleteSelectedRecord('${logKey}')"
            >
              <i class="ri-delete-bin-line"></i> Delete
            </button>
          </div>
        </div>

        <!-- Document Parent Metadata Grid -->
        <div class="grid grid-cols-2 gap-3 bg-red-50/50 p-4 rounded-xl border border-red-100/70 mb-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Voucher Ref #</label>
            <span class="font-mono text-sm font-bold text-red-600">${this.escapeHtml(refNo)}</span>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date Authorized</label>
            <span class="text-xs font-semibold text-slate-700">${this.escapeHtml(date)}</span>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deduction Reason</label>
            <span class="text-xs font-semibold text-slate-900">${this.escapeHtml(reason)}</span>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Authorized Pharmacist</label>
            <span class="text-xs font-semibold text-slate-700 line-clamp-1">${this.escapeHtml(authorizedBy)}</span>
          </div>
          ${notes ? `
          <div class="col-span-2 pt-2 border-t border-red-100">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Audit & Disposal Notes</label>
            <span class="text-xs text-slate-600 font-medium">${this.escapeHtml(notes)}</span>
          </div>
          ` : ''}
        </div>

        <!-- Children Line Items Section (Highlighting Parent-Child Hierarchy) -->
        <div class="mb-4">
          <div class="flex items-center justify-between gap-2 mb-2 px-1">
            <div>
              <strong class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <i class="ri-git-commit-line text-red-600 text-sm"></i> Children Line Items (${totalItems})
              </strong>
              <span class="text-[11px] text-slate-400 block">Itemized medication write-offs linked to voucher #${this.escapeHtml(refNo)}</span>
            </div>
            <span class="text-xs text-red-700 font-bold bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200/60 whitespace-nowrap">
              -${totalUnits} units total
            </span>
          </div>

          <div class="max-h-[220px] overflow-y-auto rounded-xl border border-slate-200/90 shadow-2xs">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th class="py-2.5 px-3 text-center">#</th>
                  <th class="py-2.5 px-3">Medicine & Batch</th>
                  <th class="py-2.5 px-3 text-center">Pulled Qty</th>
                  <th class="py-2.5 px-3 text-right">Unit Cost</th>
                  <th class="py-2.5 px-3 text-right">Loss Valuation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                ${itemsRows || '<tr><td colspan="5" class="text-center py-6 text-slate-400">No write-off items attached</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Grand Total Summary Bar -->
        <div class="flex justify-between items-center bg-gradient-to-r from-red-50/70 to-rose-50/40 p-4 rounded-xl border border-red-200/80 mb-4">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Write-Off Valuation</div>
            <small class="text-[11px] text-slate-400 font-medium">${totalItems} line items · ${totalUnits} units removed from stock</small>
          </div>
          <div class="text-xl font-extrabold text-red-600 font-heading">
            ₱${totalLossValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <!-- Document Footer Actions -->
        <div class="flex items-center justify-between gap-3 pt-2">
          <button 
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer" 
            onclick="window.stockOutController.printSlip('${logKey}')"
          >
            <i class="ri-printer-line text-sm text-slate-500"></i> Print Disposal Slip
          </button>
          <button 
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-500/20 transition cursor-pointer" 
            onclick="window.stockOutController.viewModalDetails('${logKey}')"
          >
            <i class="ri-zoom-in-line text-sm"></i> Full Voucher Dialog
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
