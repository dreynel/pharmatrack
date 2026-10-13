<?php
/**
 * PharmaTrack - Native PHP API Central Gateway & Dispatcher
 * Directly routes API calls to the domain Registry and Modules actions.
 */

// Handle CORS if needed
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$parsedPath = parse_url($requestUri, PHP_URL_PATH);

// Strip prefix e.g. /PharmaTrack/api or /api
$prefix = '/api';
$pos = strpos($parsedPath, $prefix);
if ($pos !== false) {
    $subPath = substr($parsedPath, $pos + strlen($prefix));
} else {
    $subPath = $parsedPath;
}

$subPath = trim($subPath, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Parse path segments: e.g. ["products", "12"]
$segments = !empty($subPath) ? explode('/', $subPath) : [];
$resource = $segments[0] ?? '';
$idParam = $segments[1] ?? null;
$actionParam = $segments[2] ?? null;

$rootDir = dirname(__DIR__);

// Helper to set ID in GET/input for actions
if ($idParam && is_numeric($idParam)) {
    $_GET['id'] = (int)$idParam;
}

switch ($resource) {
    // 0. AUTHENTICATION (Login, Logout, Me)
    case 'auth':
        require_once $rootDir . '/config/db.php';
        require_once $rootDir . '/config/session.php';
        require_once $rootDir . '/config/helpers.php';
        $pdo = getDatabaseConnection();

        if ($idParam === 'login' || $subPath === 'auth/login') {
            $input = getJsonInput();
            $loginInput = sanitizeString($input['login'] ?? ($input['email'] ?? ''));
            $password = $input['password'] ?? '';

            if (empty($loginInput) || empty($password)) {
                jsonResponse(['success' => false, 'error' => 'Please provide both email/username and password.'], 400);
            }

            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR name LIKE ? LIMIT 1");
            $stmt->execute([$loginInput, "%{$loginInput}%"]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                loginUser($user);
                jsonResponse([
                    'success'  => true,
                    'message'  => "Welcome back, {$user['name']}!",
                    'user'     => [
                        'id'    => (int)$user['id'],
                        'name'  => $user['name'],
                        'email' => $user['email'],
                        'role'  => $user['role']
                    ],
                    'redirect' => 'index.html'
                ]);
            } else {
                jsonResponse(['success' => false, 'error' => 'Invalid email/username or password.'], 401);
            }
        } elseif ($idParam === 'logout' || $subPath === 'auth/logout') {
            logoutUser();
            jsonResponse(['success' => true, 'message' => 'Successfully signed out.', 'redirect' => 'login.php']);
        } elseif ($idParam === 'me' || $subPath === 'auth/me') {
            if (isAuthenticated()) {
                jsonResponse(['success' => true, 'authenticated' => true, 'user' => getCurrentUser()]);
            } else {
                jsonResponse(['success' => false, 'authenticated' => false, 'user' => null], 401);
            }
        }
        break;

    // 1. PRODUCTS (Registry/ProductRegistry)
    case 'products':
        if ($method === 'GET') {
            if ($idParam && is_numeric($idParam)) {
                $_GET['product_id'] = (int)$idParam;
            }
            require $rootDir . '/Registry/ProductRegistry/actions/get_products.php';
        } elseif ($method === 'POST') {
            if ($idParam && $actionParam === 'restock') {
                // Restock endpoint
                $raw = json_decode(file_get_contents('php://input'), true) ?? [];
                $_POST['id'] = (int)$idParam;
                $_POST['stock_increment'] = (int)($raw['quantity'] ?? 0);
                require $rootDir . '/Registry/ProductRegistry/actions/update_product.php';
            } else {
                require $rootDir . '/Registry/ProductRegistry/actions/save_product.php';
            }
        } elseif ($method === 'PUT') {
            require $rootDir . '/Registry/ProductRegistry/actions/update_product.php';
        } elseif ($method === 'DELETE') {
            require $rootDir . '/Registry/ProductRegistry/actions/delete_product.php';
        }
        break;

    // 2. SUPPLIERS (Registry/SupplierRegistry)
    case 'suppliers':
        if ($method === 'GET') {
            require $rootDir . '/Registry/SupplierRegistry/actions/get_suppliers.php';
        } elseif ($method === 'POST' || $method === 'PUT') {
            require $rootDir . '/Registry/SupplierRegistry/actions/save_supplier.php';
        } elseif ($method === 'DELETE') {
            require $rootDir . '/Registry/SupplierRegistry/actions/delete_supplier.php';
        }
        break;

    // 3. CATEGORIES (Registry/CategoryRegistry)
    case 'categories':
        if ($method === 'GET') {
            require $rootDir . '/Registry/CategoryRegistry/actions/get_categories.php';
        } elseif ($method === 'POST' || $method === 'PUT') {
            require $rootDir . '/Registry/CategoryRegistry/actions/save_category.php';
        } elseif ($method === 'DELETE') {
            require $rootDir . '/Registry/CategoryRegistry/actions/delete_category.php';
        }
        break;

    // 4. USERS (Registry/UserRegistry)
    case 'users':
        if ($method === 'GET') {
            require $rootDir . '/Registry/UserRegistry/actions/get_users.php';
        } elseif ($method === 'POST' || $method === 'PUT') {
            require $rootDir . '/Registry/UserRegistry/actions/save_user.php';
        } elseif ($method === 'DELETE') {
            require $rootDir . '/Registry/UserRegistry/actions/delete_user.php';
        }
        break;

    // 5. STOCK IN (Modules/StockIn)
    case 'stock-in':
        if ($method === 'GET') {
            if ($idParam && is_numeric($idParam)) {
                $_GET['stock_in_id'] = (int)$idParam;
                require $rootDir . '/Modules/StockIn/actions/get_stock_in_items.php';
            } else {
                require $rootDir . '/Modules/StockIn/actions/get_stock_in.php';
            }
        } elseif ($method === 'POST') {
            require $rootDir . '/Modules/StockIn/actions/save_stock_in.php';
        } elseif ($method === 'DELETE') {
            require $rootDir . '/Modules/StockIn/actions/delete_stock_in.php';
        }
        break;

    // 6. STOCK OUT (Modules/StockOut)
    case 'stock-out':
        if ($method === 'GET') {
            if ($idParam && is_numeric($idParam)) {
                $_GET['stock_out_id'] = (int)$idParam;
                require $rootDir . '/Modules/StockOut/actions/get_stock_out_items.php';
            } else {
                require $rootDir . '/Modules/StockOut/actions/get_stock_out.php';
            }
        } elseif ($method === 'POST') {
            require $rootDir . '/Modules/StockOut/actions/save_stock_out.php';
        } elseif ($method === 'DELETE') {
            require $rootDir . '/Modules/StockOut/actions/delete_stock_out.php';
        }
        break;

    // 7. POS & TRANSACTIONS (Modules/POS)
    case 'pos':
        if ($actionParam === 'checkout' || $idParam === 'checkout') {
            require $rootDir . '/Modules/POS/actions/checkout.php';
        }
        break;

    case 'transactions':
        if ($method === 'GET') {
            if ($idParam && is_numeric($idParam)) {
                $_GET['id'] = (int)$idParam;
                require $rootDir . '/Modules/POS/actions/get_sale_details.php';
            } else {
                require $rootDir . '/Modules/POS/actions/get_sales.php';
            }
        }
        break;

    // 8. CONVERSIONS (Modules/Conversion)
    case 'conversions':
        if ($method === 'GET') {
            require $rootDir . '/Modules/Conversion/actions/get_conversions.php';
        } elseif ($method === 'POST') {
            require $rootDir . '/Modules/Conversion/actions/convert.php';
        }
        break;

    // 9. MOVEMENTS (Modules/StockMovements)
    case 'movements':
        require $rootDir . '/Modules/StockMovements/actions/get_movements.php';
        break;

    // 10. FORECASTS (Modules/Forecast)
    case 'forecasts':
        if ($idParam === 'purchase-order' || $actionParam === 'purchase-order') {
            require $rootDir . '/Modules/Forecast/actions/create_po.php';
        } else {
            require $rootDir . '/Modules/Forecast/actions/get_forecast.php';
        }
        break;

    // 11. DASHBOARD (Modules/Dashboard)
    case 'dashboard':
        if ($idParam === 'metrics') {
            require $rootDir . '/Modules/Dashboard/actions/get_metrics.php';
        } else {
            require $rootDir . '/Modules/Dashboard/actions/get_stats.php';
        }
        break;

    // 12. REPORTS (Modules/Reports)
    case 'reports':
        if ($idParam === 'export') {
            require $rootDir . '/Modules/Reports/actions/export_csv.php';
        } else {
            $_GET['type'] = $idParam ?? 'sales';
            require $rootDir . '/Modules/Reports/actions/get_reports.php';
        }
        break;

    default:
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => "API endpoint '{$subPath}' not found."
        ]);
        break;
}

