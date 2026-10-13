# PharmaTrack - POS Sales & Inventory Management with AI Demand Forecasting
### Custom Designed for **Xyra Andrea Pharmacy**

---

## 🌟 System Overview
**PharmaTrack** is an enterprise-grade clinical management system built on **Laravel 12 (PHP 8.2+)** and **MySQL 8.0**, featuring a high-speed Point of Sale (POS) counter, complete inventory lifecycle control (Catalog, Goods Receiving / Stock In, Regulated Disposal / Stock Out, Item Conversion & UOM Unboxing, Consolidated Stock Movement Ledger), intelligent **AI Demand Forecasting**, audited reports with CSV export, and SweetAlert2 (SWAL) for confirmations and notifications.

---

## 🏛️ System Architecture & Folder Layout

```
d:/xampp/htdocs/PharmaTrack/
├── app/
│   ├── Http/Controllers/
│   │   ├── DashboardController.php      # Main SPA View & Real-time KPI Stream
│   │   ├── PosController.php            # POS Counter & Transaction Logs
│   │   ├── ProductController.php        # Stock Catalog & Quick Restock
│   │   ├── StockInController.php        # Goods Receiving & Invoices
│   │   ├── StockOutController.php       # Regulated Disposals & Write-Offs
│   │   ├── ConversionController.php     # Bulk Container Unboxing & UOM breakdown
│   │   ├── StockMovementController.php  # Consolidated Movement Ledger
│   │   ├── ForecastController.php       # AI Demand Forecasting & PO generation
│   │   ├── SupplierController.php       # Supplier Directory & PO tracker
│   │   └── ReportController.php         # Sales, Valuation, Loss & FSN reports
│   │
│   ├── Models/                          # Eloquent Models with Dual Accessors
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── Supplier.php
│   │   ├── Sale.php & SaleItem.php
│   │   ├── StockIn.php & StockInItem.php
│   │   ├── StockOut.php & StockOutItem.php
│   │   ├── Conversion.php
│   │   ├── StockMovement.php
│   │   └── PurchaseOrder.php
│   │
│   └── Services/                        # OOP Service Layer (Separation of Concerns)
│       ├── InventoryService.php         # Audit logging, status recalculation, alert checks
│       ├── PosService.php               # Atomic sales transactions, cart math, discount rules
│       ├── StockTransferService.php     # Goods receiving & disposal write-offs
│       ├── ConversionService.php        # Bulk-to-retail conversion with batch/cost inheritance
│       ├── ForecastService.php          # AI moving averages, safety buffers & PO generator
│       └── ReportService.php            # Sales analytics, inventory valuation & FSN turnover
│
├── database/
│   ├── migrations/                      # Structured MySQL Schema
│   └── seeders/DatabaseSeeder.php       # Rich realistic pharmacy dataset
│
├── resources/
│   └── views/
│       ├── pharmatrack.blade.php        # Master Unified Blade Application Layout
│       └── welcome.blade.php
│
├── public/
│   ├── css/                             # Modular Clinical Design System
│   └── js/                              # Layered Frontend Controllers & REST Client
│       ├── services/api.service.js      # Live REST API Client with CSRF support
│       ├── ui/swal.helpers.js           # SweetAlert2 Modals, Calculators & Receipts
│       └── modules/*.controller.js      # Feature Domain Controllers
│
└── routes/
    ├── api.php                          # RESTful API Endpoints
    └── web.php                          # Web Routes & CSV Exports
```

---

## 🗄️ Database Configuration & Migration for New Computers

When you clone or copy **PharmaTrack** to another computer or fresh XAMPP environment:

### Option A: Fully Automated (Zero-Setup)
1. Copy or clone `PharmaTrack` into your web server directory (e.g. `d:/xampp/htdocs/PharmaTrack` or `c:/xampp/htdocs/PharmaTrack`).
2. Start Apache and MySQL in your XAMPP Control Panel.
3. Open `http://localhost/PharmaTrack/` in your browser.
4. **Auto-Provisioning**: PharmaTrack's native connection handler (`config/db.php`) will automatically detect if the database `pharmatrack_db` or required tables are missing. It will connect to MySQL, auto-create the database `pharmatrack_db`, and automatically import `database/schema.sql`.

### Option B: Manual Import (phpMyAdmin / MySQL CLI)
If you prefer manual setup:
```bash
# In MySQL CLI or phpMyAdmin:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pharmatrack_db;"
mysql -u root -p pharmatrack_db < database/schema.sql
```

