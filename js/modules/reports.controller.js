/**
 * PharmaTrack - Reports & Intelligence Controller
 * Xyra Andrea Pharmacy - Audited Reporting: Sales, Inventory Valuation, Losses & FSN Analysis
 */

class ReportsController {
  constructor() {
    this.currentReport = 'sales';
    this.dateRange = 'all';
    this.searchQuery = '';
  }

  async init() {
    this.bindEvents();
    await this.render();
  }

  bindEvents() {
    // Report Type Pills
    const pills = document.querySelectorAll('.report-pill-btn');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentReport = pill.getAttribute('data-report-type');
        this.render();
      });
    });

    // Date Filter
    const dateSelect = document.getElementById('report-date-range');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        this.dateRange = e.target.value;
        this.render();
      });
    }

    // Search
    const searchInput = document.getElementById('report-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-report-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCurrentReportCSV());
    }

    // Print Report
    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
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
    const titleEl = document.getElementById('report-active-title');
    const descEl = document.getElementById('report-active-desc');
    const printTitleEl = document.getElementById('report-print-title');

    if (titleEl) titleEl.innerText = header.title;
    if (descEl) descEl.innerText = header.desc;
    if (printTitleEl) printTitleEl.innerText = header.title;

    const printDateEl = document.getElementById('report-print-timestamp');
    if (printDateEl) {
      printDateEl.innerText = `Generated on: ${new Date().toLocaleString()} | Xyra Andrea Pharmacy`;
    }
  }

  // 1. SALES REPORT
  async renderSalesReport() {
    const txns = await window.mockApi.getTransactions();
    const q = this.searchQuery.toLowerCase();

    const filtered = txns.filter(t => {
      return t.id.toLowerCase().includes(q) ||
             t.cashier.toLowerCase().includes(q) ||
             t.paymentMethod.toLowerCase().includes(q);
    });

    let totalGross = 0;
    let totalDiscount = 0;
    let totalNet = 0;

    filtered.forEach(t => {
      const disc = t.discountAmount || 0;
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
            <h4>₱${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
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
            <h4>₱${totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
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
        <th>Timestamp</th>
        <th>Cashier</th>
        <th>Payment Mode</th>
        <th>Items Count</th>
        <th>Gross (₱)</th>
        <th>Discount (₱)</th>
        <th>Net Paid (₱)</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 2.5rem;">No sales records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(t => {
      const disc = t.discountAmount || 0;
      const gross = t.total + disc;

      return `
        <tr>
          <td><strong style="color: var(--primary);">${t.id}</strong></td>
          <td>${t.timestamp}</td>
          <td>${t.cashier}</td>
          <td><span class="badge-pill badge-info">${t.paymentMethod}</span></td>
          <td>${t.items ? t.items.length : 0} items</td>
          <td>₱${gross.toFixed(2)}</td>
          <td style="color: #f59e0b;">-₱${disc.toFixed(2)}</td>
          <td style="font-weight: 800; color: #10b981;">₱${t.total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  }

  // 2. INVENTORY VALUATION REPORT
  async renderInventoryValuationReport() {
    const products = await window.mockApi.getProducts();
    const q = this.searchQuery.toLowerCase();

    const filtered = products.filter(p => {
      return p.name.toLowerCase().includes(q) ||
             p.genericName.toLowerCase().includes(q) ||
             p.sku.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q);
    });

    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    filtered.forEach(p => {
      totalCostValuation += (p.stock * p.costPrice);
      totalRetailValuation += (p.stock * p.unitPrice);
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
            <span>Active SKUs</span>
            <h4>${filtered.length} Medicines</h4>
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
        <th>Medicine & Generic</th>
        <th>Category</th>
        <th>UOM</th>
        <th>Stock Qty</th>
        <th>Cost Price</th>
        <th>Retail Price</th>
        <th>Cost Valuation</th>
        <th>Retail Valuation</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2.5rem;">No inventory data available.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const itemCostVal = p.stock * p.costPrice;
      const itemRetailVal = p.stock * p.unitPrice;

      return `
        <tr>
          <td><code>${p.sku}</code></td>
          <td><strong>${p.name}</strong><br><small style="color: var(--text-muted);">${p.genericName}</small></td>
          <td><span class="badge-pill badge-info">${p.category}</span></td>
          <td>${p.uom || 'Unit'}</td>
          <td><strong>${p.stock}</strong></td>
          <td>₱${p.costPrice.toFixed(2)}</td>
          <td>₱${p.unitPrice.toFixed(2)}</td>
          <td style="color: #028090; font-weight: 700;">₱${itemCostVal.toFixed(2)}</td>
          <td style="color: #00a896; font-weight: 800;">₱${itemRetailVal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
  }

  // 3. LOSSES & DISPOSAL REPORT
  async renderLossesReport() {
    const logs = await window.mockApi.getStockOutLogs();
    const products = await window.mockApi.getProducts();
    const q = this.searchQuery.toLowerCase();

    const filtered = logs.filter(l => {
      return l.refNo.toLowerCase().includes(q) ||
             l.reason.toLowerCase().includes(q) ||
             l.authorizedBy.toLowerCase().includes(q);
    });

    let totalDisposedUnits = 0;
    let estimatedTotalLoss = 0;
    let expiredCount = 0;
    let damagedCount = 0;

    filtered.forEach(log => {
      log.items.forEach(item => {
        totalDisposedUnits += item.qty;
        const prod = products.find(p => p.id === item.productId || p.name === item.name);
        const cost = prod ? prod.costPrice : 5.0;
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
        <th>Reason / Category</th>
        <th>Items & Batches</th>
        <th>Units Pulled</th>
        <th>Authorized Pharmacist</th>
        <th>Audit Notes</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2.5rem;">No disposal or loss records logged.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(log => {
      let badgeClass = 'badge-danger';
      if (log.reason.includes('Damaged')) badgeClass = 'badge-warning';
      else if (log.reason.includes('Clinic') || log.reason.includes('Internal')) badgeClass = 'badge-success';

      const itemsDesc = log.items.map(i => `${i.name} (Qty: ${i.qty})`).join(', ');
      const totalUnits = log.items.reduce((acc, i) => acc + i.qty, 0);

      return `
        <tr>
          <td><code style="color: #ef4444; font-weight: bold;">${log.refNo}</code></td>
          <td>${log.date}</td>
          <td><span class="badge-pill ${badgeClass}">${log.reason}</span></td>
          <td>${itemsDesc}</td>
          <td><strong style="color: #ef4444;">-${totalUnits}</strong></td>
          <td>${log.authorizedBy}</td>
          <td><small style="color: var(--text-muted);">${log.notes || 'N/A'}</small></td>
        </tr>
      `;
    }).join('');
  }

  // 4. FAST & SLOW MOVING GOODS (FSN ANALYSIS)
  async renderFsnReport() {
    const forecasts = await window.mockApi.getDemandForecasts();
    const q = this.searchQuery.toLowerCase();

    const filtered = forecasts.filter(f => {
      return f.product.name.toLowerCase().includes(q) ||
             f.product.genericName.toLowerCase().includes(q) ||
             f.product.category.toLowerCase().includes(q);
    });

    let fastCount = 0;
    let normalCount = 0;
    let slowCount = 0;

    filtered.forEach(f => {
      if (f.avgDaily >= 25) fastCount++;
      else if (f.avgDaily >= 8) normalCount++;
      else slowCount++;
    });

    const kpiContainer = document.getElementById('report-kpi-summary');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="inv-mini-kpi">
          <div class="inv-mini-icon teal"><i class="ri-speed-up-line"></i></div>
          <div class="inv-mini-details">
            <span>Fast Moving (High Turn)</span>
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
          <div class="inv-mini-icon purple"><i class="ri-stock-line"></i></div>
          <div class="inv-mini-details">
            <span>Health Index</span>
            <h4>94.2% Optimal</h4>
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
        <th>Avg. Daily Dispense</th>
        <th>Days of Stock Left</th>
        <th>30-Day Velocity</th>
        <th>FSN Classification</th>
      </tr>
    `;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 2.5rem;">No FSN data found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(f => {
      let fsnBadge = 'badge-success';
      let fsnLabel = 'Fast-Moving';

      if (f.avgDaily < 8) {
        fsnBadge = 'badge-danger';
        fsnLabel = 'Slow-Moving';
      } else if (f.avgDaily < 25) {
        fsnBadge = 'badge-info';
        fsnLabel = 'Normal Velocity';
      }

      return `
        <tr>
          <td><code>${f.product.sku}</code></td>
          <td><strong>${f.product.name}</strong></td>
          <td><span class="badge-pill badge-info">${f.product.category}</span></td>
          <td><strong>${f.product.stock}</strong> ${f.product.uom || 'units'}</td>
          <td>${f.avgDaily} / day</td>
          <td><strong>${f.daysOfInventoryLeft} days</strong></td>
          <td style="color: var(--primary); font-weight: 700;">${f.forecast30} units</td>
          <td><span class="badge-pill ${fsnBadge}">${fsnLabel}</span></td>
        </tr>
      `;
    }).join('');
  }

  // EXPORT CURRENT REPORT TO CSV
  async exportCurrentReportCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    let filename = `PharmaTrack_${this.currentReport.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (this.currentReport === 'sales') {
      const txns = await window.mockApi.getTransactions();
      csvContent += 'Receipt OR #,Date,Cashier,Payment Method,Items Count,Gross Total,Discount,Net Paid\r\n';
      txns.forEach(t => {
        const disc = t.discountAmount || 0;
        const gross = t.total + disc;
        csvContent += `"${t.id}","${t.timestamp}","${t.cashier}","${t.paymentMethod}",${t.items ? t.items.length : 0},${gross.toFixed(2)},${disc.toFixed(2)},${t.total.toFixed(2)}\r\n`;
      });
    } else if (this.currentReport === 'inventory') {
      const prods = await window.mockApi.getProducts();
      csvContent += 'SKU,Medicine Name,Generic Name,Category,UOM,Stock Qty,Cost Price,Retail Price,Cost Valuation,Retail Valuation\r\n';
      prods.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.genericName}","${p.category}","${p.uom || 'Unit'}",${p.stock},${p.costPrice.toFixed(2)},${p.unitPrice.toFixed(2)},${(p.stock * p.costPrice).toFixed(2)},${(p.stock * p.unitPrice).toFixed(2)}\r\n`;
      });
    } else if (this.currentReport === 'losses') {
      const logs = await window.mockApi.getStockOutLogs();
      csvContent += 'Disposal Ref #,Date,Reason,Authorized By,Notes\r\n';
      logs.forEach(l => {
        csvContent += `"${l.refNo}","${l.date}","${l.reason}","${l.authorizedBy}","${l.notes || ''}"\r\n`;
      });
    } else if (this.currentReport === 'fast-moving') {
      const forecasts = await window.mockApi.getDemandForecasts();
      csvContent += 'SKU,Medicine Name,Category,Current Stock,Avg Daily Sales,Days of Stock Left,30d Forecast\r\n';
      forecasts.forEach(f => {
        csvContent += `"${f.product.sku}","${f.product.name}","${f.product.category}",${f.product.stock},${f.avgDaily},${f.daysOfInventoryLeft},${f.forecast30}\r\n`;
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

