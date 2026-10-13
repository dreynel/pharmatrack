# PharmaTrack - Native PHP Sales & Inventory Management System
### Custom Designed for **Xyra Andrea Pharmacy**

---

## 🌟 System Overview
**PharmaTrack** is an enterprise-grade clinical pharmacy management system built on pure **Native PHP 7.4+ / 8.x** and **MySQL 8.0 / MariaDB**. It operates with **zero external framework dependencies** (pure native PDO, native sessions, modular actions, and Bootstrap 5.3 UI).

Core capabilities include:
- High-speed Point of Sale (POS) with real-time barcode search & official receipt generation
- Complete inventory lifecycle control (Catalog, Goods Receiving / Stock In, Regulated Disposal / Stock Out)
- Two-Panel Split Layout (Parent documents with real-time Children Line Items inline)
- Item Conversion & UOM Breakdown (wholesale box to retail blister/capsules)
- Consolidated Stock Movement Ledger (full chronological audit trail)
- Predictive demand forecasting & automated distributor Purchase Orders
- Comprehensive audited reporting (Sales, Inventory Valuation, Expiry/Loss, and FSN Turnover analysis) with CSV export

---

## 🏛️ Native PHP Modular Folder Structure

The project strictly follows the requested **Registry** and **Modules** native PHP modular architecture:

```
d:/xampp/htdocs/PharmaTrack/
├── config/
│   ├── db.php                     # Native PDO connection with zero-setup auto-provisioning
│   ├── helpers.php                # Native sanitization, JSON response & refNo utilities
│   └── session.php                # Native PHP session & RBAC authentication
│
├── api/
│   ├── .htaccess                  # Clean REST rewrite rule
│   └── index.php                  # Central Native API Gateway & Dispatcher
│
├── Registry/                      # Master Entity Management
│   ├── CategoryRegistry/          # [components, actions, index.php]
│   ├── ProductRegistry/           # [components, actions, index.php]
│   ├── SupplierRegistry/          # [components, actions, index.php]
│   └── UserRegistry/              # [components, actions, index.php]
│
├── Modules/                       # Core Business Workflow Modules
│   ├── Conversion/                # [components, actions, index.php]
│   ├── Dashboard/                 # [components, actions, index.php]
│   ├── Forecast/                  # [components, actions, index.php]
│   ├── POS/                       # [components, actions, index.php]
│   ├── Reports/                   # [components, actions, index.php]
│   ├── StockIn/                   # [components, actions, index.php] (Parent-Child Receiving)
│   ├── StockMovements/            # [components, actions, index.php]
│   └── StockOut/                  # [components, actions, index.php] (Parent-Child Disposals)
│
├── database/
│   └── schema.sql                 # Complete database structure, foreign keys & seed catalog
│
├── css/                           # Bootstrap 5.3 + clinical custom styling
├── js/                            # Modular domain controllers & Native REST API client
├── login.php                      # Native authentication portal
├── logout.php                     # Native session destruction handler
├── index.php                      # Protected entrypoint (checks session -> index.html)
└── index.html                     # Unified Responsive SPA Interface (Bootstrap 5.3 Grid)
```

---

## 🗄️ Database Setup & Migration (Zero-Setup on New Computers)

When you clone or copy **PharmaTrack** to another computer:

### Option A: Fully Automated (Zero-Setup)
1. Copy or clone `PharmaTrack` into your web server directory (e.g. `d:/xampp/htdocs/PharmaTrack` or `c:/xampp/htdocs/PharmaTrack`).
2. Start **Apache** and **MySQL** in your XAMPP Control Panel.
3. Open `http://localhost/PharmaTrack/` in your browser.
4. **Auto-Provisioning**: PharmaTrack's native connection handler (`config/db.php`) will automatically detect if the database `pharmatrack_db` or required tables are missing. It connects to MySQL, executes `CREATE DATABASE IF NOT EXISTS pharmatrack_db`, and automatically imports `database/pharmatrack_db.sql`.

### Option B: Manual Import (phpMyAdmin / MySQL CLI)
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pharmatrack_db;"
mysql -u root -p pharmatrack_db < database/pharmatrack_db.sql
```

---

## ⚙️ Default Credentials & Connection
- **Host**: `127.0.0.1` (or `localhost`)
- **Port**: `3306`
- **Database**: `pharmatrack_db`
- **Default Database User**: `root` (works with both empty password and `007622`)
- **Default Login Portal**:
  - **Admin**: `admin@pharmatrack.com` | Password: `admin123`
  - **Cashier**: `cashier@pharmatrack.com` | Password: `cashier123`

---

## 🚀 Running the Application
Open your web browser and navigate directly to:
👉 **[http://localhost/PharmaTrack/](http://localhost/PharmaTrack/)**

All features (Product Registry, Stock In, Stock Out, POS, Conversions, Movements, Forecasts, and Reports) operate natively via Native PHP PDO and the Bootstrap 5.3 Grid interface.