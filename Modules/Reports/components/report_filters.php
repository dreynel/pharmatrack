<!-- Component: Report Filter Controls (Modules/Reports/components/report_filters.php) -->
<div class="report-filters-card glass-card" id="report-filters-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-file-chart-line text-primary"></i> Pharmacy Audit & Financial Reporting</h3>
      <span class="text-sm text-muted">Generate compliance summaries, revenue breakdowns, valuation sheets, and loss reports</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-secondary btn-sm" onclick="exportActiveReportCSV()">
        <i class="ri-download-2-line"></i> Download CSV
      </button>
      <button class="btn btn-primary btn-sm" onclick="window.print()">
        <i class="ri-printer-line"></i> Print Summary
      </button>
    </div>
  </div>

  <div class="report-controls-bar" style="padding: 1rem 1.25rem; display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
    <div class="control-group">
      <label class="text-xs font-semibold">Report Type</label>
      <select id="report-type-select" class="form-control form-control-sm" onchange="handleReportTypeChange(this.value)">
        <option value="sales" selected>Sales & Revenue Breakdown</option>
        <option value="valuation">Current Inventory Valuation</option>
        <option value="losses">Stock-Out & Expiry Losses</option>
        <option value="fsn">FSN Turnover Analysis (Fast/Slow/Non-Moving)</option>
      </select>
    </div>

    <div class="control-group" id="report-date-range-group">
      <label class="text-xs font-semibold">Date Range</label>
      <select id="report-range-select" class="form-control form-control-sm" onchange="handleReportRangeChange(this.value)">
        <option value="today">Today</option>
        <option value="week">Last 7 Days</option>
        <option value="month" selected>Last 30 Days</option>
        <option value="year">Last 365 Days</option>
      </select>
    </div>

    <div class="control-group">
      <button class="btn btn-secondary btn-sm" onclick="refreshCurrentReport()">
        <i class="ri-refresh-line"></i> Refresh Data
      </button>
    </div>
  </div>
</div>

