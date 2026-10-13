<!-- Component: Demand Forecasting Velocity Table (Modules/Forecast/components/forecast_table.php) -->
<div class="forecast-card glass-card" id="forecast-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-line-chart-line text-primary"></i> Demand Forecasting & Reorder Planning</h3>
      <span class="text-sm text-muted">Data-driven replenishment based on previous sales velocity, safety stock, and runout projections</span>
    </div>
    <div class="card-actions" style="display: flex; gap: 0.5rem; align-items: center;">
      <label class="text-xs text-muted" style="margin: 0;">Sales Window:</label>
      <select id="forecast-period-select" class="form-control form-control-sm" onchange="loadForecastData(this.value)">
        <option value="14">Last 14 Days</option>
        <option value="30" selected>Last 30 Days (Standard)</option>
        <option value="60">Last 60 Days</option>
        <option value="90">Last 90 Days (Quarterly)</option>
      </select>
    </div>
  </div>

  <div class="panel-filters-bar" style="padding: 0.75rem 1.25rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
    <div class="search-input-wrap" style="flex: 1; min-width: 240px;">
      <i class="ri-search-line"></i>
      <input type="text" id="forecast-search-input" placeholder="Search product or generic name..." oninput="filterForecastTable()">
    </div>

    <div class="filter-group">
      <select id="forecast-urgency-filter" class="form-control form-control-sm" onchange="filterForecastTable()">
        <option value="">All Urgency Levels</option>
        <option value="Critical">Critical (Out of Stock)</option>
        <option value="High">High (Reorder Urgently)</option>
        <option value="Medium">Medium (Approaching Reorder)</option>
        <option value="Low">Low (Sufficient)</option>
      </select>
    </div>
  </div>

  <div class="table-responsive" style="max-height: 560px; overflow-y: auto;">
    <table class="custom-table" id="forecast-table">
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Current Stock</th>
          <th>Reorder Point</th>
          <th>Total Sold (Period)</th>
          <th>Daily Sales Velocity</th>
          <th>Days Remaining</th>
          <th>Suggested Reorder</th>
          <th>Urgency</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="forecast-tbody">
        <!-- Rendered dynamically -->
      </tbody>
    </table>
  </div>
</div>

