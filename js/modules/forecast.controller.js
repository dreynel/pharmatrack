/**
 * PharmaTrack - Seasonal & Year-Over-Year Demand Forecasting Controller
 * Compares last year's same-month demand against current shelf stock to prevent stockouts.
 */

class ForecastController {
  constructor() {
    this.forecastChart = null;
    this.categoryChart = null;
    this.riskFilter = 'all'; // 'all' | 'critical' | 'adequate'

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonth = `${yyyy}-${mm}`;

    this.currentForecasts = [];
    this.currentMeta = {};
    this.eventsBound = false;

    // Modalized Medicine Selection State (null = All products included)
    this.selectedProductIds = null;
    try {
      const saved = localStorage.getItem('pharmatrack_forecast_selected_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.selectedProductIds = parsed.map(Number);
        }
      }
    } catch (e) {
      this.selectedProductIds = null;
    }
  }

  async init() {
    this.bindEvents();
    this.syncFilterUI();
    await this.render();
  }

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    // Live theme adaptation for charts
    window.addEventListener('pharmatrack:themechange', () => {
      if (this.currentForecasts && this.currentForecasts.length) {
        this.renderCharts(this.currentForecasts);
      }
    });

    // 1. Medicine Selection Modal Trigger Button
    const selectMedBtn = document.getElementById('btn-select-forecast-medicines');
    if (selectMedBtn) {
      selectMedBtn.addEventListener('click', async () => {
        await this.showMedicineSelectionModal();
      });
    }

    // 1b. Reset Selection Button
    const resetMedBtn = document.getElementById('btn-reset-forecast-selection');
    if (resetMedBtn) {
      resetMedBtn.addEventListener('click', async () => {
        await this.resetMedicineSelection();
      });
    }

    // 2. Month / Season Selector
    const monthInput = document.getElementById('forecast-month-input');
    if (monthInput) {
      monthInput.value = this.selectedMonth;
      monthInput.addEventListener('change', async (e) => {
        if (e.target.value) {
          this.selectedMonth = e.target.value;
          await this.render();
        }
      });
    }

    // 3. Quick Depletion Risk Filter Buttons (All, Critical / High, Adequate)
    const riskBtns = document.querySelectorAll('.forecast-risk-filter-btn');
    riskBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const risk = btn.getAttribute('data-risk');
        if (!risk || risk === this.riskFilter) return;
        this.riskFilter = risk;

        riskBtns.forEach(b => {
          if (b === btn) {
            b.classList.remove('btn-outline-danger', 'btn-outline-success', 'btn-outline-primary');
            b.classList.add(risk === 'critical' ? 'btn-danger' : (risk === 'adequate' ? 'btn-success' : 'btn-primary'), 'active');
          } else {
            b.classList.remove('active', 'btn-danger', 'btn-success', 'btn-primary');
            const bRisk = b.getAttribute('data-risk');
            b.classList.add(bRisk === 'critical' ? 'btn-outline-danger' : (bRisk === 'adequate' ? 'btn-outline-success' : 'btn-outline-primary'));
          }
        });

        this.renderForecastTable(this.currentForecasts);
      });
    });
  }

  syncFilterUI() {
    const monthInput = document.getElementById('forecast-month-input');
    if (monthInput && monthInput.value !== this.selectedMonth) {
      monthInput.value = this.selectedMonth;
    }

    // Update Medicine Selection Trigger Badge & Reset Button
    const medBadge = document.getElementById('forecast-selected-count-badge');
    const resetBtn = document.getElementById('btn-reset-forecast-selection');
    const totalCount = this.currentForecasts?.totalCatalogCount || 10;

    if (this.selectedProductIds && this.selectedProductIds.length > 0) {
      if (medBadge) {
        medBadge.textContent = `${this.selectedProductIds.length} of ${totalCount}`;
        medBadge.className = 'badge bg-warning text-dark';
      }
      if (resetBtn) {
        resetBtn.classList.remove('d-none');
      }
    } else {
      if (medBadge) {
        medBadge.textContent = totalCount ? `All (${totalCount})` : 'All';
        medBadge.className = 'badge bg-primary text-white';
      }
      if (resetBtn) {
        resetBtn.classList.add('d-none');
      }
    }
  }

  getQueryParams() {
    const params = {
      month: this.selectedMonth
    };
    if (this.selectedProductIds && this.selectedProductIds.length > 0) {
      params.product_ids = this.selectedProductIds.join(',');
    }
    return params;
  }

  async render() {
    this.bindEvents();

    const params = this.getQueryParams();
    const forecasts = await window.mockApi.getDemandForecasts(params);
    this.currentForecasts = forecasts;

    const monthName = forecasts.monthName || 'Month';
    const lastYear = forecasts.lastYear || (new Date().getFullYear() - 1);
    const targetYear = forecasts.targetYear || new Date().getFullYear();

    this.currentMeta = {
      monthName,
      lastYear,
      targetYear,
      periodLabel: forecasts.periodLabel || `${monthName} ${targetYear} vs. ${monthName} ${lastYear}`
    };

    // Update header labels
    const trendTitleEl = document.getElementById('forecast-trend-title');
    if (trendTitleEl) {
      trendTitleEl.innerHTML = `<i class="ri-bar-chart-grouped-line"></i> Current Shelf Stock vs. Last Year Demand (${monthName} ${lastYear})`;
    }

    const badgeEl = document.getElementById('forecast-period-badge');
    if (badgeEl) {
      badgeEl.textContent = this.currentMeta.periodLabel;
    }

    const soldHeaderEl = document.getElementById('forecast-sold-col-header');
    if (soldHeaderEl) {
      soldHeaderEl.textContent = `Demand (${monthName} ${lastYear})`;
    }

    const colHeaderEl = document.getElementById('forecast-horizon-col-header');
    if (colHeaderEl) {
      colHeaderEl.textContent = `Projected Need (${monthName} ${targetYear})`;
    }

    this.syncFilterUI();
    this.renderKpiSummary(forecasts);
    this.renderForecastTable(forecasts);
    this.renderCharts(forecasts);
  }

  renderKpiSummary(forecasts) {
    const kpiContainer = document.getElementById('forecast-kpi-summary');
    if (!kpiContainer) return;

    const totalLastYearSold = forecasts.reduce((acc, f) => acc + (Number(f.demandLastYear) || 0), 0);
    const totalCurrentStock = forecasts.reduce((acc, f) => acc + (Number(f.currentStock) || 0), 0);
    const criticalCount = forecasts.filter(f => f.urgency === 'Critical' || f.urgency === 'High').length;
    const totalEstCost = forecasts.reduce((acc, f) => {
      const qty = Number(f.suggestedReorder || 0);
      const cost = Number(f.product?.costPrice || 0);
      return acc + (qty * cost);
    }, 0);

    const monthName = this.currentMeta.monthName || 'Period';
    const lastYear = this.currentMeta.lastYear || '2025';

    kpiContainer.innerHTML = `
      <div class="inv-mini-kpi">
        <div class="inv-mini-kpi-icon" style="background: rgba(245, 158, 11, 0.12); color: #d97706;">
          <i class="ri-history-line"></i>
        </div>
        <div>
          <span class="inv-mini-kpi-label">Last Year (${monthName} ${lastYear}) Demand</span>
          <h4 class="inv-mini-kpi-value">${totalLastYearSold.toLocaleString()} <small style="font-size: 0.75rem; font-weight: 500; color: #64748b;">units</small></h4>
        </div>
      </div>

      <div class="inv-mini-kpi">
        <div class="inv-mini-kpi-icon" style="background: rgba(0, 168, 150, 0.12); color: var(--primary);">
          <i class="ri-medicine-bottle-line"></i>
        </div>
        <div>
          <span class="inv-mini-kpi-label">Current Physical Shelf Stock</span>
          <h4 class="inv-mini-kpi-value" style="color: var(--primary);">${totalCurrentStock.toLocaleString()} <small style="font-size: 0.75rem; font-weight: 500; color: #64748b;">units</small></h4>
        </div>
      </div>

      <div class="inv-mini-kpi">
        <div class="inv-mini-kpi-icon" style="background: rgba(239, 68, 68, 0.12); color: #ef4444;">
          <i class="ri-alarm-warning-line"></i>
        </div>
        <div>
          <span class="inv-mini-kpi-label">High Depletion Risk Items</span>
          <h4 class="inv-mini-kpi-value" style="color: ${criticalCount > 0 ? '#ef4444' : '#10b981'};">
            ${criticalCount} <small style="font-size: 0.75rem; font-weight: 600;">${criticalCount > 0 ? '(Re-stock Needed)' : '(All Sufficient)'}</small>
          </h4>
        </div>
      </div>

      <div class="inv-mini-kpi">
        <div class="inv-mini-kpi-icon" style="background: rgba(37, 99, 235, 0.12); color: #2563eb;">
          <i class="ri-funds-box-line"></i>
        </div>
        <div>
          <span class="inv-mini-kpi-label">Est. Restock Purchase Budget</span>
          <h4 class="inv-mini-kpi-value">₱${totalEstCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
        </div>
      </div>
    `;
  }

  renderForecastTable(forecasts) {
    const container = document.getElementById('forecast-table-body');
    if (!container) return;

    let filtered = [...forecasts];
    if (this.riskFilter === 'critical') {
      filtered = filtered.filter(f => f.urgency === 'Critical' || f.urgency === 'High' || f.suggestedReorder > 0);
    } else if (this.riskFilter === 'adequate') {
      filtered = filtered.filter(f => f.urgency === 'Low' || f.suggestedReorder === 0);
    }

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2.5rem;">No medicines match the selected filter.</td></tr>`;
      return;
    }

    container.innerHTML = filtered.map(item => {
      const p = item.product || {};
      const currentStock = Number(item.currentStock || 0);
      const demandLastYear = Number(item.demandLastYear || 0);
      const sold30d = Number(item.sold30d || 0);
      const projectedDemand = Number(item.projectedDemand || 0);
      const safetyStock = Number(item.safetyStock || 10);
      const suggestedReorder = Number(item.suggestedReorder || 0);
      const daysLeft = Number(item.daysOfInventoryLeft || 0);
      const urgency = item.urgency || 'Low';

      // Depletion Risk Badge styling
      let riskBadgeClass = 'badge-success';
      let riskIcon = 'ri-checkbox-circle-line';
      let riskTitle = 'Adequate Stock';

      if (urgency === 'Critical') {
        riskBadgeClass = 'badge-danger';
        riskIcon = 'ri-alarm-warning-line';
        riskTitle = currentStock <= 0 ? 'Out of Stock' : `Critical (${daysLeft}d left)`;
      } else if (urgency === 'High') {
        riskBadgeClass = 'badge-warning';
        riskIcon = 'ri-alert-line';
        riskTitle = `High Demand / Low Stock (${daysLeft}d)`;
      } else if (urgency === 'Medium') {
        riskBadgeClass = 'badge-warning';
        riskIcon = 'ri-time-line';
        riskTitle = `Reorder Soon (${daysLeft}d)`;
      }

      // Stock status visual
      const stockBadgeColor = currentStock <= 0 ? '#ef4444' : (currentStock < projectedDemand ? '#f59e0b' : '#10b981');

      // Action button: direct 1-click Reorder
      const actionBtn = suggestedReorder > 0
        ? `<div class="d-flex align-items-center gap-1">
             <button class="btn btn-sm btn-primary text-nowrap" onclick="window.forecastController.handleGeneratePO(${p.id})">
               <i class="ri-shopping-cart-2-line"></i> Restock (${suggestedReorder.toLocaleString()})
             </button>
             <button class="btn btn-sm btn-outline-secondary" onclick="window.forecastController.showCalculationBreakdown(${p.id})" title="View restock calculation breakdown">
               <i class="ri-information-line"></i>
             </button>
           </div>`
        : `<div class="d-flex align-items-center gap-1">
             <button class="btn btn-sm btn-outline-success text-nowrap" onclick="window.forecastController.handleGeneratePO(${p.id})" title="Stock is sufficient; click to place advance PO">
               <i class="ri-check-line"></i> Sufficient
             </button>
             <button class="btn btn-sm btn-outline-secondary" onclick="window.forecastController.showCalculationBreakdown(${p.id})" title="View calculation breakdown">
               <i class="ri-information-line"></i>
             </button>
           </div>`;

      return `
        <tr>
          <td>
            <div class="d-flex flex-column">
              <span class="fw-bold text-dark">${this.escapeHtml(p.name)}</span>
              <span class="small text-muted">${this.escapeHtml(p.genericName)}</span>
              <span class="badge bg-light text-secondary border mt-1 align-self-start" style="font-size: 0.72rem;">${this.escapeHtml(p.category)}</span>
            </div>
          </td>
          <td>
            <span class="fw-bold" style="color: ${stockBadgeColor}; font-size: 0.95rem;">
              ${currentStock.toLocaleString()}
            </span>
            <small class="text-muted d-block">${this.escapeHtml(p.uom)}</small>
          </td>
          <td>
            <div class="d-flex flex-column">
              <span class="fw-bold text-dark">${demandLastYear.toLocaleString()} <small class="text-muted">${this.escapeHtml(p.uom)}</small></span>
              <small class="text-muted font-monospace" style="font-size: 0.7rem;">${this.escapeHtml(item.lastYearLabel)}</small>
            </div>
          </td>
          <td>
            <span class="fw-semibold text-secondary">${sold30d.toLocaleString()}</span>
            <small class="text-muted d-block">${(Number(item.avgDaily) || 0).toFixed(1)}/day</small>
          </td>
          <td>
            <span class="fw-bold text-primary">${projectedDemand.toLocaleString()}</span>
            <small class="text-muted d-block">${this.escapeHtml(p.uom)}</small>
          </td>
          <td>
            <span class="badge bg-light text-secondary border font-monospace">+${safetyStock} ${this.escapeHtml(p.uom)}</span>
          </td>
          <td>
            <div class="d-flex flex-column gap-1">
              <span class="badge-pill ${riskBadgeClass}">
                <i class="${riskIcon} me-1"></i>${riskTitle}
              </span>
              <small class="text-muted" style="font-size: 0.72rem;">${this.escapeHtml(item.riskLabel || '')}</small>
            </div>
          </td>
          <td>
            <div class="d-flex flex-column">
              <span class="fw-bold ${suggestedReorder > 0 ? 'text-danger' : 'text-success'}" style="font-size: 1rem;">
                ${suggestedReorder > 0 ? `+${suggestedReorder.toLocaleString()}` : '0'} <small style="font-size: 0.75rem;">${this.escapeHtml(p.uom)}</small>
              </span>
              ${suggestedReorder > 0 ? `<small class="text-muted">₱${(suggestedReorder * Number(p.costPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>` : ''}
            </div>
          </td>
          <td>
            ${actionBtn}
          </td>
        </tr>
      `;
    }).join('');
  }

  renderCharts(forecasts) {
    if (typeof Chart === 'undefined') return;

    // 1. Dual-Bar Comparison: Current Shelf Stock vs. Last Year's Same-Month Demand
    const barCtx = document.getElementById('demandForecastChart');
    if (barCtx) {
      if (this.forecastChart) this.forecastChart.destroy();

      // Top 8 medicines by demand/risk
      const displayItems = forecasts.slice(0, 8);
      const labels = displayItems.map(f => f.product?.name ? (f.product.name.length > 20 ? f.product.name.substring(0, 18) + '...' : f.product.name) : 'Med');
      const stockData = displayItems.map(f => Number(f.currentStock || 0));
      const demandData = displayItems.map(f => Number(f.demandLastYear || f.projectedDemand || 0));

      // Color code stock bars: red if lower than last year's demand, teal if sufficient
      const stockColors = displayItems.map(f => {
        const stk = Number(f.currentStock || 0);
        const dem = Number(f.demandLastYear || f.projectedDemand || 0);
        return stk < dem ? '#ef4444' : '#00a896';
      });

      this.forecastChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Current Shelf Stock',
              data: stockData,
              backgroundColor: stockColors,
              borderRadius: 5,
              barPercentage: 0.7,
              categoryPercentage: 0.8
            },
            {
              label: `Last Year Demand (${this.currentMeta.monthName || 'Same Month'} ${this.currentMeta.lastYear || ''})`,
              data: demandData,
              backgroundColor: '#f59e0b',
              borderRadius: 5,
              barPercentage: 0.7,
              categoryPercentage: 0.8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 14,
                font: { family: 'Outfit, sans-serif', size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                afterBody: (context) => {
                  const idx = context[0].dataIndex;
                  const item = displayItems[idx];
                  if (item && item.suggestedReorder > 0) {
                    return `⚠️ Stock Depletion Risk: Reorder +${item.suggestedReorder} ${item.product?.uom || 'units'}`;
                  }
                  return '✓ Stock covers seasonal demand';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Outfit, sans-serif', size: 11 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.06)' },
              ticks: { font: { family: 'Outfit, sans-serif', size: 11 } }
            }
          }
        }
      });
    }

    // 2. Category Demand Share (Doughnut)
    const catCtx = document.getElementById('categoryForecastChart');
    if (catCtx) {
      if (this.categoryChart) this.categoryChart.destroy();

      const catTotals = {};
      forecasts.forEach(f => {
        const cat = f.product?.category || 'General';
        const dem = Number(f.demandLastYear || f.projectedDemand || 0);
        catTotals[cat] = (catTotals[cat] || 0) + dem;
      });

      const catLabels = Object.keys(catTotals);
      const catData = Object.values(catTotals);
      const catColors = ['#00a896', '#028090', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

      this.categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{
            data: catData,
            backgroundColor: catColors.slice(0, catLabels.length),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                font: { family: 'Outfit, sans-serif', size: 11 }
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  }

  async handleGeneratePO(productId) {
    const item = this.currentForecasts.find(f => f.product && f.product.id === Number(productId));
    if (!item) {
      SwalHelpers?.toast?.('Product forecast not found', 'error');
      return;
    }

    const p = item.product;
    const suggested = item.suggestedReorder > 0 ? item.suggestedReorder : Math.max(10, p.reorderPoint || 10);
    const unitCost = Number(p.costPrice || 0);
    const monthName = this.currentMeta.monthName || 'Seasonal';
    const lastYear = this.currentMeta.lastYear || 'Last Year';

    const result = await Swal.fire({
      title: `Generate Purchase Order`,
      html: `
        <div style="text-align: left; font-size: 0.88rem;">
          <p class="mb-2"><strong>Medicine:</strong> ${this.escapeHtml(p.name)} (${this.escapeHtml(p.category)})</p>
          <p class="mb-2"><strong>Current Shelf Stock:</strong> <span class="badge ${p.stock < item.projectedDemand ? 'bg-danger' : 'bg-success'}">${p.stock} ${this.escapeHtml(p.uom)}</span></p>
          <p class="mb-2"><strong>Last Year (${monthName} ${lastYear}) Demand:</strong> <strong>${item.demandLastYear} ${this.escapeHtml(p.uom)}</strong></p>
          <p class="mb-2"><strong>Projected Need + Buffer:</strong> ${item.targetStock} ${this.escapeHtml(p.uom)} (Recommended Order: <strong class="text-danger">${suggested} ${this.escapeHtml(p.uom)}</strong>)</p>
          <hr class="my-2">
          <div class="mb-3">
            <label class="form-label fw-bold">Order Quantity (${this.escapeHtml(p.uom)}):</label>
            <input type="number" id="po-order-qty" class="form-control" min="1" value="${suggested}">
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold">Estimated Unit Cost (₱):</label>
            <input type="number" step="0.01" id="po-unit-cost" class="form-control" value="${unitCost}">
          </div>
          <div class="mb-2">
            <label class="form-label fw-bold">PO Notes / Supplier Reference:</label>
            <textarea id="po-notes" class="form-control" rows="2" placeholder="e.g. Seasonal replenishment based on ${monthName} historical demand"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Confirm & Generate PO',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#00a896',
      preConfirm: () => {
        const qty = parseInt(document.getElementById('po-order-qty').value, 10);
        const cost = parseFloat(document.getElementById('po-unit-cost').value);
        const notes = document.getElementById('po-notes').value.trim();
        if (!qty || qty <= 0) {
          Swal.showValidationMessage('Please enter a valid order quantity');
          return false;
        }
        return { qty, cost, notes };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        const payload = {
          product_id: p.id,
          order_qty: result.value.qty,
          unit_cost: result.value.cost,
          notes: result.value.notes,
          algorithm: 'seasonal_yoy',
          projected_demand: item.projectedDemand
        };
        await window.mockApi.createPurchaseOrder(payload);
        SwalHelpers?.toast?.(`Purchase Order generated for ${p.name} (${result.value.qty} ${p.uom})`, 'success');
      } catch (err) {
        SwalHelpers?.toast?.(err.message || 'Failed to generate purchase order', 'error');
      }
    }
  }

  showCalculationBreakdown(productId) {
    const item = this.currentForecasts.find(f => f.product && f.product.id === Number(productId));
    if (!item) return;

    const p = item.product;
    const monthName = this.currentMeta.monthName || 'Same Month';
    const lastYear = this.currentMeta.lastYear || 'Last Year';

    const htmlContent = `
      <div style="text-align: left; font-size: 0.88rem; line-height: 1.6;">
        <h5 style="color: var(--primary); font-weight: 700; margin-bottom: 0.75rem;">
          ${this.escapeHtml(p.name)} (${this.escapeHtml(p.category)})
        </h5>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <h6 style="font-weight: 700; margin-bottom: 0.5rem; color: #1e293b;">
            <i class="ri-calculator-line text-primary me-1"></i> Seasonal Restock Math:
          </h6>
          <table style="width: 100%; font-size: 0.85rem;">
            <tr>
              <td style="padding: 4px 0;">1. Last Year Demand (<strong>${monthName} ${lastYear}</strong>):</td>
              <td style="text-align: right; font-weight: 700;">${item.demandLastYear} ${this.escapeHtml(p.uom)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">2. Recent 30-Day Velocity:</td>
              <td style="text-align: right; font-weight: 700;">${item.sold30d} ${this.escapeHtml(p.uom)}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 6px 0; font-weight: 600;">3. Projected Monthly Demand:</td>
              <td style="text-align: right; font-weight: 700; color: #028090;">${item.projectedDemand} ${this.escapeHtml(p.uom)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">4. Safety Cushion (Supplier Lead Time):</td>
              <td style="text-align: right; font-weight: 700; color: #d97706;">+ ${item.safetyStock} ${this.escapeHtml(p.uom)}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 6px 0; font-weight: 700;">Target Stock Needed:</td>
              <td style="text-align: right; font-weight: 700;">${item.targetStock} ${this.escapeHtml(p.uom)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Less: Current Shelf Stock:</td>
              <td style="text-align: right; font-weight: 700; color: #ef4444;">− ${p.stock} ${this.escapeHtml(p.uom)}</td>
            </tr>
            <tr style="border-top: 2px solid #00a896; font-size: 0.95rem;">
              <td style="padding: 8px 0; font-weight: 700; color: var(--primary);">Suggested Reorder Quantity:</td>
              <td style="text-align: right; font-weight: 800; color: var(--primary); font-size: 1.1rem;">
                ${item.suggestedReorder} ${this.escapeHtml(p.uom)}
              </td>
            </tr>
          </table>
        </div>

        <div style="background: rgba(0, 168, 150, 0.08); border-left: 4px solid #00a896; border-radius: 4px; padding: 0.75rem 1rem; font-size: 0.82rem;">
          <strong><i class="ri-lightbulb-line text-warning"></i> Pharmacist Advice:</strong><br>
          ${item.suggestedReorder > 0
            ? `Because your store sold <strong>${item.demandLastYear} ${p.uom}</strong> during ${monthName} last year, and your current stock is only <strong>${p.stock} ${p.uom}</strong>, placing an order of <strong>${item.suggestedReorder} ${p.uom}</strong> guarantees your shelves will not run dry before the month concludes.`
            : `Your current shelf stock of <strong>${p.stock} ${p.uom}</strong> is sufficient to meet last year's ${monthName} demand (${item.demandLastYear} ${p.uom}) plus the distributor safety buffer. No immediate reorder is required.`
          }
        </div>
      </div>
    `;

    Swal.fire({
      title: `📋 Restock Calculation Breakdown`,
      html: htmlContent,
      width: '640px',
      showCloseButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Close Breakdown',
      confirmButtonColor: '#00a896'
    });
  }

  showModelGuideModal() {
    const htmlContent = `
      <div style="text-align: left; font-size: 0.88rem; max-height: 72vh; overflow-y: auto; padding-right: 4px;">
        <div class="ols-header-card mb-3">
          <h4 style="margin: 0 0 0.35rem; font-size: 1.05rem; font-weight: 700; color: var(--primary);">
            <i class="ri-lightbulb-line"></i> Year-Over-Year Seasonal Demand Forecasting
          </h4>
          <p style="margin: 0; font-size: 0.82rem; line-height: 1.5; color: #475569;">
            Instead of abstract statistical guesses, PharmaTrack uses the proven retail pharmacy practice: comparing what customers bought during the same month last year against what is on your shelves right now.
          </p>
        </div>

        <div class="ols-modal-card mb-3">
          <h5 style="margin: 0 0 0.5rem; font-size: 0.92rem; font-weight: 700; color: #008779;">
            <i class="ri-number-1"></i> Step 1: Check Last Year's Demand (Same Month)
          </h5>
          <p style="margin: 0; font-size: 0.82rem; color: #64748b;">
            Pharmacies experience regular annual disease and weather cycles (e.g. cough and cold surges during rainy or colder months, antibiotics after seasonal typhoons, vitamins during school exams). Looking at the exact same calendar month last year gives you real customer demand benchmarks.
          </p>
        </div>

        <div class="ols-modal-card mb-3">
          <h5 style="margin: 0 0 0.5rem; font-size: 0.92rem; font-weight: 700; color: #028090;">
            <i class="ri-number-2"></i> Step 2: Compare Against Current Shelf Stock
          </h5>
          <p style="margin: 0; font-size: 0.82rem; color: #64748b;">
            The system instantly checks how many boxes or tablets are physically on hand today. If current stock is low while last year's sales were high, the system immediately flags a <strong>Depletion Risk</strong>.
          </p>
        </div>

        <div class="ols-modal-card mb-3">
          <h5 style="margin: 0 0 0.5rem; font-size: 0.92rem; font-weight: 700; color: #d97706;">
            <i class="ri-number-3"></i> Step 3: Calculate Suggested Purchase Order Quantity
          </h5>
          <div class="formula-code-snippet p-2 rounded mb-2 font-monospace" style="font-size: 0.82rem; line-height: 1.6;">
            <strong>Suggested Reorder</strong> = (Last Year Demand + Supplier Safety Buffer) − Current Shelf Stock
          </div>
          <p style="margin: 0; font-size: 0.82rem; color: #64748b;">
            This calculation ensures you have enough inventory to cover customer demand, keeps a 7-day safety buffer for delivery delays, and avoids over-ordering items you already have on hand.
          </p>
        </div>

        <div class="ols-tip-box" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.82rem; color: #166534;">
          <strong><i class="ri-shield-star-line"></i> Capstone Presentation Summary:</strong><br>
          "Our system forecasts medicine demand by directly examining historical sales for the same calendar month last year. When current stock is lower than historical seasonal demand, it automatically suggests exact purchase order quantities before the pharmacy runs out of stock."
        </div>
      </div>
    `;

    Swal.fire({
      title: `📘 How Seasonal Forecasting Works`,
      html: htmlContent,
      width: '780px',
      showCloseButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Got It!',
      confirmButtonColor: '#00a896'
    });
  }

  async showMedicineSelectionModal() {
    let allProducts = [];
    try {
      allProducts = await window.mockApi.getProducts();
    } catch (e) {
      SwalHelpers?.toast?.('Failed to load products list', 'error');
      return;
    }

    if (!allProducts || allProducts.length === 0) {
      SwalHelpers?.toast?.('No medicines available in catalog', 'info');
      return;
    }

    const currentlySelected = new Set(this.selectedProductIds || allProducts.map(p => p.id));
    const categories = Array.from(new Set(allProducts.map(p => p.category || 'General'))).sort();

    const optionsHtml = categories.map(cat => `<option value="${this.escapeHtml(cat)}">${this.escapeHtml(cat)}</option>`).join('');

    const rowsHtml = allProducts.map(p => {
      const isChecked = currentlySelected.has(p.id);
      return `
        <div class="forecast-med-picker-row d-flex align-items-center justify-content-between p-2 border-bottom ${isChecked ? 'is-selected' : ''}"
             data-id="${p.id}"
             data-name="${this.escapeHtml(p.name).toLowerCase()}"
             data-category="${this.escapeHtml(p.category || 'General').toLowerCase()}"
             data-stock="${p.stock}">
          <div class="d-flex align-items-center gap-2">
            <input type="checkbox" class="form-check-input forecast-med-check" value="${p.id}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
            <div>
              <div class="fw-bold" style="font-size: 0.86rem; color: #0f172a;">${this.escapeHtml(p.name)}</div>
              <div class="small text-muted" style="font-size: 0.76rem;">${this.escapeHtml(p.genericName || '')} &bull; <span class="badge bg-light text-secondary border">${this.escapeHtml(p.category)}</span></div>
            </div>
          </div>
          <div class="text-end">
            <span class="badge ${p.stock <= 0 ? 'bg-danger' : (p.stock < 15 ? 'bg-warning text-dark' : 'bg-success')}" style="font-size: 0.75rem;">
              ${p.stock} ${this.escapeHtml(p.uom || 'Unit')}
            </span>
          </div>
        </div>
      `;
    }).join('');

    const modalBody = `
      <div style="text-align: left; font-size: 0.85rem;">
        <p class="text-muted mb-2" style="font-size: 0.8rem;">
          Choose which medicines to analyze in the seasonal demand forecast:
        </p>
        <div class="row g-2 mb-2">
          <div class="col-7">
            <input type="text" id="swal-forecast-med-search" class="form-control form-control-sm" placeholder="🔍 Search medicine name...">
          </div>
          <div class="col-5">
            <select id="swal-forecast-med-cat" class="form-select form-select-sm">
              <option value="">All Categories</option>
              ${optionsHtml}
            </select>
          </div>
        </div>

        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-primary btn-sm py-0" id="swal-btn-select-all" style="font-size: 0.74rem;">Select All</button>
            <button type="button" class="btn btn-outline-secondary btn-sm py-0" id="swal-btn-deselect-all" style="font-size: 0.74rem;">Deselect All</button>
          </div>
          <span class="small text-muted" style="font-size: 0.74rem;">
            Selected: <strong id="swal-selected-counter" class="text-primary">${currentlySelected.size}</strong> of ${allProducts.length}
          </span>
        </div>

        <div id="swal-med-list-container" style="max-height: 280px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
          ${rowsHtml}
        </div>
      </div>
    `;

    const result = await Swal.fire({
      title: 'Select Medicines for Demand Forecast',
      html: modalBody,
      width: '640px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Apply Selection',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#00a896',
      didOpen: () => {
        const searchInput = document.getElementById('swal-forecast-med-search');
        const catSelect = document.getElementById('swal-forecast-med-cat');
        const listContainer = document.getElementById('swal-med-list-container');
        const counterEl = document.getElementById('swal-selected-counter');
        const rows = listContainer.querySelectorAll('.forecast-med-picker-row');

        const updateCounter = () => {
          const checkedCount = listContainer.querySelectorAll('.forecast-med-check:checked').length;
          if (counterEl) counterEl.textContent = checkedCount;
        };

        const filterRows = () => {
          const q = (searchInput?.value || '').trim().toLowerCase();
          const cat = (catSelect?.value || '').trim().toLowerCase();

          rows.forEach(row => {
            const rName = row.getAttribute('data-name') || '';
            const rCat = row.getAttribute('data-category') || '';
            const matchQ = !q || rName.includes(q);
            const matchCat = !cat || rCat === cat;
            row.style.display = (matchQ && matchCat) ? 'flex' : 'none';
          });
        };

        searchInput?.addEventListener('input', filterRows);
        catSelect?.addEventListener('change', filterRows);

        rows.forEach(row => {
          const chk = row.querySelector('.forecast-med-check');
          row.addEventListener('click', (e) => {
            if (e.target !== chk) chk.checked = !chk.checked;
            row.classList.toggle('is-selected', chk.checked);
            updateCounter();
          });
        });

        document.getElementById('swal-btn-select-all')?.addEventListener('click', () => {
          rows.forEach(r => {
            if (r.style.display !== 'none') {
              r.querySelector('.forecast-med-check').checked = true;
              r.classList.add('is-selected');
            }
          });
          updateCounter();
        });

        document.getElementById('swal-btn-deselect-all')?.addEventListener('click', () => {
          rows.forEach(r => {
            if (r.style.display !== 'none') {
              r.querySelector('.forecast-med-check').checked = false;
              r.classList.remove('is-selected');
            }
          });
          updateCounter();
        });
      },
      preConfirm: () => {
        const checkedBoxes = document.querySelectorAll('.forecast-med-check:checked');
        const selectedIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10)).filter(Boolean);
        if (selectedIds.length === 0) {
          Swal.showValidationMessage('Please select at least 1 medicine');
          return false;
        }
        return selectedIds;
      }
    });

    if (result.isConfirmed && result.value) {
      const selected = result.value;
      if (selected.length === allProducts.length) {
        this.selectedProductIds = null;
        localStorage.removeItem('pharmatrack_forecast_selected_products');
      } else {
        this.selectedProductIds = selected;
        localStorage.setItem('pharmatrack_forecast_selected_products', JSON.stringify(selected));
      }
      await this.render();
      SwalHelpers?.toast?.(`Demand forecast updated for ${selected.length} medicines`, 'success');
    }
  }

  async resetMedicineSelection() {
    this.selectedProductIds = null;
    localStorage.removeItem('pharmatrack_forecast_selected_products');
    await this.render();
    SwalHelpers?.toast?.('Forecast reset to include all medicines', 'info');
  }

  escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.ForecastController = ForecastController;
