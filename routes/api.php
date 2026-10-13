<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\StockInController;
use App\Http\Controllers\StockOutController;
use App\Http\Controllers\ConversionController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\ForecastController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| PharmaTrack API Routes
|--------------------------------------------------------------------------
*/

// Auth status
Route::get('/auth/me', [AuthController::class, 'me']);

// Dashboard
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);

// Products & Inventory
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
Route::get('/products/expiring', [ProductController::class, 'expiringSoon']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);
Route::post('/products/{id}/restock', [ProductController::class, 'restock']);
Route::get('/categories', [ProductController::class, 'categories']);

// POS / Cashier
Route::post('/pos/checkout', [PosController::class, 'checkout']);
Route::get('/pos/history', [PosController::class, 'sales']);
Route::get('/transactions', [PosController::class, 'sales']);
Route::get('/transactions/{id}', [PosController::class, 'show']);
Route::post('/pos/hold', [PosController::class, 'holdOrder']);
Route::get('/pos/held', [PosController::class, 'getHeldOrders']);
Route::delete('/pos/held/{id}', [PosController::class, 'discardHeldOrder']);

// Goods Receiving (Stock In)
Route::get('/stock-in', [StockInController::class, 'index']);
Route::get('/stock-in/{id}', [StockInController::class, 'show']);
Route::post('/stock-in', [StockInController::class, 'store']);
Route::put('/stock-in/{id}', [StockInController::class, 'update']);
Route::delete('/stock-in/{id}', [StockInController::class, 'destroy']);

// Disposal & Loss (Stock Out)
Route::get('/stock-out', [StockOutController::class, 'index']);
Route::get('/stock-out/{id}', [StockOutController::class, 'show']);
Route::post('/stock-out', [StockOutController::class, 'store']);
Route::put('/stock-out/{id}', [StockOutController::class, 'update']);
Route::delete('/stock-out/{id}', [StockOutController::class, 'destroy']);

// UOM Breakdown & Conversion
Route::get('/conversions', [ConversionController::class, 'index']);
Route::post('/conversions', [ConversionController::class, 'store']);

// Consolidated Stock Movements Audit Trail
Route::get('/stock-movements', [StockMovementController::class, 'index']);
Route::get('/movements', [StockMovementController::class, 'index']);

// AI Demand Forecasting & PO Automation (Supports both /forecast and /forecasts)
Route::get('/forecast', [ForecastController::class, 'index']);
Route::get('/forecasts', [ForecastController::class, 'index']);
Route::post('/forecast/purchase-order', [ForecastController::class, 'createPurchaseOrder']);
Route::post('/forecasts/purchase-order', [ForecastController::class, 'createPurchaseOrder']);

// Suppliers & Vendor Management
Route::get('/suppliers', [SupplierController::class, 'index']);
Route::post('/suppliers', [SupplierController::class, 'store']);
Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);
Route::get('/suppliers/purchase-orders', [SupplierController::class, 'purchaseOrders']);

// Reports & Analytics
Route::get('/reports/sales', [ReportController::class, 'sales']);
Route::get('/reports/valuation', [ReportController::class, 'valuation']);
Route::get('/reports/losses', [ReportController::class, 'losses']);
Route::get('/reports/fsn', [ReportController::class, 'fsn']);
