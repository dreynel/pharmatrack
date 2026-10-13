<!-- Component: POS Receipt Modal (Modules/POS/components/receipt_modal.php) -->
<div class="modal" id="modal-pos-receipt" style="display: none;">
  <div class="modal-backdrop" onclick="closePosReceiptModal()"></div>
  <div class="modal-content modal-md">
    <div class="modal-header">
      <h3 class="modal-title"><i class="ri-printer-line text-primary"></i> Official Pharmacy Receipt</h3>
      <button class="modal-close" onclick="closePosReceiptModal()"><i class="ri-close-line"></i></button>
    </div>

    <div class="modal-body receipt-body" id="pos-printable-receipt">
      <div class="receipt-header text-center" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700;">XYRA ANDREA PHARMACY</h4>
        <p class="text-xs text-muted" style="margin: 2px 0;">Brgy. Poblacion, Alaminos, Laguna</p>
        <p class="text-xs text-muted" style="margin: 2px 0;">Non-VAT Reg. TIN: 123-456-789-000</p>
        <p class="text-xs text-muted" style="margin: 2px 0;">Contact: (049) 567-8901</p>
      </div>

      <div class="receipt-meta" style="font-size: 0.8rem; margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between;">
          <span>Invoice No: <strong id="receipt-invoice-no">INV-0000</strong></span>
          <span id="receipt-date">2026-10-13</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Cashier: <span id="receipt-cashier">Pharmacist</span></span>
          <span>Customer: <span id="receipt-customer">Regular</span></span>
        </div>
      </div>

      <table class="receipt-items-table" style="width: 100%; font-size: 0.8rem; border-collapse: collapse; margin-bottom: 0.75rem;">
        <thead>
          <tr style="border-bottom: 1px dashed var(--border-color); text-align: left;">
            <th style="padding: 4px 0;">Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody id="receipt-items-tbody">
          <!-- Populated dynamically -->
        </tbody>
      </table>

      <div class="receipt-totals" style="border-top: 1px dashed var(--border-color); padding-top: 0.5rem; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Subtotal:</span>
          <strong id="receipt-subtotal">₱0.00</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px; color: var(--color-success, #10b981);">
          <span>Discount:</span>
          <strong id="receipt-discount">-₱0.00</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 1rem; font-weight: 700;">
          <span>Total:</span>
          <span id="receipt-total">₱0.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Amount Paid (<span id="receipt-payment-method">Cash</span>):</span>
          <span id="receipt-amount-paid">₱0.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Change:</span>
          <span id="receipt-change">₱0.00</span>
        </div>
      </div>

      <div class="receipt-footer text-center text-xs text-muted" style="margin-top: 1rem; border-top: 1px dashed var(--border-color); padding-top: 0.5rem;">
        <p style="margin: 2px 0;">Thank you for trusting Xyra Andrea Pharmacy!</p>
        <p style="margin: 2px 0;">Please keep this receipt for verification.</p>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closePosReceiptModal()">Close</button>
      <button type="button" class="btn btn-primary" onclick="printReceipt()"><i class="ri-printer-line"></i> Print Receipt</button>
    </div>
  </div>
</div>

