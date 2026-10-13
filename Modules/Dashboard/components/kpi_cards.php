<!-- Component: Dashboard KPI Metric Cards (Modules/Dashboard/components/kpi_cards.php) -->
<div class="kpi-cards-grid" id="dashboard-kpi-grid">
  <!-- Card 1: Today's Sales -->
  <div class="kpi-card glass-card">
    <div class="kpi-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
      <i class="ri-money-dollar-circle-line"></i>
    </div>
    <div class="kpi-details">
      <span class="kpi-label">Today's Revenue</span>
      <h3 class="kpi-value" id="kpi-today-sales">₱0.00</h3>
      <span class="kpi-subtext" id="kpi-today-transactions">0 transactions today</span>
    </div>
  </div>

  <!-- Card 2: Active Medicines -->
  <div class="kpi-card glass-card">
    <div class="kpi-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">
      <i class="ri-medicine-bottle-line"></i>
    </div>
    <div class="kpi-details">
      <span class="kpi-label">Catalog Products</span>
      <h3 class="kpi-value" id="kpi-total-products">0</h3>
      <span class="kpi-subtext" id="kpi-inventory-valuation">Valuation: ₱0.00</span>
    </div>
  </div>

  <!-- Card 3: Low Stock Alerts -->
  <div class="kpi-card glass-card">
    <div class="kpi-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
      <i class="ri-alert-line"></i>
    </div>
    <div class="kpi-details">
      <span class="kpi-label">Low Stock Items</span>
      <h3 class="kpi-value" id="kpi-low-stock">0</h3>
      <span class="kpi-subtext">Needs reorder replenishment</span>
    </div>
  </div>

  <!-- Card 4: Expiring Soon Alerts -->
  <div class="kpi-card glass-card">
    <div class="kpi-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">
      <i class="ri-calendar-close-line"></i>
    </div>
    <div class="kpi-details">
      <span class="kpi-label">Expiring (90 Days)</span>
      <h3 class="kpi-value" id="kpi-expiring-soon">0</h3>
      <span class="kpi-subtext">Require FEFO priority dispensing</span>
    </div>
  </div>
</div>

