<!-- Component: Conversion History Log (Modules/Conversion/components/conversion_history.php) -->
<div class="conversion-history-card glass-card" id="conversion-history-container" style="margin-top: 1.5rem;">
  <div class="card-header">
    <div>
      <h3><i class="ri-history-line text-secondary"></i> Conversion Audit Trail</h3>
      <span class="text-sm text-muted">Complete traceability log of wholesale break downs and unit yield</span>
    </div>
    <div class="card-actions">
      <div class="search-input-wrap">
        <i class="ri-search-line"></i>
        <input type="text" id="conv-search" placeholder="Search conversion log..." oninput="filterConversionHistory(this.value)">
      </div>
    </div>
  </div>

  <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
    <table class="custom-table" id="conversion-history-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Date</th>
          <th>Source Bulk</th>
          <th>Qty Deducted</th>
          <th>Target Piece</th>
          <th>Yield (Pieces)</th>
          <th>Ratio</th>
          <th>Operator</th>
        </tr>
      </thead>
      <tbody id="conversion-history-tbody">
        <!-- Rendered dynamically -->
      </tbody>
    </table>
  </div>
</div>

