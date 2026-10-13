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
        <div class="col-span-full py-12 text-center text-slate-400">
          <div class="inline-block animate-spin text-2xl mb-2"><i class="ri-loader-4-line text-teal-600"></i></div>
          <p class="text-sm font-medium">Loading registered distributors & suppliers...</p>
        </div>
      `;
    }

    try {
      const response = await window.api.getSuppliers();
      this.suppliers = Array.isArray(response) ? response : (response.suppliers || []);
      this.renderGrid();
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      if (container) {
        container.innerHTML = `
          <div class="col-span-full py-10 text-center text-rose-500 bg-rose-50/50 rounded-xl border border-rose-200">
            <i class="ri-error-warning-line text-3xl mb-2"></i>
            <p class="text-sm font-semibold">Unable to fetch suppliers list.</p>
            <button class="btn btn-outline btn-sm mt-3" onclick="window.suppliersController.loadSuppliers()">
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
          <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div class="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              <i class="ri-search-line"></i>
            </div>
            <h4 class="text-base font-bold text-slate-700">No matching suppliers found</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No registered suppliers match "<strong>${this.escapeHtml(this.searchTerm)}</strong>". Try checking spelling or search by another keyword.
            </p>
            <button class="btn btn-outline btn-sm mt-4" onclick="document.getElementById('supplier-search-input').value=''; window.suppliersController.searchTerm=''; window.suppliersController.renderGrid();">
              Clear Search Filter
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm p-8">
            <div class="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
              <i class="ri-building-4-line"></i>
            </div>
            <h4 class="text-lg font-bold text-slate-800">No Pharmaceutical Suppliers Registered</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Maintain an accredited directory of drug manufacturers, wholesale distributors, and medical reps to streamline procurement and purchase orders.
            </p>
            <button class="btn btn-primary mt-4" onclick="window.suppliersController.handleAddSupplier()">
              <i class="ri-add-line"></i> Register First Supplier
            </button>
          </div>
        `;
      }
      return;
    }

    container.innerHTML = filtered.map(s => {
      const activePOs = s.purchase_orders_count ?? s.active_pos ?? s.activePOs ?? 0;
      const contactPerson = s.contact_person || s.contact || 'No contact person';
      const phone = s.phone || 'No phone provided';
      const email = s.email || 'No email provided';
      const address = s.address || 'Address not registered';

      return `
        <div class="glass-card hover:shadow-md transition-all duration-200 border border-slate-200/80 bg-white/95 rounded-2xl p-5 flex flex-col justify-between" style="margin-bottom: 0;">
          <!-- Top Section: Header & Actions -->
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 border border-teal-200 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                  <i class="ri-building-4-line"></i>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-base leading-snug line-clamp-1" title="${this.escapeHtml(s.name)}">
                    ${this.escapeHtml(s.name)}
                  </h4>
                  <span class="inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 font-semibold px-2 py-0.5 rounded-md mt-0.5 border border-teal-200/50">
                    <i class="ri-checkbox-circle-fill text-[10px]"></i> Accredited Vendor
                  </span>
                </div>
              </div>

              <!-- Action Menu: Edit & Delete buttons -->
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 flex items-center justify-center transition-colors"
                  title="Edit Supplier"
                  onclick="window.suppliersController.handleEditSupplier(${s.id})"
                >
                  <i class="ri-edit-line text-base"></i>
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                  title="Delete Supplier"
                  onclick="window.suppliersController.handleDeleteSupplier(${s.id})"
                >
                  <i class="ri-delete-bin-line text-base"></i>
                </button>
              </div>
            </div>

            <!-- Details Section -->
            <div class="space-y-2 py-2 border-y border-slate-100 text-xs text-slate-600">
              <div class="flex items-center gap-2">
                <i class="ri-user-star-line text-slate-400 text-sm flex-shrink-0"></i>
                <span class="truncate font-medium text-slate-700">${this.escapeHtml(contactPerson)}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="ri-phone-line text-slate-400 text-sm flex-shrink-0"></i>
                <span class="truncate">${this.escapeHtml(phone)}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="ri-mail-line text-slate-400 text-sm flex-shrink-0"></i>
                <a href="${email !== 'No email provided' ? 'mailto:' + this.escapeHtml(email) : '#'}" class="truncate text-teal-600 hover:underline">
                  ${this.escapeHtml(email)}
                </a>
              </div>
              <div class="flex items-start gap-2">
                <i class="ri-map-pin-line text-slate-400 text-sm flex-shrink-0 mt-0.5"></i>
                <span class="line-clamp-2 leading-relaxed text-slate-500">${this.escapeHtml(address)}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Footer: PO Count & Quick Order -->
          <div class="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
            <div class="text-[11px] text-slate-500">
              <span class="font-bold text-slate-700">${activePOs}</span> Active PO(s)
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                onclick="window.suppliersController.handleEditSupplier(${s.id})"
              >
                <i class="ri-settings-3-line"></i> Manage
              </button>
              <button
                type="button"
                class="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1"
                onclick="SwalHelpers.toast('Connecting to ${this.escapeHtml(s.name)} portal...', 'info')"
              >
                <i class="ri-send-plane-line"></i> Contact
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
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
    const supplier = this.suppliers.find(s => s.id === id);
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
    const supplier = this.suppliers.find(s => s.id === id);
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
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.SuppliersController = SuppliersController;
