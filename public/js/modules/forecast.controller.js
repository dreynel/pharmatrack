/**
 * PharmaTrack - AI Demand Forecasting Controller
 * Xyra Andrea Pharmacy - Consumption Prediction, Safety Stock & Purchase Order Automation
 */

class ForecastController {
  constructor() {
    this.forecastChart = null;
    this.categoryChart = null;
  }

  async init() {
    await this.render();
  }

  async render() {
    const forecasts = await window.mockApi.getDemandForecasts();
    this.renderForecastTable(forecasts);
    this.renderCharts(forecasts);
  }

  renderForecastTable(forecasts) {
    const container = document.getElementById('forecast-table-body');
    if (!container) return;

    if (forecasts.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2.5rem;">No forecast data available.</td></tr>`;
      return;
    }

    container.innerHTML = forecasts.map(item => {
      const { product, avgDaily, forecast30, safetyStock, suggestedReorder, daysOfInventoryLeft, urgency } = item;
      
      let urgencyBadge = 'badge-success';
      if (urgency === 'High') urgencyBadge = 'badge-danger';
      else if (urgency === 'Medium') urgencyBadge = 'badge-warning';

      return `
        <tr>
          <td>
            <strong>${product.name}</strong><br>
            <small style="color: var(--text-muted);">${product.category} | ${product.batchNo || 'N/A'}</small>
          </td>
          <td><strong>${product.stock}</strong> ${product.uom || 'units'}</td>
          <td>${avgDaily} / day</td>
          <td style="color: var(--primary); font-weight: 700;">${forecast30} ${product.uom || 'units'}</td>
          <td>${safetyStock} ${product.uom || 'units'}</td>
          <td>
            <span class="badge-pill ${urgencyBadge}">${urgency} (${daysOfInventoryLeft} days left)</span>
          </td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="window.forecastController.handleGeneratePO(${product.id})">
              <i class="ri-shopping-cart-2-line"></i> Order (${suggestedReorder})
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async handleGeneratePO(productId) {
    const forecasts = await window.mockApi.getDemandForecasts();
    const item = forecasts.find(f => f.product.id === productId);
    if (!item) return;

    const result = await SwalHelpers.showGeneratePOModal(item);
    if (result.isConfirmed && result.value) {
      const { supplier, orderQty } = result.value;
      try {
        await window.api.createPurchaseOrder({
          productId: item.product.id,
          orderQty: parseInt(orderQty),
          suggestedQty: item.suggestedReorder,
          supplierName: supplier
        });
        Swal.fire({
          title: 'Purchase Order Issued!',
          html: `PO for <strong>${orderQty} units</strong> of ${item.product.name} submitted to <strong>${supplier}</strong>.`,
          icon: 'success',
          confirmButtonColor: '#00a896',
          confirmButtonText: 'Done'
        });
        if (window.appController) {
          await window.appController.refreshAllModules();
        }
      } catch (err) {
        Swal.fire('Error', err.message || 'Failed to issue purchase order', 'error');
      }
    }
  }

  renderCharts(forecasts) {
    // 1. Line Chart: Historical vs 30-Day Demand Forecast
    const lineCtx = document.getElementById('demandForecastChart');
    if (lineCtx) {
      if (this.forecastChart) this.forecastChart.destroy();

      const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4 (Hist)', 'Week 5 (Fcst)', 'Week 6 (Fcst)', 'Week 7 (Fcst)', 'Week 8 (Fcst)'];
      const topProducts = forecasts.slice(0, 3);

      const datasets = topProducts.map((item, idx) => {
        const colors = ['#00a896', '#f59e0b', '#3b82f6'];
        const baseSales = item.avgDaily * 7;
        const histData = [baseSales * 0.9, baseSales * 0.95, baseSales * 1.05, baseSales];
        const forecastData = [baseSales * 1.1, baseSales * 1.15, baseSales * 1.08, baseSales * 1.2];

        return {
          label: item.product.name,
          data: [...histData, ...forecastData],
          borderColor: colors[idx % colors.length],
          backgroundColor: colors[idx % colors.length] + '18',
          fill: true,
          tension: 0.4
        };
      });

      this.forecastChart = new Chart(lineCtx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#0f172a', font: { weight: 'bold' } } },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: { grid: { color: 'rgba(15, 23, 42, 0.05)' }, ticks: { color: '#64748b' } },
            y: { grid: { color: 'rgba(15, 23, 42, 0.05)' }, ticks: { color: '#64748b' } }
          }
        }
      });
    }

    // 2. Bar Chart: Category Forecasted Consumption
    const barCtx = document.getElementById('categoryForecastChart');
    if (barCtx) {
      if (this.categoryChart) this.categoryChart.destroy();

      const categoryTotals = {};
      forecasts.forEach(f => {
        const cat = f.product.category;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + f.forecast30;
      });

      this.categoryChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(categoryTotals),
          datasets: [{
            label: '30-Day Forecasted Units',
            data: Object.values(categoryTotals),
            backgroundColor: '#028090',
            borderWidth: 0,
            borderRadius: 6
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
  }
}

window.ForecastController = ForecastController;

