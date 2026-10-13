<?php
/**
 * PharmaTrack - Native PHP Login Portal
 * Xyra Andrea Pharmacy - Sales & Inventory Management System
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/session.php';
require_once __DIR__ . '/config/helpers.php';

// Redirect if already authenticated
if (isAuthenticated()) {
    header('Location: index.html');
    exit;
}

$errorMessage = '';
$loginValue = 'admin@pharmatrack.com';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $loginInput = sanitizeString($_POST['login'] ?? '');
    $password = $_POST['password'] ?? '';
    $loginValue = $loginInput;

    if (empty($loginInput) || empty($password)) {
        $errorMessage = 'Please enter both your email or username and password.';
    } else {
        try {
            $pdo = getDatabaseConnection();
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR name LIKE ? LIMIT 1");
            $stmt->execute([$loginInput, "%{$loginInput}%"]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                loginUser($user);
                header('Location: index.html');
                exit;
            } else {
                $errorMessage = 'Invalid credentials. Please verify your email/username and password.';
            }
        } catch (Exception $e) {
            $errorMessage = 'System error: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sign In | PharmaTrack - Xyra Andrea Pharmacy</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- RemixIcon -->
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet">

  <!-- Bootstrap 5.3.3 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

  <!-- PharmaTrack Stylesheet -->
  <link rel="stylesheet" href="css/style.css?v=login1">

  <style>
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      background-image: 
        radial-gradient(at 15% 15%, rgba(0, 168, 150, 0.08) 0px, transparent 55%),
        radial-gradient(at 85% 85%, rgba(2, 128, 144, 0.08) 0px, transparent 55%);
      background-attachment: fixed;
      padding: 1.5rem;
    }
    .login-container {
      width: 100%;
      max-width: 440px;
    }
    .login-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      padding: 2.25rem 2rem;
      position: relative;
    }
    .brand-logo-badge {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: linear-gradient(135deg, #00a896 0%, #028090 100%);
      color: #ffffff;
      font-size: 2rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(0, 168, 150, 0.28);
      margin-bottom: 1rem;
    }
    .demo-badge-btn {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .demo-badge-btn:hover {
      background: #e2e8f0;
      border-color: #cbd5e1;
      color: #0f172a;
    }
    .demo-badge-btn.active-admin {
      background: rgba(0, 168, 150, 0.12);
      border-color: rgba(0, 168, 150, 0.3);
      color: #00a896;
    }
  </style>
</head>
<body>

  <div class="login-container">
    <div class="login-card">
      
      <!-- Brand Header -->
      <div class="text-center mb-4">
        <div class="brand-logo-badge">
          <i class="ri-capsule-fill"></i>
        </div>
        <h2 style="font-family: var(--font-heading); font-size: 1.65rem; font-weight: 800; color: #0f172a; margin-bottom: 0.2rem;">
          PharmaTrack
        </h2>
        <span class="badge bg-success-subtle text-success border border-success-subtle text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">
          Xyra Andrea Pharmacy
        </span>
        <p class="text-muted small mt-2 mb-0">Sales & Inventory Management System</p>
      </div>

      <!-- Error Alert -->
      <?php if (!empty($errorMessage)): ?>
        <div class="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 border-danger-subtle" role="alert" style="font-size: 0.85rem;">
          <i class="ri-error-warning-fill text-danger fs-5"></i>
          <div><?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') ?></div>
        </div>
      <?php endif; ?>

      <!-- Login Form -->
      <form action="login.php" method="POST" id="form-login">
        <div class="mb-3">
          <label for="input-login" class="form-label text-dark small fw-bold text-uppercase" style="letter-spacing: 0.4px;">
            Email or Username
          </label>
          <div class="input-group">
            <span class="input-group-text bg-light text-muted border-end-0">
              <i class="ri-user-3-line"></i>
            </span>
            <input 
              type="text" 
              class="form-control border-start-0 ps-0" 
              id="input-login" 
              name="login" 
              value="<?= htmlspecialchars($loginValue, ENT_QUOTES, 'UTF-8') ?>" 
              placeholder="e.g. admin@pharmatrack.com"
              required 
              autofocus
            >
          </div>
        </div>

        <div class="mb-3">
          <label for="input-password" class="form-label text-dark small fw-bold text-uppercase" style="letter-spacing: 0.4px;">
            Password
          </label>
          <div class="input-group">
            <span class="input-group-text bg-light text-muted border-end-0">
              <i class="ri-lock-password-line"></i>
            </span>
            <input 
              type="password" 
              class="form-control border-start-0 border-end-0 px-0" 
              id="input-password" 
              name="password" 
              value="admin123" 
              placeholder="••••••••"
              required
            >
            <button class="btn btn-outline-secondary border-start-0" type="button" id="btn-toggle-password" title="Show / Hide Password">
              <i class="ri-eye-line" id="toggle-icon"></i>
            </button>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-4">
          <div class="form-check mb-0">
            <input class="form-check-input" type="checkbox" value="1" id="remember-me" checked>
            <label class="form-check-label text-muted small" for="remember-me">
              Keep signed in
            </label>
          </div>
          <span class="badge bg-light text-muted border" style="font-size: 0.7rem;">
            <i class="ri-shield-check-line text-success"></i> Secure Session
          </span>
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2 fs-6 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
          <span>Sign In to Terminal</span>
          <i class="ri-arrow-right-line"></i>
        </button>
      </form>

      <!-- Quick Demo Credentials Selector -->
      <div class="mt-4 pt-3 border-top text-center">
        <span class="text-muted d-block mb-2" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
          <i class="ri-key-2-line text-primary"></i> Click to Auto-Fill Demo Accounts:
        </span>
        <div class="d-flex justify-content-center gap-2 flex-wrap">
          <button type="button" class="demo-badge-btn" onclick="setDemo('admin@pharmatrack.com', 'admin123')">
            <i class="ri-shield-user-line text-primary"></i> <strong>Admin</strong> (admin123)
          </button>
          <button type="button" class="demo-badge-btn" onclick="setDemo('cashier@pharmatrack.com', 'cashier123')">
            <i class="ri-shopping-bag-3-line text-success"></i> <strong>Cashier</strong> (cashier123)
          </button>
        </div>
      </div>

    </div>
  </div>

  <!-- Bootstrap 5.3.3 JS Bundle -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <script>
    // Toggle Password Visibility
    const toggleBtn = document.getElementById('btn-toggle-password');
    const passwordInput = document.getElementById('input-password');
    const toggleIcon = document.getElementById('toggle-icon');

    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      toggleIcon.className = isPassword ? 'ri-eye-off-line' : 'ri-eye-line';
    });

    // Auto-fill Demo Credentials
    function setDemo(login, password) {
      document.getElementById('input-login').value = login;
      document.getElementById('input-password').value = password;
      document.getElementById('input-password').setAttribute('type', 'password');
      toggleIcon.className = 'ri-eye-line';
    }
  </script>
</body>
</html>