### Option C: Laravel Artisan (if using Artisan)
```bash
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

---

## ⚙️ Credentials & Connection Defaults
- **Host**: `127.0.0.1` (or `localhost`)
- **Port**: `3306`
- **Database**: `pharmatrack_db`
- **Username**: `root`
- **Password**: Blank / empty (standard XAMPP default) or `007622` (configured in `.env`). The system automatically tries both passwords so it works out-of-the-box on standard XAMPP installs without any reconfiguration!

---

## 🚀 Key Modules & Capabilities

### 1. 📊 Operations: Dashboard & Analytics
- **Live KPIs**: Today's Sales (₱), Low Stock Items, Near-Expiry Items (within 30 days), and Total Units in Stock.
- **Hourly Revenue Stream**: Interactive Chart.js stream tracking hourly sales.
- **Stock Alert Feed**: Immediate warning table highlighting medicines reaching reorder thresholds.

### 2. 🛒 Point of Sale (POS Terminal)
- **Barcode & Instant Search**: Live search by product name, generic active ingredient, or hardware barcode scan.
- **Category Filter Pills**: Fast selection across Analgesics, Antibiotics, Vitamins, Respiratory, Cardiovascular, Antihistamines, First Aid, etc.
- **Cart & Quantity Validation**: Quantity adjustments (`+` / `-`), stock ceiling validation, and item removal.
- **Senior & PWD Discounts**: Built-in 5% Senior Citizen, 10% PWD, and custom promotions.
- **SweetAlert2 Checkout**: Payment modal supporting Cash, GCash, Maya, and Credit Card with automatic change calculation.
- **Official Thermal Receipt**: Printable Official Receipt (OR) modal with itemized breakdown and tax details.

### 3. 📦 Inventory Control Modules
- **Medicine Stock Catalog (`#view-inventory`)**: Tracks SKU, Brand & Generic Name, Category, Packaging UOM, Unit Price, Cost Price, Stock On-Hand, Batch #, Expiry Date, and Status Pills (*In Stock*, *Low Stock*, *Critical Low*, *Expiring Soon*, *Out of Stock*).
- **Stock In / Receiving (`#view-stock-in`)**: Logs Delivery Receipts (DR) and Invoices from pharmaceutical distributors (Unilab, Pascual, Zuellig), updates batch numbers and expiry dates, and records unit cost basis.
- **Stock Out / Disposals (`#view-stock-out`)**: Audit-compliant tracking for expired medicines, damaged packaging, supplier returns (RTV), and clinic use.
- **Item Conversion / UOM Breakdown (`#view-conversion`)**: Unbox wholesale bulk packaging (e.g. 1 Box of 100) into retail units (100 Tablets/Capsules) with dynamic ratio multiplier math, automatic batch/expiry inheritance, and cost apportionment.
- **Consolidated Movement Ledger (`#view-movements`)**: Master chronological audit trail tracking every single inventory delta across `STOCK_IN`, `STOCK_OUT`, `POS_SALE`, `CONVERT_IN`, and `CONVERT_OUT` with previous vs. new stock levels and reference IDs.

### 4. 📈 AI Demand Forecasting Module
- **Predictive Consumption Algorithm**: Uses historical 30-day moving averages + trend variance to predict upcoming demand.
- **Safety Stock Buffer**: Automatic 7-day safety buffer based on lead times and daily velocity.
- **Visual Analytics**: Chart.js trend lines comparing historical vs. predicted consumption and category share charts.
- **Automated Purchase Orders**: Generates recommended reorder quantities and triggers SweetAlert2 PO submission directly to distributors.

### 5. 🏢 Supplier Directory & 📊 Comprehensive Reports
- **Supplier Directory**: Distributor registry (Unilab, Pascual, Zuellig) with active PO tracking.
- **Sales & Revenue Report**: Gross sales, discounts awarded, net revenue, and transaction breakdown.
- **Inventory Valuation**: Total retail valuation, capital cost basis, and projected profit margins.
- **Disposal, Expiry & Loss Report**: Written-off units and financial loss quantification.
- **Fast & Slow Moving Goods (FSN Analysis)**: Inventory turnover velocity categorizing medicines into Fast-Moving, Normal, and Slow-Moving.
- **Export & Print**: 1-click **Export to CSV** and clean **Print Report** mode.

---

## 🧪 Testing & Verification
A complete PHPUnit / Feature test suite is provided in `tests/Feature/PharmaTrackSystemTest.php`:
```bash
php artisan test --filter=PharmaTrackSystemTest
```
Result: **8 passed (39 assertions)**.

---

## 🏃 Running the Application
The application can be accessed directly through Laravel:
```bash
php artisan serve --port=8000
```
Then open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**
*(Also compatible with XAMPP Apache at `http://localhost/PharmaTrack/public`)*
#   p h a r m a t r a c k  
 