/**
 * PharmaTrack - Main Application & Navigation Controller
 * PharmaTrack - Master Application & Navigation Router
 * Xyra Andrea Pharmacy - Sales & Inventory with Demand Forecasting
 * Upgraded with Stock In, Stock Out, Item Conversion & Stock Movement Ledger
 * Layered modular architecture conforming to professional standards
 */

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.activeInvTab = 'catalog';
    this.salesTrendChart = null;
    window.appController = this;
  }

  async init() {
    this.startClock();
    this.bindMobileDrawer();
    await this.initControllers();
    this.bindNavigation();
    this.bindInventorySubnav();
    this.bindGlobalShortcuts();

    // Initial render for active view
    await this.navigateTo(this.currentView);
  }

  async initControllers() {
    window.dashboardController = new window.DashboardController();
    window.posController = new window.PosController();
    window.inventoryController = new window.InventoryController();
    window.stockInController = new window.StockInController();
    window.stockOutController = new window.StockOutController();
    window.conversionController = new window.ConversionController();
    window.movementsController = new window.MovementsController();
    window.forecastController = new window.ForecastController();
    window.salesController = new window.SalesController();
    window.suppliersController = new window.SuppliersController();
    window.reportsController = new window.ReportsController();

    // Initialize all modular controllers
    await Promise.allSettled([
      window.dashboardController.init(),
      window.posController.init(),
      window.inventoryController.init(),
      window.stockInController.init(),
      window.stockOutController.init(),
      window.conversionController.init(),
      window.movementsController.init(),
      window.forecastController.init(),
      window.salesController.init(),
      window.suppliersController.init(),
      window.reportsController.init()
    ]);

    this.bindGlobalActions();
    this.bindAuthEvents();
    await this.checkSessionUser();
  }

  async checkSessionUser() {
    try {
      if (window.api && typeof window.api.getAuthUser === 'function') {
        const res = await window.api.getAuthUser();
        if (res && res.authenticated && res.user) {
          this.updateUserUI(res.user);
          return;
        }
      }
      // If not authenticated, redirect to login
      window.location.href = 'login.php';
    } catch (e) {
      window.location.href = 'login.php';
    }
  }

  updateUserUI(user) {
    const nameEl = document.querySelector('.user-details h4');
    const badgeEl = document.querySelector('.user-role-badge');
    const avatarEl = document.querySelector('.user-avatar');

    if (nameEl && user.name) {
      nameEl.textContent = user.name;
    }

    if (badgeEl && user.role) {
      const isAdmin = user.role.toLowerCase() === 'admin';
      badgeEl.className = `user-role-badge ${isAdmin ? 'role-admin' : 'role-cashier'}`;
      badgeEl.innerHTML = `<i class="${isAdmin ? 'ri-shield-check-fill' : 'ri-user-star-line'}"></i> ${isAdmin ? 'Manager' : 'Cashier'}`;
    }

    if (avatarEl && user.name) {
      const parts = user.name.trim().split(' ');
      const initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
      avatarEl.textContent = initials || 'XA';
    }
  }

  bindAuthEvents() {
    const handleLogout = async () => {
      const confirm = await Swal.fire({
        title: 'Sign Out Session?',
        text: 'Are you sure you want to end your current session?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Sign Out',
        cancelButtonText: 'Stay Logged In',
        reverseButtons: true
      });

      if (confirm.isConfirmed) {
        Swal.fire({
          title: 'Signing Out...',
          text: 'Safely terminating session credentials.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          if (window.api && typeof window.api.logout === 'function') {
            await window.api.logout();
          }
        } catch (err) {
          // Continue redirect
        }
        window.location.href = 'login.php';
      }
    };

    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    const headerLogoutBtn = document.getElementById('header-logout-btn');
    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);
    if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', handleLogout);
  }

  startClock() {
    const clockEl = document.getElementById('live-clock');
    const updateTime = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.innerHTML = `<i class="ri-time-line"></i> ${now.toLocaleTimeString()} | ${now.toLocaleDateString()}`;
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  bindMobileDrawer() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeSidebarBtn = document.getElementById('mobile-close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');

    const openSidebar = () => {
      if (sidebar) sidebar.classList.add('active');
      if (mobileOverlay) mobileOverlay.classList.add('active');
    };

    const closeSidebar = () => {
      if (sidebar) sidebar.classList.remove('active');
      if (mobileOverlay) mobileOverlay.classList.remove('active');
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('.nav-item button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
          closeSidebar();
        }
      });
    });
  }

  async navigateTo(targetView) {
    if (!targetView) return;
    this.currentView = targetView;

    // 1. Toggle navigation buttons active state (sidebar & subnav)
    document.querySelectorAll('.nav-item button').forEach(btn => {
      if (btn.getAttribute('data-view') === targetView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.inv-subnav-btn').forEach(btn => {
      const btnView = btn.getAttribute('data-view') || (btn.getAttribute('data-inv-tab') === 'catalog' ? 'inventory' : btn.getAttribute('data-inv-tab'));
      if (btnView === targetView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 2. Toggle main container view sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const activeSec = document.getElementById(`view-${targetView}`);
    if (activeSec) {
      activeSec.classList.add('active');
    }

    // 3. Update topbar header title and subtitle
    this.updateHeaderTitle(targetView);

    // 4. Dynamically load/render module data from live DB
    await this.renderView(targetView);

    // 5. Close mobile drawer on small screens
    if (window.innerWidth <= 992) {
      const sidebar = document.getElementById('sidebar');
      const mobileOverlay = document.getElementById('mobile-overlay');
      if (sidebar) sidebar.classList.remove('active');
      if (mobileOverlay) mobileOverlay.classList.remove('active');
    }

    // 6. Smooth scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindNavigation() {
    // Bind all buttons and elements with [data-view]
    document.querySelectorAll('[data-view]').forEach(elem => {
      elem.addEventListener('click', async (e) => {
        e.preventDefault();
        const targetView = elem.getAttribute('data-view');
        if (targetView) {
          await this.navigateTo(targetView);
        }
      });
    });

    // Also support any subnav buttons configured with data-inv-tab (that do not already have data-view)
    document.querySelectorAll('.inv-subnav-btn[data-inv-tab]:not([data-view])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-inv-tab');
        const targetView = (tab === 'catalog') ? 'inventory' : tab;
        await this.navigateTo(targetView);
      });
    });
  }

  bindInventorySubnav() {
    // Subnav delegation handled by bindNavigation and navigateTo
  }

  async renderView(view) {
    try {
      switch (view) {
        case 'dashboard':
          if (window.dashboardController) await window.dashboardController.render();
          break;
        case 'pos':
          if (window.posController) await window.posController.render();
          break;
        case 'sales':
          if (window.salesController) await window.salesController.render();
          break;
        case 'inventory':
          if (window.inventoryController) await window.inventoryController.render();
          break;
        case 'stock-in':
          if (window.stockInController) await window.stockInController.render();
          break;
        case 'stock-out':
          if (window.stockOutController) await window.stockOutController.render();
          break;
        case 'conversion':
          if (window.conversionController) await window.conversionController.render();
          break;
        case 'movements':
          if (window.movementsController) await window.movementsController.render();
          break;
        case 'forecast':
          if (window.forecastController) await window.forecastController.render();
          break;
        case 'suppliers':
          if (window.suppliersController) await window.suppliersController.render();
          break;
        case 'reports':
          if (window.reportsController) await window.reportsController.render();
          break;
        default:
          console.warn(`[AppController] Unknown view: ${view}`);
      }
    } catch (err) {
      console.error(`[AppController] Error rendering view ${view}:`, err);
    }
  }

  async refreshAllModules() {
    try {
      await Promise.allSettled([
        window.dashboardController ? window.dashboardController.render() : Promise.resolve(),
        window.posController ? window.posController.refreshProducts() : Promise.resolve(),
        window.inventoryController ? window.inventoryController.render() : Promise.resolve(),
        window.stockInController ? window.stockInController.render() : Promise.resolve(),
        window.stockOutController ? window.stockOutController.render() : Promise.resolve(),
        window.conversionController ? window.conversionController.render() : Promise.resolve(),
        window.movementsController ? window.movementsController.render() : Promise.resolve(),
        window.forecastController ? window.forecastController.render() : Promise.resolve(),
        window.salesController ? window.salesController.render() : Promise.resolve(),
        window.suppliersController ? window.suppliersController.render() : Promise.resolve(),
        window.reportsController ? window.reportsController.render() : Promise.resolve()
      ]);
    } catch (err) {
      console.error('[AppController] Error refreshing all modules:', err);
    }
  }

  updateHeaderTitle(view, titleEl, subtitleEl) {
    if (!titleEl) titleEl = document.getElementById('page-title-text');
    if (!subtitleEl) subtitleEl = document.getElementById('page-subtitle-text');
    const titles = {
      dashboard: {
        title: 'Pharmacy Analytics Overview',
        subtitle: 'Real-time sales, inventory status, and AI demand predictions for Xyra Andrea Pharmacy'
      },
      pos: {
        title: 'Point of Sale (POS) Terminal',
        subtitle: 'Fast checkout counter, barcode scanner, and thermal receipt generator'
      },
      inventory: {
        title: 'Medicine & Stock Management',
        subtitle: 'Catalog batches, UOM packaging, dosage forms, and unit pricing overview'
      },
      'stock-in': {
        title: 'Stock In (Goods Receiving)',
        subtitle: 'Direct supplier shipments, purchase receipt logs, and batch intake'
      },
      'stock-out': {
        title: 'Stock Out (Disposal & Write-Offs)',
        subtitle: 'Damaged goods, expired stock, and return requisitions ledger'
      },
      conversion: {
        title: 'Item Packaging Conversion',
        subtitle: 'Transform bulk boxes into retail blister strips and single unit pieces'
      },
      movements: {
        title: 'Stock Movement Audit Trail',
        subtitle: 'Complete chronological history of all inventory balance changes'
      },
      forecast: {
        title: 'AI Demand Forecasting',
        subtitle: 'Intelligent inventory prediction, safety stock calculation, and purchase orders'
      },
      sales: {
        title: 'Sales Logs & Transactions',
        subtitle: 'Complete transaction history and customer billing records'
      },
      suppliers: {
        title: 'Supplier & Purchase Orders',
        subtitle: 'Manage pharmaceutical distributors and supply requisitions'
      },
      reports: {
        title: 'Reports & Business Analytics',
        subtitle: 'Comprehensive financial, inventory valuation, and dispensing audits'
      }
    };

    if (titles[view]) {
      if (titleEl) titleEl.innerText = titles[view].title;
      if (subtitleEl) subtitleEl.innerText = titles[view].subtitle;
    }
  }

  async loadDashboardStats() {
    const products = await window.mockApi.getProducts();
    const txns = await window.mockApi.getTransactions();

    let todaySalesTotal = 0;
    txns.forEach(t => todaySalesTotal += t.total);

    const lowStockCount = products.filter(p => p.stock <= p.reorderPoint).length;
    const nearExpiryCount = products.filter(p => p.status === 'Expiring Soon').length;
    const totalItemsCount = products.reduce((acc, p) => acc + p.stock, 0);

    const salesKpi = document.getElementById('kpi-today-sales');
    const lowStockKpi = document.getElementById('kpi-low-stock');
    const expiryKpi = document.getElementById('kpi-near-expiry');
    const totalItemsKpi = document.getElementById('kpi-total-items');
    const alertBadge = document.getElementById('alert-notification-badge');

    if (salesKpi) salesKpi.innerText = `₱${todaySalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (lowStockKpi) lowStockKpi.innerText = lowStockCount;
    if (expiryKpi) expiryKpi.innerText = nearExpiryCount;
    if (totalItemsKpi) totalItemsKpi.innerText = totalItemsCount.toLocaleString();
    if (alertBadge) alertBadge.innerText = lowStockCount + nearExpiryCount;

    this.renderDashboardLowStockTable(products.filter(p => p.stock <= p.reorderPoint || p.status === 'Expiring Soon'));
    this.renderSalesTrendChart(txns);
  }

  renderDashboardLowStockTable(alertProducts) {
    const container = document.getElementById('dash-low-stock-table-body');
    if (!container) return;

    if (alertProducts.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #10b981; padding: 1.5rem;">All stock levels are optimal!</td></tr>`;
      return;
    }

    container.innerHTML = alertProducts.map(p => {
      let badgeClass = 'badge-warning';
      if (p.stock <= 0) badgeClass = 'badge-danger';

      return `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td><span class="badge-pill badge-info">${p.category}</span></td>
          <td><strong>${p.stock}</strong> ${p.uom || 'units'}</td>
          <td><span class="badge-pill ${badgeClass}">${p.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="window.appController.quickRestock(${p.id})">
              <i class="ri-add-line"></i> Restock
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderSalesTrendChart(txns) {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    if (this.salesTrendChart) this.salesTrendChart.destroy();

    this.salesTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'],
        datasets: [{
          label: "Today's Hourly Revenue (₱)",
          data: [1200, 3400, 5600, 4200, 6800, 7500, 3100],
          backgroundColor: '#00a896',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#0f172a', font: { weight: 'bold' } } }
        },
        scales: {
          x: { grid: { color: 'rgba(15, 23, 42, 0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(15, 23, 42, 0.05)' }, ticks: { color: '#64748b' } }
        }
      }
    });
  }

  // =========================================================================
  // 1. INVENTORY CATALOG & BATCHES PANE
  // =========================================================================
  async renderInventoryCatalog(searchQuery = '') {
    const products = await window.mockApi.getProducts();
    const container = document.getElementById('inventory-table-body');
    if (!container) return;

    const filtered = products.filter(p => {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             p.genericName.toLowerCase().includes(q) ||
             p.sku.toLowerCase().includes(q) ||
             (p.batchNo && p.batchNo.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 2rem;">No medicines found in inventory catalog.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(p => {
      let badgeClass = 'badge-success';
      if (p.stock <= 0) badgeClass = 'badge-danger';
      else if (p.stock <= p.reorderPoint) badgeClass = 'badge-warning';

      const isBulkPill = p.isBulk ? `<span class="badge-pill badge-info" style="font-size: 0.7rem; margin-left: 4px;">BULK</span>` : '';

      return `
        <tr>
          <td><code style="color: var(--primary); font-weight: bold;">${p.sku}</code></td>
          <td>
            <strong>${p.name}</strong> ${isBulkPill}<br>
            <small style="color: var(--text-muted);">${p.genericName}</small>
          </td>
          <td><span class="badge-pill badge-info">${p.category}</span></td>
          <td><strong style="color: #475569;">${p.uom || 'Tablet'}</strong></td>
          <td>
            <strong>₱${p.unitPrice.toFixed(2)}</strong><br>
            <small style="color: var(--text-muted);">Cost: ₱${p.costPrice.toFixed(2)}</small>
          </td>
          <td>
            <strong style="font-size: 0.95rem;">${p.stock}</strong> <span style="font-size: 0.78rem; color: #64748b;">${p.uom || 'units'}</span>
          </td>
          <td><code>${p.batchNo || 'N/A'}</code></td>
          <td>${p.expiryDate || 'N/A'}</td>
          <td><span class="badge-pill ${badgeClass}">${p.status}</span></td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-sm btn-outline" title="Restock Stock" onclick="window.appController.quickRestock(${p.id})">
                <i class="ri-add-line"></i> Restock
              </button>
              ${p.isBulk ? `
                <button class="btn btn-sm btn-primary" title="Unbox / Convert" onclick="window.appController.handleItemConversionModal(${p.id})">
                  <i class="ri-swap-line"></i> Unbox
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 2. STOCK IN (RECEIVING) PANE
  // =========================================================================
  async renderStockInView(searchQuery = '') {
    if (window.stockInController) {
      window.stockInController.searchQuery = searchQuery.toLowerCase().trim();
      return window.stockInController.render();
    }
  }

  async refreshAllModules() {
    // Keep all controllers synchronized
    if (window.dashboardController) await window.dashboardController.loadStats();
    if (window.inventoryController) await window.inventoryController.render();
    if (window.stockInController) await window.stockInController.render();
    if (window.stockOutController) await window.stockOutController.render();
    if (window.conversionController) await window.conversionController.render();
    if (window.movementsController) await window.movementsController.render();
    if (window.forecastController) await window.forecastController.render();
    if (window.salesController) await window.salesController.render();
    if (window.reportsController) await window.reportsController.render();
    if (window.posController) await window.posController.refreshProducts();
  }

  viewStockInDetails(stockInRecord) {
    SwalHelpers.showStockInDetailModal(stockInRecord);
  }

  // =========================================================================
  // 3. STOCK OUT (DISPOSAL & PULL-OUTS) PANE
  // =========================================================================
  async renderStockOutView(searchQuery = '') {
    if (window.stockOutController) {
      window.stockOutController.searchQuery = searchQuery.toLowerCase().trim();
      return window.stockOutController.render();
    }
  }

  // =========================================================================
  // 4. ITEM CONVERSION (BULK BREAKDOWN) PANE
  // =========================================================================
  async renderConversionView(searchQuery = '') {
    const products = await window.mockApi.getProducts();
    const logs = await window.mockApi.getConversionLogs();
    
    // 1. Render Quick Conversion Action Cards
    const cardsContainer = document.getElementById('conversion-quick-cards');
    if (cardsContainer) {
      const bulkProducts = products.filter(p => p.isBulk && p.childProductId);
      
      cardsContainer.innerHTML = bulkProducts.map(bulk => {
        const retail = products.find(p => p.id === bulk.childProductId) || { name: 'Retail Tablet', stock: 0, uom: 'Tablet' };
        const rate = bulk.conversionRate || 100;

        return `
          <div class="conversion-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="badge-pill badge-info" style="font-size: 0.7rem; margin-bottom: 0.4rem;">Bulk Pack Link</span>
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0;">${bulk.name}</h4>
              </div>
              <span class="badge-pill badge-success" style="font-size: 0.75rem;">1 : ${rate}</span>
            </div>

            <div class="conversion-card-flow">
              <div class="conversion-flow-node">
                <strong>${bulk.stock} ${bulk.uom}</strong>
                <small>Wholesale Bulk</small>
              </div>
              <div class="conversion-arrow">➔</div>
              <div class="conversion-flow-node" style="text-align: right;">
                <strong style="color: #10b981;">${retail.stock} ${retail.uom}</strong>
                <small>${retail.name.split(' ')[0]} Retail</small>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-outline" style="flex: 1;" onclick="window.appController.handleItemConversionModal(${bulk.id})">
                <i class="ri-settings-4-line"></i> Custom
              </button>
              <button class="btn btn-sm btn-primary" style="flex: 1;" onclick="window.appController.quickUnboxOne(${bulk.id})">
                <i class="ri-inbox-unarchive-line"></i> Unbox 1 Box
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Render Conversion History Table
    const tableContainer = document.getElementById('conversion-table-body');
    if (!tableContainer) return;

    const filtered = logs.filter(l => {
      const q = searchQuery.toLowerCase();
      return l.id.toLowerCase().includes(q) ||
             l.sourceProductName.toLowerCase().includes(q) ||
             l.targetProductName.toLowerCase().includes(q) ||
             l.operator.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      tableContainer.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 2rem;">No conversion operations logged.</td></tr>`;
      return;
    }

    tableContainer.innerHTML = filtered.map(log => `
      <tr>
        <td><strong style="color: var(--primary);">${log.id}</strong></td>
        <td>${log.date}</td>
        <td>
          <span class="badge-pill badge-warning" style="font-weight: 700;">-${log.sourceQty} ${log.sourceUom || 'Box'}</span><br>
          <small style="color: var(--text-main); font-weight: 600;">${log.sourceProductName}</small>
        </td>
        <td>
          <span class="badge-pill badge-success" style="font-weight: 700;">+${log.targetQty} ${log.targetUom || 'Tablet'}</span><br>
          <small style="color: var(--text-main); font-weight: 600;">${log.targetProductName}</small>
        </td>
        <td><span class="badge-pill badge-info">1 : ${log.multiplier}</span></td>
        <td>
          <code>${log.batchNo || 'N/A'}</code><br>
          <small style="color: var(--text-muted);">${log.expiryDate || 'N/A'}</small>
        </td>
        <td>${log.operator}</td>
        <td><small style="color: var(--text-muted);">${log.notes || 'N/A'}</small></td>
      </tr>
    `).join('');
  }

  // Quick 1-click conversion helper
  async quickUnboxOne(bulkId) {
    const products = await window.mockApi.getProducts();
    const bulk = products.find(p => p.id === bulkId);
    if (!bulk) return;

    if (bulk.stock < 1) {
      SwalHelpers.toast(`${bulk.name} is out of stock!`, 'error');
      return;
    }

    const retail = products.find(p => p.id === bulk.childProductId);
    if (!retail) {
      SwalHelpers.toast('No linked retail product found', 'error');
      return;
    }

    const rate = bulk.conversionRate || 100;

    const confirm = await Swal.fire({
      title: '📦 Unbox 1 Bulk Container?',
      html: `
        <div style="text-align: left;">
          <p>You are about to unbox:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.8rem;">
            <strong>-1 ${bulk.uom}</strong> of ${bulk.name}<br>
            <span style="color: #10b981; font-weight: bold;">+${rate} ${retail.uom}</span> to ${retail.name}
          </div>
          <small style="color: #64748b;">Batch ${bulk.batchNo} and Expiry ${bulk.expiryDate} will be preserved.</small>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm Unbox',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      await window.mockApi.processItemConversion({
        sourceProductId: bulk.id,
        targetProductId: retail.id,
        sourceQty: 1,
        operator: 'Xyra Andrea (Pharmacist)',
        notes: `Quick 1-box conversion (+${rate} ${retail.uom})`
      });

      SwalHelpers.toast(`Unboxed 1 Box into +${rate} ${retail.uom}!`, 'success');
      await this.refreshAllInventory();
    }
  }

  // =========================================================================
  // 5. STOCK MOVEMENT AUDIT TRAIL LEDGER
  // =========================================================================
  async renderStockMovementsView(filterType = 'ALL', searchQuery = '') {
    const movements = await window.mockApi.getStockMovements();
    const container = document.getElementById('movement-table-body');
    if (!container) return;

    const filtered = movements.filter(m => {
      const matchType = filterType === 'ALL' || m.type === filterType;
      const q = searchQuery.toLowerCase();
      const matchSearch = m.productName.toLowerCase().includes(q) ||
                          m.referenceId.toLowerCase().includes(q) ||
                          m.remarks.toLowerCase().includes(q);
      return matchType && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2rem;">No stock movements recorded.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(m => {
      let badgeClass = 'badge-stockin';
      let typeLabel = 'STOCK IN';

      if (m.type === 'STOCK_OUT') {
        badgeClass = 'badge-stockout';
        typeLabel = 'STOCK OUT';
      } else if (m.type === 'POS_SALE') {
        badgeClass = 'badge-sale';
        typeLabel = 'POS SALE';
      } else if (m.type === 'CONVERT_IN') {
        badgeClass = 'badge-convert-in';
        typeLabel = 'CONVERT IN';
      } else if (m.type === 'CONVERT_OUT') {
        badgeClass = 'badge-convert-out';
        typeLabel = 'CONVERT OUT';
      }

      const isPositive = m.qtyChange > 0;
      const changeColor = isPositive ? '#10b981' : '#ef4444';
      const changePrefix = isPositive ? '+' : '';

      return `
        <tr>
          <td><code style="font-weight: bold; color: var(--text-muted);">${m.id}</code></td>
          <td>${m.timestamp}</td>
          <td><strong>${m.productName}</strong></td>
          <td><span class="badge-pill ${badgeClass}">${typeLabel}</span></td>
          <td>${m.previousStock}</td>
          <td><strong style="color: ${changeColor}; font-size: 0.95rem;">${changePrefix}${m.qtyChange}</strong></td>
          <td><strong>${m.newStock}</strong></td>
          <td><code style="color: var(--primary); font-weight: bold;">${m.referenceId}</code></td>
          <td><small style="color: var(--text-muted);">${m.remarks}</small></td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // TRANSACTIONS & SUPPLIERS VIEWS
  // =========================================================================
  async renderTransactionsTable() {
    const txns = await window.mockApi.getTransactions();
    const container = document.getElementById('sales-table-body');
    if (!container) return;

    if (txns.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center;">No transactions logged yet.</td></tr>`;
      return;
    }

    container.innerHTML = txns.map(t => `
      <tr>
        <td><strong style="color: var(--primary);">${t.id}</strong></td>
        <td>${t.timestamp}</td>
        <td>${t.cashier}</td>
        <td>${t.items.length} items</td>
        <td><span class="badge-pill badge-info">${t.paymentMethod}</span></td>
        <td style="font-weight: 800; color: #10b981;">₱${t.total.toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick='window.appController.viewReceipt(${JSON.stringify(t)})'>
            <i class="ri-file-paper-line"></i> View Receipt
          </button>
        </td>
      </tr>
    `).join('');
  }

  async renderSuppliersGrid() {
    const suppliers = await window.mockApi.getSuppliers();
    const container = document.getElementById('suppliers-grid-container');
    if (!container) return;

    container.innerHTML = suppliers.map(s => `
      <div class="glass-card" style="margin-bottom: 0;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
            <i class="ri-building-4-line"></i>
          </div>
          <div>
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${s.name}</h4>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${s.email}</span>
          </div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          <i class="ri-phone-line"></i> ${s.contact}<br>
          <i class="ri-file-list-3-line"></i> Active Orders: <strong>${s.activePOs} POs</strong>
        </p>
        <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="SwalHelpers.toast('Connected to distributor portal', 'info')">
          <i class="ri-mail-send-line"></i> Contact Distributor
        </button>
      </div>
    `).join('');
  }

  // =========================================================================
  // GLOBAL MODAL ACTIONS & LISTENERS
  // =========================================================================
  bindGlobalActions() {
    // 1. Add Medicine Button
    const addProductBtn = document.getElementById('add-medicine-btn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', async () => {
        const result = await SwalHelpers.showAddProductModal();
        if (result.isConfirmed && result.value) {
          await window.mockApi.addProduct(result.value);
          SwalHelpers.toast('New product registered!', 'success');
          await this.refreshAllInventory();
        }
      });
    }

    // 2. Open Stock In Modal Button
    const openStockInBtn = document.getElementById('btn-open-stockin-modal');
    if (openStockInBtn) {
      openStockInBtn.addEventListener('click', () => this.handleStockInModal());
    }

    // 3. Open Stock Out Modal Button
    const openStockOutBtn = document.getElementById('btn-open-stockout-modal');
    if (openStockOutBtn) {
      openStockOutBtn.addEventListener('click', () => this.handleStockOutModal());
    }

    // 4. Open Item Conversion Modal Button
    const openConvBtn = document.getElementById('btn-open-conversion-modal');
    if (openConvBtn) {
      openConvBtn.addEventListener('click', () => this.handleItemConversionModal());
    }

    // 5. Quick Shortcut Button from Catalog
    const quickConvertShortcut = document.getElementById('btn-quick-convert-shortcut');
    if (quickConvertShortcut) {
      quickConvertShortcut.addEventListener('click', () => {
        const convTabBtn = document.querySelector('[data-inv-tab="conversion"]');
        if (convTabBtn) convTabBtn.click();
      });
    }

    // 6. Search Inputs
    const invSearch = document.getElementById('inventory-search-input');
    if (invSearch) {
      invSearch.addEventListener('input', (e) => this.renderInventoryCatalog(e.target.value));
    }

    const stkinSearch = document.getElementById('stockin-search-input');
    if (stkinSearch) {
      stkinSearch.addEventListener('input', (e) => this.renderStockInView(e.target.value));
    }

    const stkoutSearch = document.getElementById('stockout-search-input');
    if (stkoutSearch) {
      stkoutSearch.addEventListener('input', (e) => this.renderStockOutView(e.target.value));
    }

    const convSearch = document.getElementById('conversion-search-input');
    if (convSearch) {
      convSearch.addEventListener('input', (e) => this.renderConversionView(e.target.value));
    }

    const movSearch = document.getElementById('movement-search-input');
    const movFilter = document.getElementById('movement-type-filter');

    const updateMovementTable = () => {
      const type = movFilter ? movFilter.value : 'ALL';
      const q = movSearch ? movSearch.value : '';
      this.renderStockMovementsView(type, q);
    };

    if (movSearch) movSearch.addEventListener('input', updateMovementTable);
    if (movFilter) movFilter.addEventListener('change', updateMovementTable);
  }

  // 7. Header POS Shortcut
  bindGlobalShortcuts() {
    const posShortcut = document.getElementById('header-pos-shortcut');
    if (posShortcut) {
      posShortcut.addEventListener('click', () => {
        document.querySelector('[data-view="pos"]').click();
        this.navigateTo('pos');
      });
    }
  }

  // Stock In Modal Workflow
  async handleStockInModal() {
    const products = await window.mockApi.getProducts();
    const suppliers = await window.mockApi.getSuppliers();

    const result = await SwalHelpers.showStockInModal(products, suppliers);
    if (result.isConfirmed && result.value) {
      await window.mockApi.processStockIn(result.value);
      SwalHelpers.toast(`Stock In recorded: ${result.value.refNo}`, 'success');
      await this.refreshAllInventory();
    }
  }

  // Stock Out Modal Workflow
  async handleStockOutModal() {
    const products = await window.mockApi.getProducts();

    const result = await SwalHelpers.showStockOutModal(products);
    if (result && result.isConfirmed && result.value) {
      await window.mockApi.processStockOut(result.value);
      SwalHelpers.toast(`Stock Out logged: ${result.value.refNo}`, 'warning');
      await this.refreshAllInventory();
    }
  }

  // Item Conversion Modal Workflow
  async handleItemConversionModal(preselectedId = null) {
    const products = await window.mockApi.getProducts();

    const result = await SwalHelpers.showItemConversionModal(products, preselectedId);
    if (result && result.isConfirmed && result.value) {
      await window.mockApi.processItemConversion(result.value);
      SwalHelpers.toast('Item converted successfully!', 'success');
      await this.refreshAllInventory();
    }
  }

  // Quick Restock from row
  async quickRestock(productId) {
    const product = await window.mockApi.getProductById(productId);
    if (!product) return;

    const result = await SwalHelpers.showRestockModal(product);
    if (result.isConfirmed && result.value) {
      await window.mockApi.updateProductStock(productId, result.value);
      SwalHelpers.toast(`Added +${result.value} ${product.uom || 'units'} to ${product.name}`, 'success');
      await this.refreshAllInventory();
    }
  }

  // Refresh all state, dashboard cards, POS grid, and inventory tables
  async refreshAllInventory() {
    await this.loadDashboardStats();
    await this.refreshActiveInventoryTab();
    if (window.posController) {
      window.posController.products = await window.mockApi.getProducts();
      window.posController.renderProductsGrid();
    }
    if (window.forecastController) {
      window.forecastController.renderForecastView();
    }
  }

  viewReceipt(txn) {
    SwalHelpers.showReceiptModal(txn);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
  window.appController.init();
});
