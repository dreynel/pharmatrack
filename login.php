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
  <link rel="stylesheet" href="css/style.css?v=20261102_v9">

  <style>
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      background-image: 
        radial-gradient(at 0% 0%, rgba(0, 168, 150, 0.09) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(2, 128, 144, 0.08) 0px, transparent 50%),
        radial-gradient(rgba(0, 168, 150, 0.05) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 28px 28px;
      background-attachment: fixed;
      padding: 1.5rem;
      position: relative;
      overflow-x: hidden;
    }
    .login-container {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 2;
    }
    .login-ambient-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(0, 168, 150, 0.22) 0%, rgba(2, 128, 144, 0.08) 50%, transparent 70%);
      filter: blur(45px);
      pointer-events: none;
      z-index: 1;
    }
    .login-card {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 168, 150, 0.28);
      border-radius: 22px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.14), 0 0 25px rgba(0, 168, 150, 0.08);
      padding: 2.75rem 2.25rem;
      position: relative;
    }
    .brand-logo-badge {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #00a896 0%, #028090 100%);
      color: #ffffff;
      font-size: 2.2rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(0, 168, 150, 0.35);
      margin-bottom: 1.15rem;
      animation: floatBadge 3.5s ease-in-out infinite alternate;
    }
    @keyframes floatBadge {
      0% { transform: translateY(0); }
      100% { transform: translateY(-6px); }
    }
    .demo-badge-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.45rem 0.85rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .demo-badge-btn:hover {
      background: #ffffff;
      border-color: #00a896;
      color: #008779;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 168, 150, 0.15);
    }
    .form-control:focus {
      border-color: #00a896 !important;
      box-shadow: 0 0 0 3px rgba(0, 168, 150, 0.18) !important;
    }

    /* Cyber-Deck Mode for Login */
    body.cyber-theme {
      background-color: #060913 !important;
      background-image: 
        radial-gradient(at 15% 15%, rgba(0, 242, 254, 0.15) 0px, transparent 55%),
        radial-gradient(at 85% 85%, rgba(0, 229, 204, 0.12) 0px, transparent 55%),
        linear-gradient(to right, rgba(0, 242, 254, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 242, 254, 0.04) 1px, transparent 1px) !important;
      background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px !important;
    }
    body.cyber-theme .login-card {
      background: rgba(11, 18, 33, 0.94) !important;
      border: 1px solid rgba(0, 242, 254, 0.3) !important;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.2) !important;
      color: #f1f5f9;
    }
    body.cyber-theme .login-card h2 {
      color: #ffffff !important;
      text-shadow: 0 0 15px rgba(0, 242, 254, 0.4);
    }
    body.cyber-theme .form-control {
      background: rgba(15, 23, 42, 0.9) !important;
      border-color: rgba(0, 242, 254, 0.25) !important;
      color: #ffffff !important;
    }
    body.cyber-theme .input-group-text {
      background: rgba(15, 23, 42, 0.95) !important;
      border-color: rgba(0, 242, 254, 0.25) !important;
      color: #00f2fe !important;
    }
    body.cyber-theme .demo-badge-btn {
      background: rgba(15, 23, 42, 0.85) !important;
      border-color: rgba(0, 242, 254, 0.25) !important;
      color: #94a3b8 !important;
    }
    body.cyber-theme .demo-badge-btn:hover {
      background: rgba(0, 242, 254, 0.15) !important;
      border-color: #00f2fe !important;
      color: #00f2fe !important;
    }
    body.cyber-theme .form-check-label {
      color: #cbd5e1 !important;
    }
    body.cyber-theme .badge.bg-light {
      background: rgba(15, 23, 42, 0.95) !important;
      color: #cbd5e1 !important;
      border-color: rgba(0, 242, 254, 0.25) !important;
    }
  </style>
  <script>
    (function() {
      const theme = localStorage.getItem('pharmatrack_theme') || 'cyber';
      if (theme === 'cyber') {
        document.documentElement.setAttribute('data-theme', 'cyber');
        document.addEventListener('DOMContentLoaded', () => {
          if (document.body) document.body.classList.add('cyber-theme');
        });
      }
    })();
  </script>
</head>
<body>

  <div class="login-container">
    <div class="login-ambient-glow"></div>
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

  <!-- Sound Engine -->
  <script src="js/ui/sound-fx.js?v=20261029_cyber"></script>

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

