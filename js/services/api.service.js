/**
 * PharmaTrack - Real API Client Service Layer
 * Interacts with Native PHP & MySQL Backend
 * Works seamlessly on both `php -S localhost:8001` and XAMPP (`http://localhost/pharmatrack`)
 * Custom Designed for Xyra Andrea Pharmacy
 */

class ApiService {
  constructor() {
    this.baseUrl = this.determineBaseUrl();
  }

  determineBaseUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    // Relative path to physical PHP gateway works on BOTH `php -S localhost:8001`
    // and Apache subdirectories (`http://localhost/pharmatrack/` or `/PharmaTrack/`)
    return 'api/index.php';
  }

  async request(endpoint, options = {}) {
    const [pathPart, queryPart] = endpoint.split('?');
    const cleanPath = pathPart.startsWith('/') ? pathPart : '/' + pathPart;
    const url = `${this.baseUrl}?endpoint=${encodeURIComponent(cleanPath)}${queryPart ? '&' + queryPart : ''}`;

    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Grab CSRF token if present
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      defaultHeaders['X-CSRF-TOKEN'] = csrfToken;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      let data = {};
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = {};
      }

      if (!response.ok) {
        // If 401, return authentication status object instead of throwing
        if (response.status === 401) {
          return { success: false, authenticated: false, user: null, error: data.error || 'Unauthorized' };
        }
        const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      if (endpoint !== '/auth/me') {
        console.error(`API Error on [${options.method || 'GET'}] ${url}:`, err);
      }
      throw err;
    }
  }

  async get(endpoint, params = {}) {
    let url = endpoint;
    const query = new URLSearchParams(params).toString();
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ---- Endpoints Implementation ----

  // 0. Authentication
  async login(loginInput, password) {
    return this.post('/auth/login', { login: loginInput, password });
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async getAuthUser() {
    return this.get('/auth/me');
  }

  // 1. Products
  async getProducts(params = {}) {
    const res = await this.get('/products', params);
    const list = Array.isArray(res) ? res : (res.data || res.products || []);
    return list.map(p => ({
      ...p,
      id: Number(p.id),
      stock: Number(p.stock ?? 0),
      unitPrice: parseFloat(p.unitPrice ?? p.unit_price ?? 0),
      costPrice: parseFloat(p.costPrice ?? p.cost_price ?? 0),
      reorderPoint: Number(p.reorderPoint ?? p.reorder_point ?? 10),
      genericName: p.genericName ?? p.generic_name ?? '',
      category: p.category ?? p.category_name ?? 'General',
      batchNo: p.batchNo ?? p.batch_no ?? '',
      expiryDate: p.expiryDate ?? p.expiry_date ?? '',
      isBulk: Boolean(p.isBulk ?? Number(p.is_bulk ?? 0)),
      conversionRate: Number(p.conversionRate ?? p.conversion_rate ?? 1),
      childProductId: p.childProductId ?? (p.child_product_id ? Number(p.child_product_id) : null)
    }));
  }

  async getProductById(id) {
    const res = await this.get(`/products/${id}`);
    return res.data || res.product || res;
  }

  async addProduct(productObj) {
    const res = await this.post('/products', productObj);
    return res.product || res.data || res;
  }

  async updateProductStock(productId, addQuantity) {
    const res = await this.post(`/products/${productId}/restock`, { quantity: addQuantity });
    return res.product || res.data || res;
  }

  async updateProduct(id, productObj) {
    const res = await this.put(`/products/${id}`, productObj);
    return res.product || res.data || res;
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  // 1b. Categories
  async getCategories() {
    const res = await this.get('/categories');
    const list = Array.isArray(res) ? res : (res.data || res.categories || []);
    return list.map(c => ({
      id: Number(c.id),
      name: c.name || '',
      description: c.description || '',
      productCount: Number(c.product_count ?? 0)
    }));
  }

  async addCategory(payload) {
    const res = await this.post('/categories', payload);
    return res.category || res.data || res;
  }

  async updateCategory(id, payload) {
    const res = await this.post('/categories', { ...payload, id });
    return res.category || res.data || res;
  }

  async deleteCategory(id) {
    return this.delete(`/categories/${id}`);
  }

  // 1c. Units of Measure (UOM)
  async getUoms() {
    const res = await this.get('/uoms');
    const list = Array.isArray(res) ? res : (res.data || res.uoms || []);
    return list.map(u => ({
      id: Number(u.id),
      name: u.name || '',
      abbreviation: u.abbreviation || '',
      description: u.description || '',
      productCount: Number(u.product_count ?? 0)
    }));
  }

  async addUom(payload) {
    const res = await this.post('/uoms', payload);
    return res.uom || res.data || res;
  }

  async updateUom(id, payload) {
    const res = await this.post('/uoms', { ...payload, id });
    return res.uom || res.data || res;
  }

  async deleteUom(id) {
    return this.delete(`/uoms/${id}`);
  }

  // 2. Transactions & POS
  async getTransactions() {
    const res = await this.get('/transactions');
    const list = Array.isArray(res) ? res : (res.data || res.transactions || res.sales || []);
    return list.map(t => {
      const subtotal = parseFloat(t.subtotal ?? t.total ?? 0);
      const discount = parseFloat(t.discount ?? t.discountAmount ?? t.discount_amount ?? 0);
      const total = parseFloat(t.total ?? 0);
      const amountPaid = parseFloat(t.amountPaid ?? t.amountTendered ?? t.amount_paid ?? t.amount_tendered ?? total);
      const change = parseFloat(t.change ?? t.changeAmount ?? t.change_amount ?? 0);

      const items = Array.isArray(t.items) ? t.items.map(it => ({
        id: Number(it.id || 0),
        productId: Number(it.productId || it.product_id || 0),
        product_id: Number(it.productId || it.product_id || 0),
        name: String(it.name || it.product_name || 'Item'),
        product_name: String(it.name || it.product_name || 'Item'),
        qty: parseInt(it.qty ?? it.quantity ?? 1, 10),
        quantity: parseInt(it.qty ?? it.quantity ?? 1, 10),
        price: parseFloat(it.price ?? it.unit_price ?? 0),
        unit_price: parseFloat(it.price ?? it.unit_price ?? 0),
        batchNo: String(it.batchNo || it.batch_no || ''),
        batch_no: String(it.batchNo || it.batch_no || ''),
        expiryDate: String(it.expiryDate || it.expiry_date || ''),
        expiry_date: String(it.expiryDate || it.expiry_date || ''),
        subtotal: parseFloat(it.subtotal ?? ((it.qty ?? it.quantity ?? 1) * (it.price ?? it.unit_price ?? 0)))
      })) : [];

      return {
        ...t,
        id: String(t.invoice_no || t.id || ''),
        invoice_no: String(t.invoice_no || t.id || ''),
        dbId: Number(t.db_id || t.id || 0),
        sale_id: Number(t.db_id || t.id || 0),
        timestamp: t.timestamp || t.created_at || '',
        created_at: t.timestamp || t.created_at || '',
        cashier: t.cashier || 'Pharmacist',
        customerName: t.customerName || t.customer_name || 'Walk-in Customer',
        customer_name: t.customerName || t.customer_name || 'Walk-in Customer',
        customerType: t.customerType || t.customer_type || 'regular',
        customer_type: t.customerType || t.customer_type || 'regular',
        customer_id_no: t.customer_id_no || '',
        paymentMethod: t.paymentMethod || t.payment_method || 'Cash',
        payment_method: t.paymentMethod || t.payment_method || 'Cash',
        discountType: t.discountType || t.discount_type || 'None',
        discount_type: t.discountType || t.discount_type || 'None',
        discountAmount: discount,
        discount: discount,
        subtotal: subtotal,
        total: total,
        amountTendered: amountPaid,
        amountPaid: amountPaid,
        amount_paid: amountPaid,
        changeAmount: change,
        change: change,
        items: items,
        items_count: items.length
      };
    });
  }

  async getTransactionById(id) {
    const res = await this.get(`/transactions/${encodeURIComponent(id)}`);
    const t = res.sale || res.transaction || res.data || res;
    if (!t || typeof t !== 'object') return null;

    const subtotal = parseFloat(t.subtotal ?? t.total ?? 0);
    const discount = parseFloat(t.discount ?? t.discountAmount ?? t.discount_amount ?? 0);
    const total = parseFloat(t.total ?? 0);
    const amountPaid = parseFloat(t.amountPaid ?? t.amountTendered ?? t.amount_paid ?? t.amount_tendered ?? total);
    const change = parseFloat(t.change ?? t.changeAmount ?? t.change_amount ?? 0);

    const items = Array.isArray(t.items) ? t.items.map(it => ({
      id: Number(it.id || 0),
      productId: Number(it.productId || it.product_id || 0),
      product_id: Number(it.productId || it.product_id || 0),
      name: String(it.name || it.product_name || 'Item'),
      product_name: String(it.name || it.product_name || 'Item'),
      qty: parseInt(it.qty ?? it.quantity ?? 1, 10),
      quantity: parseInt(it.qty ?? it.quantity ?? 1, 10),
      price: parseFloat(it.price ?? it.unit_price ?? 0),
      unit_price: parseFloat(it.price ?? it.unit_price ?? 0),
      batchNo: String(it.batchNo || it.batch_no || ''),
      batch_no: String(it.batchNo || it.batch_no || ''),
      expiryDate: String(it.expiryDate || it.expiry_date || ''),
      expiry_date: String(it.expiryDate || it.expiry_date || ''),
      subtotal: parseFloat(it.subtotal ?? ((it.qty ?? it.quantity ?? 1) * (it.price ?? it.unit_price ?? 0)))
    })) : [];

    return {
      ...t,
      id: String(t.invoice_no || t.id || id),
      invoice_no: String(t.invoice_no || t.id || id),
      dbId: Number(t.db_id || t.id || 0),
      sale_id: Number(t.db_id || t.id || 0),
      timestamp: t.timestamp || t.created_at || '',
      created_at: t.timestamp || t.created_at || '',
      cashier: t.cashier || 'Pharmacist',
      customerName: t.customerName || t.customer_name || 'Walk-in Customer',
      customer_name: t.customerName || t.customer_name || 'Walk-in Customer',
      customerType: t.customerType || t.customer_type || 'regular',
      customer_type: t.customerType || t.customer_type || 'regular',
      customer_id_no: t.customer_id_no || '',
      paymentMethod: t.paymentMethod || t.payment_method || 'Cash',
      payment_method: t.paymentMethod || t.payment_method || 'Cash',
      discountType: t.discountType || t.discount_type || 'None',
      discount_type: t.discountType || t.discount_type || 'None',
      discountAmount: discount,
      discount: discount,
      subtotal: subtotal,
      total: total,
      amountTendered: amountPaid,
      amountPaid: amountPaid,
      amount_paid: amountPaid,
      changeAmount: change,
      change: change,
      items: items,
      items_count: items.length
    };
  }

  async processSale(salePayload) {
    const res = await this.post('/pos/checkout', salePayload);
    return res.sale || res.data || res;
  }

  async processReturn(payload) {
    const res = await this.post('/returns', payload);
    return res.returnSlip || res.data || res;
  }

  async getReturns(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/returns${query ? '?' + query : ''}`;
    const res = await this.get(url);
    return res.returns || res.data || res || [];
  }

  // 3. Stock In
  async getStockInLogs() {
    const res = await this.get('/stock-in');
    const list = Array.isArray(res) ? res : (res.data || res.logs || []);
    return list.map(r => ({
      ...r,
      id: Number(r.id),
      refNo: r.refNo || r.ref_no || '',
      supplierName: r.supplierName || r.supplier_name || '',
      totalAmount: parseFloat(r.totalAmount ?? r.total_amount ?? 0),
      receivedBy: r.receivedBy || r.received_by || 'Pharmacist',
      items: Array.isArray(r.items) ? r.items : []
    }));
  }

  async getStockInDetail(id) {
    const res = await this.get(`/stock-in/${id}`);
    return res.items || res.data || res;
  }

  async processStockIn(payload) {
    const res = await this.post('/stock-in', payload);
    return res.stockIn || res.record || res.data || res;
  }

  async updateStockIn(id, payload) {
    const res = await this.put(`/stock-in/${id}`, { ...payload, id });
    return res.stockIn || res.record || res.data || res;
  }

  async deleteStockIn(id) {
    return this.delete(`/stock-in/${id}`);
  }

  // 4. Stock Out
  async getStockOutLogs() {
    const res = await this.get('/stock-out');
    const list = Array.isArray(res) ? res : (res.data || res.logs || []);
    return list.map(r => ({
      ...r,
      id: Number(r.id),
      refNo: r.refNo || r.ref_no || '',
      authorizedBy: r.authorizedBy || r.authorized_by || 'Pharmacist',
      reason: r.reason || 'Disposed',
      notes: r.notes || '',
      items: Array.isArray(r.items) ? r.items.map(i => ({
        ...i,
        qty: Number(i.qty ?? i.quantity ?? 0),
        name: i.name || i.product_name || '',
        productId: Number(i.productId ?? i.product_id ?? 0),
        costPrice: parseFloat(i.costPrice ?? i.cost_price ?? 0)
      })) : []
    }));
  }

  async getStockOutDetail(id) {
    const res = await this.get(`/stock-out/${id}`);
    return res.items || res.data || res;
  }

  async processStockOut(payload) {
    const res = await this.post('/stock-out', payload);
    return res.stockOut || res.record || res.data || res;
  }

  async updateStockOut(id, payload) {
    const res = await this.put(`/stock-out/${id}`, { ...payload, id });
    return res.stockOut || res.record || res.data || res;
  }

  async deleteStockOut(id) {
    return this.delete(`/stock-out/${id}`);
  }

  // 5. Bulk Conversions
  async getConversionLogs() {
    const res = await this.get('/conversions');
    const list = Array.isArray(res) ? res : (res.conversions || res.data || res.logs || []);
    return list.map(c => ({
      ...c,
      id: String(c.conv_code || c.id || ''),
      date: c.date || c.created_at || '',
      sourceProductId: Number(c.source_product_id ?? c.sourceProductId ?? 0),
      sourceProductName: c.source_product_name || c.sourceProductName || '',
      sourceQty: Number(c.source_qty ?? c.sourceQty ?? 1),
      sourceUom: c.source_uom || c.sourceUom || 'Box',
      targetProductId: Number(c.target_product_id ?? c.targetProductId ?? 0),
      targetProductName: c.target_product_name || c.targetProductName || '',
      targetQty: Number(c.target_qty ?? c.targetQty ?? 0),
      targetUom: c.target_uom || c.targetUom || 'Unit',
      multiplier: Number(c.multiplier ?? 1),
      batchNo: c.batch_no || c.batchNo || 'N/A',
      expiryDate: c.expiry_date || c.expiryDate || 'N/A',
      operator: c.operator || 'Pharmacist',
      notes: c.notes || ''
    }));
  }

  async processItemConversion(payload) {
    const res = await this.post('/conversions', payload);
    return res.conversion || res.record || res.data || res;
  }

  async saveConversionRule(rule) {
    const res = await this.post('/conversion-rules', rule);
    return res;
  }

  async deleteConversionRule(productId) {
    const res = await this.post('/conversion-rules', { id: productId, _method: 'DELETE' });
    return res;
  }

  // Active Inventory Batches per Product (FEFO / Batch Traceability)
  async getProductBatches(productId = 0) {
    const param = productId > 0 ? `?product_id=${productId}` : '';
    const res = await this.get(`/batches${param}`);
    return Array.isArray(res) ? res : (res.batches || res.data || []);
  }

  // 6. Accounting Inventory Ledger (`inventory` table)
  async getStockMovements(params = {}) {
    const res = await this.get('/inventory', params);
    const list = Array.isArray(res) ? res : (res.inventory || res.movements || res.data || res.logs || []);
    return list.map(m => {
      const txCode = m.transaction_code || m.transactionCode || m.type || 'StockIn';
      const impact = Number(m.impact ?? m.qty_change ?? m.qtyChange ?? 0);
      const prevBal = Number(m.previous_balance ?? m.previous_stock ?? m.previousStock ?? 0);
      const runBal = Number(m.running_balance ?? m.new_stock ?? m.newStock ?? 0);
      const refNo = String(m.reference_no || m.reference_id || m.referenceId || '');
      const entryNo = String(m.entry_no || m.movement_code || m.id || '');
      return {
        ...m,
        id: entryNo,
        entryNo,
        timestamp: m.transacted_at || m.timestamp || m.created_at || '',
        productId: Number(m.product_id ?? m.productId ?? 0),
        productName: m.product_name || m.productName || '',
        transactionCode: txCode,
        type: txCode,
        previousBalance: prevBal,
        previousStock: prevBal,
        impact,
        qtyChange: impact,
        runningBalance: runBal,
        newStock: runBal,
        referenceNo: refNo,
        referenceId: refNo,
        batchNo: String(m.batch_no || m.batchNo || ''),
        batch_no: String(m.batch_no || m.batchNo || ''),
        expiryDate: String(m.expiry_date || m.expiryDate || ''),
        expiry_date: String(m.expiry_date || m.expiryDate || ''),
        remarks: String(m.remarks || '')
      };
    });
  }

  // 7. Seasonal Demand Forecasts & Restock Engine
  async getDemandForecasts(params = {}) {
    const res = await this.get('/forecasts', params);
    const list = Array.isArray(res) ? res : (res.forecast || res.forecasts || res.data || []);
    const periodDays = Number(res.period_days ?? 30);
    const elapsedDays = Number(res.elapsed_days ?? periodDays);
    const trendChart = res.trend_chart || null;

    const mapped = list.map(f => {
      if (f.product && typeof f.product === 'object') {
        return f;
      }
      const avgDaily = parseFloat(f.avg_daily_sales ?? f.avgDaily ?? 0);
      const rawUrgency = f.urgency || 'Low';
      const currentStock = Number(f.current_stock ?? f.stock ?? 0);
      const demandLastYear = Number(f.demand_last_year ?? f.total_sold_period ?? 0);
      const sold30d = Number(f.sold_30d ?? 0);
      const projectedDemand = Number(f.projected_demand ?? f.forecast_qty ?? demandLastYear);
      const safetyStock = Number(f.safety_stock ?? f.reorder_point ?? 10);
      const suggestedReorder = Number(f.suggested_reorder_qty ?? f.suggested_reorder ?? 0);

      return {
        ...f,
        product: {
          id: Number(f.product_id ?? f.id ?? 0),
          sku: f.sku || '',
          name: f.name || '',
          genericName: f.generic_name || f.genericName || '',
          category: f.category || 'General',
          uom: f.uom || 'Unit',
          stock: currentStock,
          reorderPoint: Number(f.reorder_point ?? 10),
          costPrice: parseFloat(f.cost_price ?? 0),
          batchNo: f.batch_no || 'N/A',
          expiryDate: f.expiry_date || ''
        },
        currentStock,
        demandLastYear,
        lastYearLabel: f.last_year_label || 'Last Year',
        sold30d,
        soldThisMonth: Number(f.sold_this_month ?? 0),
        avgDaily,
        projectedDemand,
        forecastQty: projectedDemand,
        forecast30: projectedDemand,
        safetyStock,
        targetStock: Number(f.target_stock ?? (projectedDemand + safetyStock)),
        suggestedReorder,
        estimatedReorderCost: parseFloat(f.estimated_reorder_cost ?? 0),
        daysOfInventoryLeft: Number(f.days_remaining ?? f.days_of_inventory_left ?? 0),
        status: f.status || 'Adequate Stock',
        urgency: rawUrgency,
        riskLabel: f.risk_label || '',
        historicalBasis: f.historical_basis || '',
        trendChart
      };
    });

    mapped.trendChart = trendChart;
    mapped.targetMonth = res.target_month || '';
    mapped.monthName = res.month_name || '';
    mapped.lastYear = res.last_year || '';
    mapped.periodLabel = res.period_label || 'Year-Over-Year Demand Analysis';
    mapped.totalCatalogCount = Number(res.total_catalog_count ?? mapped.length);
    mapped.filteredProductIds = Array.isArray(res.filtered_product_ids) ? res.filtered_product_ids : [];
    return mapped;
  }

  async createPurchaseOrder(payload) {
    const res = await this.post('/forecasts/purchase-order', payload);
    return res.po || res;
  }

  // 8. Suppliers
  async getSuppliers() {
    const res = await this.get('/suppliers');
    return Array.isArray(res) ? res : (res.data || res.suppliers || []);
  }

  async addSupplier(supplierData) {
    const res = await this.post('/suppliers', supplierData);
    return res.supplier || res.data || res;
  }

  async updateSupplier(id, supplierData) {
    const res = await this.put(`/suppliers/${id}`, { ...supplierData, id });
    return res.supplier || res.data || res;
  }

  async deleteSupplier(id) {
    return this.delete(`/suppliers/${id}`);
  }

  // 9. Dashboard & Reports
  async getDashboardMetrics() {
    return this.get('/dashboard/metrics');
  }

  async getSalesReport(range = 'month') {
    return this.get('/reports/sales', { range });
  }

  async getValuationReport() {
    return this.get('/reports/valuation');
  }

  async getLossReport() {
    return this.get('/reports/losses');
  }

  async getFsnAnalysis() {
    return this.get('/reports/fsn');
  }
}

// Global instance assigned to window.api and window.mockApi for backwards-compatibility
window.api = new ApiService();
window.mockApi = window.api;
