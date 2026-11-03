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

    // Default landing view for cashier / staff is POS Terminal
    if (this.isRestrictedStaff && (this.currentView === 'dashboard' || this.currentView === 'inventory' || this.currentView === 'suppliers')) {
      this.currentView = 'pos';
    }

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
          this.currentUser = res.user;
          this.updateUserUI(res.user);
          this.applyRolePermissions(res.user);
          sessionStorage.removeItem('auth_redirect_attempt');
          return;
        }
      }
      
      // Prevent infinite redirect loops: only attempt redirect once per session
      const hasRedirected = sessionStorage.getItem('auth_redirect_attempt');
      if (!hasRedirected) {
        sessionStorage.setItem('auth_redirect_attempt', '1');
        window.location.replace('login.php');
      } else {
        // Fallback default admin profile in UI if redirect was already triggered
        const fallback = { name: 'Admin Pharmacist', role: 'admin' };
        this.currentUser = fallback;
        this.updateUserUI(fallback);
        this.applyRolePermissions(fallback);
      }
    } catch (e) {
      console.warn('Session check error:', e);
      // Fallback default profile instead of looping
      const fallback = { name: 'Admin Pharmacist', role: 'admin' };
      this.currentUser = fallback;
      this.updateUserUI(fallback);
      this.applyRolePermissions(fallback);
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
      const role = String(user.role).toLowerCase().trim();
      const isAdmin = role === 'admin' || role === 'manager';
      badgeEl.className = `user-role-badge ${isAdmin ? 'role-admin' : 'role-cashier'}`;
      let label = 'Staff';
      if (role === 'admin' || role === 'manager') label = 'Manager';
      else if (role === 'cashier') label = 'Cashier';
      badgeEl.innerHTML = `<i class="${isAdmin ? 'ri-shield-check-fill' : 'ri-user-star-line'}"></i> ${label}`;
    }

    if (avatarEl && user.name) {
      const parts = user.name.trim().split(' ');
      const initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
      avatarEl.textContent = initials || 'XA';
    }
  }

  applyRolePermissions(user) {
    const role = (user && user.role ? String(user.role).toLowerCase().trim() : 'admin');
    const isCashierOrStaff = (role === 'cashier' || role === 'staff');
    this.isRestrictedStaff = isCashierOrStaff;

    // Toggle body classes for CSS RBAC
    document.body.classList.toggle('role-cashier', role === 'cashier');
    document.body.classList.toggle('role-staff', role === 'staff');
    document.body.classList.toggle('role-cashier-staff', isCashierOrStaff);
    document.body.setAttribute('data-user-role', role);

    // Direct DOM manipulation fallback (in case browser lacks :has support)
    const stockCatalogNav = document.getElementById('nav-item-inventory') ||
      document.querySelector('.nav-item button[data-view="inventory"]')?.closest('.nav-item');
    const suppliersNav = document.getElementById('nav-item-suppliers') ||
      document.querySelector('.nav-item button[data-view="suppliers"]')?.closest('.nav-item');
    const dashViewInvBtn = document.getElementById('dash-view-inventory-btn');

    if (stockCatalogNav) {
      stockCatalogNav.style.display = isCashierOrStaff ? 'none' : '';
    }
    if (suppliersNav) {
      suppliersNav.style.display = isCashierOrStaff ? 'none' : '';
    }
    if (dashViewInvBtn) {
      dashViewInvBtn.style.display = isCashierOrStaff ? 'none' : '';
    }

    // Hide subnav catalog buttons in inventory tabs if present
    document.querySelectorAll('.inv-subnav-btn[data-view="inventory"], .inv-subnav-btn[data-inv-tab="catalog"]').forEach(btn => {
      btn.style.display = isCashierOrStaff ? 'none' : '';
    });

    // If currently on a restricted view, redirect to POS terminal
    if (isCashierOrStaff && (this.currentView === 'inventory' || this.currentView === 'suppliers')) {
      this.navigateTo('pos');
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

    // RBAC: Cashier & Staff accounts cannot access Stock Catalog or Suppliers
    if (this.isRestrictedStaff && (targetView === 'inventory' || targetView === 'suppliers')) {
      console.warn(`[RBAC] Access denied to '${targetView}' for cashier/staff.`);
      targetView = 'pos';
    }

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
        window.dashboardController && typeof window.dashboardController.render === 'function' 
          ? window.dashboardController.render() 
          : (this.loadDashboardStats ? this.loadDashboardStats() : Promise.resolve()),
        window.posController && typeof window.posController.refreshProducts === 'function' 
          ? window.posController.refreshProducts() 
          : Promise.resolve(),
        window.inventoryController && typeof window.inventoryController.render === 'function' 
          ? window.inventoryController.render() 
          : Promise.resolve(),
        window.stockInController && typeof window.stockInController.render === 'function' 
          ? window.stockInController.render() 
          : Promise.resolve(),
        window.stockOutController && typeof window.stockOutController.render === 'function' 
          ? window.stockOutController.render() 
          : Promise.resolve(),
        window.conversionController && typeof window.conversionController.render === 'function' 
          ? window.conversionController.render() 
          : Promise.resolve(),
        window.movementsController && typeof window.movementsController.render === 'function' 
          ? window.movementsController.render() 
          : Promise.resolve(),
        window.forecastController 
          ? (typeof window.forecastController.render === 'function' ? window.forecastController.render() : (typeof window.forecastController.renderForecastView === 'function' ? window.forecastController.renderForecastView() : Promise.resolve())) 
          : Promise.resolve(),
        window.salesController && typeof window.salesController.render === 'function' 
          ? window.salesController.render() 
          : Promise.resolve(),
        window.suppliersController && typeof window.suppliersController.render === 'function' 
          ? window.suppliersController.render() 
          : Promise.resolve(),
        window.reportsController && typeof window.reportsController.render === 'function' 
          ? window.reportsController.render() 
          : Promise.resolve()
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
        subtitle: 'Real-time sales, inventory status, and seasonal demand forecasting for Xyra Andrea Pharmacy'
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
        title: 'Demand Forecasting & Restocking',
        subtitle: 'Seasonal demand analysis, safety stock calculations, and suggested purchase orders'
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

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const getTxnDate = (t) => {
      if (!t || !t.timestamp) return null;
      const iso = t.timestamp.includes('T') ? t.timestamp : t.timestamp.replace(' ', 'T');
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    };

    const todayTxns = txns.filter(t => {
      const d = getTxnDate(t);
      return d && d.getFullYear() === todayYear && d.getMonth() === todayMonth && d.getDate() === todayDate;
    });

    let todaySalesTotal = 0;
    todayTxns.forEach(t => todaySalesTotal += Number(t.total || 0));

    const lowStockCount = products.filter(p => p.stock <= p.reorderPoint).length;
    const nearExpiryCount = products.filter(p => p.status === 'Expiring Soon').length;
    const totalItemsCount = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);

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
    this.renderSalesTrendChart(todayTxns);
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

  renderSalesTrendChart(todayTxns = []) {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    if (this.salesTrendChart) this.salesTrendChart.destroy();

    const labels = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'];
    const hourlyData = [0, 0, 0, 0, 0, 0, 0];

    const getTxnDate = (t) => {
      if (!t || !t.timestamp) return null;
      const iso = t.timestamp.includes('T') ? t.timestamp : t.timestamp.replace(' ', 'T');
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    };

    todayTxns.forEach(t => {
      const d = getTxnDate(t);
      if (!d) return;
      const hr = d.getHours();
      const amt = Number(t.total || 0);

      if (hr < 10) hourlyData[0] += amt;
      else if (hr < 12) hourlyData[1] += amt;
      else if (hr < 14) hourlyData[2] += amt;
      else if (hr < 16) hourlyData[3] += amt;
      else if (hr < 18) hourlyData[4] += amt;
      else if (hr < 20) hourlyData[5] += amt;
      else hourlyData[6] += amt;
    });

    const data = hourlyData.map(v => Math.round(v * 100) / 100);

    const isDark = document.body.classList.contains('cyber-theme') || document.documentElement.getAttribute('data-theme') === 'cyber';
    const chartTextColor = isDark ? '#f1f5f9' : '#0f172a';
    const chartTickColor = isDark ? '#94a3b8' : '#64748b';
    const chartGridColor = isDark ? 'rgba(0, 242, 254, 0.09)' : 'rgba(15, 23, 42, 0.05)';

    this.salesTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: "Today's Hourly Revenue (₱)",
          data: data,
          backgroundColor: '#00a896',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: chartTextColor, font: { weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: (context) => `₱${Number(context.raw || 0).toFixed(2)}`
            }
          }
        },
        scales: {
          x: { grid: { color: chartGridColor }, ticks: { color: chartTickColor } },
          y: { 
            beginAtZero: true,
            grid: { color: chartGridColor }, 
            ticks: { 
              color: chartTickColor,
              callback: (value) => '₱' + Number(value).toLocaleString()
            } 
          }
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
    if (window.conversionController) {
      window.conversionController.searchHistory = searchQuery.toLowerCase().trim();
      return window.conversionController.renderHistoryTable();
    }
  }

  // Quick 1-click conversion helper
  async quickUnboxOne(bulkId) {
    if (window.conversionController) {
      return window.conversionController.quickUnboxOne(bulkId);
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
      container.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 2rem;">No stock movements recorded.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(m => {
      let badgeClass = 'badge-stockin';
      let typeLabel = 'STOCK IN';

      if (m.type === 'STOCK_OUT') {
        badgeClass = 'badge-stockout';
        typeLabel = 'STOCK OUT';
      } else if (m.type === 'POS_SALE' || m.type === 'POS') {
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
      const batchDisplay = (m.batchNo || m.batch_no) ? `
        <span class="badge-pill" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; font-weight: 700; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
          <i class="ri-barcode-box-line"></i> ${m.batchNo || m.batch_no}
        </span>
        ${(m.expiryDate || m.expiry_date) ? `<div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;"><i class="ri-calendar-line"></i> Exp: ${m.expiryDate || m.expiry_date}</div>` : ''}
      ` : `<span style="color: #94a3b8; font-size: 0.75rem;">—</span>`;

      return `
        <tr>
          <td><code style="font-weight: bold; color: var(--text-muted);">${m.id}</code></td>
          <td>${m.timestamp}</td>
          <td><strong>${m.productName}</strong></td>
          <td>${batchDisplay}</td>
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
    if (window.salesController && typeof window.salesController.render === 'function') {
      return await window.salesController.render();
    }
    const txns = await window.mockApi.getTransactions();
    const container = document.getElementById('sales-table-body');
    if (!container) return;

    if (txns.length === 0) {
      container.innerHTML = `<tr><td colspan="8" style="text-align: center;">No transactions logged yet.</td></tr>`;
      return;
    }

    container.innerHTML = txns.map(t => `
      <tr>
        <td><strong style="color: var(--primary);">${t.id}</strong></td>
        <td>${t.timestamp}</td>
        <td>${t.cashier}</td>
        <td>${t.customerName || 'Walk-in'}</td>
        <td>${t.items ? t.items.length : 0} items</td>
        <td><span class="badge-pill badge-info">${t.paymentMethod}</span></td>
        <td style="font-weight: 800; color: #10b981;">₱${parseFloat(t.total || 0).toFixed(2)}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline btn-view-receipt" onclick="window.appController.viewReceipt('${t.id}')">
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
    // All modular views (inventory, stock-in, stock-out, conversion, movements,
    // suppliers, forecast, pos) bind their own view-specific buttons and search inputs
    // within their respective controller init() lifecycle.
    // Keeping this hook clean prevents duplicate event registration and double-modal triggers.
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

  // Refresh all state, dashboard cards, POS grid, and inventory tables dynamically in real-time
  async refreshAllInventory() {
    await this.refreshAllModules();
  }

  async viewReceipt(txn) {
    if (window.salesController && typeof window.salesController.viewReceipt === 'function') {
      return await window.salesController.viewReceipt(txn);
    }
    SwalHelpers.showReceiptModal(txn);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
  window.appController.init();
});
