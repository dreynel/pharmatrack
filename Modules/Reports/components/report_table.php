<!-- Component: Dynamic Report Output Viewer (Modules/Reports/components/report_table.php) -->
<div class="report-output-card glass-card" id="report-output-container" style="margin-top: 1.5rem;">
  <!-- Summary Cards Container -->
  <div class="report-kpi-summary-grid" id="report-kpi-summary" style="padding: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
    <!-- Rendered dynamically -->
  </div>

  <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
    <table class="custom-table" id="report-data-table">
      <thead id="report-table-thead">
        <!-- Rendered dynamically based on selected report type -->
      </thead>
      <tbody id="report-table-tbody">
        <!-- Rows rendered dynamically -->
      </tbody>
    </table>
  </div>
</div>

