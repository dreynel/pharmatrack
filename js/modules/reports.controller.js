/**
 * PharmaTrack - Reports & Intelligence Controller
 * Xyra Andrea Pharmacy - Audited Reporting: Sales, Inventory Valuation, Losses & FSN Analysis
 * Features: Multi-Mode Date Filtering (Daily, Monthly, Date Range, Yearly, All Time), Crisp Printing, CSV Export
 */

class ReportsController {
  constructor() {
    this.currentReport = 'sales';
    this.filterMode = 'all'; // 'all', 'daily', 'monthly', 'range', 'yearly'
    this.searchQuery = '';

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    this.filterDaily = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    this.filterMonthly = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    this.filterRangeStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    this.filterRangeEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    this.filterYearly = String(now.getFullYear());
    this.availableYears = ['2026', '2025', '2024'];
  }

  async init() {
    if (!this.eventsBound) {
      this.bindEvents();
      this.eventsBound = true;
    }
    await this.discoverAvailableYears();
    this.initFilterInputs();
    await this.render();
  }

  async discoverAvailableYears() {
    try {
      const txns = await window.mockApi.getTransactions().catch(() => []);
      const yearsSet = new Set([String(new Date().getFullYear()), '2025', '2026']);
      txns.forEach(t => {
        const d = t.timestamp || t.created_at;
        if (d && d.length >= 4) {
          const yr = d.slice(0, 4);
          if (/^\d{4}$/.test(yr)) yearsSet.add(yr);
        }
      });
      this.availableYears = Array.from(yearsSet).sort((a, b) => b - a);

      const yearSelect = document.getElementById('report-filter-yearly-select');
      if (yearSelect) {
        yearSelect.innerHTML = this.availableYears.map(yr => 
          `<option value="${yr}" ${yr === this.filterYearly ? 'selected' : ''}>${yr}</option>`
        ).join('');
      }
    } catch (e) {
      console.warn('[ReportsController] discoverAvailableYears fallback:', e);
    }
  }

  initFilterInputs() {
    const dailyInput = document.getElementById('report-filter-daily-input');
    if (dailyInput && !dailyInput.value) dailyInput.value = this.filterDaily;

    const monthlyInput = document.getElementById('report-filter-monthly-input');
    if (monthlyInput && !monthlyInput.value) monthlyInput.value = this.filterMonthly;

    const startInput = document.getElementById('report-filter-start-date');
    if (startInput && !startInput.value) startInput.value = this.filterRangeStart;

    const endInput = document.getElementById('report-filter-end-date');
    if (endInput && !endInput.value) endInput.value = this.filterRangeEnd;

    const modeSelect = document.getElementById('report-filter-mode');
    if (modeSelect) modeSelect.value = this.filterMode;

    this.syncFilterControlsUI();
  }

