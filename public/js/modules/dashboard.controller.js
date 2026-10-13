/**
 * PharmaTrack - Dashboard Module Controller
 * Xyra Andrea Pharmacy - Sales & Inventory Analytics Overview
 */

class DashboardController {
  constructor() {
    this.salesTrendChart = null;
  }

  async init() {
    await this.render();
  }

  async render() {
    await this.loadStats();
  }

  async loadStats() {
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

    this.renderLowStockTable(products.filter(p => p.stock <= p.reorderPoint || p.status === 'Expiring Soon'));
    this.renderSalesTrendChart(txns);
  }

  renderLowStockTable(alertProducts) {
    const container = document.getElementById('dash-low-stock-table-body');
    if (!container) return;

    if (alertProducts.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #10b981; padding: 1.5rem;"><i class="ri-checkbox-circle-line"></i> All inventory stock levels are optimal!</td></tr>`;
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
            <button class="btn btn-sm btn-outline" onclick="window.inventoryController.quickRestock(${p.id})">
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
}

// Attach to window
window.DashboardController = DashboardController;

