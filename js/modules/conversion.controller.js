/**
 * PharmaTrack - Item Conversion Controller
 * Xyra Andrea Pharmacy - Wholesale Bulk Unboxing & Repackaging into Retail UOM
 *
 * 2-Panel Split Architecture:
 *   - Left Panel: Conversion Settings & Rules (Tabular packaging ratios & quick unbox actions)
 *   - Right Panel: Conversion History (Audited ledger of all unboxing transactions)
 */

class ConversionController {
  constructor() {
    this.searchSettings = '';
    this.searchHistory = '';
  }

  async init() {
    if (!this.eventsBound) {
      this.bindEvents();
      this.eventsBound = true;
    }
    await this.render();
  }

  bindEvents() {
    // Left panel: Settings search
    const settingsSearch = document.getElementById('conversion-settings-search');
    if (settingsSearch) {
      settingsSearch.addEventListener('input', (e) => {
        this.searchSettings = e.target.value.toLowerCase().trim();
        this.renderSettingsTable();
      });
    }

    // Right panel: History search
    const historySearch = document.getElementById('conversion-search-input');
    if (historySearch) {
      historySearch.addEventListener('input', (e) => {
        this.searchHistory = e.target.value.toLowerCase().trim();
        this.renderHistoryTable();
      });
    }

    // Modal triggers
    const openConvBtn = document.getElementById('btn-open-conversion-modal');
    if (openConvBtn) {
      openConvBtn.addEventListener('click', () => this.handleItemConversionModal());
    }

    const addRuleBtn = document.getElementById('btn-add-conversion-rule');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => this.showRuleModal());
    }
  }

  async render() {
    const [products, logs] = await Promise.all([
      window.mockApi.getProducts().catch(() => []),
      window.mockApi.getConversionLogs().catch(() => [])
    ]);

    this.renderKPIs(products, logs);
    await this.renderSettingsTable(products);
    await this.renderHistoryTable(logs);
  }

  renderKPIs(products, logs) {
    const bulkProducts = (products || []).filter(p => p.isBulk && p.childProductId);
    const rulesCount = bulkProducts.length;
    const totalOps = (logs || []).length;
    const retailUnits = (logs || []).reduce((acc, l) => acc + (Number(l.targetQty) || 0), 0);

    const rulesEl = document.getElementById('conv-kpi-rules-count');
    if (rulesEl) rulesEl.innerText = rulesCount;

    const opsEl = document.getElementById('conv-kpi-total-ops');
    if (opsEl) opsEl.innerText = totalOps;

    const unitsEl = document.getElementById('conv-kpi-retail-units');
    if (unitsEl) unitsEl.innerText = retailUnits.toLocaleString();
  }

  async renderSettingsTable(passedProducts = null) {
    const tableBody = document.getElementById('conversion-settings-table-body');
    if (!tableBody) return;

    const products = passedProducts || await window.mockApi.getProducts().catch(() => []);
    const bulkProducts = (products || []).filter(p => p.isBulk && p.childProductId);

    const filtered = bulkProducts.filter(b => {
      if (!this.searchSettings) return true;
      const q = this.searchSettings;
      const retail = products.find(p => p.id === b.childProductId);
      return (
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.sku && b.sku.toLowerCase().includes(q)) ||
        (b.uom && b.uom.toLowerCase().includes(q)) ||
        (retail && retail.name && retail.name.toLowerCase().includes(q)) ||
        (retail && retail.uom && retail.uom.toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #64748b; padding: 2.5rem 1rem;">
            <i class="ri-settings-4-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>
            <strong>${this.searchSettings ? 'No matching conversion rules found.' : 'No conversion settings configured yet.'}</strong>
            <p style="font-size: 0.8rem; margin: 0.35rem 0 0.85rem; color: #94a3b8;">
              Link a wholesale bulk container (e.g. Box) to a retail dispensing unit (e.g. Tablet) to enable automated unit unboxing.
            </p>
            <button class="btn btn-sm btn-primary" onclick="window.conversionController.showRuleModal()">
              <i class="ri-add-line"></i> Link First Conversion Rule
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(bulk => {
      const retail = products.find(p => p.id === bulk.childProductId) || {
        name: 'Unlinked Retail Unit',
        stock: 0,
        uom: 'Units',
        sku: 'N/A'
      };
      const rate = SwalHelpers.parseRatio(bulk.conversionRate, 25);
      const bulkStock = Number(bulk.stock) || 0;
      const retailStock = Number(retail.stock) || 0;

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-main, #0f172a);">${this.escapeHtml(bulk.name)}</div>
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">
              <code>${this.escapeHtml(bulk.sku)}</code> · 
              <span class="badge-pill ${bulkStock > 0 ? 'badge-info' : 'badge-secondary'}" style="font-size: 0.72rem; padding: 0.15rem 0.45rem;">
                ${bulkStock} ${this.escapeHtml(bulk.uom)} on hand
              </span>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--text-main, #0f172a);">${this.escapeHtml(retail.name)}</div>
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">
              <code>${this.escapeHtml(retail.sku || 'N/A')}</code> · 
              <span class="badge-pill ${retailStock > 0 ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.72rem; padding: 0.15rem 0.45rem;">
                ${retailStock} ${this.escapeHtml(retail.uom)} on hand
              </span>
            </div>
          </td>
          <td style="text-align: center; vertical-align: middle;">
            <span class="badge-pill badge-teal" style="font-size: 0.78rem; font-weight: 700; padding: 0.25rem 0.6rem; white-space: nowrap;">
              1 ${this.escapeHtml(bulk.uom)} = ${rate} ${this.escapeHtml(retail.uom)}
            </span>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <div style="display: flex; gap: 0.35rem; justify-content: flex-end; align-items: center;">
              <button class="btn btn-sm btn-outline-primary" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 700;" onclick="window.conversionController.quickUnboxOne(${bulk.id})" title="Quick unbox 1 bulk container">
                <i class="ri-inbox-unarchive-line"></i> Unbox 1
              </button>
              <button class="btn btn-sm btn-outline" style="padding: 0.25rem 0.65rem; font-size: 0.76rem;" onclick="window.conversionController.handleItemConversionModal(${bulk.id})" title="Custom batch unboxing">
                <i class="ri-swap-line"></i> Convert
              </button>
              <button class="btn btn-sm btn-outline" style="padding: 0.25rem 0.45rem; color: #64748b;" onclick="window.conversionController.showRuleModal(${bulk.id})" title="Edit conversion ratio">
                <i class="ri-edit-line"></i>
              </button>
              <button class="btn btn-sm btn-outline" style="padding: 0.25rem 0.45rem; color: #ef4444; border-color: #fee2e2;" onclick="window.conversionController.unlinkRule(${bulk.id}, '${this.escapeHtml(bulk.name).replace(/'/g, "\\'")}')" title="Unlink rule">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async renderHistoryTable(passedLogs = null) {
    const tableBody = document.getElementById('conversion-table-body');
    if (!tableBody) return;

    const logs = passedLogs || await window.mockApi.getConversionLogs().catch(() => []);

    const filtered = (logs || []).filter(l => {
      if (!this.searchHistory) return true;
      const q = this.searchHistory;
      return (
        (l.id && l.id.toLowerCase().includes(q)) ||
        (l.sourceProductName && l.sourceProductName.toLowerCase().includes(q)) ||
        (l.targetProductName && l.targetProductName.toLowerCase().includes(q)) ||
        (l.batchNo && l.batchNo.toLowerCase().includes(q)) ||
        (l.operator && l.operator.toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: #64748b; padding: 2.5rem 1rem;">
            <i class="ri-history-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>
            <strong>${this.searchHistory ? 'No matching conversion history found.' : 'No conversion operations logged yet.'}</strong>
            <p style="font-size: 0.8rem; margin: 0.35rem 0 0; color: #94a3b8;">
              When you unbox bulk packages, the audited transactions and batch traceability details will appear here.
            </p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(log => `
      <tr>
        <td>
          <strong style="color: var(--primary); font-family: monospace; font-size: 0.84rem;">${this.escapeHtml(log.id)}</strong>
          <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">${this.escapeHtml(log.date)}</div>
        </td>
        <td>
          <span class="badge-pill badge-warning" style="font-weight: 700; font-size: 0.74rem;">-${log.sourceQty} ${this.escapeHtml(log.sourceUom || 'Box')}</span>
          <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-main, #0f172a); margin-top: 2px;">${this.escapeHtml(log.sourceProductName)}</div>
        </td>
        <td>
          <span class="badge-pill badge-success" style="font-weight: 700; font-size: 0.74rem;">+${log.targetQty} ${this.escapeHtml(log.targetUom || 'Tablet')}</span>
          <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-main, #0f172a); margin-top: 2px;">${this.escapeHtml(log.targetProductName)}</div>
        </td>
        <td>
          <code style="color: #00a896; font-size: 0.78rem;">${this.escapeHtml(log.batchNo || 'N/A')}</code>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Exp: ${this.escapeHtml(log.expiryDate || 'N/A')}</div>
        </td>
        <td>
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-main, #334155);">${this.escapeHtml(log.operator || 'Staff')}</div>
          ${log.notes ? `<div style="font-size: 0.72rem; color: #64748b; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(log.notes)}">${this.escapeHtml(log.notes)}</div>` : ''}
        </td>
      </tr>
    `).join('');
  }

  async showRuleModal(preselectedBulkId = null) {
    const products = await window.mockApi.getProducts().catch(() => []);
    if (!products || products.length < 2) {
      SwalHelpers.toast('Please register at least two products (one bulk packaging and one retail unit) first.', 'info');
      return;
    }

    const currentBulk = preselectedBulkId ? products.find(p => p.id === Number(preselectedBulkId)) : null;
    const currentTargetId = currentBulk ? currentBulk.childProductId : null;
    const currentRate = currentBulk ? SwalHelpers.parseRatio(currentBulk.conversionRate, 25) : 25;

    const bulkOptions = products.map(p => `
      <option value="${p.id}" ${currentBulk && currentBulk.id === p.id ? 'selected' : ''}>
        ${this.escapeHtml(p.name)} [${this.escapeHtml(p.uom || 'Unit')}] (${this.escapeHtml(p.sku)})
      </option>
    `).join('');

    const retailOptions = products.map(p => `
      <option value="${p.id}" ${currentTargetId === p.id ? 'selected' : ''}>
        ${this.escapeHtml(p.name)} [${this.escapeHtml(p.uom || 'Unit')}] (${this.escapeHtml(p.sku)})
      </option>
    `).join('');

    const html = `
      <div style="text-align: left; padding: 0.25rem 0;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 0.82rem; color: #166534;">
          <i class="ri-information-line"></i> <strong>Conversion Rule:</strong> Link a bulk packaging SKU (such as Box or Carton) to its corresponding retail dispensing unit (Tablet, Capsule, Sachet).
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; display: block; margin-bottom: 0.3rem;">Wholesale Bulk Packaging (Source Item) *</label>
          <select id="swal-rule-bulk" class="swal2-select" style="width: 100%; margin: 0; height: 38px; font-size: 0.85rem;">
            ${bulkOptions}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; display: block; margin-bottom: 0.3rem;">Retail Dispensing Unit (Target Item) *</label>
          <select id="swal-rule-retail" class="swal2-select" style="width: 100%; margin: 0; height: 38px; font-size: 0.85rem;">
            ${retailOptions}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; display: block; margin-bottom: 0.3rem;">Packaging Multiplier / Ratio (e.g. 1:25 or 25) *</label>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-weight: 700; color: #00a896; font-size: 0.9rem; white-space: nowrap;">1 Bulk Container =</span>
            <input type="text" id="swal-rule-rate" class="swal2-input" value="1:${currentRate}" placeholder="e.g. 1:25 or 25" style="width: 140px; margin: 0; height: 38px; font-size: 0.95rem; font-weight: 800; color: #00a896; text-align: center;">
            <span style="font-weight: 600; color: #64748b; font-size: 0.85rem;">Retail Units</span>
          </div>
        </div>
      </div>
    `;

    const result = await Swal.fire({
      title: currentBulk ? '⚙️ Edit Conversion Rule' : '⚙️ Configure New Conversion Rule',
      html,
      width: '680px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-save-line"></i> Save Conversion Rule',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const bulkId = parseInt(document.getElementById('swal-rule-bulk')?.value);
        const retailId = parseInt(document.getElementById('swal-rule-retail')?.value);
        const rateRaw = document.getElementById('swal-rule-rate')?.value;
        const rate = SwalHelpers.parseRatio(rateRaw, 25);

        if (!bulkId || !retailId) {
          Swal.showValidationMessage('Please select both the bulk item and retail item.');
          return false;
        }

        if (bulkId === retailId) {
          Swal.showValidationMessage('Source bulk item and target retail item cannot be the same product.');
          return false;
        }

        if (isNaN(rate) || rate < 1) {
          Swal.showValidationMessage('Conversion packaging ratio must be at least 1.');
          return false;
        }

        return { bulkId, retailId, rate };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        await window.mockApi.saveConversionRule({
          source_product_id: result.value.bulkId,
          target_product_id: result.value.retailId,
          conversion_rate: result.value.rate,
          multiplier: result.value.rate,
          ratio: `1:${result.value.rate}`
        });

        SwalHelpers.toast(`Conversion rule configured (1 = ${result.value.rate})!`, 'success');
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        SwalHelpers.toast(err.message || 'Failed to save conversion rule.', 'error');
      }
    }
  }

  async unlinkRule(bulkId, bulkName) {
    const confirm = await Swal.fire({
      title: 'Unlink Conversion Rule?',
      text: `Are you sure you want to remove the packaging conversion ratio for "${bulkName}"? The items will remain in the catalog, but bulk unboxing will be disabled for this item.`,
      icon: 'warning',
      width: '560px',
      showCancelButton: true,
      confirmButtonText: 'Yes, Unlink Rule',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        await window.mockApi.deleteConversionRule(bulkId);
        SwalHelpers.toast('Conversion rule unlinked.', 'success');
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        SwalHelpers.toast(err.message || 'Failed to unlink rule.', 'error');
      }
    }
  }

  async quickUnboxOne(bulkId) {
    const products = await window.mockApi.getProducts().catch(() => []);
    const bulk = products.find(p => p.id === bulkId);
    if (!bulk) return;

    if (bulk.stock < 1) {
      SwalHelpers.toast(`"${bulk.name}" is currently out of stock (${bulk.stock} ${bulk.uom}). Please receive stock in first.`, 'error');
      return;
    }

    const retail = products.find(p => p.id === bulk.childProductId);
    if (!retail) {
      SwalHelpers.toast('No linked retail product found for this bulk item.', 'error');
      return;
    }

    const rate = SwalHelpers.parseRatio(bulk.conversionRate, 25);
    let batches = [];
    try {
      batches = await window.mockApi.getProductBatches(bulk.id);
    } catch (e) {
      batches = [];
    }

    const batchOptionsHtml = (batches && batches.length > 0)
      ? batches.map((b, idx) => `
          <option value="${b.batchNo}" data-exp="${b.expiryDate}" data-stock="${b.availableStock}" ${idx === 0 ? 'selected' : ''}>
            ${idx === 0 ? '⭐ [FEFO Priority] ' : ''}${b.displayBatch} (Exp: ${b.expiryDate || 'N/A'} - Available: ${b.availableStock})
          </option>
        `).join('')
      : `<option value="${bulk.batchNo || 'GEN-BATCH'}" data-exp="${bulk.expiryDate || ''}" data-stock="${bulk.stock}">${bulk.batchNo || 'Default Batch'} (${bulk.stock} on hand)</option>`;

    const confirm = await Swal.fire({
      title: '📦 Unbox 1 Bulk Container',
      html: `
        <div style="text-align: left; padding: 0.25rem 0;">
          <p style="margin-bottom: 0.6rem; color: var(--text-muted, #94a3b8);">Select source batch to unbox and transfer directly into retail inventory:</p>
          <div style="background: var(--bg-card-hover, rgba(15, 23, 42, 0.85)); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 0.85rem;">
            <div style="font-weight: 700; color: #ef4444; font-size: 0.95rem;">-1 ${this.escapeHtml(bulk.uom)} <span style="color: var(--text-main, #0f172a); font-weight: 600;">of ${this.escapeHtml(bulk.name)}</span></div>
            <div style="font-weight: 700; color: #10b981; font-size: 0.95rem; margin-top: 0.25rem;">+${rate} ${this.escapeHtml(retail.uom)} <span style="color: var(--text-main, #0f172a); font-weight: 600;">to ${this.escapeHtml(retail.name)}</span></div>
          </div>
          
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; display: block; margin-bottom: 0.25rem;">Select Source Batch to Unbox (FEFO Priority):</label>
            <select id="quick-unbox-batch-select" class="swal2-select" style="width: 100%; margin: 0; font-size: 0.82rem; font-weight: 600;">
              ${batchOptionsHtml}
            </select>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.82rem; color: #1e40af;">
            <i class="ri-git-merge-line"></i> <strong>Batch Traceability:</strong> The selected source batch and its expiry date will be <strong>carried on</strong> to <span style="font-weight: 700;">${this.escapeHtml(retail.name)}</span> retail stock.
          </div>
        </div>
      `,
      width: '580px',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-inbox-unarchive-line"></i> Confirm Unbox',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const batchSelect = document.getElementById('quick-unbox-batch-select');
        const selectedOpt = batchSelect ? batchSelect.options[batchSelect.selectedIndex] : null;
        return {
          batchNo: selectedOpt ? selectedOpt.value : (bulk.batchNo || ''),
          expiryDate: selectedOpt ? (selectedOpt.getAttribute('data-exp') || '') : (bulk.expiryDate || '')
        };
      }
    });

    if (confirm.isConfirmed && confirm.value) {
      try {
        await window.mockApi.processItemConversion({
          sourceProductId: bulk.id,
          source_product_id: bulk.id,
          targetProductId: retail.id,
          target_product_id: retail.id,
          sourceQty: 1,
          source_qty: 1,
          from_qty: 1,
          targetQty: rate,
          target_qty: rate,
          to_qty: rate,
          multiplier: rate,
          conversionRate: rate,
          batchNo: confirm.value.batchNo,
          batch_no: confirm.value.batchNo,
          expiryDate: confirm.value.expiryDate,
          expiry_date: confirm.value.expiryDate,
          operator: 'Xyra Andrea (Pharmacist)',
          notes: `Quick 1-${bulk.uom} unboxing (+${rate} ${retail.uom}) [Batch: ${confirm.value.batchNo || 'N/A'}]`
        });

        SwalHelpers.toast(`Unboxed 1 ${bulk.uom} into +${rate} ${retail.uom} (Batch: ${confirm.value.batchNo || 'N/A'})!`, 'success');
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        SwalHelpers.toast(err.message || 'Conversion failed.', 'error');
      }
    }
  }

  async handleItemConversionModal(preselectedId = null) {
    const products = await window.mockApi.getProducts().catch(() => []);
    const result = await SwalHelpers.showItemConversionModal(products, preselectedId);

    if (result && result.isConfirmed && result.value) {
      try {
        await window.mockApi.processItemConversion(result.value);
        SwalHelpers.toast('Item converted successfully!', 'success');
        if (window.appController) {
          await window.appController.refreshAllModules();
        } else {
          await this.render();
        }
      } catch (err) {
        SwalHelpers.toast(err.message || 'Conversion failed.', 'error');
      }
    }
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

window.ConversionController = ConversionController;