  bindEvents() {
    // 1. Report Type Pills (Sales, Valuation, Losses, FSN)
    const pills = document.querySelectorAll('.report-pill-btn');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentReport = pill.getAttribute('data-report-type');
        this.render();
      });
    });

    // 2. Filter Mode Selector (All, Daily, Monthly, Date Range, Yearly)
    const modeSelect = document.getElementById('report-filter-mode');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.filterMode = e.target.value;
        this.syncFilterControlsUI();
        this.render();
      });
    }

    // Backwards-compat alias for any older #report-date-range element
    const legacyDateSelect = document.getElementById('report-date-range');
    if (legacyDateSelect) {
      legacyDateSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'today') {
          this.filterMode = 'daily';
        } else if (val === 'month') {
          this.filterMode = 'monthly';
        } else {
          this.filterMode = val;
        }
        if (modeSelect) modeSelect.value = this.filterMode;
        this.syncFilterControlsUI();
        this.render();
      });
    }

    // 3. Daily Date Picker
    const dailyInput = document.getElementById('report-filter-daily-input');
    if (dailyInput) {
      dailyInput.addEventListener('change', (e) => {
        if (e.target.value) {
          this.filterDaily = e.target.value;
          this.render();
        }
      });
    }

    // 4. Monthly Picker
    const monthlyInput = document.getElementById('report-filter-monthly-input');
    if (monthlyInput) {
      monthlyInput.addEventListener('change', (e) => {
        if (e.target.value) {
          this.filterMonthly = e.target.value;
          this.render();
        }
      });
    }

    // 5. Date Range Pickers (Start & End)
    const startInput = document.getElementById('report-filter-start-date');
    const endInput = document.getElementById('report-filter-end-date');
    if (startInput) {
      startInput.addEventListener('change', (e) => {
        this.filterRangeStart = e.target.value;
        this.render();
      });
    }
    if (endInput) {
      endInput.addEventListener('change', (e) => {
        this.filterRangeEnd = e.target.value;
        this.render();
      });
    }

    // 6. Yearly Selector
    const yearlySelect = document.getElementById('report-filter-yearly-select');
    if (yearlySelect) {
      yearlySelect.addEventListener('change', (e) => {
        this.filterYearly = e.target.value;
        this.render();
      });
    }

    // 7. Search Input
    const searchInput = document.getElementById('report-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    // 8. Export CSV
    const exportBtn = document.getElementById('btn-export-report-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCurrentReportCSV());
    }

    // 9. Print Report
    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printReport());
    }
  }

  syncFilterControlsUI() {
    const dailyWrap = document.getElementById('report-filter-daily-wrap');
    const monthlyWrap = document.getElementById('report-filter-monthly-wrap');
    const rangeWrap = document.getElementById('report-filter-range-wrap');
    const yearlyWrap = document.getElementById('report-filter-yearly-wrap');

    if (dailyWrap) dailyWrap.style.display = this.filterMode === 'daily' ? 'inline-flex' : 'none';
    if (monthlyWrap) monthlyWrap.style.display = this.filterMode === 'monthly' ? 'inline-flex' : 'none';
    if (rangeWrap) rangeWrap.style.display = this.filterMode === 'range' ? 'inline-flex' : 'none';
    if (yearlyWrap) yearlyWrap.style.display = this.filterMode === 'yearly' ? 'inline-flex' : 'none';
  }

  isDateInFilter(dateStr) {
    if (!dateStr) return false;
    if (this.filterMode === 'all') return true;

    // Normalizes "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD"
    const dateOnly = String(dateStr).trim().slice(0, 10);
    if (dateOnly.length < 10) return false;

    if (this.filterMode === 'daily') {
      return dateOnly === this.filterDaily;
    }

    if (this.filterMode === 'monthly') {
      return dateOnly.startsWith(this.filterMonthly);
    }

    if (this.filterMode === 'yearly') {
      return dateOnly.startsWith(this.filterYearly);
    }

    if (this.filterMode === 'range') {
      if (this.filterRangeStart && dateOnly < this.filterRangeStart) return false;
      if (this.filterRangeEnd && dateOnly > this.filterRangeEnd) return false;
      return true;
    }

    return true;
  }

  getFilterDescription() {
    if (this.filterMode === 'all') {
      return 'All Recorded Dates';
    }
    if (this.filterMode === 'daily') {
      return `Daily: ${this.formatDisplayDate(this.filterDaily)}`;
    }
    if (this.filterMode === 'monthly') {
      return `Monthly: ${this.formatDisplayMonth(this.filterMonthly)}`;
    }
    if (this.filterMode === 'range') {
      const from = this.filterRangeStart || 'Start';
      const to = this.filterRangeEnd || 'Present';
      return `Date Range: ${from} to ${to}`;
    }
    if (this.filterMode === 'yearly') {
      return `Yearly: ${this.filterYearly}`;
    }
    return 'All Recorded Dates';
  }

  formatDisplayDate(isoDateStr) {
    if (!isoDateStr) return '';
    try {
      const parts = isoDateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch (e) {}
    return isoDateStr;
  }

  formatDisplayMonth(isoMonthStr) {
    if (!isoMonthStr) return '';
    try {
      const parts = isoMonthStr.split('-');
      if (parts.length >= 2) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }
    } catch (e) {}
    return isoMonthStr;
  }

  async render() {
    this.updateReportHeader();

    if (this.currentReport === 'sales') {
      await this.renderSalesReport();
    } else if (this.currentReport === 'inventory') {
      await this.renderInventoryValuationReport();
    } else if (this.currentReport === 'losses') {
      await this.renderLossesReport();
    } else if (this.currentReport === 'fast-moving') {
      await this.renderFsnReport();
    }
  }

  updateReportHeader() {
    const titles = {
      sales: { title: 'Sales & Revenue Summary Report', desc: 'Detailed revenue receipts, payment distributions, and discount deductions' },
      inventory: { title: 'Inventory Valuation & Capital Stock Report', desc: 'Asset valuation based on FIFO cost pricing, retail markups, and potential gross margins' },
      losses: { title: 'Disposal, Expiry & Loss Write-Off Report', desc: 'Audited log of expired medications pulled, damaged goods, and clinic requisitions' },
      'fast-moving': { title: 'Fast & Slow Moving Goods (FSN Analysis)', desc: 'Inventory velocity classification for stock replenishment optimization' }
    };

    const header = titles[this.currentReport] || titles.sales;
    const filterDesc = this.getFilterDescription();

    const titleEl = document.getElementById('report-active-title');
    const descEl = document.getElementById('report-active-desc');
    const printTitleEl = document.getElementById('report-print-title');
    const printPeriodEl = document.getElementById('report-print-period-badge');
    const printDateEl = document.getElementById('report-print-timestamp');

    if (titleEl) titleEl.innerText = `${header.title} (${filterDesc})`;
    if (descEl) descEl.innerText = `${header.desc} • Filter: ${filterDesc}`;
    if (printTitleEl) printTitleEl.innerText = header.title;
    if (printPeriodEl) printPeriodEl.innerText = filterDesc;

    if (printDateEl) {
      printDateEl.innerText = `Generated on: ${new Date().toLocaleString()} | Xyra Andrea Pharmacy`;
    }
  }

  printReport() {
    this.updateReportHeader();

    // Dynamically set Pharmacist name on signature line
    const prepEl = document.getElementById('report-sig-prepared');
    const activeUserName = (window.currentUser && window.currentUser.name) 
      ? window.currentUser.name 
      : (localStorage.getItem('pharmatrack_user_name') || 'Pharmacist-on-Duty');
    if (prepEl) {
      prepEl.innerText = activeUserName;
    }

    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 1000);
  }

  // =========================================================================
  // 1. SALES REPORT
  // =========================================================================
  async renderSalesReport() {
    const txns = await window.mockApi.getTransactions();
    const q = this.searchQuery.toLowerCase();

    // Apply Date Filter + Search Filter
    const filtered = txns.filter(t => {
      const dateMatch = this.isDateInFilter(t.timestamp || t.created_at);
      if (!dateMatch) return false;

      const cust = t.customerName || t.customer_name || '';
      return t.id.toLowerCase().includes(q) ||
             t.cashier.toLowerCase().includes(q) ||
             cust.toLowerCase().includes(q) ||
             t.paymentMethod.toLowerCase().includes(q);
    });

    let totalGross = 0;
    let totalDiscount = 0;
    let totalNet = 0;

    filtered.forEach(t => {
      const disc = t.discountAmount || t.discount || 0;
      totalNet += t.total;
      totalDiscount += disc;
      totalGross += (t.total + disc);
    });

    const avgOrderVal = filtered.length > 0 ? (totalNet / filtered.length) : 0;

    // Render KPI summaries
    const kpiContainer = document.getElementById('report-kpi-summary');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon teal"><i class="ri-money-dollar-circle-line"></i></div>
          <div class="inv-mini-details">
            <span>Total Net Revenue</span>
            <h4>₱${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon blue"><i class="ri-receipt-line"></i></div>
          <div class="inv-mini-details">
            <span>Total Transactions</span>
            <h4>${filtered.length} Orders</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon amber"><i class="ri-percent-line"></i></div>
          <div class="inv-mini-details">
            <span>Discounts Awarded</span>
            <h4>₱${totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon purple"><i class="ri-shopping-basket-line"></i></div>
          <div class="inv-mini-details">
            <span>Avg Order Value</span>
            <h4>₱${avgOrderVal.toFixed(2)}</h4>
          </div>
        </div>
      `;
    }

    // Render Table
    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');
    if (!thead || !tbody) return;

    thead.innerHTML = `
      <tr>
        <th>Receipt OR #</th>
        <th>Date &amp; Time</th>
        <th>Cashier</th>
        <th>Customer</th>
        <th>Payment Mode</th>
        <th>Items Count</th>
        <th>Gross (₱)</th>
        <th>Discount (₱)</th>
        <th>Net Paid (₱)</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-search-line" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem; opacity: 0.6;"></i>No sales transactions found for the selected ${this.getFilterDescription()}.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(t => {
      const disc = t.discountAmount || t.discount || 0;
      const gross = t.total + disc;
      const cust = t.customerName || t.customer_name || 'Walk-in Customer';

      return `
        <tr>
          <td><strong style="color: var(--primary);">${t.id}</strong></td>
          <td>${t.timestamp || t.created_at || 'N/A'}</td>
          <td>${t.cashier}</td>
          <td>${cust}</td>
          <td><span class="badge-pill badge-info">${t.paymentMethod}</span></td>
          <td>${t.items ? t.items.length : (t.items_count || 1)} items</td>
          <td>₱${gross.toFixed(2)}</td>
          <td style="color: #f59e0b;">${disc > 0 ? `-₱${disc.toFixed(2)}` : '₱0.00'}</td>
          <td style="font-weight: 800; color: #10b981;">₱${t.total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 2. INVENTORY VALUATION REPORT
  // =========================================================================
  async renderInventoryValuationReport() {
    const products = await window.mockApi.getProducts();
    const q = this.searchQuery.toLowerCase();

    const filtered = products.filter(p => {
      return p.name.toLowerCase().includes(q) ||
             p.genericName.toLowerCase().includes(q) ||
             (p.sku && p.sku.toLowerCase().includes(q)) ||
             p.category.toLowerCase().includes(q);
    });

    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let totalStockUnits = 0;

    filtered.forEach(p => {
      const qty = Number(p.stock || 0);
      totalStockUnits += qty;
      totalCostValuation += (qty * p.costPrice);
      totalRetailValuation += (qty * p.unitPrice);
    });

    const potentialMargin = totalRetailValuation - totalCostValuation;
    const marginPercent = totalRetailValuation > 0 ? ((potentialMargin / totalRetailValuation) * 100) : 0;

    const kpiContainer = document.getElementById('report-kpi-summary');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon teal"><i class="ri-store-2-line"></i></div>
          <div class="inv-mini-details">
            <span>Total Retail Valuation</span>
            <h4>₱${totalRetailValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon blue"><i class="ri-funds-box-line"></i></div>
          <div class="inv-mini-details">
            <span>Total Capital Cost</span>
            <h4>₱${totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon amber"><i class="ri-line-chart-line"></i></div>
          <div class="inv-mini-details">
            <span>Projected Margin</span>
            <h4>₱${potentialMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${marginPercent.toFixed(1)}%)</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon purple"><i class="ri-capsule-line"></i></div>
          <div class="inv-mini-details">
            <span>Active SKUs / Units</span>
            <h4>${filtered.length} SKUs (${totalStockUnits.toLocaleString()} units)</h4>
          </div>
        </div>
      `;
    }

    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');
    if (!thead || !tbody) return;

    thead.innerHTML = `
      <tr>
        <th>SKU</th>
        <th>Medicine &amp; Formulation</th>
        <th>Category</th>
        <th>Stock Qty</th>
        <th>Active Lot</th>
        <th>Cost Price</th>
        <th>Retail Price</th>
        <th>Cost Valuation</th>
        <th>Retail Valuation</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2.5rem;">No inventory valuation records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const itemCostVal = p.stock * p.costPrice;
      const itemRetailVal = p.stock * p.unitPrice;

      return `
        <tr>
          <td><code>${p.sku || 'N/A'}</code></td>
          <td><strong>${p.name}</strong><br><small style="color: var(--text-muted);">${p.genericName || 'Standard'}</small></td>
          <td><span class="badge-pill badge-info">${p.category}</span></td>
          <td><strong>${p.stock}</strong> ${p.uom || 'units'}</td>
          <td><code style="color: var(--primary);">${p.batchNo || 'Assigned'}</code></td>
          <td>₱${p.costPrice.toFixed(2)}</td>
          <td>₱${p.unitPrice.toFixed(2)}</td>
          <td style="color: #028090; font-weight: 700;">₱${itemCostVal.toFixed(2)}</td>
          <td style="color: #00a896; font-weight: 800;">₱${itemRetailVal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 3. LOSSES & DISPOSAL REPORT
  // =========================================================================
  async renderLossesReport() {
    const logs = await window.mockApi.getStockOutLogs();
    const products = await window.mockApi.getProducts();
    const q = this.searchQuery.toLowerCase();

    // Filter by Date Filter + Search Query
    const filtered = logs.filter(l => {
      const dateMatch = this.isDateInFilter(l.date || l.created_at);
      if (!dateMatch) return false;

      return l.refNo.toLowerCase().includes(q) ||
             l.reason.toLowerCase().includes(q) ||
             l.authorizedBy.toLowerCase().includes(q);
    });

    let totalDisposedUnits = 0;
    let estimatedTotalLoss = 0;
    let expiredCount = 0;
    let damagedCount = 0;

    filtered.forEach(log => {
      (log.items || []).forEach(item => {
        totalDisposedUnits += item.qty;
        const prod = products.find(p => p.id === item.productId || p.name === item.name);
        const cost = prod ? prod.costPrice : (item.costPrice || 5.0);
        estimatedTotalLoss += (item.qty * cost);

        if (log.reason.toLowerCase().includes('expired')) expiredCount += item.qty;
        else damagedCount += item.qty;
      });
    });

    const kpiContainer = document.getElementById('report-kpi-summary');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon red"><i class="ri-delete-bin-line"></i></div>
          <div class="inv-mini-details">
            <span>Total Units Written Off</span>
            <h4>${totalDisposedUnits} Units</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon amber"><i class="ri-money-dollar-circle-line"></i></div>
          <div class="inv-mini-details">
            <span>Estimated Loss (Cost Basis)</span>
            <h4>₱${estimatedTotalLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon purple"><i class="ri-calendar-close-line"></i></div>
          <div class="inv-mini-details">
            <span>Expired Medications</span>
            <h4>${expiredCount} Units</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon blue"><i class="ri-file-damage-line"></i></div>
          <div class="inv-mini-details">
            <span>Damaged / Other Losses</span>
            <h4>${damagedCount} Units</h4>
          </div>
        </div>
      `;
    }

    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');
    if (!thead || !tbody) return;

    thead.innerHTML = `
      <tr>
        <th>Disposal Ref #</th>
        <th>Date</th>
        <th>Reason / Classification</th>
        <th>Items &amp; Batches</th>
        <th>Units Pulled</th>
        <th>Authorized Pharmacist</th>
        <th>Audit Notes</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2.5rem;"><i class="ri-check-line" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem; color: #10b981;"></i>No write-offs or disposal records logged for the selected ${this.getFilterDescription()}.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(log => {
      let badgeClass = 'badge-danger';
      if (log.reason.includes('Damaged')) badgeClass = 'badge-warning';
      else if (log.reason.includes('Clinic') || log.reason.includes('Internal')) badgeClass = 'badge-success';

      const itemsDesc = (log.items || []).map(i => `${i.name} (Qty: ${i.qty})`).join(', ');
      const totalUnits = (log.items || []).reduce((acc, i) => acc + i.qty, 0);

      return `
        <tr>
          <td><code style="color: #ef4444; font-weight: bold;">${log.refNo}</code></td>
          <td>${log.date || 'N/A'}</td>
          <td><span class="badge-pill ${badgeClass}">${log.reason}</span></td>
          <td>${itemsDesc}</td>
          <td><strong style="color: #ef4444;">-${totalUnits}</strong></td>
          <td>${log.authorizedBy}</td>
          <td><small style="color: var(--text-muted);">${log.notes || 'None logged'}</small></td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 4. FAST & SLOW MOVING GOODS (FSN ANALYSIS)
  // =========================================================================
  async renderFsnReport() {
    const products = await window.mockApi.getProducts();
    const txns = await window.mockApi.getTransactions();
    const q = this.searchQuery.toLowerCase();

    // Calculate actual units sold per product within the currently selected filter period
    const unitsSoldMap = {};
    const filteredTxns = txns.filter(t => this.isDateInFilter(t.timestamp || t.created_at));

    filteredTxns.forEach(t => {
      (t.items || []).forEach(item => {
        const pId = item.productId || item.product_id;
        const qty = item.qty || item.quantity || 1;
        unitsSoldMap[pId] = (unitsSoldMap[pId] || 0) + qty;
      });
    });

    const fsnRows = products.map(prod => {
      const soldPeriod = unitsSoldMap[prod.id] || 0;
      let classification = 'Normal Velocity';
      let badgeClass = 'badge-info';

      if (soldPeriod >= 20) {
        classification = 'Fast-Moving';
        badgeClass = 'badge-success';
      } else if (soldPeriod <= 3) {
        classification = 'Slow / Non-Moving';
        badgeClass = 'badge-danger';
      }

      return {
        product: prod,
        soldPeriod,
        classification,
        badgeClass
      };
    });

    const filtered = fsnRows.filter(row => {
      return row.product.name.toLowerCase().includes(q) ||
             (row.product.genericName && row.product.genericName.toLowerCase().includes(q)) ||
             row.product.category.toLowerCase().includes(q);
    });

    // Sort by units sold descending
    filtered.sort((a, b) => b.soldPeriod - a.soldPeriod);

    let fastCount = 0;
    let normalCount = 0;
    let slowCount = 0;

    filtered.forEach(f => {
      if (f.classification === 'Fast-Moving') fastCount++;
      else if (f.classification === 'Normal Velocity') normalCount++;
      else slowCount++;
    });

    const kpiContainer = document.getElementById('report-kpi-summary');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon teal"><i class="ri-speed-up-line"></i></div>
          <div class="inv-mini-details">
            <span>Fast-Moving (High Turnover)</span>
            <h4>${fastCount} Medicines</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon blue"><i class="ri-swap-line"></i></div>
          <div class="inv-mini-details">
            <span>Normal Velocity</span>
            <h4>${normalCount} Medicines</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon amber"><i class="ri-timer-line"></i></div>
          <div class="inv-mini-details">
            <span>Slow / Non-Moving</span>
            <h4>${slowCount} Medicines</h4>
          </div>
        </div>
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon purple"><i class="ri-calendar-event-line"></i></div>
          <div class="inv-mini-details">
            <span>Evaluated Period</span>
            <h4 style="font-size: 0.95rem;">${this.getFilterDescription()}</h4>
          </div>
        </div>
      `;
    }

    const thead = document.getElementById('report-table-head');
    const tbody = document.getElementById('report-table-body');
    if (!thead || !tbody) return;

    thead.innerHTML = `
      <tr>
        <th>SKU</th>
        <th>Medicine Name</th>
        <th>Category</th>
        <th>Current Stock</th>
        <th>Units Sold (${this.getFilterDescription()})</th>
        <th>Turnover Status</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 2.5rem;">No FSN records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(f => {
      return `
        <tr>
          <td><code>${f.product.sku || 'N/A'}</code></td>
          <td><strong>${f.product.name}</strong><br><small style="color: var(--text-muted);">${f.product.genericName || ''}</small></td>
          <td><span class="badge-pill badge-info">${f.product.category}</span></td>
          <td><strong>${f.product.stock}</strong> ${f.product.uom || 'units'}</td>
          <td style="color: var(--primary); font-weight: 800; font-size: 0.95rem;">${f.soldPeriod} units</td>
          <td><span class="badge-pill ${f.badgeClass}">${f.classification}</span></td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // EXPORT CURRENT FILTERED REPORT TO CSV
  // =========================================================================
  async exportCurrentReportCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    const filterTag = this.filterMode.toUpperCase();
    const filename = `PharmaTrack_${this.currentReport.toUpperCase()}_${filterTag}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (this.currentReport === 'sales') {
      const txns = await window.mockApi.getTransactions();
      const filtered = txns.filter(t => this.isDateInFilter(t.timestamp || t.created_at));

      csvContent += 'Receipt OR #,Date,Cashier,Customer,Payment Method,Items Count,Gross Total,Discount,Net Paid\r\n';
      filtered.forEach(t => {
        const disc = t.discountAmount || t.discount || 0;
        const gross = t.total + disc;
        const cust = (t.customerName || t.customer_name || 'Walk-in Customer').replace(/"/g, '""');
        csvContent += `"${t.id}","${t.timestamp || t.created_at}","${t.cashier}","${cust}","${t.paymentMethod}",${t.items ? t.items.length : 1},${gross.toFixed(2)},${disc.toFixed(2)},${t.total.toFixed(2)}\r\n`;
      });
    } else if (this.currentReport === 'inventory') {
      const prods = await window.mockApi.getProducts();
      csvContent += 'SKU,Medicine Name,Generic Name,Category,UOM,Stock Qty,Cost Price,Retail Price,Cost Valuation,Retail Valuation\r\n';
      prods.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.genericName}","${p.category}","${p.uom || 'Unit'}",${p.stock},${p.costPrice.toFixed(2)},${p.unitPrice.toFixed(2)},${(p.stock * p.costPrice).toFixed(2)},${(p.stock * p.unitPrice).toFixed(2)}\r\n`;
      });
    } else if (this.currentReport === 'losses') {
      const logs = await window.mockApi.getStockOutLogs();
      const filtered = logs.filter(l => this.isDateInFilter(l.date || l.created_at));

      csvContent += 'Disposal Ref #,Date,Reason,Authorized By,Units Pulled,Notes\r\n';
      filtered.forEach(l => {
        const totalUnits = (l.items || []).reduce((acc, i) => acc + i.qty, 0);
        csvContent += `"${l.refNo}","${l.date}","${l.reason}","${l.authorizedBy}",${totalUnits},"${(l.notes || '').replace(/"/g, '""')}"\r\n`;
      });
    } else if (this.currentReport === 'fast-moving') {
      const products = await window.mockApi.getProducts();
      const txns = await window.mockApi.getTransactions();
      const filteredTxns = txns.filter(t => this.isDateInFilter(t.timestamp || t.created_at));
      const unitsMap = {};
      filteredTxns.forEach(t => {
        (t.items || []).forEach(item => {
          const pId = item.productId || item.product_id;
          unitsMap[pId] = (unitsMap[pId] || 0) + (item.qty || item.quantity || 1);
        });
      });

      csvContent += 'SKU,Medicine Name,Category,Current Stock,Period Units Sold,Turnover Status\r\n';
      products.forEach(p => {
        const sold = unitsMap[p.id] || 0;
        const status = sold >= 20 ? 'Fast-Moving' : (sold <= 3 ? 'Slow / Non-Moving' : 'Normal Velocity');
        csvContent += `"${p.sku}","${p.name}","${p.category}",${p.stock},${sold},"${status}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    SwalHelpers.toast(`Exported ${filename}`, 'success');
  }
}

window.ReportsController = ReportsController;
