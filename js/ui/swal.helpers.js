/**
 * PharmaTrack - SweetAlert2 Helper Wrappers
 * Xyra Andrea Pharmacy - Clinical Design System Modals
 */

const SwalHelpers = {
  // Toast Notification
  toast(title, icon = 'success') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon,
      title: title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  },

  // Modal Concurrency, Rapid-Click & Stacking Validator
  _lastOpenTimestamp: 0,
  _activeModalId: null,

  canOpenModal(modalId, force = false) {
    const now = Date.now();
    // 1. Prevent rapid double-clicks (within 350ms)
    if (!force && (now - this._lastOpenTimestamp < 350)) {
      console.warn(`[SwalHelpers] Modal launch blocked: rapid click detected on '${modalId}'.`);
      return false;
    }

    // 2. Prevent opening a second main modal while one is already visible on screen
    if (!force && typeof Swal !== 'undefined' && Swal.isVisible()) {
      const container = Swal.getContainer();
      const isToast = container && (container.classList.contains('swal2-top-end') || container.classList.contains('swal2-toast'));
      if (!isToast) {
        console.warn(`[SwalHelpers] Modal launch blocked: a modal is currently open on screen.`);
        return false;
      }
    }

    this._lastOpenTimestamp = now;
    this._activeModalId = modalId;
    return true;
  },

  releaseModalLock() {
    this._activeModalId = null;
    this._lastOpenTimestamp = 0;
  },

  // Payment Confirmation Modal for POS (Philippine BIR Standard)
  async showPaymentModal(cartItems, subtotalOrCalc, discountPercent = 0) {
    if (!this.canOpenModal('payment')) return { isConfirmed: false, isDismissed: true };

    let subtotal = 0;
    let discountAmount = 0;
    let finalTotal = 0;
    let vatableSales = 0;
    let vatAmount = 0;
    let vatExemptSales = 0;
    let isSeniorOrPwd = false;
    let defaultDiscountType = 'Regular';

    if (subtotalOrCalc && typeof subtotalOrCalc === 'object') {
      subtotal = parseFloat(subtotalOrCalc.subtotal || 0);
      isSeniorOrPwd = Boolean(subtotalOrCalc.isSeniorOrPwd);
      discountAmount = isSeniorOrPwd ? parseFloat(subtotalOrCalc.discountVal ?? subtotalOrCalc.discountAmount ?? 0) : 0;
      finalTotal = parseFloat(subtotalOrCalc.finalTotal ?? Math.max(0, subtotal - discountAmount));
      vatableSales = parseFloat(subtotalOrCalc.vatableSales || 0);
      vatAmount = parseFloat(subtotalOrCalc.vatAmount || 0);
      vatExemptSales = parseFloat(subtotalOrCalc.vatExemptSales || 0);
      defaultDiscountType = isSeniorOrPwd ? (subtotalOrCalc.discountType || 'Senior / PWD') : 'Regular';
    } else {
      subtotal = parseFloat(subtotalOrCalc || 0);
      isSeniorOrPwd = discountPercent === 20;
      discountAmount = isSeniorOrPwd ? (((subtotal / 1.12) * 0.20) + (subtotal - (subtotal / 1.12))) : 0;
      finalTotal = Math.max(0, subtotal - discountAmount);
      vatableSales = isSeniorOrPwd ? 0 : (finalTotal / 1.12);
      vatAmount = isSeniorOrPwd ? 0 : (finalTotal - vatableSales);
      vatExemptSales = isSeniorOrPwd ? finalTotal : 0;
      defaultDiscountType = isSeniorOrPwd ? 'Senior / PWD' : 'Regular';
    }

    const htmlContent = `
      <div style="text-align: left; padding: 0.25rem 0;">
        <!-- Order Financial Summary -->
        <div style="background: var(--bg-card-hover, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 1.1rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem; font-size: 0.88rem; color: var(--text-muted, #64748b);">
            <span>Gross Sales (VAT-Inc):</span>
            <span style="font-weight: 700; color: var(--text-main, #0f172a);">₱${subtotal.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem; font-size: 0.88rem; color: #f59e0b;">
            <span>Discount Applied:</span>
            <span style="font-weight: 700;">-₱${discountAmount.toFixed(2)}</span>
          </div>` : ''}
          
          <!-- Philippine BIR 12% Tax Mini Breakdown -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.75rem; margin: 0.5rem 0; font-size: 0.76rem; color: #64748b; font-family: monospace;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>12% VATable Sales:</span>
              <span style="font-weight: 600; color: #334155;">₱${vatableSales.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>12% VAT Amount:</span>
              <span style="font-weight: 600; color: #334155;">₱${vatAmount.toFixed(2)}</span>
            </div>
            ${vatExemptSales > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #0284c7;">
              <span>VAT-Exempt Sales (SC/PWD):</span>
              <span style="font-weight: 700;">₱${vatExemptSales.toFixed(2)}</span>
            </div>` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 1.35rem; font-weight: 800; color: #00a896; border-top: 1px dashed var(--border-color, #cbd5e1); padding-top: 0.65rem; margin-top: 0.4rem;">
            <span>TOTAL DUE:</span>
            <span>₱${finalTotal.toFixed(2)}</span>
          </div>
        </div>

        ${isSeniorOrPwd ? `
        <!-- BIR Statutory ID Field for Senior Citizen / PWD -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #166534; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 4px;">
            <i class="ri-shield-user-line"></i> Senior / PWD Information (BIR Req.)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <div>
              <label style="font-size: 0.72rem; color: #475569; display: block; margin-bottom: 2px;">Customer Name:</label>
              <input type="text" id="swal-cust-name" class="form-control" placeholder="e.g. Juan dela Cruz" style="font-size: 0.85rem; padding: 0.4rem 0.6rem; border-radius: 6px;">
            </div>
            <div>
              <label style="font-size: 0.72rem; color: #475569; display: block; margin-bottom: 2px;">OSCA / PWD ID No.:</label>
              <input type="text" id="swal-cust-id-no" class="form-control" placeholder="e.g. SC-1958-8821" style="font-size: 0.85rem; padding: 0.4rem 0.6rem; border-radius: 6px;">
            </div>
          </div>
        </div>
        ` : ''}

        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="color: var(--text-main, #475569); font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 0.4rem;">Payment Method:</label>
          <select id="swal-payment-method" class="swal2-select" style="width: 100%; margin: 0; padding: 0.65rem; min-height: 42px; border-radius: 8px; font-weight: 600;">
            <option value="Cash">Cash Payment</option>
            <option value="GCash">GCash / E-Wallet</option>
            <option value="Maya">Maya</option>
            <option value="Credit Card">Credit / Debit Card</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <label style="color: #475569; font-size: 0.85rem; font-weight: 700; margin: 0;">Amount Tendered (₱):</label>
            <!-- Quick Tender Chips -->
            <div style="display: flex; gap: 4px;">
              <button type="button" class="btn btn-sm btn-outline py-0 px-2 quick-cash-btn" data-val="${finalTotal}" style="font-size: 0.75rem; border-radius: 4px;">Exact</button>
              <button type="button" class="btn btn-sm btn-outline py-0 px-2 quick-cash-btn" data-val="100" style="font-size: 0.75rem; border-radius: 4px;">₱100</button>
              <button type="button" class="btn btn-sm btn-outline py-0 px-2 quick-cash-btn" data-val="200" style="font-size: 0.75rem; border-radius: 4px;">₱200</button>
              <button type="button" class="btn btn-sm btn-outline py-0 px-2 quick-cash-btn" data-val="500" style="font-size: 0.75rem; border-radius: 4px;">₱500</button>
              <button type="button" class="btn btn-sm btn-outline py-0 px-2 quick-cash-btn" data-val="1000" style="font-size: 0.75rem; border-radius: 4px;">₱1k</button>
            </div>
          </div>
          <input type="number" id="swal-amount-paid" class="swal2-input" placeholder="e.g. 500" value="${Math.ceil(finalTotal)}" step="0.01" style="width: 100%; margin: 0; padding: 0.65rem; font-size: 1.25rem; font-weight: 800; min-height: 44px; border-radius: 8px;">
        </div>

        <div id="change-preview" style="text-align: right; font-size: 1.15rem; font-weight: 800; color: #10b981; padding: 0.25rem 0;">
          Change: ₱0.00
        </div>
      </div>
    `;

    return Swal.fire({
      title: '🛒 Complete Transaction',
      width: '580px',
      html: htmlContent,
      showCancelButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Process Payment',
      cancelButtonText: 'Cancel',
      didOpen: () => {
        const inputAmount = document.getElementById('swal-amount-paid');
        const changePreview = document.getElementById('change-preview');

        const updateChange = () => {
          const paid = parseFloat(inputAmount.value) || 0;
          const change = paid - finalTotal;
          if (change >= 0) {
            changePreview.style.color = '#10b981';
            changePreview.innerHTML = `Change: ₱${change.toFixed(2)}`;
          } else {
            changePreview.style.color = '#ef4444';
            changePreview.innerHTML = `Insufficient Amount: -₱${Math.abs(change).toFixed(2)}`;
          }
        };

        inputAmount.addEventListener('input', updateChange);
        updateChange();

        document.querySelectorAll('.quick-cash-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = parseFloat(btn.getAttribute('data-val')) || finalTotal;
            inputAmount.value = val.toFixed(2);
            updateChange();
          });
        });
      },
      preConfirm: () => {
        const paymentMethod = document.getElementById('swal-payment-method').value;
        const amountPaid = parseFloat(document.getElementById('swal-amount-paid').value) || 0;
        const custNameEl = document.getElementById('swal-cust-name');
        const custIdNoEl = document.getElementById('swal-cust-id-no');

        if (paymentMethod === 'Cash' && amountPaid < finalTotal) {
          Swal.showValidationMessage(`Amount tendered must be at least ₱${finalTotal.toFixed(2)}`);
          return false;
        }

        const effectivePaid = (paymentMethod !== 'Cash' && amountPaid <= 0) ? finalTotal : amountPaid;

        return {
          paymentMethod,
          amountPaid: effectivePaid,
          change: Math.max(0, effectivePaid - finalTotal),
          subtotal,
          discount: discountAmount,
          total: finalTotal,
          vatableSales,
          vatAmount,
          vatExemptSales,
          zeroRatedSales: 0,
          customerName: custNameEl ? custNameEl.value.trim() : '',
          customerIdNo: custIdNoEl ? custIdNoEl.value.trim() : '',
          customerType: isSeniorOrPwd ? (defaultDiscountType.toLowerCase().includes('pwd') ? 'pwd' : 'senior') : 'regular',
          discountType: defaultDiscountType
        };
      }
    });
  },

  // Printable Official Receipt Modal (Philippine BIR Standard Compliant)
  showReceiptModal(txn) {
    if (!txn) return;
    if (!this.canOpenModal('receipt')) return;

    const invoiceId = txn.id || txn.invoice_no || 'N/A';
    const timestamp = txn.timestamp || txn.created_at || new Date().toLocaleString();
    const cashier = txn.cashier || 'Pharmacist';
    const customerName = txn.customerName || txn.customer_name || 'Walk-in Customer';
    const customerType = txn.customerType || txn.customer_type || 'regular';
    const customerIdNo = txn.customerIdNo || txn.customer_id_no || '';
    const paymentMethod = txn.paymentMethod || txn.payment_method || 'Cash';

    const subtotal = parseFloat(txn.subtotal ?? txn.total ?? 0);
    const discount = parseFloat(txn.discount ?? txn.discountAmount ?? txn.discount_amount ?? 0);
    const discountType = txn.discountType || txn.discount_type || '';
    const total = parseFloat(txn.total ?? 0);
    const amountPaid = parseFloat(txn.amountPaid ?? txn.amountTendered ?? txn.amount_paid ?? txn.amount_tendered ?? total);
    const change = parseFloat(txn.change ?? txn.changeAmount ?? txn.change_amount ?? (amountPaid > total ? amountPaid - total : 0));

    // BIR Standard VAT Calculation (12% Philippines VAT & RA 9994 / RA 10754 Exemption)
    const isScPwd = (customerType && customerType.toLowerCase() !== 'regular') ||
                    (discountType && (discountType.toLowerCase().includes('senior') || discountType.toLowerCase().includes('pwd')));

    let vatableSales = parseFloat(txn.vatableSales ?? txn.vatable_sales ?? 0);
    let vatAmount = parseFloat(txn.vatAmount ?? txn.vat_amount ?? 0);
    let vatExemptSales = parseFloat(txn.vatExemptSales ?? txn.vat_exempt_sales ?? 0);
    let zeroRatedSales = parseFloat(txn.zeroRatedSales ?? txn.zero_rated_sales ?? 0);

    if (vatableSales === 0 && vatAmount === 0 && vatExemptSales === 0) {
      if (isScPwd) {
        vatableSales = 0;
        vatAmount = 0;
        vatExemptSales = total;
      } else {
        vatableSales = total / 1.12;
        vatAmount = total - vatableSales;
        vatExemptSales = 0;
      }
    }

    const items = Array.isArray(txn.items) ? txn.items : [];
    const itemsHtml = items.length > 0 ? items.map(item => {
      const name = item.name || item.product_name || 'Item';
      const bNo = item.batchNo || item.batch_no || '';
      const exp = item.expiryDate || item.expiry_date || '';
      const qty = parseInt(item.qty ?? item.quantity ?? 1, 10);
      const price = parseFloat(item.price ?? item.unit_price ?? 0);
      const lineTotal = parseFloat(item.subtotal ?? (qty * price));
      return `
      <tr>
        <td style="padding: 4px 0; text-align: left;">
          <div style="font-weight: 600; color: #1e293b;">${name}</div>
          ${bNo ? `<div style="font-size: 0.68rem; color: #64748b; font-family: monospace;">Batch: ${bNo}${exp ? ` | Exp: ${exp}` : ''}</div>` : ''}
        </td>
        <td style="text-align: center; vertical-align: top; padding-top: 4px;">${qty}</td>
        <td style="text-align: right; vertical-align: top; padding-top: 4px;">₱${price.toFixed(2)}</td>
        <td style="text-align: right; vertical-align: top; padding-top: 4px; font-weight: 600;">₱${lineTotal.toFixed(2)}</td>
      </tr>
    `;
    }).join('') : `
      <tr>
        <td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px 0;">No itemized products recorded</td>
      </tr>
    `;

    const receiptHtml = `
      <div class="receipt-box" id="printable-receipt-box">
        <!-- Official BIR Header -->
        <div class="receipt-header">
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
            <i class="ri-capsule-fill" style="color: #00a896; font-size: 1.3rem;"></i>
            <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.5px;">XYRA ANDREA PHARMACY</h2>
          </div>
          <p style="margin: 0; font-size: 0.74rem; color: #475569;">Poblacion, Dumangas, Iloilo, Philippines 5006</p>
          <p style="margin: 1px 0; font-size: 0.74rem; color: #475569; font-family: monospace;">VAT Reg TIN: 421-890-123-00000</p>
          <p style="margin: 1px 0; font-size: 0.72rem; color: #64748b; font-family: monospace;">MIN: MIN-20261102-001 | SN: SN-XA2026-0988</p>
          <p style="margin: 5px 0 0; font-weight: 800; color: #00a896; letter-spacing: 1.2px; font-size: 0.82rem;">OFFICIAL SALES INVOICE</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 3px;">
          <span>SI / OR #: <strong style="font-family: monospace; color: #00a896;">${invoiceId}</strong></span>
          <span>${timestamp}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 3px;">
          <span>Cashier: <strong>${cashier}</strong></span>
          <span>Customer: <strong>${customerName}</strong></span>
        </div>
        ${(isScPwd || customerIdNo) ? `
        <div style="display: flex; justify-content: space-between; font-size: 0.73rem; margin-bottom: 6px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
          <span>Classification: <strong style="color: #0284c7;">${customerType.toUpperCase()}</strong></span>
          <span>ID No: <strong style="font-family: monospace;">${customerIdNo || 'Verified'}</strong></span>
        </div>` : ''}

        <table class="receipt-table" style="width: 100%; border-collapse: collapse; margin-top: 6px;">
          <thead>
            <tr style="border-bottom: 1px dashed #94a3b8;">
              <th style="text-align: left; padding: 4px 0;">ITEM</th>
              <th style="text-align: center; padding: 4px 0;">QTY</th>
              <th style="text-align: right; padding: 4px 0;">PRICE</th>
              <th style="text-align: right; padding: 4px 0;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals & Payment Section -->
        <div style="border-top: 1px dashed #64748b; padding-top: 6px; margin-top: 6px; font-size: 0.8rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Gross Sales (VAT-Inc):</span>
            <span>₱${subtotal.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #e11d48; margin-bottom: 2px;">
            <span>Less: Discount ${discountType ? `(${discountType})` : ''}:</span>
            <span>-₱${discount.toFixed(2)}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.98rem; margin: 4px 0; padding: 4px 0; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; color: #00a896;">
            <span>TOTAL AMOUNT DUE:</span>
            <span>₱${total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 3px; font-size: 0.78rem;">
            <span>Amount Tendered (${paymentMethod}):</span>
            <span>₱${amountPaid.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem;">
            <span>Change:</span>
            <span style="font-weight: 700; color: #10b981;">₱${change.toFixed(2)}</span>
          </div>
        </div>

        <!-- Philippine BIR Standard 12% Value-Added Tax (VAT) Breakdown Box -->
        <div style="border-top: 1px dashed #64748b; border-bottom: 1px dashed #64748b; padding: 6px 0; margin: 8px 0; font-size: 0.74rem; font-family: monospace;">
          <div style="text-align: center; font-weight: 800; color: #334155; margin-bottom: 4px; letter-spacing: 0.5px;">--- BIR TAX / VAT BREAKDOWN ---</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <span>VATable Sales (12%):</span>
            <span>₱${vatableSales.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <span>VAT Amount (12%):</span>
            <span>₱${vatAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <span>VAT-Exempt Sales:</span>
            <span>₱${vatExemptSales.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
            <span>Zero-Rated Sales:</span>
            <span>₱${zeroRatedSales.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 800; border-top: 1px dotted #cbd5e1; margin-top: 3px; padding-top: 2px;">
            <span>TOTAL SALES:</span>
            <span>₱${(vatableSales + vatAmount + vatExemptSales + zeroRatedSales).toFixed(2)}</span>
          </div>
          ${isScPwd ? `
          <div style="margin-top: 8px; border-top: 1px dotted #cbd5e1; padding-top: 4px;">
            <div style="font-size: 0.7rem; color: #475569;">Senior / PWD Signature:</div>
            <div style="border-bottom: 1px solid #94a3b8; height: 16px; margin-top: 4px;"></div>
          </div>` : ''}
        </div>

        <!-- BIR Compliance Accreditation Footer -->
        <div class="receipt-footer" style="text-align: center; font-size: 0.7rem; color: #64748b; line-height: 1.35;">
          <p style="margin: 2px 0; font-weight: 700; color: #334155;">THIS SERVES AS AN OFFICIAL SALES INVOICE</p>
          <p style="margin: 1px 0;">PTU No.: FP-112026-0091-XA | Issued: 11/02/2026</p>
          <p style="margin: 1px 0;">Accredited POS System &bull; BIR Compliant</p>
          <p style="margin: 4px 0 2px; color: #00a896; font-weight: 600;">Thank you for trusting Xyra Andrea Pharmacy!</p>
          <p style="margin: 0; font-style: italic;">Get well soon! Please keep this invoice for returns.</p>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Official Receipt Preview',
      html: receiptHtml,
      width: '520px',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="ri-printer-line"></i> Print Receipt',
      denyButtonText: '<i class="ri-arrow-go-back-line"></i> Return Item',
      cancelButtonText: 'Close',
      customClass: {
        popup: 'receipt-swal-modal'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
      } else if (result.isDenied) {
        this.showReturnModal(txn);
      }
    });
  },

  // Interactive Customer Return & Refund Modal
  async showReturnModal(txn) {
    if (!txn) return;
    if (!this.canOpenModal('return-item')) return;

    let fullTxn = txn;
    if ((!Array.isArray(fullTxn.items) || fullTxn.items.length === 0) && (fullTxn.id || fullTxn.dbId)) {
      try {
        if (window.mockApi && typeof window.mockApi.getTransactionById === 'function') {
          const fetched = await window.mockApi.getTransactionById(fullTxn.id || fullTxn.dbId);
          if (fetched) fullTxn = fetched;
        }
      } catch (e) {
        console.warn('[SwalHelpers] Could not fetch full txn for return:', e);
      }
    }

    const items = Array.isArray(fullTxn.items) ? fullTxn.items : [];
    if (items.length === 0) {
      this.toast('No line items recorded for this invoice to return.', 'warning');
      return;
    }

    const invoiceNo = fullTxn.id || fullTxn.invoice_no || 'N/A';
    const customer = fullTxn.customerName || fullTxn.customer_name || 'Walk-in Customer';

    const itemsRowsHtml = items.map((it, idx) => {
      const pid = it.productId || it.product_id || 0;
      const name = it.name || it.product_name || 'Item';
      const maxQty = parseInt(it.qty ?? it.quantity ?? 1, 10);
      const price = parseFloat(it.price ?? it.unit_price ?? 0);
      const batch = it.batchNo || it.batch_no || '';
      const exp = it.expiryDate || it.expiry_date || '';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 4px; text-align: center; vertical-align: middle;">
            <input type="checkbox" class="form-check-input return-item-check" data-idx="${idx}" id="ret-chk-${idx}" checked style="cursor: pointer; width: 1.15rem; height: 1.15rem;">
          </td>
          <td style="padding: 8px 4px; vertical-align: middle;">
            <label for="ret-chk-${idx}" style="cursor: pointer; margin: 0; font-weight: 600; color: #1e293b; display: block;">${name}</label>
            ${batch ? `<small style="font-family: monospace; color: #64748b; font-size: 0.72rem;">Batch: ${batch}${exp ? ` | Exp: ${exp}` : ''}</small>` : ''}
          </td>
          <td style="padding: 8px 4px; text-align: right; vertical-align: middle; font-size: 0.85rem;">₱${price.toFixed(2)}</td>
          <td style="padding: 8px 4px; text-align: center; vertical-align: middle; width: 95px;">
            <input type="number" class="form-control form-control-sm return-item-qty" data-idx="${idx}" data-price="${price}" value="${maxQty}" min="1" max="${maxQty}" style="text-align: center; font-weight: 700; border-radius: 6px;">
            <small style="color: #64748b; font-size: 0.7rem;">Max: ${maxQty}</small>
          </td>
          <td style="padding: 8px 4px; text-align: right; font-weight: 700; color: #10b981; vertical-align: middle; font-size: 0.9rem;" class="return-item-subtotal" id="ret-sub-${idx}">
            ₱${(maxQty * price).toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const modalHtml = `
      <div style="text-align: left; font-size: 0.85rem;">
        <div style="background: rgba(0, 168, 150, 0.08); padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid var(--primary, #00a896);">
          <div style="display: flex; justify-content: space-between;">
            <span>Original Invoice: <strong style="font-family: monospace; color: var(--primary);">${invoiceNo}</strong></span>
            <span>Date: <strong>${fullTxn.timestamp || fullTxn.created_at || 'Recent'}</strong></span>
          </div>
          <div style="margin-top: 2px;">Customer: <strong>${customer}</strong> | Cashier: <strong>${fullTxn.cashier || 'Pharmacist'}</strong></div>
        </div>

        <p style="font-weight: 700; margin-bottom: 6px; color: #334155;"><i class="ri-checkbox-multiple-line"></i> Select Items &amp; Quantities to Return:</p>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px 8px; margin-bottom: 12px; background: #fafafa;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="border-bottom: 1px solid #cbd5e1; color: #475569; font-size: 0.75rem;">
                <th style="padding: 4px; text-align: center;">RETURN</th>
                <th style="padding: 4px;">PRODUCT</th>
                <th style="padding: 4px; text-align: right;">PRICE</th>
                <th style="padding: 4px; text-align: center;">QTY</th>
                <th style="padding: 4px; text-align: right;">REFUND</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div>
            <label style="font-weight: 600; display: block; margin-bottom: 3px;">Return Reason <span style="color: red;">*</span></label>
            <select id="swal-ret-reason" class="form-select form-select-sm" style="border-radius: 6px;">
              <option value="Customer Mistake / Wrong Item Selected" selected>Customer Mistake / Wrong Item</option>
              <option value="Customer Dosage / Formulation Error">Wrong Dosage / Formulation</option>
              <option value="Cashier Dispensing Error">Cashier Dispensing Error</option>
              <option value="Doctor Altered Prescription">Doctor Altered Prescription</option>
              <option value="Defective / Damaged Packaging">Defective Packaging / Seal Damaged</option>
              <option value="Adverse Reaction / Medicine Incompatibility">Adverse Reaction / Incompatible</option>
              <option value="Other">Other / Miscellaneous</option>
            </select>
          </div>
          <div>
            <label style="font-weight: 600; display: block; margin-bottom: 3px;">Refund Compensation</label>
            <select id="swal-ret-refund-method" class="form-select form-select-sm" style="border-radius: 6px;">
              <option value="Cash" selected>Cash Refund</option>
              <option value="GCash">GCash Transfer</option>
              <option value="Maya">Maya Transfer</option>
              <option value="Store Credit">Store Credit / Item Swap</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <label style="font-weight: 600; display: block; margin-bottom: 3px;">Medicine Condition &amp; FDA Restock Rule <span style="color: red;">*</span></label>
          <select id="swal-ret-condition" class="form-select form-select-sm" style="border-radius: 6px;">
            <option value="resellable" selected>✓ Good / Sealed (Restock to Active Pharmacy Shelf)</option>
            <option value="damaged">⚠ Opened / Compromised (Quarantine &amp; Write-Off - Do NOT Restock)</option>
          </select>
          <small style="color: #64748b; font-size: 0.72rem; display: block; margin-top: 2px;">
            RA 10918 Rule: Opened or broken blister packs cannot be re-dispensed to patients.
          </small>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="font-weight: 600; display: block; margin-bottom: 3px;">Pharmacist Remarks / Notes</label>
          <input type="text" id="swal-ret-notes" class="form-control form-control-sm" placeholder="e.g. Returned immediately, swapped for Biogesic Suspension..." style="border-radius: 6px;">
        </div>

        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0;">
          <span style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">Total Refund Amount:</span>
          <span id="swal-ret-total-banner" style="font-weight: 800; color: #10b981; font-size: 1.25rem;">₱0.00</span>
        </div>
      </div>
    `;

    const result = await Swal.fire({
      title: '<i class="ri-arrow-go-back-line text-warning"></i> Process Customer Return',
      html: modalHtml,
      width: '580px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Confirm Return &amp; Refund',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#00a896',
      didOpen: () => {
        const modalEl = Swal.getHtmlContainer();
        const banner = modalEl.querySelector('#swal-ret-total-banner');

        const calculateTotal = () => {
          let sum = 0;
          const checks = modalEl.querySelectorAll('.return-item-check');
          checks.forEach(chk => {
            if (chk.checked) {
              const idx = chk.dataset.idx;
              const qtyInput = modalEl.querySelector(`.return-item-qty[data-idx="${idx}"]`);
              const subtotalEl = modalEl.querySelector(`#ret-sub-${idx}`);
              const price = parseFloat(qtyInput?.dataset?.price || 0);
              const qty = Math.max(1, parseInt(qtyInput?.value || 1, 10));
              const lineTotal = qty * price;
              if (subtotalEl) subtotalEl.textContent = `₱${lineTotal.toFixed(2)}`;
              sum += lineTotal;
            }
          });
          if (banner) banner.textContent = `₱${sum.toFixed(2)}`;
        };

        modalEl.querySelectorAll('.return-item-check').forEach(chk => {
          chk.addEventListener('change', calculateTotal);
        });

        modalEl.querySelectorAll('.return-item-qty').forEach(qInput => {
          qInput.addEventListener('input', calculateTotal);
        });

        calculateTotal();
      },
      preConfirm: () => {
        const modalEl = Swal.getHtmlContainer();
        const checks = modalEl.querySelectorAll('.return-item-check:checked');
        if (checks.length === 0) {
          Swal.showValidationMessage('Please select at least one item to return.');
          return false;
        }

        const selectedItems = [];
        checks.forEach(chk => {
          const idx = parseInt(chk.dataset.idx, 10);
          const origItem = items[idx];
          const qtyInput = modalEl.querySelector(`.return-item-qty[data-idx="${idx}"]`);
          const returnQty = parseInt(qtyInput.value, 10);

          if (origItem && returnQty > 0) {
            selectedItems.push({
              product_id: origItem.productId || origItem.product_id,
              sale_item_id: origItem.id || origItem.sale_item_id,
              qty: returnQty,
              quantity: returnQty,
              unit_price: parseFloat(origItem.price || origItem.unit_price || 0),
              batch_no: origItem.batchNo || origItem.batch_no || '',
              expiry_date: origItem.expiryDate || origItem.expiry_date || ''
            });
          }
        });

        if (selectedItems.length === 0) {
          Swal.showValidationMessage('Please specify valid return quantities.');
          return false;
        }

        const reason = modalEl.querySelector('#swal-ret-reason').value;
        const condition = modalEl.querySelector('#swal-ret-condition').value;
        const refundMethod = modalEl.querySelector('#swal-ret-refund-method').value;
        const notes = modalEl.querySelector('#swal-ret-notes').value.trim();

        return {
          invoice_no: invoiceNo,
          sale_id: fullTxn.db_id || fullTxn.dbId || fullTxn.sale_id || fullTxn.id,
          reason: reason,
          condition_type: condition,
          refund_method: refundMethod,
          notes: notes,
          items: selectedItems
        };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        Swal.showLoading();
        const returnSlip = await window.mockApi.processReturn(result.value);

        if (window.SoundFX && typeof window.SoundFX.playSuccess === 'function') {
          window.SoundFX.playSuccess();
        }

        if (window.appController) {
          await window.appController.refreshAllModules();
        }

        this.showReturnSlipModal(returnSlip);
      } catch (err) {
        console.error('[SwalHelpers] Return processing failed:', err);
        Swal.fire('Error', err.message || 'Failed to process return transaction.', 'error');
      }
    }
  },

  // Official Return & Refund Credit Slip Preview
  showReturnSlipModal(slip) {
    if (!slip) return;

    const returnNo = slip.return_no || slip.id || 'RET-0000';
    const invoiceNo = slip.invoice_no || 'N/A';
    const timestamp = slip.timestamp || new Date().toLocaleString();
    const cashier = slip.cashier || 'Pharmacist';
    const customer = slip.customer_name || 'Walk-in Customer';
    const refundMethod = slip.refund_method || 'Cash';
    const refundAmount = parseFloat(slip.refund_amount || 0);
    const reason = slip.reason || 'Customer Mistake / Wrong Item Selected';
    const condition = slip.condition_label || (slip.restocked ? 'Good / Sealed (Restocked)' : 'Damaged / Opened (Quarantined)');

    const items = Array.isArray(slip.items) ? slip.items : [];
    const itemsHtml = items.map(it => {
      const name = it.name || it.product_name || 'Item';
      const qty = it.qty || it.quantity || 1;
      const price = parseFloat(it.price || it.unit_price || 0);
      const subtotal = parseFloat(it.subtotal || (qty * price));
      const batch = it.batch_no || it.batchNo || '';

      return `
        <tr>
          <td style="padding: 4px 0; text-align: left;">
            <div style="font-weight: 600; color: #1e293b;">${name}</div>
            ${batch ? `<div style="font-size: 0.68rem; color: #64748b; font-family: monospace;">Batch: ${batch}</div>` : ''}
          </td>
          <td style="text-align: center; vertical-align: top; padding-top: 4px;">${qty}</td>
          <td style="text-align: right; vertical-align: top; padding-top: 4px;">₱${price.toFixed(2)}</td>
          <td style="text-align: right; vertical-align: top; padding-top: 4px; font-weight: 600; color: #ef4444;">-₱${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const slipHtml = `
      <div class="receipt-box" id="printable-return-slip">
        <div class="receipt-header">
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
            <i class="ri-capsule-fill" style="color: #00a896; font-size: 1.3rem;"></i>
            <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.5px;">XYRA ANDREA PHARMACY</h2>
          </div>
          <p style="margin: 0; font-size: 0.75rem; color: #475569;">123 Healthcare Ave, Metro Manila</p>
          <p style="margin: 0; font-size: 0.75rem; color: #475569;">VAT Reg TIN: 000-123-456-000 | Contact: (02) 8123-4567</p>
          <p style="margin: 6px 0 0; font-weight: bold; color: #e11d48; letter-spacing: 1px;">CUSTOMER RETURN &amp; REFUND CREDIT SLIP</p>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
          <span>Credit Slip #: <strong style="font-family: monospace; color: #e11d48;">${returnNo}</strong></span>
          <span>${timestamp}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
          <span>Ref Invoice OR #: <strong style="font-family: monospace;">${invoiceNo}</strong></span>
          <span>Cashier: <strong>${cashier}</strong></span>
        </div>
        <div style="font-size: 0.75rem; margin-bottom: 8px;">
          <span>Customer: <strong>${customer}</strong></span>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-size: 0.75rem; margin-bottom: 8px;">
          <div>Reason: <strong>${reason}</strong></div>
          <div style="margin-top: 2px;">Condition: <strong>${condition}</strong></div>
        </div>

        <table class="receipt-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px dashed #94a3b8;">
              <th style="text-align: left; padding: 4px 0;">RETURNED ITEM</th>
              <th style="text-align: center; padding: 4px 0;">QTY</th>
              <th style="text-align: right; padding: 4px 0;">PRICE</th>
              <th style="text-align: right; padding: 4px 0;">REFUND</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #64748b; padding-top: 6px; margin-top: 8px; font-size: 0.8rem;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1rem; color: #e11d48; margin-top: 4px;">
            <span>TOTAL REFUND PAID:</span>
            <span>-₱${refundAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-top: 4px; color: #64748b;">
            <span>Compensation Method:</span>
            <span><strong>${refundMethod}</strong></span>
          </div>
        </div>

        <div class="receipt-footer" style="text-align: center; margin-top: 12px; font-size: 0.72rem; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
          <p style="margin: 2px 0;">Customer signature: ______________________</p>
          <p style="margin: 2px 0;">Official audit credit voucher. Thank you for your patience.</p>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Return Credit Slip Preview',
      html: slipHtml,
      width: '520px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-printer-line"></i> Print Credit Slip',
      cancelButtonText: 'Done',
      customClass: {
        popup: 'receipt-swal-modal'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
      }
    });
  },

  // Modal to Add New Product (Dynamic Categories and UOMs)
  async showAddProductModal(passedCats = null, passedUoms = null) {
    if (!this.canOpenModal('add-product')) return { isConfirmed: false, isDismissed: true };

    let cats = passedCats;
    let uoms = passedUoms;
    try {
      if (!cats && window.mockApi && window.mockApi.getCategories) {
        cats = await window.mockApi.getCategories();
      }
      if (!uoms && window.mockApi && window.mockApi.getUoms) {
        uoms = await window.mockApi.getUoms();
      }
    } catch (e) {
      console.warn('Failed to load categories/uoms dynamically, using defaults', e);
    }

    if (!cats || cats.length === 0) {
      cats = [
        { name: 'Analgesics' }, { name: 'Antibiotics' }, { name: 'Vitamins & Supplements' },
        { name: 'Respiratory' }, { name: 'Cardiovascular' }, { name: 'Antihistamines' },
        { name: 'First Aid' }, { name: 'Gastrointestinal' }
      ];
    }

    if (!uoms || uoms.length === 0) {
      uoms = [
        { name: 'Tablet', abbreviation: 'tab' }, { name: 'Capsule', abbreviation: 'cap' },
        { name: 'Box', abbreviation: 'box' },
        { name: 'Strip', abbreviation: 'strip' }, { name: 'Bottle', abbreviation: 'btl' },
        { name: 'Tube', abbreviation: 'tube' }, { name: 'Sachet', abbreviation: 'sachet' },
        { name: 'Vial', abbreviation: 'vial' }, { name: 'Ampoule', abbreviation: 'amp' }
      ];
    }

    const catOptions = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    const uomOptions = uoms.map(u => `<option value="${u.name}">${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ''}</option>`).join('');

    const htmlContent = `
      <div style="text-align: left;">
        <div class="form-group">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Brand & Medicine Name *</label>
          <input type="text" id="new-prod-name" class="swal2-input" placeholder="e.g. Biogesic Paracetamol 500mg" style="width:100%; margin:0.3rem 0 0.8rem;">
        </div>
        <div class="form-group">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Generic Name</label>
          <input type="text" id="new-prod-generic" class="swal2-input" placeholder="e.g. Paracetamol" style="width:100%; margin:0.3rem 0 0.8rem;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Category *</label>
              <a href="javascript:void(0)" onclick="SwalHelpers.releaseModalLock(); Swal.close(); setTimeout(() => window.inventoryController?.manageCategoriesModal(true), 150);" style="font-size: 0.72rem; color: #00a896; text-decoration: underline; font-weight: 600;">+ Manage</a>
            </div>
            <select id="new-prod-cat" class="swal2-select" style="width:100%; margin:0.3rem 0 0.8rem;">
              ${catOptions}
            </select>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Unit of Measure (UOM) *</label>
              <a href="javascript:void(0)" onclick="SwalHelpers.releaseModalLock(); Swal.close(); setTimeout(() => window.inventoryController?.manageUomsModal(true), 150);" style="font-size: 0.72rem; color: #00a896; text-decoration: underline; font-weight: 600;">+ Manage</a>
            </div>
            <select id="new-prod-uom" class="swal2-select" style="width:100%; margin:0.3rem 0 0.8rem;">
              ${uomOptions}
            </select>
          </div>
        </div>
        <div style="background: #e6fffa; border: 1px solid #b2f5ea; border-radius: 8px; padding: 0.65rem 0.85rem; margin: 0.4rem 0 0.85rem; font-size: 0.78rem; color: #234e52;">
          <i class="ri-shield-check-line"></i> <strong>Audit Compliance:</strong> New catalog products start with <strong>0 stock</strong>. All quantities, batch numbers, and expiration dates must enter the pharmacy via the <strong>Stock In (Goods Receiving)</strong> process.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Selling Price (₱) *</label>
            <input type="number" id="new-prod-price" class="swal2-input" placeholder="10.00" step="0.25" min="0" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Cost Price (₱)</label>
            <input type="number" id="new-prod-cost" class="swal2-input" placeholder="6.00" step="0.25" min="0" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Catalog Stock</label>
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.85rem; font-weight: 700; color: #64748b; display: flex; align-items: center; justify-content: space-between; margin: 0.3rem 0 0.8rem;">
              <span>0 (Always Zero)</span>
              <span class="badge-pill badge-info" style="font-size: 0.7rem; font-weight: 600;">Stock In 1st</span>
            </div>
            <input type="hidden" id="new-prod-stock" value="0">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Reorder Point Alert *</label>
            <input type="number" id="new-prod-reorder" class="swal2-input" placeholder="20" min="1" value="20" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
        </div>
      </div>
    `;

    return Swal.fire({
      title: '💊 Register New Medicine',
      html: htmlContent,
      width: '820px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Save Product',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const name = document.getElementById('new-prod-name').value.trim();
        const genericName = document.getElementById('new-prod-generic').value.trim();
        const category = document.getElementById('new-prod-cat').value;
        const uom = document.getElementById('new-prod-uom').value;
        const unitPrice = parseFloat(document.getElementById('new-prod-price').value);
        const costPrice = parseFloat(document.getElementById('new-prod-cost').value) || (unitPrice * 0.65);
        const stock = 0; // strictly 0 on creation
        const reorderPoint = parseInt(document.getElementById('new-prod-reorder').value) || 10;

        if (!name || isNaN(unitPrice)) {
          Swal.showValidationMessage('Please provide medicine name and valid price (*)');
          return false;
        }

        return { name, genericName, category, uom, unitPrice, costPrice, stock: 0, reorderPoint };
      }
    });
  },

  // Modal to Edit Product
  async showEditProductModal(product, passedCats = null, passedUoms = null) {
    if (!this.canOpenModal('edit-product')) return { isConfirmed: false, isDismissed: true };

    let cats = passedCats;
    let uoms = passedUoms;
    try {
      if (!cats && window.mockApi && window.mockApi.getCategories) {
        cats = await window.mockApi.getCategories();
      }
      if (!uoms && window.mockApi && window.mockApi.getUoms) {
        uoms = await window.mockApi.getUoms();
      }
    } catch (e) {
      console.warn('Failed to load categories/uoms dynamically', e);
    }

    if (!cats || cats.length === 0) {
      cats = [{ name: product.category || 'General' }];
    }
    if (!uoms || uoms.length === 0) {
      uoms = [{ name: product.uom || 'Tablet' }];
    }

    const catOptions = cats.map(c => `
      <option value="${c.name}" ${c.name === product.category ? 'selected' : ''}>${c.name}</option>
    `).join('');

    const uomOptions = uoms.map(u => `
      <option value="${u.name}" ${u.name === product.uom ? 'selected' : ''}>${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ''}</option>
    `).join('');

    const htmlContent = `
      <div style="text-align: left;">
        <div class="form-group">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Brand & Medicine Name *</label>
          <input type="text" id="edit-prod-name" class="swal2-input" value="${product.name.replace(/"/g, '&quot;')}" style="width:100%; margin:0.3rem 0 0.8rem;">
        </div>
        <div class="form-group">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Generic Name</label>
          <input type="text" id="edit-prod-generic" class="swal2-input" value="${(product.genericName || '').replace(/"/g, '&quot;')}" style="width:100%; margin:0.3rem 0 0.8rem;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Category *</label>
            <select id="edit-prod-cat" class="swal2-select" style="width:100%; margin:0.3rem 0 0.8rem;">
              ${catOptions}
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Unit of Measure (UOM) *</label>
            <select id="edit-prod-uom" class="swal2-select" style="width:100%; margin:0.3rem 0 0.8rem;">
              ${uomOptions}
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Selling Price (₱) *</label>
            <input type="number" id="edit-prod-price" class="swal2-input" value="${product.unitPrice}" step="0.25" min="0" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Cost Price (₱)</label>
            <input type="number" id="edit-prod-cost" class="swal2-input" value="${product.costPrice}" step="0.25" min="0" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: var(--text-main, #475569); font-size: 0.85rem;">Ledger Stock Balance</label>
            <div style="background: var(--bg-card-hover, #f8fafc); border: 1px solid var(--border-color, #cbd5e1); border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.85rem; font-weight: 700; color: var(--text-main, #0f172a); display: flex; align-items: center; justify-content: space-between; margin: 0.3rem 0 0.8rem;">
              <span>${product.stock} ${product.uom}</span>
              <span class="badge-pill ${product.stock > 0 ? 'badge-success' : 'badge-secondary'}" style="font-size: 0.7rem; font-weight: 600;">Ledger Balance</span>
            </div>
            <input type="hidden" id="edit-prod-stock" value="${product.stock}">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Reorder Point *</label>
            <input type="number" id="edit-prod-reorder" class="swal2-input" value="${product.reorderPoint}" min="1" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
        </div>
      </div>
    `;

    return Swal.fire({
      title: '✏️ Edit Medicine Information',
      html: htmlContent,
      width: '820px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Save Changes',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const name = document.getElementById('edit-prod-name').value.trim();
        const genericName = document.getElementById('edit-prod-generic').value.trim();
        const category = document.getElementById('edit-prod-cat').value;
        const uom = document.getElementById('edit-prod-uom').value;
        const unitPrice = parseFloat(document.getElementById('edit-prod-price').value);
        const costPrice = parseFloat(document.getElementById('edit-prod-cost').value) || 0;
        const stock = parseInt(document.getElementById('edit-prod-stock').value) || 0;
        const reorderPoint = parseInt(document.getElementById('edit-prod-reorder').value) || 10;

        if (!name || isNaN(unitPrice)) {
          Swal.showValidationMessage('Please provide medicine name and valid price (*)');
          return false;
        }

        return { name, genericName, category, uom, unitPrice, costPrice, stock, reorderPoint };
      }
    });
  },

  // Modal to Manage Categories (List, Add, Edit, Delete)
  async showManageCategoriesModal(force = false) {
    if (!this.canOpenModal('manage-categories', force)) return { isConfirmed: false, isDismissed: true };

    const loadAndRender = async () => {
      let categories = [];
      try {
        categories = await window.mockApi.getCategories();
      } catch (err) {
        categories = [];
      }

      const rowsHtml = categories.length === 0
        ? `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#64748b;">No categories defined yet.</td></tr>`
        : categories.map(cat => `
          <tr>
            <td style="font-weight:700; color:var(--text-main, #0f172a);">${cat.name}</td>
            <td style="color:#64748b; font-size:0.8rem;">${cat.description || '<em style="color:#94a3b8;">No description</em>'}</td>
            <td style="text-align:center;"><span class="badge-pill badge-info" style="font-size:0.75rem;">${cat.productCount} meds</span></td>
            <td style="text-align:right; white-space:nowrap;">
              <button class="btn btn-sm btn-outline edit-cat-btn" data-id="${cat.id}" data-name="${cat.name.replace(/"/g, '&quot;')}" data-desc="${(cat.description || '').replace(/"/g, '&quot;')}" style="padding:0.2rem 0.5rem; margin-right:4px;">
                <i class="ri-edit-line"></i>
              </button>
              <button class="btn btn-sm btn-outline delete-cat-btn" data-id="${cat.id}" data-name="${cat.name.replace(/"/g, '&quot;')}" style="padding:0.2rem 0.5rem; color:#ef4444; border-color:#fca5a5;">
                <i class="ri-delete-bin-line"></i>
              </button>
            </td>
          </tr>
        `).join('');

      return `
        <div style="text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; padding-bottom: 0.6rem; border-bottom: 1px solid #e2e8f0;">
            <div>
              <p style="margin: 0; font-size: 0.85rem; color: #64748b;">Manage classifications for your pharmacy catalog</p>
            </div>
            <button id="btn-add-cat-new" class="btn btn-sm btn-primary" style="padding: 0.35rem 0.8rem; font-size: 0.82rem;">
              <i class="ri-add-line"></i> Add Category
            </button>
          </div>

          <div style="max-height: 320px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table class="custom-table" style="margin: 0; font-size: 0.85rem;">
              <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 2;">
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th style="text-align:center;">Products</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="manage-cat-tbody">
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    const modalHtml = await loadAndRender();

    return Swal.fire({
      title: '📁 Medicine Categories Registry',
      html: modalHtml,
      width: '980px',
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        const attachHandlers = () => {
          // Add Category Handler
          const addBtn = document.getElementById('btn-add-cat-new');
          if (addBtn) {
            addBtn.onclick = async () => {
              const { value: formValues } = await Swal.fire({
                title: 'Add New Category',
                html: `
                  <div style="text-align:left;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Category Name *</label>
                    <input id="cat-input-name" class="swal2-input" placeholder="e.g. Dermatological" style="width:100%; margin:0.3rem 0 0.8rem;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Description</label>
                    <textarea id="cat-input-desc" class="swal2-textarea" placeholder="Brief description of medications in this category" style="width:100%; margin:0.3rem 0; height:80px;"></textarea>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Save Category',
                preConfirm: () => {
                  const name = document.getElementById('cat-input-name').value.trim();
                  const description = document.getElementById('cat-input-desc').value.trim();
                  if (!name) {
                    Swal.showValidationMessage('Category name is required');
                    return false;
                  }
                  return { name, description };
                }
              });

              if (formValues) {
                try {
                  await window.mockApi.addCategory(formValues);
                  SwalHelpers.toast(`Category '${formValues.name}' created!`, 'success');
                  if (window.appController) window.appController.refreshAllModules();
                  // Re-open category manager
                  SwalHelpers.showManageCategoriesModal(true);
                } catch (err) {
                  Swal.fire('Error', err?.message || 'Failed to save category', 'error');
                }
              }
            };
          }

          // Edit Category Handlers
          document.querySelectorAll('.edit-cat-btn').forEach(btn => {
            btn.onclick = async () => {
              const id = btn.getAttribute('data-id');
              const oldName = btn.getAttribute('data-name');
              const oldDesc = btn.getAttribute('data-desc');

              const { value: formValues } = await Swal.fire({
                title: 'Edit Category',
                html: `
                  <div style="text-align:left;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Category Name *</label>
                    <input id="cat-edit-name" class="swal2-input" value="${oldName.replace(/"/g, '&quot;')}" style="width:100%; margin:0.3rem 0 0.8rem;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Description</label>
                    <textarea id="cat-edit-desc" class="swal2-textarea" style="width:100%; margin:0.3rem 0; height:80px;">${oldDesc}</textarea>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Update Category',
                preConfirm: () => {
                  const name = document.getElementById('cat-edit-name').value.trim();
                  const description = document.getElementById('cat-edit-desc').value.trim();
                  if (!name) {
                    Swal.showValidationMessage('Category name is required');
                    return false;
                  }
                  return { name, description };
                }
              });

              if (formValues) {
                try {
                  await window.mockApi.updateCategory(id, formValues);
                  SwalHelpers.toast(`Category '${formValues.name}' updated!`, 'success');
                  if (window.appController) window.appController.refreshAllModules();
                  SwalHelpers.showManageCategoriesModal(true);
                } catch (err) {
                  Swal.fire('Error', err?.message || 'Failed to update category', 'error');
                }
              }
            };
          });

          // Delete Category Handlers
          document.querySelectorAll('.delete-cat-btn').forEach(btn => {
            btn.onclick = async () => {
              const id = btn.getAttribute('data-id');
              const name = btn.getAttribute('data-name');

              const confirm = await Swal.fire({
                title: `Delete '${name}'?`,
                text: 'Are you sure you want to delete this category?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete',
                confirmButtonColor: '#ef4444'
              });

              if (confirm.isConfirmed) {
                try {
                  await window.mockApi.deleteCategory(id);
                  SwalHelpers.toast(`Category '${name}' deleted!`, 'success');
                  if (window.appController) window.appController.refreshAllModules();
                  SwalHelpers.showManageCategoriesModal(true);
                } catch (err) {
                  Swal.fire('Cannot Delete Category', err?.message || 'Failed to delete category', 'error');
                }
              }
            };
          });
        };

        attachHandlers();
      }
    });
  },

  // Modal to Manage Units of Measure (UOM) (List, Add, Edit, Delete)
  async showManageUomsModal(force = false) {
    if (!this.canOpenModal('manage-uoms', force)) return { isConfirmed: false, isDismissed: true };

    const loadAndRender = async () => {
      let uoms = [];
      try {
        uoms = await window.mockApi.getUoms();
      } catch (err) {
        uoms = [];
      }

      const rowsHtml = uoms.length === 0
        ? `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#64748b;">No units of measure registered yet.</td></tr>`
        : uoms.map(uom => `
          <tr>
            <td style="font-weight:700; color:var(--text-main, #0f172a);">${uom.name}</td>
            <td><code style="color:var(--primary); font-weight:700;">${uom.abbreviation || '—'}</code></td>
            <td style="color:#64748b; font-size:0.8rem;">${uom.description || '<em style="color:#94a3b8;">No description</em>'}</td>
            <td style="text-align:center;"><span class="badge-pill badge-info" style="font-size:0.75rem;">${uom.productCount} meds</span></td>
            <td style="text-align:right; white-space:nowrap;">
              <button class="btn btn-sm btn-outline edit-uom-btn" data-id="${uom.id}" data-name="${uom.name.replace(/"/g, '&quot;')}" data-abbr="${(uom.abbreviation || '').replace(/"/g, '&quot;')}" data-desc="${(uom.description || '').replace(/"/g, '&quot;')}" style="padding:0.2rem 0.5rem; margin-right:4px;">
                <i class="ri-edit-line"></i>
              </button>
              <button class="btn btn-sm btn-outline delete-uom-btn" data-id="${uom.id}" data-name="${uom.name.replace(/"/g, '&quot;')}" style="padding:0.2rem 0.5rem; color:#ef4444; border-color:#fca5a5;">
                <i class="ri-delete-bin-line"></i>
              </button>
            </td>
          </tr>
        `).join('');

      return `
        <div style="text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; padding-bottom: 0.6rem; border-bottom: 1px solid #e2e8f0;">
            <div>
              <p style="margin: 0; font-size: 0.85rem; color: #64748b;">Manage dosage packaging forms and dispensing units</p>
            </div>
            <button id="btn-add-uom-new" class="btn btn-sm btn-primary" style="padding: 0.35rem 0.8rem; font-size: 0.82rem;">
              <i class="ri-add-line"></i> Add Unit (UOM)
            </button>
          </div>

          <div style="max-height: 320px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table class="custom-table" style="margin: 0; font-size: 0.85rem;">
              <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 2;">
                <tr>
                  <th>Unit Name</th>
                  <th>Abbreviation</th>
                  <th>Description</th>
                  <th style="text-align:center;">Products</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="manage-uom-tbody">
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    const modalHtml = await loadAndRender();

    return Swal.fire({
      title: '⚖️ Units of Measure (UOM) Registry',
      html: modalHtml,
      width: '1040px',
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        const attachHandlers = () => {
          // Add UOM Handler
          const addBtn = document.getElementById('btn-add-uom-new');
          if (addBtn) {
            addBtn.onclick = async () => {
              const { value: formValues } = await Swal.fire({
                title: 'Add New Unit of Measure',
                html: `
                  <div style="text-align:left;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Unit Name *</label>
                    <input id="uom-input-name" class="swal2-input" placeholder="e.g. Sachet, Nebule, Spray" style="width:100%; margin:0.3rem 0 0.8rem;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Short Abbreviation</label>
                    <input id="uom-input-abbr" class="swal2-input" placeholder="e.g. neb, sachet" style="width:100%; margin:0.3rem 0 0.8rem;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Description</label>
                    <textarea id="uom-input-desc" class="swal2-textarea" placeholder="Package or dose description" style="width:100%; margin:0.3rem 0; height:70px;"></textarea>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Save Unit',
                preConfirm: () => {
                  const name = document.getElementById('uom-input-name').value.trim();
                  const abbreviation = document.getElementById('uom-input-abbr').value.trim();
                  const description = document.getElementById('uom-input-desc').value.trim();
                  if (!name) {
                    Swal.showValidationMessage('Unit name is required');
                    return false;
                  }
                  return { name, abbreviation, description };
                }
              });

              if (formValues) {
                try {
                  await window.mockApi.addUom(formValues);
                  SwalHelpers.toast(`Unit '${formValues.name}' created!`, 'success');
                  if (window.appController) window.appController.refreshAllModules();
                  SwalHelpers.showManageUomsModal(true);
                } catch (err) {
                  Swal.fire('Error', err?.message || 'Failed to save UOM', 'error');
                }
              }
            };
          }

          // Edit UOM Handler
          document.querySelectorAll('.edit-uom-btn').forEach(btn => {
            btn.onclick = async () => {
              const id = btn.getAttribute('data-id');
              const oldName = btn.getAttribute('data-name');
              const oldAbbr = btn.getAttribute('data-abbr');
              const oldDesc = btn.getAttribute('data-desc');

              const { value: formValues } = await Swal.fire({
                title: 'Edit Unit of Measure',
                html: `
                  <div style="text-align:left;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Unit Name *</label>
                    <input id="uom-edit-name" class="swal2-input" value="${oldName.replace(/"/g, '&quot;')}" style="width:100%; margin:0.3rem 0 0.8rem;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Short Abbreviation</label>
                    <input id="uom-edit-abbr" class="swal2-input" value="${oldAbbr.replace(/"/g, '&quot;')}" style="width:100%; margin:0.3rem 0 0.8rem;">
                    <label style="font-weight:700; font-size:0.85rem; color:#475569;">Description</label>
                    <textarea id="uom-edit-desc" class="swal2-textarea" style="width:100%; margin:0.3rem 0; height:70px;">${oldDesc}</textarea>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Update Unit',
                preConfirm: () => {
                  const name = document.getElementById('uom-edit-name').value.trim();
                  const abbreviation = document.getElementById('uom-edit-abbr').value.trim();
                  const description = document.getElementById('uom-edit-desc').value.trim();
                  if (!name) {
                    Swal.showValidationMessage('Unit name is required');
                    return false;
                  }
                  return { name, abbreviation, description };
                }
              });

              if (formValues) {
                try {
                  await window.mockApi.updateUom(id, formValues);
                  SwalHelpers.toast(`Unit '${formValues.name}' updated!`, 'success');
                  if (window.appController) window.appController.refreshAllModules();
                  SwalHelpers.showManageUomsModal(true);
                } catch (err) {
                  Swal.fire('Error', err?.message || 'Failed to update UOM', 'error');
                }
              }
            };
          });

          // Delete UOM Handler
          document.querySelectorAll('.delete-uom-btn').forEach(btn => {
            btn.onclick = async () => {
              const id = btn.getAttribute('data-id');
              const name = btn.getAttribute('data-name');

              const confirm = await Swal.fire({
                title: `Delete '${name}'?`,
                text: 'Are you sure you want to delete this Unit of Measure?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete',
                confirmButtonColor: '#ef4444'
              });

              if (confirm.isConfirmed) {
                try {
                  await window.mockApi.deleteUom(id);
                  SwalHelpers.toast(`Unit '${name}' deleted!`, 'success');
                  if (window.appController) window.appController.refreshAllModules();
                  SwalHelpers.showManageUomsModal(true);
                } catch (err) {
                  Swal.fire('Cannot Delete Unit', err?.message || 'Failed to delete UOM', 'error');
                }
              }
            };
          });
        };

        attachHandlers();
      }
    });
  },

  // Modal to Quick Restock
  async showRestockModal(product) {
    if (!this.canOpenModal('restock')) return { isConfirmed: false, isDismissed: true };

    return Swal.fire({
      title: `📦 Quick Restock Item`,
      html: `
        <div style="text-align: left;">
          <div style="background: var(--bg-card-hover, #f1f5f9); border: 1px solid var(--border-color, #e2e8f0); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
            <p style="margin-bottom: 0.3rem; font-weight: 700; color: var(--text-main, #0f172a);">${product.name}</p>
            <p style="color: var(--text-muted, #64748b); font-size: 0.85rem; margin: 0;">Current Stock: <strong style="color: #00a896;">${product.stock} ${product.uom || 'units'}</strong> | Batch: <code>${product.batchNo}</code></p>
          </div>
          
          <div class="form-group">
            <label style="font-weight: 700; color: var(--text-main, #475569); font-size: 0.85rem;">Quantity to Add (${product.uom || 'units'}):</label>
            <input type="number" id="restock-qty" class="swal2-input" placeholder="e.g. 50" value="50" min="1" style="width: 100%; margin: 0.4rem 0;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm Restock',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const qty = parseInt(document.getElementById('restock-qty').value);
        if (isNaN(qty) || qty <= 0) {
          Swal.showValidationMessage('Please enter a valid stock quantity');
          return false;
        }
        return qty;
      }
    });
  },

  // =========================================================================
  // 1. MASTER-DETAIL STOCK IN (RECEIVING SHIPMENTS)
  // =========================================================================
  async showStockInModal(products, suppliers) {
    if (!this.canOpenModal('stock-in')) return { isConfirmed: false, isDismissed: true };

    const suppliersOptions = suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    const productsOptions = products.map(p => `
      <option value="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-cost="${p.costPrice || 0}" data-stock="${p.stock}" data-uom="${p.uom || 'units'}">
        ${p.name} [${p.uom || 'units'}] - Current Stock: ${p.stock}
      </option>
    `).join('');

    const defaultDR = 'DR-' + Math.floor(100000 + Math.random() * 900000);
    const today = new Date().toISOString().split('T')[0];

    const htmlContent = `
      <div style="text-align: left;">
        <!-- PARENT HEADER: TRANSACTION & VENDOR INFORMATION -->
        <div style="background: var(--bg-card-hover, #f8fafc); border-radius: 8px; padding: 0.9rem 1.1rem; margin-bottom: 0.95rem; border: 1px solid var(--border-color, #e2e8f0); border-left: 4px solid var(--primary);">
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; white-space: nowrap; display: block; margin-bottom: 0.3rem;">Distributor / Supplier *</label>
              <select id="stkin-supplier" class="swal2-select" style="width: 100%; margin: 0; height: 38px; font-size: 0.85rem;">
                ${suppliersOptions}
                <option value="Direct Laboratory Purchase">Direct Laboratory Purchase</option>
                <option value="Local Wholesale Depot">Local Wholesale Depot</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; white-space: nowrap; display: block; margin-bottom: 0.3rem;">Delivery Receipt (DR) / Inv # *</label>
              <input type="text" id="stkin-refno" class="swal2-input" value="${defaultDR}" style="width: 100%; margin: 0; height: 38px; font-size: 0.85rem; font-weight: bold; color: var(--primary);">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; white-space: nowrap; display: block; margin-bottom: 0.3rem;">Receiving Date *</label>
              <input type="date" id="stkin-date" class="swal2-input" value="${today}" style="width: 100%; margin: 0; height: 38px; font-size: 0.85rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-weight: 700; color: var(--text-main, #334155); font-size: 0.82rem; white-space: nowrap; display: block; margin-bottom: 0.3rem;">Received By (Staff) *</label>
              <input type="text" id="stkin-receiver" class="swal2-input" value="Xyra Andrea (Pharmacist)" style="width: 100%; margin: 0; height: 38px; font-size: 0.85rem;">
            </div>
          </div>
        </div>

        <!-- CHILDREN DETAILS: DYNAMIC MEDICINE ITEMS -->
        <div style="margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-weight: 800; color: #00a896; font-size: 0.88rem; white-space: nowrap;">
              <i class="ri-medicine-bottle-line"></i> Delivered Medicine Line Items
            </label>
            <button type="button" id="btn-add-stkin-row" class="btn btn-sm btn-outline" style="padding: 0.3rem 0.85rem; font-size: 0.8rem; font-weight: 700;">
              <i class="ri-add-line"></i> Add Medicine Line
            </button>
          </div>

          <div style="max-height: 270px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table class="custom-table" style="margin: 0; font-size: 0.84rem; width: 100%; table-layout: fixed;">
              <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 3;">
                <tr>
                  <th style="width: 32%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Medicine / Description</th>
                  <th style="width: 18%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Batch / Lot # *</th>
                  <th style="width: 16%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Expiry Date *</th>
                  <th style="width: 10%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Qty *</th>
                  <th style="width: 11%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Unit Cost (₱)</th>
                  <th style="width: 13%; white-space: nowrap; text-align: right; padding: 0.75rem 0.6rem;">Subtotal</th>
                  <th style="width: 44px; text-align: center; padding: 0.75rem 0.3rem;"></th>
                </tr>
              </thead>
              <tbody id="stkin-items-tbody">
                <!-- Line items inserted here dynamically -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- PARENT TOTALS & NOTES -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #e6fffa; border: 1px solid #b2f5ea; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.85rem;">
          <div>
            <span style="font-size: 0.85rem; color: #234e52; font-weight: 600;">Total Line Items:</span>
            <strong id="stkin-items-count" style="color: #00a896; margin-left: 0.3rem;">1</strong>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: #234e52; font-weight: 600;">Total Delivery Cost:</span>
            <span id="stkin-grand-total" style="font-size: 1.25rem; font-weight: 800; color: #00a896; margin-left: 0.4rem;">₱0.00</span>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 700; color: #475569; font-size: 0.82rem; display: block; margin-bottom: 0.3rem;">Delivery Notes / Cold Chain Inspection</label>
          <input type="text" id="stkin-notes" class="swal2-input" placeholder="e.g. Verified cold storage temperature compliance, intact package seals" style="width: 100%; margin: 0; height: 38px; font-size: 0.85rem;">
        </div>
      </div>
    `;

    return Swal.fire({
      title: '📥 Receive Shipment (Stock In)',
      html: htmlContent,
      width: '1380px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-inbox-archive-line"></i> Confirm Stock In',
      cancelButtonText: 'Cancel',
      didOpen: () => {
        const tbody = document.getElementById('stkin-items-tbody');
        const countIndicator = document.getElementById('stkin-items-count');
        const totalIndicator = document.getElementById('stkin-grand-total');
        const addBtn = document.getElementById('btn-add-stkin-row');

        const calculateTotals = () => {
          let grandTotal = 0;
          let rowCount = 0;
          tbody.querySelectorAll('.stkin-row').forEach(row => {
            rowCount++;
            const qty = parseInt(row.querySelector('.row-qty').value) || 0;
            const cost = parseFloat(row.querySelector('.row-cost').value) || 0;
            const subtotal = qty * cost;
            grandTotal += subtotal;
            row.querySelector('.row-subtotal').innerText = `₱${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          });
          countIndicator.innerText = rowCount;
          totalIndicator.innerText = `₱${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        const createRow = () => {
          const tr = document.createElement('tr');
          tr.className = 'stkin-row';
          tr.innerHTML = `
            <td style="padding: 0.45rem 0.5rem;">
              <select class="swal2-select row-prod-select" style="width: 100%; margin: 0; height: 36px; font-size: 0.84rem;">
                ${productsOptions}
              </select>
            </td>
            <td style="padding: 0.45rem 0.5rem;">
              <input type="text" class="swal2-input row-batch" placeholder="Enter Batch / Lot #" value="" style="width: 100%; margin: 0; height: 36px; font-size: 0.84rem; font-family: monospace;">
            </td>
            <td style="padding: 0.45rem 0.5rem;">
              <input type="date" class="swal2-input row-expiry" value="" style="width: 100%; margin: 0; height: 36px; font-size: 0.84rem;">
            </td>
            <td style="padding: 0.45rem 0.5rem;">
              <input type="number" class="swal2-input row-qty" value="1" min="1" placeholder="Qty" style="width: 100%; margin: 0; height: 36px; font-size: 0.84rem; font-weight: bold;">
            </td>
            <td style="padding: 0.45rem 0.5rem;">
              <input type="number" class="swal2-input row-cost" value="0.00" step="0.5" style="width: 100%; margin: 0; height: 36px; font-size: 0.84rem;">
            </td>
            <td style="text-align: right; font-weight: 700; color: #00a896; padding: 0.45rem 0.5rem; white-space: nowrap; font-size: 0.9rem;" class="row-subtotal">
              ₱0.00
            </td>
            <td style="text-align: center; padding: 0.45rem 0.2rem;">
              <button type="button" class="btn btn-sm btn-outline row-btn-delete" style="padding: 0.25rem 0.45rem; color: #ef4444; border-color: #ef4444;" title="Remove this line">
                <i class="ri-delete-bin-line"></i>
              </button>
            </td>
          `;

          const prodSelect = tr.querySelector('.row-prod-select');
          const batchInput = tr.querySelector('.row-batch');
          const expInput = tr.querySelector('.row-expiry');
          const costInput = tr.querySelector('.row-cost');
          const qtyInput = tr.querySelector('.row-qty');
          const delBtn = tr.querySelector('.row-btn-delete');

          const syncDefaults = () => {
            const opt = prodSelect.options[prodSelect.selectedIndex];
            if (opt) {
              costInput.value = parseFloat(opt.getAttribute('data-cost') || 0).toFixed(2);
              // Requirement: Stock in must NOT have default batch/lot# or default expiry
              calculateTotals();
            }
          };

          prodSelect.addEventListener('change', syncDefaults);
          costInput.addEventListener('input', calculateTotals);
          qtyInput.addEventListener('input', calculateTotals);

          delBtn.addEventListener('click', () => {
            if (tbody.querySelectorAll('.stkin-row').length > 1) {
              tr.remove();
              calculateTotals();
            } else {
              Swal.showValidationMessage('A delivery receipt must have at least one line item.');
            }
          });

          tbody.appendChild(tr);
          syncDefaults();
        };

        addBtn.addEventListener('click', () => createRow());
        // Add initial row
        createRow();
      },
      preConfirm: () => {
        const supplierName = document.getElementById('stkin-supplier').value;
        const refNo = document.getElementById('stkin-refno').value.trim();
        const date = document.getElementById('stkin-date').value;
        const receivedBy = document.getElementById('stkin-receiver').value.trim();
        const notes = document.getElementById('stkin-notes').value.trim();

        if (!refNo || !date || !receivedBy) {
          Swal.showValidationMessage('Please fill in all required delivery header fields.');
          return false;
        }

        const rows = document.querySelectorAll('.stkin-row');
        const items = [];
        let totalAmount = 0;

        for (const row of rows) {
          const prodSelect = row.querySelector('.row-prod-select');
          const opt = prodSelect.options[prodSelect.selectedIndex];
          const productId = parseInt(prodSelect.value);
          const name = opt.getAttribute('data-name') || opt.text.split(' [')[0];
          const batchNo = row.querySelector('.row-batch').value.trim();
          const expiryDate = row.querySelector('.row-expiry').value;
          const qty = parseInt(row.querySelector('.row-qty').value);
          const costPrice = parseFloat(row.querySelector('.row-cost').value);

          if (!productId || isNaN(qty) || qty <= 0 || isNaN(costPrice) || !batchNo || !expiryDate) {
            Swal.showValidationMessage('Please ensure all medicine lines have valid quantities, unit costs, Batch / Lot #, and Expiry Dates.');
            return false;
          }

          const lineSubtotal = qty * costPrice;
          totalAmount += lineSubtotal;
          items.push({
            productId,
            name,
            qty,
            costPrice,
            batchNo,
            expiryDate
          });
        }

        if (items.length === 0) {
          Swal.showValidationMessage('Please add at least one medicine item to receive.');
          return false;
        }

        return {
          supplierName,
          refNo,
          date,
          receivedBy,
          totalAmount,
          notes,
          items
        };
      }
    });
  },

  // =========================================================================
  // 2. MASTER-DETAIL STOCK OUT (DISPOSALS & PULL-OUTS)
  // =========================================================================
  async showStockOutModal(products) {
    if (!this.canOpenModal('stock-out')) return { isConfirmed: false, isDismissed: true };

    const availableProducts = products.filter(p => p.stock > 0);
    if (availableProducts.length === 0) {
      Swal.fire('No Available Stock', 'There are no active inventory items currently in stock to pull out or dispose.', 'info');
      return null;
    }

    const productsOptions = availableProducts.map(p => `
      <option value="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-stock="${p.stock}" data-cost="${p.costPrice || 0}" data-batch="${p.batchNo || 'N/A'}" data-uom="${p.uom || 'units'}">
        ${p.name} [${p.uom || 'units'}] - Stock: ${p.stock}
      </option>
    `).join('');

    const defaultSO = 'SO-' + Math.floor(10000 + Math.random() * 90000);
    const today = new Date().toISOString().split('T')[0];

    const htmlContent = `
      <div style="text-align: left;">
        <!-- PARENT HEADER: DISPOSAL REQUISITION & REASON -->
        <div style="background: #fef2f2; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.9rem; border: 1px solid #fee2e2; border-left: 4px solid var(--danger);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.6rem;">
            <div class="form-group">
              <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Disposal Voucher / Slip # *</label>
              <input type="text" id="stkout-refno" class="swal2-input" value="${defaultSO}" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem; font-weight: bold; color: #ef4444;">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Date of Deduction *</label>
              <input type="date" id="stkout-date" class="swal2-input" value="${today}" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-weight: 700; color: #ef4444; font-size: 0.82rem;">Deduction Reason *</label>
              <select id="stkout-reason" class="swal2-select" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem;">
                <option value="Expired Medicine Disposal">Expired Medicine Disposal (FDA Regulated)</option>
                <option value="Damaged Packaging">Damaged / Broken Packaging</option>
                <option value="Supplier Return (RTV)">Supplier Return / RTV</option>
                <option value="Internal Clinic Use">Internal Pharmacy / Clinic Consumption</option>
                <option value="Inventory Discrepancy">Inventory Count Discrepancy (Audit)</option>
              </select>
            </div>
            <div class="form-group">
              <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Authorized Pharmacist / Manager *</label>
              <input type="text" id="stkout-authorizer" class="swal2-input" value="Xyra Andrea (Manager)" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem;">
            </div>
          </div>
        </div>

        <!-- CHILDREN DETAILS: DEDUCTION LINE ENTRIES -->
        <div style="margin-bottom: 0.8rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-weight: 800; color: #dc2626; font-size: 0.88rem;">
              <i class="ri-delete-bin-2-line"></i> Items to Deduct / Write Off
            </label>
            <button type="button" id="btn-add-stkout-row" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.7rem; font-size: 0.78rem; color: #ef4444; border-color: #ef4444;">
              <i class="ri-add-line"></i> Add Medicine Line
            </button>
          </div>

          <div style="max-height: 260px; overflow-y: auto; border: 1px solid #fee2e2; border-radius: 8px;">
            <table class="custom-table" style="margin: 0; font-size: 0.84rem; width: 100%; table-layout: fixed;">
              <thead style="position: sticky; top: 0; background: #fff5f5; z-index: 3;">
                <tr>
                  <th style="width: 38%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Medicine / Description</th>
                  <th style="width: 34%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Batch / Lot # (FEFO Selection)</th>
                  <th style="width: 12%; white-space: nowrap; text-align: center; padding: 0.75rem 0.6rem;">Avail Stock</th>
                  <th style="width: 16%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Qty to Deduct *</th>
                  <th style="width: 44px; text-align: center; padding: 0.75rem 0.3rem;"></th>
                </tr>
              </thead>
              <tbody id="stkout-items-tbody">
                <!-- Line items inserted here dynamically -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- SUMMARY & REMARKS -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #fff1f2; border: 1px solid #fecdd3; padding: 0.65rem 0.9rem; border-radius: 8px; margin-bottom: 0.75rem;">
          <div>
            <span style="font-size: 0.82rem; color: #881337; font-weight: 600;">Total Items:</span>
            <strong id="stkout-items-count" style="color: #e11d48; margin-left: 0.3rem;">1</strong>
          </div>
          <div>
            <span style="font-size: 0.82rem; color: #881337; font-weight: 600;">Total Units Deducted:</span>
            <span id="stkout-grand-qty" style="font-size: 1.2rem; font-weight: 800; color: #e11d48; margin-left: 0.4rem;">0 units</span>
          </div>
        </div>

        <div class="form-group">
          <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Audit Remarks & Justification Notes</label>
          <input type="text" id="stkout-notes" class="swal2-input" placeholder="e.g. Hazardous disposal completed per FDA protocol #401" style="width: 100%; margin: 0.2rem 0; height: 36px; font-size: 0.85rem;">
        </div>
      </div>
    `;

    return Swal.fire({
      title: '📤 Record Stock Out (Write-off)',
      html: htmlContent,
      width: '1350px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-delete-bin-2-line"></i> Confirm Stock Out',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel',
      didOpen: () => {
        const tbody = document.getElementById('stkout-items-tbody');
        const countIndicator = document.getElementById('stkout-items-count');
        const grandQtyIndicator = document.getElementById('stkout-grand-qty');
        const addBtn = document.getElementById('btn-add-stkout-row');

        const calculateTotals = () => {
          let grandQty = 0;
          let rowCount = 0;
          tbody.querySelectorAll('.stkout-row').forEach(row => {
            rowCount++;
            const qty = parseInt(row.querySelector('.row-qty').value) || 0;
            grandQty += qty;
          });
          countIndicator.innerText = rowCount;
          grandQtyIndicator.innerText = `${grandQty} units`;
        };

        const createRow = () => {
          const tr = document.createElement('tr');
          tr.className = 'stkout-row';
          tr.innerHTML = `
            <td>
              <select class="swal2-select row-prod-select" style="width: 100%; margin: 0; height: 34px; font-size: 0.8rem;">
                ${productsOptions}
              </select>
            </td>
            <td>
              <select class="swal2-select row-batch-select" style="width: 100%; margin: 0; height: 34px; font-size: 0.78rem;">
                <option value="">Loading batches...</option>
              </select>
            </td>
            <td>
              <span class="row-stock-badge badge-pill badge-info" style="font-size: 0.75rem;">0</span>
            </td>
            <td>
              <input type="number" class="swal2-input row-qty" value="1" min="1" style="width: 100%; margin: 0; height: 34px; font-size: 0.8rem; font-weight: bold; color: #ef4444;">
            </td>
            <td style="text-align: center;">
              <button type="button" class="btn btn-sm btn-outline row-btn-delete" style="padding: 0.15rem 0.35rem; color: #ef4444; border-color: #ef4444;" title="Remove this line">
                <i class="ri-delete-bin-line"></i>
              </button>
            </td>
          `;

          const prodSelect = tr.querySelector('.row-prod-select');
          const batchSelect = tr.querySelector('.row-batch-select');
          const stockBadge = tr.querySelector('.row-stock-badge');
          const qtyInput = tr.querySelector('.row-qty');
          const delBtn = tr.querySelector('.row-btn-delete');

          const syncDefaults = async () => {
            const opt = prodSelect.options[prodSelect.selectedIndex];
            if (opt) {
              const prodId = parseInt(prodSelect.value);
              const uom = opt.getAttribute('data-uom') || 'units';
              let batches = [];
              try {
                batches = await window.mockApi.getProductBatches(prodId);
              } catch (e) {
                batches = [];
              }

              if (batches && batches.length > 0) {
                batchSelect.innerHTML = batches.map(b => 
                  `<option value="${b.batchNo}" data-exp="${b.expiryDate}" data-stock="${b.availableStock}">${b.displayBatch} (Exp: ${b.expiryDate || 'N/A'} - ${b.availableStock} avail)</option>`
                ).join('');
              } else {
                const pBatch = opt.getAttribute('data-batch') || '';
                const pStock = parseInt(opt.getAttribute('data-stock') || 0);
                batchSelect.innerHTML = `<option value="${pBatch}" data-exp="" data-stock="${pStock}">${pBatch || 'Default Batch'} (${pStock} avail)</option>`;
              }
              syncBatchSelection();
            }
          };

          const syncBatchSelection = () => {
            const bOpt = batchSelect.options[batchSelect.selectedIndex];
            const opt = prodSelect.options[prodSelect.selectedIndex];
            const uom = opt ? (opt.getAttribute('data-uom') || 'units') : 'units';
            if (bOpt) {
              const bStock = parseInt(bOpt.getAttribute('data-stock') || 0);
              stockBadge.innerText = `${bStock} ${uom}`;
              qtyInput.max = bStock;
            }
            calculateTotals();
          };

          prodSelect.addEventListener('change', syncDefaults);
          batchSelect.addEventListener('change', syncBatchSelection);
          qtyInput.addEventListener('input', calculateTotals);

          delBtn.addEventListener('click', () => {
            if (tbody.querySelectorAll('.stkout-row').length > 1) {
              tr.remove();
              calculateTotals();
            } else {
              Swal.showValidationMessage('A disposal voucher must have at least one line item.');
            }
          });

          tbody.appendChild(tr);
          syncDefaults();
        };

        addBtn.addEventListener('click', () => createRow());
        // Add initial row
        createRow();
      },
      preConfirm: () => {
        const refNo = document.getElementById('stkout-refno').value.trim();
        const date = document.getElementById('stkout-date').value;
        const reason = document.getElementById('stkout-reason').value;
        const authorizedBy = document.getElementById('stkout-authorizer').value.trim();
        const notes = document.getElementById('stkout-notes').value.trim();

        if (!refNo || !date || !authorizedBy) {
          Swal.showValidationMessage('Please fill in all disposal voucher header fields.');
          return false;
        }

        const rows = document.querySelectorAll('.stkout-row');
        const items = [];

        for (const row of rows) {
          const prodSelect = row.querySelector('.row-prod-select');
          const batchSelect = row.querySelector('.row-batch-select');
          const opt = prodSelect.options[prodSelect.selectedIndex];
          const bOpt = batchSelect ? batchSelect.options[batchSelect.selectedIndex] : null;

          const productId = parseInt(prodSelect.value);
          const name = opt.getAttribute('data-name') || opt.text.split(' [')[0];
          const costPrice = parseFloat(opt.getAttribute('data-cost') || 0);
          const batchNo = bOpt ? bOpt.value : (opt.getAttribute('data-batch') || '');
          const expiryDate = bOpt ? (bOpt.getAttribute('data-exp') || '') : '';
          const availableStock = bOpt ? parseInt(bOpt.getAttribute('data-stock') || 0) : parseInt(opt.getAttribute('data-stock') || 0);
          const qty = parseInt(row.querySelector('.row-qty').value);

          if (isNaN(qty) || qty <= 0) {
            Swal.showValidationMessage(`Please enter a valid deduction quantity for ${name}.`);
            return false;
          }

          if (qty > availableStock) {
            Swal.showValidationMessage(`Cannot deduct ${qty} units of ${name}. Only ${availableStock} units available in selected batch.`);
            return false;
          }

          items.push({
            productId,
            product_id: productId,
            name,
            product_name: name,
            costPrice,
            cost_price: costPrice,
            batchNo,
            batch_no: batchNo,
            expiryDate,
            expiry_date: expiryDate,
            quantity: qty,
            qty
          });
        }

        if (items.length === 0) {
          Swal.showValidationMessage('Please add at least one medicine item to deduct.');
          return false;
        }

        return {
          refNo,
          date,
          reason,
          authorizedBy,
          notes,
          items
        };
      }
    });
  },
  parseRatio(val, fallback = 25) {
    if (val === null || val === undefined) return fallback;
    const str = String(val).trim();
    if (!str) return fallback;
    if (str.includes(':')) {
      const parts = str.split(':').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
      if (parts.length === 2) {
        return Math.round(Math.max(parts[0], parts[1]) / Math.min(parts[0], parts[1])) || fallback;
      }
    }
    if (str.includes('/')) {
      const parts = str.split('/').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
      if (parts.length === 2) {
        return Math.round(Math.max(parts[0], parts[1]) / Math.min(parts[0], parts[1])) || fallback;
      }
    }
    if (str.toLowerCase().includes('to')) {
      const parts = str.toLowerCase().split('to').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
      if (parts.length === 2) {
        return Math.round(Math.max(parts[0], parts[1]) / Math.min(parts[0], parts[1])) || fallback;
      }
    }
    const clean = parseFloat(str.replace(/[^0-9.]/g, ''));
    return (!isNaN(clean) && clean > 0) ? Math.round(clean) : fallback;
  },

  // Item Conversion Modal
  async showItemConversionModal(allProducts, preselectedSourceId = null) {
    if (!this.canOpenModal('conversion')) return { isConfirmed: false, isDismissed: true };

    const bulkProducts = allProducts.filter(p => p.isBulk || (p.uom && p.uom.toLowerCase().includes('box')) || p.childProductId);
    const retailProducts = allProducts.filter(p => !p.isBulk);

    if (bulkProducts.length === 0) {
      Swal.fire('No Bulk Inventory', 'There are no bulk packaging items available for conversion.', 'info');
      return null;
    }

    const sourceOptions = bulkProducts.map(b => {
      const selected = preselectedSourceId && b.id === parseInt(preselectedSourceId) ? 'selected' : '';
      const rawRate = b.conversionRate || b.conversion_rate || 25;
      return `<option value="${b.id}" data-stock="${b.stock}" data-uom="${b.uom}" data-rate="${rawRate}" data-child="${b.childProductId || ''}" data-cost="${b.costPrice}" data-batch="${b.batchNo}" data-exp="${b.expiryDate}" ${selected}>
        ${b.name} (${b.uom}) - In Stock: ${b.stock}
      </option>`;
    }).join('');

    const targetOptions = retailProducts.map(r => `
      <option value="${r.id}" data-stock="${r.stock}" data-uom="${r.uom}" data-cost="${r.costPrice}" data-name="${r.name}">
        ${r.name} (${r.uom}) - In Stock: ${r.stock}
      </option>
    `).join('');

    const htmlContent = `
      <div style="text-align: left;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem; color: #15803d; font-weight: 700; margin-bottom: 0.4rem;">
            <i class="ri-swap-box-line" style="font-size: 1.2rem;"></i>
            <span>Unit Breakdown & Repackaging Assistant</span>
          </div>
          <p style="font-size: 0.8rem; color: #166534; margin: 0;">
            Unboxes bulk stock (Cartons/Boxes) into retail dispensing units (Tablets/Capsules/Strips). Enter the desired packaging ratio (e.g. 1:25) or input exact units to receive.
          </p>
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Select Source Bulk Item (To Unbox) *</label>
          <select id="conv-source-select" class="swal2-select" style="width: 100%; margin: 0.2rem 0;">
            ${sourceOptions}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem; margin: 0;">Select Bulk Batch to Unbox (FEFO Priority) *</label>
            <span id="conv-batch-count-badge" style="font-size: 0.72rem; color: #0284c7; background: #e0f2fe; padding: 1px 6px; border-radius: 4px; font-weight: 600;">0 batches</span>
          </div>
          <select id="conv-batch-select" class="swal2-select" style="width: 100%; margin: 0.2rem 0; font-weight: 600;">
            <option value="">Loading batches...</option>
          </select>
          <div id="conv-batch-custom-wrap" style="display: none; margin-top: 0.4rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 0.5rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 0.35rem;">Custom Source Batch Details:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <input type="text" id="conv-custom-batch-no" class="swal2-input" placeholder="Batch / Lot Number" style="margin: 0; font-size: 0.82rem; height: 34px;">
              <input type="date" id="conv-custom-exp-date" class="swal2-input" style="margin: 0; font-size: 0.82rem; height: 34px;">
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Select Target Retail Item (To Add) *</label>
          <select id="conv-target-select" class="swal2-select" style="width: 100%; margin: 0.2rem 0;">
            ${targetOptions}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 0.75rem; margin-bottom: 0.85rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.83rem;">Bulk Units (From) *</label>
            <input type="number" id="conv-qty-input" class="swal2-input" value="1" min="1" style="width: 100%; margin: 0.2rem 0; font-size: 1.1rem; font-weight: bold; color: #ef4444;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.83rem;">Packaging Ratio</label>
            <input type="text" id="conv-rate-input" class="swal2-input" value="1:25" placeholder="e.g. 1:25 or 25" style="width: 100%; margin: 0.2rem 0; font-size: 1.05rem; font-weight: bold; color: #00a896; text-align: center;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.83rem;">Retail Units to Credit *</label>
            <input type="number" id="conv-target-qty-input" class="swal2-input" value="25" min="1" style="width: 100%; margin: 0.2rem 0; font-size: 1.1rem; font-weight: bold; color: #10b981;">
          </div>
        </div>

        <!-- Dynamic Live Math Conversion Box -->
        <div style="background: #ffffff; border: 2px dashed #00a896; border-radius: 12px; padding: 1.1rem; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0,168,150,0.06);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="text-align: center; flex: 1;">
              <span style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Bulk Deducted</span>
              <div id="conv-preview-source" style="font-size: 1.15rem; font-weight: 800; color: #ef4444;">-1 Box</div>
            </div>
            <div style="color: #00a896; font-size: 1.6rem; font-weight: bold; padding: 0 0.5rem;">➔</div>
            <div style="text-align: center; flex: 1;">
              <span style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Retail Added</span>
              <div id="conv-preview-target" style="font-size: 1.15rem; font-weight: 800; color: #10b981;">+25 Tablets</div>
            </div>
          </div>

          <!-- Carried-Over Batch to Destination Banner -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.7rem 0.9rem; margin-top: 0.65rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.35rem;">
              <span style="font-weight: 700; color: #1e40af; font-size: 0.82rem; display: flex; align-items: center; gap: 5px;">
                <i class="ri-git-merge-line"></i> Destination Retail Batch (Carried from Source):
              </span>
              <span class="badge" style="background: #2563eb; color: #ffffff; font-weight: 800; font-size: 0.82rem; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                <i class="ri-barcode-box-line"></i> <span id="conv-preview-batch">BATCH-NO</span>
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: #3b82f6; margin-top: 0.35rem; border-top: 1px dashed #dbeafe; padding-top: 0.35rem;">
              <span>Carried Expiration Date: <strong id="conv-preview-exp">—</strong></span>
              <span>Recalculated Retail Cost: <strong id="conv-preview-cost" style="color: #1e3a8a;">₱0.00 / pc</strong></span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Pharmacist Operator *</label>
            <input type="text" id="conv-operator" class="swal2-input" value="Xyra Andrea (Pharmacist)" style="width: 100%; margin: 0.2rem 0;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Notes / Conversion Reason</label>
            <input type="text" id="conv-notes" class="swal2-input" placeholder="e.g. Unboxed for retail counter dispenser" style="width: 100%; margin: 0.2rem 0;">
          </div>
        </div>
      </div>
    `;

    return Swal.fire({
      title: '🔄 Perform Item Conversion',
      html: htmlContent,
      width: '920px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-swap-line"></i> Confirm Conversion',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel',
      didOpen: () => {
        const sourceSelect = document.getElementById('conv-source-select');
        const targetSelect = document.getElementById('conv-target-select');
        const qtyInput = document.getElementById('conv-qty-input');
        const rateInput = document.getElementById('conv-rate-input');
        const targetQtyInput = document.getElementById('conv-target-qty-input');

        const previewSource = document.getElementById('conv-preview-source');
        const previewTarget = document.getElementById('conv-preview-target');
        const previewBatch = document.getElementById('conv-preview-batch');
        const previewExp = document.getElementById('conv-preview-exp');
        const previewCost = document.getElementById('conv-preview-cost');

        const batchSelect = document.getElementById('conv-batch-select');
        const customBatchWrap = document.getElementById('conv-batch-custom-wrap');
        const customBatchInput = document.getElementById('conv-custom-batch-no');
        const customExpInput = document.getElementById('conv-custom-exp-date');

        const syncSourceToTarget = async () => {
          const selectedSource = sourceSelect.options[sourceSelect.selectedIndex];
          if (!selectedSource) return;

          const sourceId = parseInt(sourceSelect.value);
          const childId = selectedSource.getAttribute('data-child');
          const rawRate = selectedSource.getAttribute('data-rate');
          const rate = SwalHelpers.parseRatio(rawRate, 25);
          
          rateInput.value = `1:${rate}`;
          const currentFromQty = parseInt(qtyInput.value) || 1;
          targetQtyInput.value = Math.max(1, currentFromQty * rate);

          let batches = [];
          try {
            batches = await window.mockApi.getProductBatches(sourceId);
          } catch (e) {
            batches = [];
          }

          if (batchSelect) {
            const batchCountBadge = document.getElementById('conv-batch-count-badge');
            if (batchCountBadge) {
              batchCountBadge.textContent = `${batches ? batches.length : 0} active batch(es)`;
            }

            if (batches && batches.length > 0) {
              const opts = batches.map((b, idx) => {
                const isFefo = idx === 0 ? '⭐ [FEFO Priority] ' : '';
                return `<option value="${b.batchNo}" data-exp="${b.expiryDate}" data-stock="${b.availableStock}" ${idx === 0 ? 'selected' : ''}>
                  ${isFefo}${b.displayBatch} (Exp: ${b.expiryDate || 'N/A'} - Available: ${b.availableStock})
                </option>`;
              });
              opts.push('<option value="__CUSTOM__">➕ Enter / Override Custom Batch...</option>');
              batchSelect.innerHTML = opts.join('');
            } else {
              const defBatch = selectedSource.getAttribute('data-batch') || 'UNASSIGNED';
              const defExp = selectedSource.getAttribute('data-exp') || '';
              const defStock = parseInt(selectedSource.getAttribute('data-stock') || 0);
              batchSelect.innerHTML = `
                <option value="${defBatch}" data-exp="${defExp}" data-stock="${defStock}">${defBatch} (${defStock} on hand)</option>
                <option value="__CUSTOM__">➕ Enter / Override Custom Batch...</option>
              `;
            }
          }

          if (childId) {
            for (let i = 0; i < targetSelect.options.length; i++) {
              if (targetSelect.options[i].value === childId) {
                targetSelect.selectedIndex = i;
                break;
              }
            }
          }

          updateLiveConversionMath();
        };

        const updateLiveConversionMath = (originField = '') => {
          const selectedSource = sourceSelect.options[sourceSelect.selectedIndex];
          const selectedTarget = targetSelect.options[targetSelect.selectedIndex];
          const selectedBatch = batchSelect ? batchSelect.options[batchSelect.selectedIndex] : null;
          if (!selectedSource || !selectedTarget) return;

          const isCustomBatch = batchSelect && batchSelect.value === '__CUSTOM__';
          if (customBatchWrap) {
            customBatchWrap.style.display = isCustomBatch ? 'block' : 'none';
          }

          const sourceUom = selectedSource.getAttribute('data-uom') || 'Box';
          const targetUom = selectedTarget.getAttribute('data-uom') || 'Tablet';
          const sourceCost = parseFloat(selectedSource.getAttribute('data-cost') || 0);

          let batch = selectedBatch ? selectedBatch.value : (selectedSource.getAttribute('data-batch') || 'N/A');
          let exp = selectedBatch ? (selectedBatch.getAttribute('data-exp') || 'N/A') : (selectedSource.getAttribute('data-exp') || 'N/A');
          let maxStock = selectedBatch ? parseInt(selectedBatch.getAttribute('data-stock') || 0) : parseInt(selectedSource.getAttribute('data-stock') || 0);

          if (isCustomBatch) {
            batch = customBatchInput ? (customBatchInput.value.trim() || 'CUSTOM-BATCH') : 'CUSTOM-BATCH';
            exp = customExpInput ? (customExpInput.value || 'N/A') : 'N/A';
            maxStock = parseInt(selectedSource.getAttribute('data-stock') || 0);
          }

          const convQty = parseInt(qtyInput.value) || 0;
          let rate = SwalHelpers.parseRatio(rateInput.value, 25);

          if (originField === 'targetQty') {
            const enteredTarget = parseInt(targetQtyInput.value) || 0;
            if (convQty > 0 && enteredTarget > 0) {
              rate = Math.round(enteredTarget / convQty) || 1;
              rateInput.value = `1:${rate}`;
            }
          } else {
            const calcTarget = convQty * rate;
            targetQtyInput.value = calcTarget > 0 ? calcTarget : '';
          }

          const targetResultQty = parseInt(targetQtyInput.value) || (convQty * rate);

          previewSource.innerText = `-${convQty} ${sourceUom}`;
          previewTarget.innerText = `+${targetResultQty} ${targetUom}`;
          if (previewBatch) previewBatch.innerText = batch || 'No Batch';
          if (previewExp) previewExp.innerText = exp || 'N/A';

          const costPerUnit = rate > 0 ? (sourceCost / rate).toFixed(2) : '0.00';
          if (previewCost) previewCost.innerText = `₱${costPerUnit} / ${targetUom}`;

          if (convQty > maxStock) {
            previewSource.style.color = '#dc2626';
            previewSource.innerHTML += `<br><small style="font-size:0.7rem;">(Only ${maxStock} in stock!)</small>`;
          } else {
            previewSource.style.color = '#ef4444';
          }
        };

        sourceSelect.addEventListener('change', syncSourceToTarget);
        if (batchSelect) batchSelect.addEventListener('change', () => updateLiveConversionMath('batch'));
        if (customBatchInput) customBatchInput.addEventListener('input', () => updateLiveConversionMath('customBatch'));
        if (customExpInput) customExpInput.addEventListener('input', () => updateLiveConversionMath('customExp'));
        targetSelect.addEventListener('change', () => updateLiveConversionMath());
        qtyInput.addEventListener('input', () => updateLiveConversionMath('qty'));
        rateInput.addEventListener('input', () => updateLiveConversionMath('rate'));
        targetQtyInput.addEventListener('input', () => updateLiveConversionMath('targetQty'));

        syncSourceToTarget();
      },
      preConfirm: () => {
        const sourceSelect = document.getElementById('conv-source-select');
        const targetSelect = document.getElementById('conv-target-select');
        const sourceProdId = parseInt(sourceSelect.value);
        const targetProdId = parseInt(targetSelect.value);
        const sourceQty = parseInt(document.getElementById('conv-qty-input').value) || 1;
        const operator = document.getElementById('conv-operator').value.trim();
        const notes = document.getElementById('conv-notes').value.trim();

        const selectedSource = sourceSelect.options[sourceSelect.selectedIndex];
        const batchSelect = document.getElementById('conv-batch-select');
        const selectedBatch = batchSelect ? batchSelect.options[batchSelect.selectedIndex] : null;

        let batchNo = selectedBatch ? selectedBatch.value : '';
        let expiryDate = selectedBatch ? (selectedBatch.getAttribute('data-exp') || '') : '';
        let maxStock = selectedBatch ? parseInt(selectedBatch.getAttribute('data-stock') || 0) : parseInt(selectedSource.getAttribute('data-stock') || 0);

        if (batchNo === '__CUSTOM__') {
          batchNo = document.getElementById('conv-custom-batch-no')?.value.trim() || '';
          expiryDate = document.getElementById('conv-custom-exp-date')?.value || '';
          maxStock = parseInt(selectedSource.getAttribute('data-stock') || 0);
        }

        if (sourceProdId === targetProdId) {
          Swal.showValidationMessage('Source item and target item cannot be the same product.');
          return false;
        }

        if (isNaN(sourceQty) || sourceQty <= 0) {
          Swal.showValidationMessage('Please enter a valid conversion quantity (at least 1).');
          return false;
        }

        if (sourceQty > maxStock) {
          Swal.showValidationMessage(`Cannot convert ${sourceQty} units. Only ${maxStock} units available in selected batch.`);
          return false;
        }

        const convRate = SwalHelpers.parseRatio(document.getElementById('conv-rate-input')?.value, 25);
        let targetResultQty = parseInt(document.getElementById('conv-target-qty-input')?.value);
        if (isNaN(targetResultQty) || targetResultQty <= 0) {
          targetResultQty = sourceQty * convRate;
        }

        return {
          sourceProductId: sourceProdId,
          source_product_id: sourceProdId,
          targetProductId: targetProdId,
          target_product_id: targetProdId,
          sourceQty,
          source_qty: sourceQty,
          from_qty: sourceQty,
          targetQty: targetResultQty,
          target_qty: targetResultQty,
          to_qty: targetResultQty,
          conversionRate: convRate,
          multiplier: convRate,
          ratio: `1:${convRate}`,
          batchNo,
          batch_no: batchNo,
          expiryDate,
          expiry_date: expiryDate,
          operator,
          notes
        };
      }
    });
  },

  // =========================================================================
  // 3. MASTER-DETAIL INSPECTION SLIP: STOCK IN (RECEIPT)
  // =========================================================================
  showStockInDetailModal(stockIn) {
    if (!this.canOpenModal('stock-in-detail')) return;
    const items = stockIn.items || [];
    let totalQty = 0;

    const itemsRows = items.map(item => {
      const qty = item.qty || item.quantity || 0;
      const cost = parseFloat(item.costPrice || item.cost_price || 0);
      const subtotal = qty * cost;
      totalQty += qty;

      return `
        <tr>
          <td><strong>${item.name || item.product_name}</strong></td>
          <td><code>${item.batchNo || item.batch_no || 'N/A'}</code></td>
          <td>${item.expiryDate || item.expiry_date || 'N/A'}</td>
          <td style="text-align: center; font-weight: 700; color: #00a896;">+${qty}</td>
          <td style="text-align: right;">₱${cost.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 700; color: #00a896;">₱${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div style="text-align: left;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.8rem; margin-bottom: 0.8rem;">
          <div>
            <h4 style="margin: 0; color: #00a896; font-size: 1.15rem; font-weight: 800;">${stockIn.supplierName || 'Distributor Delivery'}</h4>
            <span style="font-size: 0.82rem; color: #64748b;">Delivery Receipt / DR #: <strong style="color: var(--primary);">${stockIn.refNo}</strong></span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.88rem; color: var(--text-main, #0f172a); font-weight: 700;">Date: ${stockIn.date}</span><br>
            <small style="color: var(--text-muted, #64748b);">Received By: <strong>${stockIn.receivedBy}</strong></small>
          </div>
        </div>

        <table class="custom-table" style="font-size: 0.86rem; margin-bottom: 1rem; width: 100%; table-layout: fixed;">
          <thead>
            <tr>
              <th style="width: 32%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Delivered Medicine</th>
              <th style="width: 20%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Batch / Lot #</th>
              <th style="width: 16%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Expiry Date</th>
              <th style="width: 10%; white-space: nowrap; text-align: center; padding: 0.75rem 0.6rem;">Qty</th>
              <th style="width: 11%; white-space: nowrap; text-align: right; padding: 0.75rem 0.6rem;">Unit Cost</th>
              <th style="width: 11%; white-space: nowrap; text-align: right; padding: 0.75rem 0.6rem;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No line items</td></tr>'}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; background: #e6fffa; border: 1px solid #b2f5ea; padding: 0.8rem; border-radius: 8px;">
          <div>
            <span style="font-size: 0.82rem; color: #234e52; font-weight: 600;">Items: <strong>${items.length} (${totalQty} units)</strong></span><br>
            <small style="color: #64748b;">${stockIn.notes || 'Cold chain verified. Packaging intact.'}</small>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.82rem; color: #234e52; font-weight: 600;">Grand Total Cost:</span><br>
            <span style="font-size: 1.25rem; font-weight: 800; color: #00a896;">₱${parseFloat(stockIn.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: '📦 Delivery Shipment Slip',
      html: html,
      width: '1200px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-printer-line"></i> Print Receiving Slip',
      cancelButtonText: 'Close'
    }).then(res => {
      if (res.isConfirmed) {
        window.print();
      }
    });
  },

  // =========================================================================
  // 4. MASTER-DETAIL INSPECTION SLIP: STOCK OUT (DISPOSAL)
  // =========================================================================
  showStockOutDetailModal(stockOut) {
    if (!this.canOpenModal('stock-out-detail')) return;
    const items = stockOut.items || [];
    let totalQty = 0;
    let totalEstimatedLoss = 0;

    const itemsRows = items.map(item => {
      const qty = item.qty || item.quantity || 0;
      const cost = parseFloat(item.costPrice || item.cost_price || 0);
      const subtotal = qty * cost;
      totalQty += qty;
      totalEstimatedLoss += subtotal;

      return `
        <tr>
          <td><strong>${item.name || item.product_name}</strong></td>
          <td><code>${item.batchNo || item.batch_no || 'N/A'}</code></td>
          <td style="text-align: center; color: #ef4444; font-weight: 700;">-${qty}</td>
          <td style="text-align: right;">₱${cost.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 700; color: #ef4444;">₱${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    let reasonBadge = 'badge-danger';
    if (stockOut.reason.includes('Damaged')) reasonBadge = 'badge-warning';
    else if (stockOut.reason.includes('Internal') || stockOut.reason.includes('Clinic')) reasonBadge = 'badge-success';
    else if (stockOut.reason.includes('Supplier') || stockOut.reason.includes('RTV')) reasonBadge = 'badge-info';

    const html = `
      <div style="text-align: left;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #fee2e2; padding-bottom: 0.8rem; margin-bottom: 0.8rem;">
          <div>
            <span class="badge-pill ${reasonBadge}" style="font-size: 0.82rem; margin-bottom: 0.3rem; display: inline-block;">${stockOut.reason}</span><br>
            <span style="font-size: 0.82rem; color: #64748b;">Disposal Slip #: <strong style="color: #ef4444;">${stockOut.refNo}</strong></span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.88rem; color: var(--text-main, #0f172a); font-weight: 700;">Date: ${stockOut.date}</span><br>
            <small style="color: var(--text-muted, #64748b);">Authorized By: <strong>${stockOut.authorizedBy}</strong></small>
          </div>
        </div>

        <table class="custom-table" style="font-size: 0.86rem; margin-bottom: 1rem; width: 100%; table-layout: fixed;">
          <thead>
            <tr>
              <th style="width: 36%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Deducted Medicine</th>
              <th style="width: 24%; white-space: nowrap; text-align: left; padding: 0.75rem 0.6rem;">Batch / Lot #</th>
              <th style="width: 12%; white-space: nowrap; text-align: center; padding: 0.75rem 0.6rem;">Qty Pulled</th>
              <th style="width: 14%; white-space: nowrap; text-align: right; padding: 0.75rem 0.6rem;">Unit Cost</th>
              <th style="width: 14%; white-space: nowrap; text-align: right; padding: 0.75rem 0.6rem;">Loss Value</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No line items</td></tr>'}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; background: #fff1f2; border: 1px solid #fecdd3; padding: 0.8rem; border-radius: 8px;">
          <div>
            <span style="font-size: 0.82rem; color: #881337; font-weight: 600;">Items: <strong>${items.length} (${totalQty} units)</strong></span><br>
            <small style="color: #64748b;">${stockOut.notes || 'Disposal executed under regulatory oversight.'}</small>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.82rem; color: #881337; font-weight: 600;">Total Loss Value:</span><br>
            <span style="font-size: 1.25rem; font-weight: 800; color: #e11d48;">₱${totalEstimatedLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: '🗑️ Disposal & Stock Out Slip',
      html: html,
      width: '1200px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-printer-line"></i> Print Disposal Slip',
      cancelButtonText: 'Close'
    }).then(res => {
      if (res.isConfirmed) {
        window.print();
      }
    });
  },
  // Demand Forecast PO Dialog
  async showGeneratePOModal(forecastItem, suppliers = []) {
    if (!this.canOpenModal('generate-po')) return { isConfirmed: false, isDismissed: true };

    const { product, suggestedReorder, forecastQty, forecast30, avgDaily, safetyStock, periodLabel } = forecastItem;
    const activeForecast = forecastQty ?? forecast30 ?? 0;
    const defaultOrderQty = suggestedReorder > 0 ? suggestedReorder : Math.max(10, product.reorderPoint || 20);

    const supplierList = Array.isArray(suppliers) && suppliers.length > 0 ? suppliers : [
      { name: 'Unilab Distribution Phils' },
      { name: 'Pascual Laboratories Inc.' },
      { name: 'Zuellig Pharma Philippines' }
    ];
    const supplierOpts = supplierList.map(s => `<option value="${s.name}">${s.name}</option>`).join('');

    return Swal.fire({
      title: '📈 Demand-Based Purchase Order',
      width: '820px',
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <div style="background: rgba(0, 168, 150, 0.08); border: 1px solid rgba(0,168,150,0.25); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <h4 style="color: #00a896; margin-bottom: 0.35rem;">${product.name}</h4>
            <div style="color: #475569; font-size: 0.84rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;">
              <div>Current Stock: <strong>${product.stock} ${product.uom || 'units'}</strong></div>
              <div>Avg. Daily Sales: <strong>${avgDaily ?? 0} / day</strong></div>
              <div>Forecast (${periodLabel || 'Horizon'}): <strong>${activeForecast} ${product.uom || 'units'}</strong></div>
              <div>Safety Buffer: <strong>${safetyStock ?? product.reorderPoint ?? 10} ${product.uom || 'units'}</strong></div>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0.8rem;">
            <label style="color: #475569; font-weight: 700; display: block;">Select Distributor / Supplier:</label>
            <select id="po-supplier" class="swal2-select" style="width: 100%; margin: 0.3rem 0;">
              ${supplierOpts}
            </select>
          </div>

          <div class="form-group">
            <label style="color: #475569; font-weight: 700; display: block;">Recommended Order Quantity (${product.uom || 'units'}):</label>
            <input type="number" id="po-qty" class="swal2-input" min="1" value="${defaultOrderQty}" style="width: 100%; margin: 0.3rem 0; font-size: 1.1rem; font-weight: bold; color: #00a896;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ri-send-plane-fill"></i> Submit Purchase Order',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const supplier = document.getElementById('po-supplier').value;
        const orderQty = parseInt(document.getElementById('po-qty').value);
        if (isNaN(orderQty) || orderQty <= 0) {
          Swal.showValidationMessage('Valid order quantity required');
          return false;
        }
        return { supplier, orderQty };
      }
    });
  },

  // Edit Stock In Parent Document & Children Items Modal
  async showEditStockInParentModal(log, suppliers = [], products = []) {
    if (!this.canOpenModal('edit-stock-in')) return { isConfirmed: false, isDismissed: true };

    const supplierList = suppliers.length > 0 ? suppliers : [
      { name: 'Unilab Distribution Phils' },
      { name: 'Pascual Laboratories Inc.' },
      { name: 'Zuellig Pharma Philippines' },
      { name: 'Mercury Drug Wholesale' }
    ];
    const currentSup = log.supplier_name || log.supplierName || '';
    const supplierOptions = supplierList.map(s => `
      <option value="${s.name}" ${s.name === currentSup ? 'selected' : ''}>${s.name}</option>
    `).join('');

    const existingItems = Array.isArray(log.items) ? log.items : [];

    return Swal.fire({
      title: `✏️ Edit Document & Children (${log.ref_no || log.refNo || ''})`,
      width: '1380px',
      html: `
        <div style="text-align: left; padding: 0.25rem 0;">
          <!-- 1. PARENT DOCUMENT HEADER -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #00a896; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem;">
              1. Parent Document Details
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.65rem;">
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Parent Document / DR # *
                </label>
                <input type="text" id="edit-stockin-ref" class="swal2-input" value="${log.ref_no || log.refNo || ''}" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem; font-family: monospace; font-weight: bold; color: #00a896;">
              </div>
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Supplier / Distributor *
                </label>
                <select id="edit-stockin-supplier" class="swal2-select" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem; display: block;">
                  ${supplierOptions}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.65rem;">
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Date Received *
                </label>
                <input type="date" id="edit-stockin-date" class="swal2-input" value="${log.date || ''}" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem;">
              </div>
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Received By *
                </label>
                <input type="text" id="edit-stockin-receiver" class="swal2-input" value="${log.received_by || log.receivedBy || ''}" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem;">
              </div>
            </div>

            <div>
              <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                Document Notes / Remarks
              </label>
              <input type="text" id="edit-stockin-notes" class="swal2-input" value="${log.notes || log.remarks || ''}" placeholder="e.g. Standard verification passed" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem;">
            </div>
          </div>

          <!-- 2. CHILDREN ITEMS OF DOCUMENT -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.78rem; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.4px;">
                <i class="ri-git-commit-line"></i> 2. Children Items in Document
              </span>
              <button type="button" id="btn-edit-add-stkin-child" class="btn btn-sm btn-outline-primary" style="padding: 0.2rem 0.65rem; font-size: 0.76rem;">
                <i class="ri-add-line"></i> Add Child Item
              </button>
            </div>

            <div style="max-height: 230px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <table class="custom-table" style="margin: 0; font-size: 0.84rem; width: 100%; table-layout: fixed;">
                <thead style="position: sticky; top: 0; background: #f1f5f9; z-index: 2;">
                  <tr>
                    <th style="width: 34%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Child Medicine</th>
                    <th style="width: 20%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Batch / Lot # *</th>
                    <th style="width: 18%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Expiry Date *</th>
                    <th style="width: 12%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Qty *</th>
                    <th style="width: 12%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Unit Cost (₱)</th>
                    <th style="width: 44px; text-align: center; padding: 0.7rem 0.3rem;"></th>
                  </tr>
                </thead>
                <tbody id="edit-stkin-children-tbody">
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ri-save-line"></i> Save Document & Children',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#00a896',
      didOpen: () => {
        const tbody = document.getElementById('edit-stkin-children-tbody');
        const addBtn = document.getElementById('btn-edit-add-stkin-child');

        const addChildRow = (item = null) => {
          const tr = document.createElement('tr');
          tr.className = 'edit-stkin-child-row';
          const selectedProdId = item ? Number(item.product_id ?? item.productId ?? 0) : (products[0]?.id || 0);
          const itemName = item ? (item.product_name || item.name || '') : (products[0]?.name || '');
          const batchVal = item ? (item.batch_no || item.batchNo || '') : '';
          const expVal = item ? (item.expiry_date || item.expiryDate || '') : '';
          const qtyVal = item ? Number(item.quantity ?? item.qty ?? 1) : 10;
          const costVal = item ? Number(item.cost_price ?? item.costPrice ?? 0) : Number(products[0]?.costPrice ?? 0);

          const prodOpts = products.length > 0
            ? products.map(p => `<option value="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-cost="${p.costPrice || 0}" data-batch="${p.batchNo || ''}" data-exp="${p.expiryDate || ''}" ${Number(p.id) === selectedProdId ? 'selected' : ''}>${p.name}</option>`).join('')
            : `<option value="${selectedProdId}" data-name="${itemName.replace(/"/g, '&quot;')}" selected>${itemName}</option>`;

          tr.innerHTML = `
            <td>
              <select class="swal2-select edit-child-prod" style="width: 100%; margin: 0; height: 36px; font-size: 0.84rem;">
                ${prodOpts}
              </select>
            </td>
            <td>
              <input type="text" class="swal2-input edit-child-batch" value="${batchVal}" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem;">
            </td>
            <td>
              <input type="date" class="swal2-input edit-child-exp" value="${expVal}" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem;">
            </td>
            <td>
              <input type="number" class="swal2-input edit-child-qty" value="${qtyVal}" min="1" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem; font-weight: bold;">
            </td>
            <td>
              <input type="number" class="swal2-input edit-child-cost" value="${costVal.toFixed(2)}" step="0.01" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem;">
            </td>
            <td style="text-align: center;">
              <button type="button" class="btn btn-sm btn-outline-danger edit-child-del" style="padding: 0.15rem 0.35rem;">
                <i class="ri-delete-bin-line"></i>
              </button>
            </td>
          `;

          const prodSel = tr.querySelector('.edit-child-prod');
          prodSel.addEventListener('change', () => {
            const opt = prodSel.options[prodSel.selectedIndex];
            if (opt) {
              tr.querySelector('.edit-child-cost').value = parseFloat(opt.getAttribute('data-cost') || 0).toFixed(2);
              tr.querySelector('.edit-child-batch').value = opt.getAttribute('data-batch') || '';
              tr.querySelector('.edit-child-exp').value = opt.getAttribute('data-exp') || '';
            }
          });

          tr.querySelector('.edit-child-del').addEventListener('click', () => {
            if (tbody.querySelectorAll('.edit-stkin-child-row').length > 1) {
              tr.remove();
            } else {
              Swal.showValidationMessage('Parent document must keep at least 1 child item.');
            }
          });

          tbody.appendChild(tr);
        };

        if (existingItems.length > 0) {
          existingItems.forEach(it => addChildRow(it));
        } else {
          addChildRow();
        }

        addBtn.addEventListener('click', () => addChildRow());
      },
      preConfirm: () => {
        const refNo = document.getElementById('edit-stockin-ref').value.trim();
        const supplierName = document.getElementById('edit-stockin-supplier').value;
        const date = document.getElementById('edit-stockin-date').value;
        const receivedBy = document.getElementById('edit-stockin-receiver').value.trim();
        const notes = document.getElementById('edit-stockin-notes').value.trim();

        if (!refNo) {
          Swal.showValidationMessage('Parent document number is required');
          return false;
        }

        const items = [];
        const rows = document.querySelectorAll('.edit-stkin-child-row');
        for (const r of rows) {
          const sel = r.querySelector('.edit-child-prod');
          const opt = sel.options[sel.selectedIndex];
          const productId = parseInt(sel.value) || 0;
          const name = opt ? (opt.getAttribute('data-name') || opt.text) : '';
          const batchNo = r.querySelector('.edit-child-batch').value.trim();
          const expiryDate = r.querySelector('.edit-child-exp').value;
          const qty = parseInt(r.querySelector('.edit-child-qty').value) || 0;
          const costPrice = parseFloat(r.querySelector('.edit-child-cost').value) || 0;

          if (qty <= 0) {
            Swal.showValidationMessage('All children items must have a quantity greater than 0.');
            return false;
          }
          items.push({ productId, product_id: productId, name, product_name: name, qty, quantity: qty, costPrice, cost_price: costPrice, batchNo, batch_no: batchNo, expiryDate, expiry_date: expiryDate });
        }

        return { refNo, ref_no: refNo, supplierName, supplier_name: supplierName, date, receivedBy, received_by: receivedBy, notes, remarks: notes, items };
      }
    });
  },

  // Edit Stock Out Parent Document & Children Items Modal
  async showEditStockOutParentModal(log, products = []) {
    if (!this.canOpenModal('edit-stock-out')) return { isConfirmed: false, isDismissed: true };

    const reasons = [
      'Expired Medicine Disposal',
      'Damaged Packaging',
      'Internal Clinic Use',
      'Supplier Return (RTV)',
      'Inventory Discrepancy'
    ];
    if (log.reason && !reasons.includes(log.reason)) {
      reasons.unshift(log.reason);
    }

    const reasonOptions = reasons.map(r => `
      <option value="${r}" ${r === log.reason ? 'selected' : ''}>${r}</option>
    `).join('');

    const existingItems = Array.isArray(log.items) ? log.items : [];

    return Swal.fire({
      title: `✏️ Edit Voucher & Children (${log.ref_no || log.refNo || ''})`,
      width: '1350px',
      html: `
        <div style="text-align: left; padding: 0.25rem 0;">
          <!-- 1. PARENT DOCUMENT HEADER -->
          <div style="background: #fff5f5; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1rem;">
            <div style="font-size: 0.72rem; font-weight: 800; color: #be123c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem;">
              1. Parent Document Details
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.65rem;">
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Parent Voucher # *
                </label>
                <input type="text" id="edit-stockout-ref" class="swal2-input" value="${log.ref_no || log.refNo || ''}" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem; font-family: monospace; font-weight: bold; color: #ef4444;">
              </div>
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Deduction Reason *
                </label>
                <select id="edit-stockout-reason" class="swal2-select" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem; display: block;">
                  ${reasonOptions}
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.65rem;">
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Date Authorized *
                </label>
                <input type="date" id="edit-stockout-date" class="swal2-input" value="${log.date || ''}" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem;">
              </div>
              <div>
                <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                  Authorized Pharmacist *
                </label>
                <input type="text" id="edit-stockout-authorizer" class="swal2-input" value="${log.authorized_by || log.authorizedBy || ''}" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem;">
              </div>
            </div>

            <div>
              <label style="display:block; font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 0.2rem;">
                Audit Notes / Protocol
              </label>
              <input type="text" id="edit-stockout-notes" class="swal2-input" value="${log.notes || log.remarks || ''}" placeholder="e.g. Conduct per GPP & FDA regulations" style="width: 100%; margin: 0; height: 36px; font-size: 0.85rem;">
            </div>
          </div>

          <!-- 2. CHILDREN ITEMS OF DOCUMENT -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.78rem; font-weight: 800; color: #be123c; text-transform: uppercase; letter-spacing: 0.4px;">
                <i class="ri-git-commit-line"></i> 2. Children Items in Voucher
              </span>
              <button type="button" id="btn-edit-add-stkout-child" class="btn btn-sm btn-outline-danger" style="padding: 0.2rem 0.65rem; font-size: 0.76rem;">
                <i class="ri-add-line"></i> Add Child Item
              </button>
            </div>

            <div style="max-height: 230px; overflow-y: auto; border: 1px solid #fecaca; border-radius: 8px;">
              <table class="custom-table" style="margin: 0; font-size: 0.84rem; width: 100%; table-layout: fixed;">
                <thead style="position: sticky; top: 0; background: #fff5f5; z-index: 2;">
                  <tr>
                    <th style="width: 38%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Child Medicine</th>
                    <th style="width: 26%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Batch / Lot #</th>
                    <th style="width: 16%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Qty Deducted *</th>
                    <th style="width: 16%; white-space: nowrap; text-align: left; padding: 0.7rem 0.6rem;">Unit Cost (₱)</th>
                    <th style="width: 44px; text-align: center; padding: 0.7rem 0.3rem;"></th>
                  </tr>
                </thead>
                <tbody id="edit-stkout-children-tbody">
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ri-save-line"></i> Save Voucher & Children',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      didOpen: () => {
        const tbody = document.getElementById('edit-stkout-children-tbody');
        const addBtn = document.getElementById('btn-edit-add-stkout-child');

        const addChildRow = (item = null) => {
          const tr = document.createElement('tr');
          tr.className = 'edit-stkout-child-row';
          const selectedProdId = item ? Number(item.product_id ?? item.productId ?? 0) : (products[0]?.id || 0);
          const itemName = item ? (item.product_name || item.name || '') : (products[0]?.name || '');
          const batchVal = item ? (item.batch_no || item.batchNo || '') : '';
          const qtyVal = item ? Number(item.quantity ?? item.qty ?? 1) : 1;
          const costVal = item ? Number(item.cost_price ?? item.costPrice ?? 0) : Number(products[0]?.costPrice ?? 0);

          const prodOpts = products.length > 0
            ? products.map(p => `<option value="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-cost="${p.costPrice || 0}" data-batch="${p.batchNo || ''}" ${Number(p.id) === selectedProdId ? 'selected' : ''}>${p.name}</option>`).join('')
            : `<option value="${selectedProdId}" data-name="${itemName.replace(/"/g, '&quot;')}" selected>${itemName}</option>`;

          tr.innerHTML = `
            <td>
              <select class="swal2-select edit-child-prod" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem;">
                ${prodOpts}
              </select>
            </td>
            <td>
              <input type="text" class="swal2-input edit-child-batch" value="${batchVal}" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem;">
            </td>
            <td>
              <input type="number" class="swal2-input edit-child-qty" value="${qtyVal}" min="1" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem; font-weight: bold; color: #ef4444;">
            </td>
            <td>
              <input type="number" class="swal2-input edit-child-cost" value="${costVal.toFixed(2)}" step="0.01" style="width: 100%; margin: 0; height: 32px; font-size: 0.78rem;">
            </td>
            <td style="text-align: center;">
              <button type="button" class="btn btn-sm btn-outline-danger edit-child-del" style="padding: 0.15rem 0.35rem;">
                <i class="ri-delete-bin-line"></i>
              </button>
            </td>
          `;

          const prodSel = tr.querySelector('.edit-child-prod');
          prodSel.addEventListener('change', () => {
            const opt = prodSel.options[prodSel.selectedIndex];
            if (opt) {
              tr.querySelector('.edit-child-cost').value = parseFloat(opt.getAttribute('data-cost') || 0).toFixed(2);
              tr.querySelector('.edit-child-batch').value = opt.getAttribute('data-batch') || '';
            }
          });

          tr.querySelector('.edit-child-del').addEventListener('click', () => {
            if (tbody.querySelectorAll('.edit-stkout-child-row').length > 1) {
              tr.remove();
            } else {
              Swal.showValidationMessage('Parent voucher must keep at least 1 child item.');
            }
          });

          tbody.appendChild(tr);
        };

        if (existingItems.length > 0) {
          existingItems.forEach(it => addChildRow(it));
        } else {
          addChildRow();
        }

        addBtn.addEventListener('click', () => addChildRow());
      },
      preConfirm: () => {
        const refNo = document.getElementById('edit-stockout-ref').value.trim();
        const reason = document.getElementById('edit-stockout-reason').value;
        const date = document.getElementById('edit-stockout-date').value;
        const authorizedBy = document.getElementById('edit-stockout-authorizer').value.trim();
        const notes = document.getElementById('edit-stockout-notes').value.trim();

        if (!refNo) {
          Swal.showValidationMessage('Voucher reference number is required');
          return false;
        }

        const items = [];
        const rows = document.querySelectorAll('.edit-stkout-child-row');
        for (const r of rows) {
          const sel = r.querySelector('.edit-child-prod');
          const opt = sel.options[sel.selectedIndex];
          const productId = parseInt(sel.value) || 0;
          const name = opt ? (opt.getAttribute('data-name') || opt.text) : '';
          const batchNo = r.querySelector('.edit-child-batch').value.trim();
          const qty = parseInt(r.querySelector('.edit-child-qty').value) || 0;
          const costPrice = parseFloat(r.querySelector('.edit-child-cost').value) || 0;

          if (qty <= 0) {
            Swal.showValidationMessage('All children items must have a quantity greater than 0.');
            return false;
          }
          items.push({ productId, product_id: productId, name, product_name: name, qty, quantity: qty, costPrice, cost_price: costPrice, batchNo, batch_no: batchNo });
        }

        return { refNo, ref_no: refNo, reason, date, authorizedBy, authorized_by: authorizedBy, notes, remarks: notes, items };
      }
    });
  },

  // Supplier Add / Edit Modal
  async showSupplierModal(supplier = null) {
    if (!this.canOpenModal('supplier')) return { isConfirmed: false, isDismissed: true };

    const isEdit = !!supplier;
    const contactVal = supplier?.contact_person || supplier?.contact || '';
    const phoneVal = supplier?.phone || supplier?.contact_number || '';
    const emailVal = supplier?.email || '';
    const addrVal = supplier?.address || '';
    const activePosVal = Number(supplier?.active_pos ?? supplier?.activePOs ?? 0);

    return Swal.fire({
      title: isEdit ? '🏢 Edit Supplier / Distributor' : '🏢 Register New Supplier',
      width: '880px',
      html: `
        <div style="text-align: left; padding: 0.25rem 0;">
          <div style="margin-bottom: 0.85rem;">
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.35rem;">
              Distributor / Company Name <span style="color:#ef4444;">*</span>
            </label>
            <input type="text" id="swal-supplier-name" class="swal2-input" placeholder="e.g. Unilab Distribution Phils" value="${supplier?.name ? String(supplier.name).replace(/"/g, '&quot;') : ''}" style="width: 100%; margin: 0; height: 40px; font-size: 0.9rem;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.85rem;">
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.35rem;">
                Contact Person / Representative
              </label>
              <input type="text" id="swal-supplier-contact" class="swal2-input" placeholder="e.g. Mr. Ramon Garcia" value="${String(contactVal).replace(/"/g, '&quot;')}" style="width: 100%; margin: 0; height: 40px; font-size: 0.9rem;">
            </div>
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.35rem;">
                Phone / Hotline
              </label>
              <input type="text" id="swal-supplier-phone" class="swal2-input" placeholder="e.g. 0917-123-4567" value="${String(phoneVal).replace(/"/g, '&quot;')}" style="width: 100%; margin: 0; height: 40px; font-size: 0.9rem;">
            </div>
          </div>

          <div style="margin-bottom: 0.85rem;">
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.35rem;">
              Official Email Address
            </label>
            <input type="email" id="swal-supplier-email" class="swal2-input" placeholder="e.g. orders@distributor.com.ph" value="${String(emailVal).replace(/"/g, '&quot;')}" style="width: 100%; margin: 0; height: 40px; font-size: 0.9rem;">
          </div>

          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.35rem;">
              Office / Warehouse Address
            </label>
            <textarea id="swal-supplier-address" class="swal2-textarea" placeholder="e.g. 66 United St, Mandaluyong City, Metro Manila" style="width: 100%; margin: 0; min-height: 68px; resize: vertical; border-radius: 8px; font-size: 0.88rem; padding: 0.5rem 0.75rem;">${String(addrVal).replace(/</g, '&lt;')}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: isEdit ? '<i class="ri-save-line"></i> Save Changes' : '<i class="ri-check-line"></i> Register Supplier',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#00a896',
      focusConfirm: false,
      didOpen: () => {
        const nameInput = document.getElementById('swal-supplier-name');
        if (nameInput) nameInput.focus();
      },
      preConfirm: () => {
        const name = document.getElementById('swal-supplier-name').value.trim();
        const contact_person = document.getElementById('swal-supplier-contact').value.trim();
        const phone = document.getElementById('swal-supplier-phone').value.trim();
        const email = document.getElementById('swal-supplier-email').value.trim();
        const active_pos = Number(supplier?.active_pos ?? 0);
        const address = document.getElementById('swal-supplier-address').value.trim();

        if (!name) {
          Swal.showValidationMessage('Distributor / Company Name is required.');
          return false;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Please enter a valid email address.');
          return false;
        }

        return { name, contact_person, phone, email, address, active_pos };
      }
    });
  }
};

window.SwalHelpers = SwalHelpers;


