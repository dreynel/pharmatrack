/**
 * PharmaTrack - Suppliers & Purchase Orders Controller
 * Xyra Andrea Pharmacy - Pharmaceutical Distributor Directory & CRUD Management
 */

class SuppliersController {
  constructor() {
    this.suppliers = [];
    this.searchTerm = '';
    this.isInitialized = false;
  }

  async init() {
    if (!this.isInitialized) {
      this.bindEvents();
      this.isInitialized = true;
    }
    await this.loadSuppliers();
  }

  bindEvents() {
    // 1. Search input event
    const searchInput = document.getElementById('supplier-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.renderGrid();
      });
    }

    // 2. Add Supplier button
    const addBtn = document.getElementById('btn-open-supplier-modal');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.handleAddSupplier());
    }
  }

  async loadSuppliers() {
    const container = document.getElementById('suppliers-grid-container');
    if (container && this.suppliers.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; color: #64748b;">
          <i class="ri-loader-4-line" style="font-size: 2rem; color: var(--primary); display: inline-block; margin-bottom: 0.5rem;"></i>
          <p style="margin: 0; font-size: 0.9rem; font-weight: 600;">Loading accredited distributors &amp; suppliers...</p>
        </div>
      `;
    }

    try {
      const response = await window.api.getSuppliers();
      this.suppliers = Array.isArray(response) ? response : (response.suppliers || response.data || []);
      this.renderKpiSummary();
      this.renderGrid();
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      if (container) {
        container.innerHTML = `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; border: 1px solid #fecaca; background: #fff5f5;">
            <i class="ri-error-warning-line" style="font-size: 2.2rem; color: #ef4444; display: block; margin-bottom: 0.4rem;"></i>
            <p style="font-size: 0.92rem; font-weight: 700; color: #be123c; margin-bottom: 0.75rem;">Unable to fetch suppliers directory.</p>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="window.suppliersController.loadSuppliers()">
              <i class="ri-refresh-line"></i> Retry
            </button>
          </div>
        `;
      }
    }
  }

  async render() {
    await this.loadSuppliers();
  }

  renderKpiSummary() {
    const kpiContainer = document.getElementById('suppliers-kpi-summary');
    if (!kpiContainer) return;

    const totalSuppliers = this.suppliers.length;
    const totalDeliveries = this.suppliers.reduce((sum, s) => sum + Number(s.deliveries_count ?? 0), 0);
    const totalSuppliedCost = this.suppliers.reduce((sum, s) => sum + Number(s.total_supplied_cost ?? 0), 0);

    kpiContainer.innerHTML = `
      <div class="inv-mini-kpi">
        <div class="inv-mini-kpi-icon" style="background: rgba(2, 128, 144, 0.12); color: var(--primary);">
          <i class="ri-building-4-line"></i>
        </div>
        <div>
          <span class="inv-mini-kpi-label">Accredited Distributors</span>
          <h4 class="inv-mini-kpi-value">${totalSuppliers} <small style="font-size: 0.75rem; font-weight: 500; color: #64748b;">vendors</small></h4>
        </div>
      </div>

      <div class="inv-mini-kpi">
        <div class="inv-mini-kpi-icon" style="background: rgba(16, 185, 129, 0.12); color: #059669;">
          <i class="ri-truck-line"></i>
        </div>
        <div>
          <span class="inv-mini-kpi-label">Recorded Deliveries</span>
          <h4 class="inv-mini-kpi-value" style="color: #059669;">${totalDeliveries} <small style="font-size: 0.75rem; font-weight: 500; color: #64748b;">shipments</small></h4>
        </div>
      </div>

      <div class="inv-mini-kpi">
        <div class="inv-mini-kpi-icon" style="background: rgba(245, 158, 11, 0.12); color: #d97706;">
          <i class="ri-funds-box-line"></i>
        </div>
        <div>
          <span class="inv-mini-kpi-label">Total Supplied Value</span>
          <h4 class="inv-mini-kpi-value">₱${totalSuppliedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
        </div>
      </div>
    `;
  }

  renderGrid() {
    const container = document.getElementById('suppliers-grid-container');
    if (!container) return;

    let filtered = this.suppliers;
    if (this.searchTerm) {
      filtered = this.suppliers.filter(s => {
        const name = (s.name || '').toLowerCase();
        const contact = (s.contact_person || s.contact || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const address = (s.address || '').toLowerCase();
        return name.includes(this.searchTerm) ||
               contact.includes(this.searchTerm) ||
               phone.includes(this.searchTerm) ||
               email.includes(this.searchTerm) ||
               address.includes(this.searchTerm);
      });
    }

    if (filtered.length === 0) {
      if (this.searchTerm) {
        container.innerHTML = `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--bg-card-hover, #f1f5f9); color: var(--text-muted, #64748b); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.4rem;">
              <i class="ri-search-line"></i>
            </div>
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main, #1e293b); margin-bottom: 0.3rem;">No matching suppliers found</h4>
            <p style="font-size: 0.84rem; color: var(--text-muted, #64748b); max-width: 380px; margin: 0 auto 1rem;">
              No registered distributors match "<strong>${this.escapeHtml(this.searchTerm)}</strong>".
            </p>
            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('supplier-search-input').value=''; window.suppliersController.searchTerm=''; window.suppliersController.renderGrid();">
              Clear Search Filter
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; border: 1px dashed var(--border-color, #cbd5e1);">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(2, 128, 144, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; font-size: 1.6rem;">
              <i class="ri-building-4-line"></i>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main, #1e293b); margin-bottom: 0.3rem;">No Pharmaceutical Suppliers Registered</h4>
            <p style="font-size: 0.84rem; color: #64748b; max-width: 420px; margin: 0 auto 1rem;">
              Register accredited pharmaceutical manufacturers and wholesale distributors to track deliveries and purchase orders.
            </p>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.suppliersController.handleAddSupplier()">
              <i class="ri-add-line"></i> Register First Supplier
            </button>
          </div>
        `;
      }
      return;
    }

    container.innerHTML = filtered.map(s => {
      const id = Number(s.id);
      const activePOs = Number(s.purchase_orders_count ?? s.active_pos ?? s.activePOs ?? 0);
      const deliveriesCount = Number(s.deliveries_count ?? 0);
      const totalSupplied = Number(s.total_supplied_cost ?? 0);
      const lastDelivery = s.last_delivery_date || 'No deliveries yet';
      const contactPerson = s.contact_person || s.contact || 'Not specified';
      const phone = s.phone || 'Not provided';
      const email = s.email || 'Not provided';
      const address = s.address || 'Address not registered';

      return `
        <div class="glass-card" style="margin-bottom: 0; padding: 1.15rem 1.25rem; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div>
            <!-- Header: Icon, Supplier Name & Quick Edit/Delete Actions -->
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.9rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0;">
                <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(2, 128, 144, 0.1); color: var(--primary); border: 1px solid rgba(2, 128, 144, 0.2); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                  <i class="ri-building-4-line"></i>
                </div>
                <div style="min-width: 0;">
                  <h4 style="font-size: 0.98rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0 0 0.2rem 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${this.escapeHtml(s.name)}">
                    ${this.escapeHtml(s.name)}
                  </h4>
                  <span style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.7rem; font-weight: 700; color: #0f766e; background: rgba(0, 168, 150, 0.12); border: 1px solid rgba(0, 168, 150, 0.3); padding: 0.1rem 0.45rem; border-radius: 6px;">
                    <i class="ri-checkbox-circle-fill"></i> Accredited Distributor
                  </span>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  style="padding: 0.25rem 0.5rem; border-radius: 7px;"
                  title="Edit Supplier"
                  onclick="window.suppliersController.handleEditSupplier(${id})"
                >
                  <i class="ri-edit-line"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  style="padding: 0.25rem 0.5rem; border-radius: 7px;"
                  title="Delete Supplier"
                  onclick="window.suppliersController.handleDeleteSupplier(${id})"
                >
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>

            <!-- Contact Details List -->
            <div style="border-top: 1px solid rgba(100, 116, 139, 0.15); border-bottom: 1px solid rgba(100, 116, 139, 0.15); padding: 0.75rem 0; display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.82rem; color: var(--text-muted, #475569);">
              <div style="display: flex; align-items: center; gap: 0.55rem;">
                <i class="ri-user-star-line" style="color: #64748b; font-size: 0.95rem; width: 16px; text-align: center;"></i>
                <span style="color: #64748b;">Rep:</span>
                <strong style="color: var(--text-main, #1e293b); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(contactPerson)}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 0.55rem;">
                <i class="ri-phone-line" style="color: #64748b; font-size: 0.95rem; width: 16px; text-align: center;"></i>
                <span style="color: #64748b;">Phone:</span>
                <span style="font-weight: 600; color: var(--text-main, #334155);">${this.escapeHtml(phone)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.55rem;">
                <i class="ri-mail-line" style="color: #64748b; font-size: 0.95rem; width: 16px; text-align: center;"></i>
                <span style="color: #64748b;">Email:</span>
                ${s.email
                  ? `<a href="mailto:${this.escapeHtml(s.email)}" style="color: var(--primary); font-weight: 600; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(email)}</a>`
                  : `<span style="color: #94a3b8;">Not provided</span>`
                }
              </div>
              <div style="display: flex; align-items: flex-start; gap: 0.55rem;">
                <i class="ri-map-pin-line" style="color: #64748b; font-size: 0.95rem; width: 16px; text-align: center; margin-top: 1px;"></i>
                <span style="color: var(--text-muted, #64748b); line-height: 1.35;">${this.escapeHtml(address)}</span>
              </div>
            </div>

            <!-- Procurement Metrics Strip -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.75rem; background: var(--bg-card-hover, rgba(15, 23, 42, 0.85)); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 0.5rem 0.65rem; text-align: center;">
              <div>
                <div style="font-size: 0.68rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Deliveries</div>
                <div style="font-size: 0.88rem; font-weight: 800; color: #059669;">${deliveriesCount}</div>
              </div>
              <div style="border-left: 1px solid var(--border-color, #e2e8f0);">
                <div style="font-size: 0.68rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Supplied</div>
                <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-main, #0f172a);">₱${totalSupplied.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div style="margin-top: 0.85rem; padding-top: 0.65rem; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
            <small style="font-size: 0.74rem; color: #64748b;">
              <i class="ri-calendar-check-line"></i> Last Delivery: <strong>${this.escapeHtml(lastDelivery)}</strong>
            </small>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                style="font-size: 0.76rem; padding: 0.25rem 0.6rem;"
                onclick="window.suppliersController.handleViewDeliveries(${id})"
              >
                <i class="ri-truck-line"></i> Deliveries
              </button>
              <button
                type="button"
                class="btn btn-sm btn-primary"
                style="font-size: 0.76rem; padding: 0.25rem 0.65rem;"
                onclick="window.suppliersController.handleEditSupplier(${id})"
              >
                <i class="ri-settings-3-line"></i> Edit
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async handleViewDeliveries(id) {
    const supplier = this.suppliers.find(s => Number(s.id) === Number(id));
    if (!supplier) return;

    try {
      const logs = await window.api.getStockInLogs();
      const matched = (logs || []).filter(l =>
        (l.supplierName || l.supplier_name || '').toLowerCase() === (supplier.name || '').toLowerCase()
      );

      const rowsHtml = matched.length > 0
        ? matched.map(l => `
            <tr>
              <td><code style="font-weight: 700; color: var(--primary);">${this.escapeHtml(l.refNo || l.ref_no)}</code></td>
              <td>${this.escapeHtml(l.date)}</td>
              <td>${this.escapeHtml(l.receivedBy || l.received_by)}</td>
              <td style="text-align: center;"><strong>${(l.items || []).length}</strong></td>
              <td style="text-align: right; font-weight: 700; color: #059669;">₱${Number(l.totalCost ?? l.total_cost ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #64748b;">No Stock-In deliveries recorded for this supplier yet.</td></tr>`;

      Swal.fire({
        title: `🚚 Delivery History — ${supplier.name}`,
        width: '720px',
        html: `
          <div style="text-align: left;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.65rem 0.9rem; margin-bottom: 0.85rem; font-size: 0.82rem; color: #475569; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <span><strong>Contact:</strong> ${this.escapeHtml(supplier.contact_person || 'N/A')} (${this.escapeHtml(supplier.phone || 'N/A')})</span>
              <span><strong>Total Shipments:</strong> ${matched.length}</span>
            </div>
            <div style="max-height: 280px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <table class="custom-table" style="margin: 0; font-size: 0.82rem;">
                <thead>
                  <tr>
                    <th>Document #</th>
                    <th>Date</th>
                    <th>Received By</th>
                    <th style="text-align: center;">Items</th>
                    <th style="text-align: right;">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `,
        confirmButtonText: 'Close',
        confirmButtonColor: '#028090'
      });
    } catch (err) {
      SwalHelpers.toast('Unable to load delivery history.', 'error');
    }
  }

  async handleAddSupplier() {
    const result = await SwalHelpers.showSupplierModal();
    if (!result || !result.isConfirmed || !result.value) return;

    Swal.fire({
      title: 'Registering Supplier...',
      text: 'Adding distributor record to pharmacy database.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await window.api.addSupplier(result.value);
      Swal.close();
      SwalHelpers.toast('Supplier registered successfully!', 'success');
      await this.loadSuppliers();
      if (window.appController) {
        await window.appController.refreshAllModules();
      }
    } catch (err) {
      Swal.close();
      console.error('Failed to add supplier:', err);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.message || 'An error occurred while saving the supplier.'
      });
    }
  }

  async handleEditSupplier(id) {
    const supplier = this.suppliers.find(s => Number(s.id) === Number(id));
    if (!supplier) {
      SwalHelpers.toast('Supplier record not found.', 'error');
      return;
    }

    const result = await SwalHelpers.showSupplierModal(supplier);
    if (!result || !result.isConfirmed || !result.value) return;

    Swal.fire({
      title: 'Updating Supplier...',
      text: 'Updating distributor details...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await window.api.updateSupplier(id, result.value);
      Swal.close();
      SwalHelpers.toast('Supplier updated successfully!', 'success');
      await this.loadSuppliers();
      if (window.appController) {
        await window.appController.refreshAllModules();
      }
    } catch (err) {
      Swal.close();
      console.error('Failed to update supplier:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'An error occurred while updating supplier details.'
      });
    }
  }

  async handleDeleteSupplier(id) {
    const supplier = this.suppliers.find(s => Number(s.id) === Number(id));
    const supplierName = supplier ? supplier.name : 'this supplier';

    const confirm = await Swal.fire({
      title: 'Delete Supplier?',
      html: `Are you sure you want to remove <strong>${this.escapeHtml(supplierName)}</strong> from the supplier directory?<br><span style="color: #ef4444; font-size: 0.82rem; margin-top: 0.5rem; display: block;">This will permanently remove the distributor record.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: '<i class="ri-delete-bin-line"></i> Yes, Delete Supplier',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: 'Removing Supplier...',
      text: 'Deleting record from database...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await window.api.deleteSupplier(id);
      Swal.close();
      SwalHelpers.toast(`Supplier "${supplierName}" has been deleted.`, 'info');
      await this.loadSuppliers();
      if (window.appController) {
        await window.appController.refreshAllModules();
      }
    } catch (err) {
      Swal.close();
      console.error('Failed to delete supplier:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'An error occurred while deleting the supplier.'
      });
    }
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.SuppliersController = SuppliersController;
