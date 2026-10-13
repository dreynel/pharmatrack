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

  // Payment Confirmation Modal for POS
  async showPaymentModal(cartItems, subtotal, discountPercent = 0) {
    const discountAmount = (subtotal * discountPercent) / 100;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const htmlContent = `
      <div style="text-align: left; padding: 0.5rem 0;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.1rem; margin-bottom: 1.1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem; color: #64748b;">
            <span>Subtotal:</span>
            <span style="font-weight: 700; color: #0f172a;">₱${subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem; color: #f59e0b;">
            <span>Discount (${discountPercent}%):</span>
            <span style="font-weight: 700;">-₱${discountAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.35rem; font-weight: 800; color: #00a896; border-top: 1px dashed #cbd5e1; padding-top: 0.75rem; margin-top: 0.5rem;">
            <span>TOTAL DUE:</span>
            <span>₱${finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.1rem;">
          <label style="color: #475569; font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 0.4rem;">Payment Method:</label>
          <select id="swal-payment-method" class="swal2-select" style="width: 100%; margin: 0; padding: 0.65rem; min-height: 44px; border-radius: 8px;">
            <option value="Cash">Cash Payment</option>
            <option value="GCash">GCash / E-Wallet</option>
            <option value="Maya">Maya</option>
            <option value="Credit Card">Credit / Debit Card</option>
          </select>
        </div>

        <div class="form-group">
          <label style="color: #475569; font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 0.4rem;">Amount Tendered (₱):</label>
          <input type="number" id="swal-amount-paid" class="swal2-input" placeholder="e.g. 500" value="${Math.ceil(finalTotal)}" step="0.01" style="width: 100%; margin: 0; padding: 0.65rem; font-size: 1.25rem; font-weight: 800; min-height: 44px; border-radius: 8px;">
        </div>

        <div id="change-preview" style="margin-top: 0.85rem; text-align: right; font-size: 1.15rem; font-weight: 800; color: #10b981;">
          Change: ₱0.00
        </div>
      </div>
    `;

    return Swal.fire({
      title: '🛒 Complete Transaction',
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
      },
      preConfirm: () => {
        const paymentMethod = document.getElementById('swal-payment-method').value;
        const amountPaid = parseFloat(document.getElementById('swal-amount-paid').value) || 0;

        if (amountPaid < finalTotal) {
          Swal.showValidationMessage(`Amount tendered must be at least ₱${finalTotal.toFixed(2)}`);
          return false;
        }

        return {
          paymentMethod,
          amountPaid,
          change: amountPaid - finalTotal,
          subtotal,
          discount: discountAmount,
          total: finalTotal
        };
      }
    });
  },

  // Printable Receipt Modal
  showReceiptModal(txn) {
    const itemsHtml = txn.items.map(item => `
      <tr>
        <td style="padding: 4px 0;">${item.name}</td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right;">₱${item.price.toFixed(2)}</td>
        <td style="text-align: right;">₱${(item.qty * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    const receiptHtml = `
      <div class="receipt-box">
        <div class="receipt-header">
          <h2>XYRA ANDREA PHARMACY</h2>
          <p style="margin: 0; font-size: 0.75rem;">123 Healthcare Ave, Metro Manila</p>
          <p style="margin: 0; font-size: 0.75rem;">VAT Reg TIN: 000-123-456-000</p>
          <p style="margin: 6px 0 0; font-weight: bold; color: #00a896;">OFFICIAL RECEIPT</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 8px;">
          <span>OR #: <strong>${txn.id}</strong></span>
          <span>${txn.timestamp}</span>
        </div>
        <div style="font-size: 0.75rem; margin-bottom: 10px;">
          <span>Cashier: ${txn.cashier}</span>
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th style="text-align: center;">QTY</th>
              <th style="text-align: right;">PRICE</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #666; padding-top: 6px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₱${txn.subtotal.toFixed(2)}</span>
          </div>
          ${txn.discount > 0 ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Discount:</span>
            <span>-₱${txn.discount.toFixed(2)}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.95rem; margin-top: 4px; color: #00a896;">
            <span>TOTAL PAID:</span>
            <span>₱${txn.total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Payment Method (${txn.paymentMethod}):</span>
            <span>₱${txn.amountPaid.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Change:</span>
            <span>₱${txn.change.toFixed(2)}</span>
          </div>
        </div>

        <div class="receipt-footer">
          <p>Thank you for choosing Xyra Andrea Pharmacy!</p>
          <p>Get Well Soon! Please keep this receipt for returns.</p>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Receipt Preview',
      html: receiptHtml,
      width: '420px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-printer-line"></i> Print Receipt',
      cancelButtonText: 'Close'
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
      }
    });
  },

  // Modal to Add New Product
  async showAddProductModal() {
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
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Category *</label>
            <select id="new-prod-cat" class="swal2-select" style="width:100%; margin:0.3rem 0 0.8rem;">
              <option value="Analgesics">Analgesics</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Vitamins & Supplements">Vitamins & Supplements</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Antihistamines">Antihistamines</option>
              <option value="First Aid">First Aid</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Unit of Measure (UOM) *</label>
            <select id="new-prod-uom" class="swal2-select" style="width:100%; margin:0.3rem 0 0.8rem;">
              <option value="Tablet">Tablet (pc)</option>
              <option value="Capsule">Capsule (pc)</option>
              <option value="Box (100s)">Box (100s)</option>
              <option value="Box (50s)">Box (50s)</option>
              <option value="Strip">Strip</option>
              <option value="Bottle">Bottle</option>
              <option value="Tube">Tube</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Batch Number *</label>
            <input type="text" id="new-prod-batch" class="swal2-input" placeholder="B-2026-999" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Expiry Date *</label>
            <input type="date" id="new-prod-expiry" class="swal2-input" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Selling Price (₱) *</label>
            <input type="number" id="new-prod-price" class="swal2-input" placeholder="10.00" step="0.5" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Cost Price (₱)</label>
            <input type="number" id="new-prod-cost" class="swal2-input" placeholder="6.00" step="0.5" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Initial Stock *</label>
            <input type="number" id="new-prod-stock" class="swal2-input" placeholder="100" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Reorder Point *</label>
            <input type="number" id="new-prod-reorder" class="swal2-input" placeholder="30" style="width:100%; margin:0.3rem 0 0.8rem;">
          </div>
        </div>
      </div>
    `;

    return Swal.fire({
      title: '💊 Register New Medicine',
      html: htmlContent,
      width: '560px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-check-line"></i> Save Product',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const name = document.getElementById('new-prod-name').value.trim();
        const genericName = document.getElementById('new-prod-generic').value.trim();
        const category = document.getElementById('new-prod-cat').value;
        const uom = document.getElementById('new-prod-uom').value;
        const batchNo = document.getElementById('new-prod-batch').value.trim();
        const unitPrice = parseFloat(document.getElementById('new-prod-price').value);
        const costPrice = parseFloat(document.getElementById('new-prod-cost').value) || (unitPrice * 0.65);
        const stock = parseInt(document.getElementById('new-prod-stock').value);
        const reorderPoint = parseInt(document.getElementById('new-prod-reorder').value);
        const expiryDate = document.getElementById('new-prod-expiry').value;

        if (!name || isNaN(unitPrice) || isNaN(stock) || !expiryDate || !batchNo) {
          Swal.showValidationMessage('Please fill in all required fields (*)');
          return false;
        }

        return { name, genericName, category, uom, batchNo, unitPrice, costPrice, stock, reorderPoint, expiryDate };
      }
    });
  },

  // Modal to Quick Restock
  async showRestockModal(product) {
    return Swal.fire({
      title: `📦 Quick Restock Item`,
      html: `
        <div style="text-align: left;">
          <div style="background: #f1f5f9; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
            <p style="margin-bottom: 0.3rem; font-weight: 700; color: #0f172a;">${product.name}</p>
            <p style="color: #64748b; font-size: 0.85rem; margin: 0;">Current Stock: <strong style="color: #00a896;">${product.stock} ${product.uom || 'units'}</strong> | Batch: <code>${product.batchNo}</code></p>
          </div>
          
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Quantity to Add (${product.uom || 'units'}):</label>
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
    const suppliersOptions = suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    const productsOptions = products.map(p => `
      <option value="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-cost="${p.costPrice || 0}" data-batch="${p.batchNo || ''}" data-exp="${p.expiryDate || ''}" data-stock="${p.stock}" data-uom="${p.uom || 'units'}">
        ${p.name} [${p.uom || 'units'}] - Current: ${p.stock}
      </option>
    `).join('');

    const defaultDR = 'DR-' + Math.floor(100000 + Math.random() * 900000);
    const today = new Date().toISOString().split('T')[0];

    const htmlContent = `
      <div style="text-align: left;">
        <!-- PARENT HEADER: TRANSACTION & VENDOR INFORMATION -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.9rem; border: 1px solid #e2e8f0; border-left: 4px solid var(--primary);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.6rem;">
            <div class="form-group">
              <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Distributor / Supplier *</label>
              <select id="stkin-supplier" class="swal2-select" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem;">
                ${suppliersOptions}
                <option value="Direct Laboratory Purchase">Direct Laboratory Purchase</option>
                <option value="Local Wholesale Depot">Local Wholesale Depot</option>
              </select>
            </div>
            <div class="form-group">
              <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Delivery Receipt (DR) / Inv # *</label>
              <input type="text" id="stkin-refno" class="swal2-input" value="${defaultDR}" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem; font-weight: bold; color: var(--primary);">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Receiving Date *</label>
              <input type="date" id="stkin-date" class="swal2-input" value="${today}" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem;">
            </div>
            <div class="form-group">
              <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Received By (Staff) *</label>
              <input type="text" id="stkin-receiver" class="swal2-input" value="Xyra Andrea (Pharmacist)" style="width: 100%; margin: 0.2rem 0; height: 38px; font-size: 0.85rem;">
            </div>
          </div>
        </div>

        <!-- CHILDREN DETAILS: DYNAMIC MEDICINE ITEMS -->
        <div style="margin-bottom: 0.8rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-weight: 800; color: #00a896; font-size: 0.88rem;">
              <i class="ri-medicine-bottle-line"></i> Delivered Medicine Line Items
            </label>
            <button type="button" id="btn-add-stkin-row" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.7rem; font-size: 0.78rem;">
              <i class="ri-add-line"></i> Add Medicine Line
            </button>
          </div>

          <div style="max-height: 260px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table class="custom-table" style="margin: 0; font-size: 0.8rem;">
              <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 3;">
                <tr>
                  <th style="min-width: 170px;">Medicine</th>
                  <th style="min-width: 105px;">Batch / Lot #</th>
                  <th style="min-width: 115px;">Expiry Date</th>
                  <th style="min-width: 75px;">Qty</th>
                  <th style="min-width: 85px;">Unit Cost</th>
                  <th style="min-width: 90px; text-align: right;">Subtotal</th>
                  <th style="width: 36px; text-align: center;"></th>
                </tr>
              </thead>
              <tbody id="stkin-items-tbody">
                <!-- Line items inserted here dynamically -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- PARENT TOTALS & NOTES -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #e6fffa; border: 1px solid #b2f5ea; padding: 0.65rem 0.9rem; border-radius: 8px; margin-bottom: 0.75rem;">
          <div>
            <span style="font-size: 0.82rem; color: #234e52; font-weight: 600;">Total Line Items:</span>
            <strong id="stkin-items-count" style="color: #00a896; margin-left: 0.3rem;">1</strong>
          </div>
          <div>
            <span style="font-size: 0.82rem; color: #234e52; font-weight: 600;">Total Delivery Cost:</span>
            <span id="stkin-grand-total" style="font-size: 1.2rem; font-weight: 800; color: #00a896; margin-left: 0.4rem;">₱0.00</span>
          </div>
        </div>

        <div class="form-group">
          <label style="font-weight: 700; color: #475569; font-size: 0.82rem;">Delivery Notes / Cold Chain Inspection</label>
          <input type="text" id="stkin-notes" class="swal2-input" placeholder="e.g. Verified cold storage temperature compliance, intact package seals" style="width: 100%; margin: 0.2rem 0; height: 36px; font-size: 0.85rem;">
        </div>
      </div>
    `;

    return Swal.fire({
      title: '📥 Receive Shipment (Stock In)',
      html: htmlContent,
      width: '780px',
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
            <td>
              <select class="swal2-select row-prod-select" style="width: 100%; margin: 0; height: 34px; font-size: 0.8rem;">
                ${productsOptions}
              </select>
            </td>
            <td>
              <input type="text" class="swal2-input row-batch" placeholder="Batch #" style="width: 100%; margin: 0; height: 34px; font-size: 0.8rem;">
            </td>
            <td>
              <input type="date" class="swal2-input row-expiry" style="width: 100%; margin: 0; height: 34px; font-size: 0.8rem;">
            </td>
            <td>
              <input type="number" class="swal2-input row-qty" value="50" min="1" style="width: 100%; margin: 0; height: 34px; font-size: 0.8rem; font-weight: bold;">
            </td>
            <td>
              <input type="number" class="swal2-input row-cost" value="0.00" step="0.5" style="width: 100%; margin: 0; height: 34px; font-size: 0.8rem;">
            </td>
            <td style="text-align: right; font-weight: 700; color: #00a896;" class="row-subtotal">
              ₱0.00
            </td>
            <td style="text-align: center;">
              <button type="button" class="btn btn-sm btn-outline row-btn-delete" style="padding: 0.15rem 0.35rem; color: #ef4444; border-color: #ef4444;" title="Remove this line">
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
              batchInput.value = opt.getAttribute('data-batch') || ('B-2026-' + Math.floor(100 + Math.random() * 900));
              expInput.value = opt.getAttribute('data-exp') || '2028-12-31';
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
            Swal.showValidationMessage('Please ensure all medicine lines have valid quantities, unit costs, batch numbers, and expiry dates.');
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
            <table class="custom-table" style="margin: 0; font-size: 0.8rem;">
              <thead style="position: sticky; top: 0; background: #fff5f5; z-index: 3;">
                <tr>
                  <th style="min-width: 220px;">Medicine</th>
                  <th style="min-width: 110px;">Batch #</th>
                  <th style="min-width: 90px;">Available</th>
                  <th style="min-width: 100px;">Qty to Deduct</th>
                  <th style="width: 36px; text-align: center;"></th>
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
      width: '740px',
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
              <code class="row-batch-code" style="font-size: 0.78rem;">-</code>
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
          const batchCode = tr.querySelector('.row-batch-code');
          const stockBadge = tr.querySelector('.row-stock-badge');
          const qtyInput = tr.querySelector('.row-qty');
          const delBtn = tr.querySelector('.row-btn-delete');

          const syncDefaults = () => {
            const opt = prodSelect.options[prodSelect.selectedIndex];
            if (opt) {
              const stock = parseInt(opt.getAttribute('data-stock') || 0);
              const uom = opt.getAttribute('data-uom') || 'units';
              const batch = opt.getAttribute('data-batch') || 'N/A';
              batchCode.innerText = batch;
              stockBadge.innerText = `${stock} ${uom}`;
              qtyInput.max = stock;
              calculateTotals();
            }
          };

          prodSelect.addEventListener('change', syncDefaults);
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
          const opt = prodSelect.options[prodSelect.selectedIndex];
          const productId = parseInt(prodSelect.value);
          const name = opt.getAttribute('data-name') || opt.text.split(' [')[0];
          const availableStock = parseInt(opt.getAttribute('data-stock') || 0);
          const costPrice = parseFloat(opt.getAttribute('data-cost') || 0);
          const batchNo = opt.getAttribute('data-batch') || 'N/A';
          const qty = parseInt(row.querySelector('.row-qty').value);

          if (isNaN(qty) || qty <= 0) {
            Swal.showValidationMessage(`Please enter a valid deduction quantity for ${name}.`);
            return false;
          }

          if (qty > availableStock) {
            Swal.showValidationMessage(`Cannot deduct ${qty} units of ${name}. Only ${availableStock} units available.`);
            return false;
          }

          items.push({
            productId,
            name,
            qty,
            costPrice,
            batchNo
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
  // Item Conversion Modal
  async showItemConversionModal(allProducts, preselectedSourceId = null) {
    const bulkProducts = allProducts.filter(p => p.isBulk || (p.uom && p.uom.toLowerCase().includes('box')) || p.childProductId);
    const retailProducts = allProducts.filter(p => !p.isBulk);

    if (bulkProducts.length === 0) {
      Swal.fire('No Bulk Inventory', 'There are no bulk packaging items available for conversion.', 'info');
      return null;
    }

    const sourceOptions = bulkProducts.map(b => {
      const selected = preselectedSourceId && b.id === parseInt(preselectedSourceId) ? 'selected' : '';
      return `<option value="${b.id}" data-stock="${b.stock}" data-uom="${b.uom}" data-rate="${b.conversionRate || 100}" data-child="${b.childProductId || ''}" data-cost="${b.costPrice}" data-batch="${b.batchNo}" data-exp="${b.expiryDate}" ${selected}>
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
            Unboxes bulk stock (Cartons/Boxes) into retail dispensing units (Tablets/Capsules/Strips). Automatically retains batch traceability, expiry dates, and recalculates unit cost.
          </p>
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Select Source Bulk Item (To Unbox) *</label>
          <select id="conv-source-select" class="swal2-select" style="width: 100%; margin: 0.2rem 0;">
            ${sourceOptions}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Select Target Retail Item (To Add) *</label>
          <select id="conv-target-select" class="swal2-select" style="width: 100%; margin: 0.2rem 0;">
            ${targetOptions}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.85rem;">
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Bulk Units to Convert *</label>
            <input type="number" id="conv-qty-input" class="swal2-input" value="1" min="1" style="width: 100%; margin: 0.2rem 0; font-size: 1.15rem; font-weight: bold; color: #00a896;">
          </div>
          <div class="form-group">
            <label style="font-weight: 700; color: #475569; font-size: 0.85rem;">Conversion Multiplier (Rate)</label>
            <input type="number" id="conv-rate-input" class="swal2-input" value="100" min="1" style="width: 100%; margin: 0.2rem 0; font-weight: bold;">
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
              <div id="conv-preview-target" style="font-size: 1.15rem; font-weight: 800; color: #10b981;">+100 Tablets</div>
            </div>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 0.6rem; font-size: 0.82rem; color: #475569; display: flex; flex-direction: column; gap: 0.3rem;">
            <div style="display: flex; justify-content: space-between;">
              <span>Batch & Expiry Traceability:</span>
              <span><code id="conv-preview-batch">B-2024-098</code> (<span id="conv-preview-exp">2027-11-15</span>)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Recalculated Retail Cost:</span>
              <strong id="conv-preview-cost" style="color: #00a896;">₱4.20 / pc</strong>
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
      width: '620px',
      showCancelButton: true,
      confirmButtonText: '<i class="ri-swap-line"></i> Confirm Conversion',
      confirmButtonColor: '#00a896',
      cancelButtonText: 'Cancel',
      didOpen: () => {
        const sourceSelect = document.getElementById('conv-source-select');
        const targetSelect = document.getElementById('conv-target-select');
        const qtyInput = document.getElementById('conv-qty-input');
        const rateInput = document.getElementById('conv-rate-input');

        const previewSource = document.getElementById('conv-preview-source');
        const previewTarget = document.getElementById('conv-preview-target');
        const previewBatch = document.getElementById('conv-preview-batch');
        const previewExp = document.getElementById('conv-preview-exp');
        const previewCost = document.getElementById('conv-preview-cost');

        const syncSourceToTarget = () => {
          const selectedSource = sourceSelect.options[sourceSelect.selectedIndex];
          if (!selectedSource) return;

          const childId = selectedSource.getAttribute('data-child');
          const rate = parseInt(selectedSource.getAttribute('data-rate') || 100);
          rateInput.value = rate;

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

        const updateLiveConversionMath = () => {
          const selectedSource = sourceSelect.options[sourceSelect.selectedIndex];
          const selectedTarget = targetSelect.options[targetSelect.selectedIndex];
          if (!selectedSource || !selectedTarget) return;

          const sourceUom = selectedSource.getAttribute('data-uom') || 'Box';
          const targetUom = selectedTarget.getAttribute('data-uom') || 'Tablet';
          const sourceCost = parseFloat(selectedSource.getAttribute('data-cost') || 0);
          const batch = selectedSource.getAttribute('data-batch') || 'N/A';
          const exp = selectedSource.getAttribute('data-exp') || 'N/A';
          const maxStock = parseInt(selectedSource.getAttribute('data-stock') || 0);

          const convQty = parseInt(qtyInput.value) || 0;
          const rate = parseInt(rateInput.value) || 100;
          const targetResultQty = convQty * rate;

          previewSource.innerText = `-${convQty} ${sourceUom}`;
          previewTarget.innerText = `+${targetResultQty} ${targetUom}`;
          previewBatch.innerText = batch;
          previewExp.innerText = exp;

          const costPerUnit = rate > 0 ? (sourceCost / rate).toFixed(2) : '0.00';
          previewCost.innerText = `₱${costPerUnit} / ${targetUom}`;

          if (convQty > maxStock) {
            previewSource.style.color = '#dc2626';
            previewSource.innerHTML += `<br><small style="font-size:0.7rem;">(Only ${maxStock} in stock!)</small>`;
          } else {
            previewSource.style.color = '#ef4444';
          }
        };

        sourceSelect.addEventListener('change', syncSourceToTarget);
        targetSelect.addEventListener('change', updateLiveConversionMath);
        qtyInput.addEventListener('input', updateLiveConversionMath);
        rateInput.addEventListener('input', updateLiveConversionMath);

        syncSourceToTarget();
      },
      preConfirm: () => {
        const sourceSelect = document.getElementById('conv-source-select');
        const targetSelect = document.getElementById('conv-target-select');
        const sourceProdId = parseInt(sourceSelect.value);
        const targetProdId = parseInt(targetSelect.value);
        const sourceQty = parseInt(document.getElementById('conv-qty-input').value);
        const operator = document.getElementById('conv-operator').value.trim();
        const notes = document.getElementById('conv-notes').value.trim();

        const selectedSource = sourceSelect.options[sourceSelect.selectedIndex];
        const maxStock = parseInt(selectedSource.getAttribute('data-stock') || 0);

        if (sourceProdId === targetProdId) {
          Swal.showValidationMessage('Source item and target item cannot be the same product.');
          return false;
        }

        if (isNaN(sourceQty) || sourceQty <= 0) {
          Swal.showValidationMessage('Please enter a valid conversion quantity (at least 1).');
          return false;
        }

        if (sourceQty > maxStock) {
          Swal.showValidationMessage(`Cannot convert ${sourceQty} units. Only ${maxStock} units available in stock.`);
          return false;
        }

        return {
          sourceProductId: sourceProdId,
          targetProductId: targetProdId,
          sourceQty,
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
            <span style="font-size: 0.88rem; color: #0f172a; font-weight: 700;">Date: ${stockIn.date}</span><br>
            <small style="color: #64748b;">Received By: <strong>${stockIn.receivedBy}</strong></small>
          </div>
        </div>

        <table class="custom-table" style="font-size: 0.84rem; margin-bottom: 0.9rem;">
          <thead>
            <tr>
              <th>Delivered Medicine</th>
              <th>Batch #</th>
              <th>Expiry Date</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Cost</th>
              <th style="text-align: right;">Subtotal</th>
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
      width: '720px',
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
            <span style="font-size: 0.88rem; color: #0f172a; font-weight: 700;">Date: ${stockOut.date}</span><br>
            <small style="color: #64748b;">Authorized By: <strong>${stockOut.authorizedBy}</strong></small>
          </div>
        </div>

        <table class="custom-table" style="font-size: 0.84rem; margin-bottom: 0.9rem;">
          <thead>
            <tr>
              <th>Deducted Medicine</th>
              <th>Batch #</th>
              <th style="text-align: center;">Qty Pulled</th>
              <th style="text-align: right;">Unit Cost</th>
              <th style="text-align: right;">Loss Value</th>
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
      width: '720px',
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
  async showGeneratePOModal(forecastItem) {
    const { product, suggestedReorder, forecast30 } = forecastItem;

    return Swal.fire({
      title: '📈 Demand-Based Purchase Order',
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <div style="background: rgba(0, 168, 150, 0.08); border: 1px solid rgba(0,168,150,0.25); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <h4 style="color: #00a896; margin-bottom: 0.3rem;">${product.name}</h4>
            <p style="color: #64748b; margin: 0;">Current Stock: ${product.stock} ${product.uom || 'units'} | 30-Day Forecasted Demand: <strong>${forecast30} units</strong></p>
          </div>

          <div class="form-group" style="margin-bottom: 0.8rem;">
            <label style="color: #475569; font-weight: 700; display: block;">Select Distributor / Supplier:</label>
            <select id="po-supplier" class="swal2-select" style="width: 100%; margin: 0.3rem 0;">
              <option value="Unilab Distribution Phils">Unilab Distribution Phils</option>
              <option value="Pascual Laboratories Inc.">Pascual Laboratories Inc.</option>
              <option value="Zuellig Pharma Philippines">Zuellig Pharma Philippines</option>
            </select>
          </div>

          <div class="form-group">
            <label style="color: #475569; font-weight: 700; display: block;">Recommended Order Quantity:</label>
            <input type="number" id="po-qty" class="swal2-input" value="${suggestedReorder}" style="width: 100%; margin: 0.3rem 0; font-size: 1.1rem; font-weight: bold; color: #00a896;">
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

  // Edit Stock In Parent Modal
  async showEditStockInParentModal(log, suppliers = []) {
    const supplierOptions = (suppliers.length > 0 ? suppliers : [
      { name: 'Unilab Distribution Phils' },
      { name: 'Pascual Laboratories Inc.' },
      { name: 'Zuellig Pharma Philippines' },
      { name: 'Mercury Drug Wholesale' }
    ]).map(s => `
      <option value="${s.name}" ${s.name === log.supplierName ? 'selected' : ''}>${s.name}</option>
    `).join('');

    return Swal.fire({
      title: '✏️ Edit Delivery Receipt (Parent)',
      html: `
        <div style="text-align: left; padding: 0.5rem 0;" class="space-y-3">
          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
              DR / Reference Number:
            </label>
            <input type="text" id="edit-stockin-ref" class="swal2-input" value="${log.refNo || ''}" style="width: 100%; margin: 0; font-family: monospace; font-weight: bold;">
          </div>

          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
              Supplier / Distributor:
            </label>
            <select id="edit-stockin-supplier" class="swal2-select" style="width: 100%; margin: 0; display: block;">
              ${supplierOptions}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
                Date Received:
              </label>
              <input type="date" id="edit-stockin-date" class="swal2-input" value="${log.date || ''}" style="width: 100%; margin: 0;">
            </div>
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
                Received By:
              </label>
              <input type="text" id="edit-stockin-receiver" class="swal2-input" value="${log.receivedBy || ''}" style="width: 100%; margin: 0;">
            </div>
          </div>

          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
              Remarks / Inspection Note:
            </label>
            <input type="text" id="edit-stockin-notes" class="swal2-input" value="${log.remarks || log.notes || ''}" placeholder="e.g. Standard verification passed" style="width: 100%; margin: 0;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ri-save-line"></i> Save Changes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#00a896',
      preConfirm: () => {
        const refNo = document.getElementById('edit-stockin-ref').value.trim();
        const supplierName = document.getElementById('edit-stockin-supplier').value;
        const date = document.getElementById('edit-stockin-date').value;
        const receivedBy = document.getElementById('edit-stockin-receiver').value.trim();
        const notes = document.getElementById('edit-stockin-notes').value.trim();

        if (!refNo) {
          Swal.showValidationMessage('Reference number is required');
          return false;
        }

        return { refNo, supplierName, date, receivedBy, notes, remarks: notes };
      }
    });
  },

  // Edit Stock Out Parent Modal
  async showEditStockOutParentModal(log) {
    const reasons = [
      'Expired Medicine Disposal',
      'Damaged / Broken Goods Write-off',
      'Clinic / Internal Medical Use',
      'Supplier Return (RTV)',
      'Inventory Audit Write-off'
    ];

    const reasonOptions = reasons.map(r => `
      <option value="${r}" ${r === log.reason ? 'selected' : ''}>${r}</option>
    `).join('');

    return Swal.fire({
      title: '✏️ Edit Disposal Voucher (Parent)',
      html: `
        <div style="text-align: left; padding: 0.5rem 0;" class="space-y-3">
          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
              Voucher Reference Number:
            </label>
            <input type="text" id="edit-stockout-ref" class="swal2-input" value="${log.refNo || ''}" style="width: 100%; margin: 0; font-family: monospace; font-weight: bold; color: #ef4444;">
          </div>

          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
              Deduction Reason:
            </label>
            <select id="edit-stockout-reason" class="swal2-select" style="width: 100%; margin: 0; display: block;">
              ${reasonOptions}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
                Date Authorized:
              </label>
              <input type="date" id="edit-stockout-date" class="swal2-input" value="${log.date || ''}" style="width: 100%; margin: 0;">
            </div>
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
                Authorized Pharmacist:
              </label>
              <input type="text" id="edit-stockout-authorizer" class="swal2-input" value="${log.authorizedBy || ''}" style="width: 100%; margin: 0;">
            </div>
          </div>

          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">
              Audit Notes / Protocol:
            </label>
            <input type="text" id="edit-stockout-notes" class="swal2-input" value="${log.remarks || log.notes || ''}" placeholder="e.g. Conduct per GPP & FDA regulations" style="width: 100%; margin: 0;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ri-save-line"></i> Save Changes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
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

        return { refNo, reason, date, authorizedBy, notes, remarks: notes };
      }
    });
  },

  // Supplier Add / Edit Modal
  async showSupplierModal(supplier = null) {
    const isEdit = !!supplier;
    return Swal.fire({
      title: isEdit ? '🏢 Edit Supplier / Distributor' : '🏢 Register New Supplier',
      html: `
        <div style="text-align: left; padding: 0.25rem 0;">
          <div style="margin-bottom: 0.85rem;">
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.35rem;">
              Distributor / Company Name <span style="color:#ef4444;">*</span>:
            </label>
            <input type="text" id="swal-supplier-name" class="swal2-input" placeholder="e.g. Unilab Pharmaceuticals Inc." value="${supplier?.name ? supplier.name.replace(/"/g, '&quot;') : ''}" style="width: 100%; margin: 0; min-height: 42px;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.85rem;">
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.35rem;">
                Contact Person / Rep:
              </label>
              <input type="text" id="swal-supplier-contact" class="swal2-input" placeholder="e.g. Maria Santos" value="${supplier?.contact_person ? supplier.contact_person.replace(/"/g, '&quot;') : ''}" style="width: 100%; margin: 0; min-height: 42px;">
            </div>
            <div>
              <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.35rem;">
                Phone / Hotline:
              </label>
              <input type="text" id="swal-supplier-phone" class="swal2-input" placeholder="e.g. +63 917 123 4567" value="${supplier?.phone ? supplier.phone.replace(/"/g, '&quot;') : ''}" style="width: 100%; margin: 0; min-height: 42px;">
            </div>
          </div>

          <div style="margin-bottom: 0.85rem;">
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.35rem;">
              Email Address:
            </label>
            <input type="email" id="swal-supplier-email" class="swal2-input" placeholder="e.g. orders@distributor.ph" value="${supplier?.email ? supplier.email.replace(/"/g, '&quot;') : ''}" style="width: 100%; margin: 0; min-height: 42px;">
          </div>

          <div>
            <label style="display:block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.35rem;">
              Office / Warehouse Address:
            </label>
            <textarea id="swal-supplier-address" class="swal2-textarea" placeholder="e.g. 66 United St, Mandaluyong, Metro Manila" style="width: 100%; margin: 0; min-height: 70px; resize: vertical; border-radius: 8px; font-size: 0.9rem; padding: 0.5rem 0.75rem;">${supplier?.address ? supplier.address.replace(/</g, '&lt;') : ''}</textarea>
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
        const address = document.getElementById('swal-supplier-address').value.trim();

        if (!name) {
          Swal.showValidationMessage('Distributor / Company Name is required.');
          return false;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Please enter a valid email address.');
          return false;
        }

        return { name, contact_person, phone, email, address };
      }
    });
  }
};

window.SwalHelpers = SwalHelpers;


