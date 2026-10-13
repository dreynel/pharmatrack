<!-- Component: POS Cart & Checkout Panel (Modules/POS/components/cart_panel.php) -->
<div class="pos-cart-panel glass-card" id="pos-cart-container">
  <div class="card-header">
    <div>
      <h3><i class="ri-shopping-cart-2-fill text-success"></i> Current Transaction</h3>
      <span class="text-sm text-muted" id="pos-cart-counter">0 items in basket</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-secondary btn-sm" onclick="clearPosCart()" title="Clear cart">
        <i class="ri-delete-bin-line"></i> Clear
      </button>
    </div>
  </div>

  <!-- Cart Line Items -->
  <div class="pos-cart-items-wrap" id="pos-cart-items-wrap">
    <div class="empty-cart-state" id="pos-empty-cart">
      <i class="ri-shopping-cart-line"></i>
      <p>Cart is currently empty.<br><span class="text-sm text-muted">Select medicines from the left to start sale.</span></p>
    </div>
    <ul class="pos-cart-list" id="pos-cart-list" style="display: none;">
      <!-- Dynamic cart rows rendered via JS -->
    </ul>
  </div>

  <!-- Customer & Discount Section -->
  <div class="pos-cart-summary-section">
    <div class="form-row" style="margin-bottom: 0.5rem;">
      <div class="form-group col-md-6" style="margin-bottom: 0;">
        <label class="text-xs">Customer Type</label>
        <select id="pos-customer-type" class="form-control form-control-sm" onchange="handleCustomerTypeChange(this.value)">
          <option value="regular">Regular Customer</option>
          <option value="senior">Senior Citizen (20% Off)</option>
          <option value="pwd">PWD (20% Off)</option>
        </select>
      </div>
      <div class="form-group col-md-6" style="margin-bottom: 0;">
        <label class="text-xs">Customer ID / Name (Optional)</label>
        <input type="text" id="pos-customer-id" class="form-control form-control-sm" placeholder="OSCA/PWD ID or Name">
      </div>
    </div>

    <!-- Calculation Breakdown -->
    <div class="summary-breakdown">
      <div class="summary-line">
        <span>Subtotal</span>
        <strong id="pos-summary-subtotal">₱0.00</strong>
      </div>
      <div class="summary-line text-success">
        <span>Discount (Senior/PWD)</span>
        <strong id="pos-summary-discount">-₱0.00</strong>
      </div>
      <div class="summary-line total-line">
        <span>Total Due</span>
        <span class="total-amount" id="pos-summary-total">₱0.00</span>
      </div>
    </div>

    <!-- Payment Inputs -->
    <div class="payment-action-box">
      <div class="form-row">
        <div class="form-group col-md-6" style="margin-bottom: 0.5rem;">
          <label class="text-xs">Payment Method</label>
          <select id="pos-payment-method" class="form-control form-control-sm">
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
            <option value="Card">Credit/Debit Card</option>
          </select>
        </div>
        <div class="form-group col-md-6" style="margin-bottom: 0.5rem;">
          <label class="text-xs">Amount Tendered</label>
          <input type="number" id="pos-amount-tendered" step="0.25" min="0" class="form-control form-control-sm" placeholder="₱0.00" oninput="calculateChange()">
        </div>
      </div>

      <div class="change-line" style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0;">
        <span class="text-sm font-semibold">Change:</span>
        <span class="text-lg font-bold text-primary" id="pos-change-amount">₱0.00</span>
      </div>

      <button class="btn btn-primary btn-block btn-lg" id="btn-pos-checkout" onclick="executePosCheckout()" disabled>
        <i class="ri-check-double-line"></i> Complete Sale & Print Receipt
      </button>
    </div>
  </div>
</div>

