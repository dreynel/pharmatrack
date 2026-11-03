/**
 * PharmaTrack - Dashboard Module Controller
 * Xyra Andrea Pharmacy - Sales & Inventory Analytics Overview
 */

class DashboardController {
  constructor() {
    this.salesTrendChart = null;
  }

  async init() {
    window.addEventListener('pharmatrack:themechange', () => {
      this.render();
    });
    await this.render();
  }

  async render() {
    await this.loadStats();
  }

  async loadStats() {
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

    this.renderLowStockTable(products.filter(p => p.stock <= p.reorderPoint || p.status === 'Expiring Soon'));
    this.renderSalesTrendChart(todayTxns);
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
}

// Attach to window
window.DashboardController = DashboardController;

