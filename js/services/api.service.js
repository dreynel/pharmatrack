/**
 * PharmaTrack - Real API Client Service Layer
 * Interacts with Native PHP & MySQL Backend
 * Custom Designed for Xyra Andrea Pharmacy
 */

class ApiService {
  constructor() {
    this.baseUrl = this.determineBaseUrl();
  }

  determineBaseUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    const path = window.location.pathname;
    const match = path.match(/^(\/[^/]+)/);
    if (match && /pharmatrack/i.test(match[1])) {
      return `${match[1]}/api`;
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
      let data = {};
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = {};
      }

      if (!response.ok) {
        // If 401, return authentication status object instead of breaking
        if (response.status === 401) {
          return { success: false, authenticated: false, user: null };
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
    return Array.isArray(res) ? res : (res.data || res.products || []);
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

  // 2. Transactions & POS
  async getTransactions() {
    const res = await this.get('/transactions');
    return Array.isArray(res) ? res : (res.data || res.transactions || []);
  }

  async getTransactionById(id) {
    const res = await this.get(`/transactions/${id}`);
    return res.data || res.transaction || res;
  }

  async processSale(salePayload) {
    const res = await this.post('/pos/checkout', salePayload);
    return res.sale || res.data || res;
  }

  // 3. Stock In
  async getStockInLogs() {
    const res = await this.get('/stock-in');
    return Array.isArray(res) ? res : (res.data || res.logs || []);
  }

  async getStockInDetail(id) {
    const res = await this.get(`/stock-in/${id}`);
    return res.items || res.data || res;
  }

  async processStockIn(payload) {
    const res = await this.post('/stock-in', payload);
    return res.stockIn || res.data || res;
  }

  async updateStockIn(id, payload) {
    const res = await this.put(`/stock-in/${id}`, payload);
    return res.stockIn || res.data || res;
  }

  async deleteStockIn(id) {
    return this.delete(`/stock-in/${id}`);
  }

  // 4. Stock Out
  async getStockOutLogs() {
    const res = await this.get('/stock-out');
    return Array.isArray(res) ? res : (res.data || res.logs || []);
  }

  async getStockOutDetail(id) {
    const res = await this.get(`/stock-out/${id}`);
    return res.items || res.data || res;
  }

  async processStockOut(payload) {
    const res = await this.post('/stock-out', payload);
    return res.stockOut || res.data || res;
  }

  async updateStockOut(id, payload) {
    const res = await this.put(`/stock-out/${id}`, payload);
    return res.stockOut || res.data || res;
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
    const res = await this.get('/suppliers');
    return Array.isArray(res) ? res : (res.data || res.suppliers || []);
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
