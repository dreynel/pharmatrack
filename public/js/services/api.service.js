/**
 * PharmaTrack - Real API Client Service Layer
 * Interacts with PHP Laravel 12 & MySQL 8.0 Backend
 * Custom Designed for Xyra Andrea Pharmacy
 */

class ApiService {
  constructor() {
    this.baseUrl = this.determineBaseUrl();
  }

  determineBaseUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    const path = window.location.pathname;
    if (path.includes('/PharmaTrack/public')) {
      return '/PharmaTrack/public/api';
    }
    if (path.includes('/PharmaTrack')) {
      return '/PharmaTrack/public/api';
    }
    return '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
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
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'}] ${url}:`, err);
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

  // 1. Products
  async getProducts(params = {}) {
    return this.get('/products', params);
  }

  async getProductById(id) {
    return this.get(`/products/${id}`);
  }

  async addProduct(productObj) {
    const res = await this.post('/products', productObj);
    return res.product || res;
  }

  async updateProductStock(productId, addQuantity) {
    const res = await this.post(`/products/${productId}/restock`, { quantity: addQuantity });
    return res.product || res;
  }

  async updateProduct(id, productObj) {
    const res = await this.put(`/products/${id}`, productObj);
    return res.product || res;
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  // 2. Transactions & POS
  async getTransactions() {
    return this.get('/transactions');
  }

  async getTransactionById(id) {
    return this.get(`/transactions/${id}`);
  }

  async processSale(salePayload) {
    const res = await this.post('/pos/checkout', salePayload);
    return res.sale || res;
  }

  // 3. Stock In
  async getStockInLogs() {
    return this.get('/stock-in');
  }

  async getStockInDetail(id) {
    return this.get(`/stock-in/${id}`);
  }

  async processStockIn(payload) {
    const res = await this.post('/stock-in', payload);
    return res.stockIn || res;
  }

  async updateStockIn(id, payload) {
    const res = await this.put(`/stock-in/${id}`, payload);
    return res.stockIn || res;
  }

  async deleteStockIn(id) {
    return this.delete(`/stock-in/${id}`);
  }

  // 4. Stock Out
  async getStockOutLogs() {
    return this.get('/stock-out');
  }

  async getStockOutDetail(id) {
    return this.get(`/stock-out/${id}`);
  }

  async processStockOut(payload) {
    const res = await this.post('/stock-out', payload);
    return res.stockOut || res;
  }

  async updateStockOut(id, payload) {
    const res = await this.put(`/stock-out/${id}`, payload);
    return res.stockOut || res;
  }

  async deleteStockOut(id) {
    return this.delete(`/stock-out/${id}`);
  }

  // 5. Bulk Conversions
  async getConversionLogs() {
    return this.get('/conversions');
  }

  async processItemConversion(payload) {
    const res = await this.post('/conversions', payload);
    return res.conversion || res;
  }

  // 6. Movement Ledger
  async getStockMovements(params = {}) {
    return this.get('/movements', params);
  }

  // 7. AI Demand Forecasts
  async getDemandForecasts() {
    return this.get('/forecasts');
  }

  async createPurchaseOrder(payload) {
    const res = await this.post('/forecasts/purchase-order', payload);
    return res.po || res;
  }

  // 8. Suppliers
  async getSuppliers() {
    return this.get('/suppliers');
  }

  async addSupplier(supplierData) {
    const res = await this.post('/suppliers', supplierData);
    return res.supplier || res;
  }

  async updateSupplier(id, supplierData) {
    const res = await this.put(`/suppliers/${id}`, supplierData);
    return res.supplier || res;
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
