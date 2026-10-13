<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLogin(): View|RedirectResponse|\Illuminate\Http\Response
    {
        if (Auth::check()) {
            return redirect()->route('home');
        }

        $loginPath = resource_path('views/auth/login.blade.php');
        if (!file_exists($loginPath) || filesize($loginPath) < 200) {
            @mkdir(dirname($loginPath), 0755, true);
            file_put_contents($loginPath, self::getLoginBladeContent());
        }

        return view('auth.login');
    }

    /**
     * Process authentication attempt.
     */
    public function login(Request $request): JsonResponse|RedirectResponse
    {
        $credentials = $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $loginInput = trim($credentials['login']);
        $password = $credentials['password'];
        $remember = $request->boolean('remember', false);

        // Determine if input is email or username
        $email = $loginInput;
        if (!filter_var($loginInput, FILTER_VALIDATE_EMAIL)) {
            // Find user by name or match username prefix
            $matchedUser = User::where('email', $loginInput . '@pharmatrack.com')
                ->orWhere('email', $loginInput . '@pharmatrack.local')
                ->orWhere('name', 'like', "%{$loginInput}%")
                ->first();

            if ($matchedUser) {
                $email = $matchedUser->email;
            }
        }

        if (Auth::attempt(['email' => $email, 'password' => $password], $remember)) {
            $request->session()->regenerate();
            $user = Auth::user();

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success'  => true,
                    'message'  => "Welcome back, {$user->name}!",
                    'redirect' => route('home'),
                    'user'     => [
                        'id'    => $user->id,
                        'name'  => $user->name,
                        'email' => $user->email,
                        'role'  => $user->role,
                    ]
                ]);
            }

            return redirect()->intended(route('home'));
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email/username or password. Please check your credentials.'
            ], 422);
        }

        return back()
            ->withErrors(['login' => 'Invalid email or password.'])
            ->withInput($request->only('login', 'remember'));
    }

    /**
     * Log out current user session.
     */
    public function logout(Request $request): JsonResponse|RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success'  => true,
                'message'  => 'Signed out successfully.',
                'redirect' => route('login')
            ]);
        }

        return redirect()->route('login');
    }

    /**
     * Get currently authenticated user data.
     */
    public function me(): JsonResponse
    {
        if (Auth::check()) {
            return response()->json([
                'authenticated' => true,
                'user'          => Auth::user()
            ]);
        }

        return response()->json([
            'authenticated' => false
        ], 401);
    }

    /**
     * Fallback template content for login screen.
     */
    public static function getLoginBladeContent(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Login | PharmaTrack - Xyra Andrea Pharmacy</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <style>
    :root {
      --primary: #00a896;
      --primary-dark: #028090;
      --primary-light: #e0f2f1;
      --navy: #0f172a;
      --card-bg: rgba(255, 255, 255, 0.96);
      --border-color: #e2e8f0;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --radius-lg: 18px;
      --radius-md: 12px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: linear-gradient(135deg, #091e2f 0%, #0c2d3e 40%, #004d47 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      position: relative;
    }
    .login-container {
      width: 100%;
      max-width: 440px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35);
      padding: 2.5rem 2.25rem;
    }
    .brand-header { text-align: center; margin-bottom: 2rem; }
    .brand-badge {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .brand-title { font-family: 'Outfit', sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--navy); }
    .brand-subtitle { font-size: 0.82rem; color: var(--primary-dark); font-weight: 700; text-transform: uppercase; margin-top: 0.2rem; }
    .brand-desc { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-label { display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.45rem; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 1rem; color: var(--text-muted); font-size: 1.2rem; pointer-events: none; }
    .form-control {
      width: 100%;
      height: 48px;
      padding: 0 1rem 0 2.85rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.92rem;
      background: #f8fafc;
      outline: none;
    }
    .form-control:focus { background: #fff; border-color: var(--primary); }
    .toggle-password-btn { position: absolute; right: 0.85rem; background: none; border: none; color: var(--text-muted); font-size: 1.15rem; cursor: pointer; }
    .remember-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; font-size: 0.82rem; color: var(--text-muted); }
    .remember-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 600; }
    .btn-login {
      width: 100%;
      height: 50px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border: none;
      border-radius: var(--radius-md);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
    }
    .demo-box { margin-top: 1.75rem; padding-top: 1.5rem; border-top: 1px dashed var(--border-color); text-align: center; }
    .demo-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.85rem; }
    .demo-pills { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
    .demo-btn {
      padding: 0.6rem 0.75rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .demo-btn span.role { font-size: 0.68rem; color: var(--primary-dark); font-weight: 600; display: block; }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="brand-header">
      <div class="brand-badge"><i class="ri-capsule-fill"></i></div>
      <h1 class="brand-title">PharmaTrack</h1>
      <div class="brand-subtitle">Xyra Andrea Pharmacy</div>
      <p class="brand-desc">POS Sales & Inventory with AI Demand Forecasting</p>
    </div>

    @if ($errors->any())
      <div style="margin-bottom: 1.25rem; padding: 0.85rem 1rem; border-radius: 10px; background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; font-size: 0.85rem; font-weight: 600;">
        {{ $errors->first() }}
      </div>
    @endif

    <form id="login-form" action="{{ route('login') }}" method="POST">
      @csrf
      <div class="form-group">
        <label class="form-label" for="login">Email or Username</label>
        <div class="input-wrapper">
          <input type="text" id="login" name="login" class="form-control" placeholder="admin@pharmatrack.com or admin" value="{{ old('login', 'admin@pharmatrack.com') }}" required autofocus>
          <i class="ri-user-3-line input-icon"></i>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <div class="input-wrapper">
          <input type="password" id="password" name="password" class="form-control" placeholder="••••••••" value="admin123" required>
          <i class="ri-lock-2-line input-icon"></i>
          <button type="button" class="toggle-password-btn" id="toggle-password"><i class="ri-eye-line" id="toggle-icon"></i></button>
        </div>
      </div>
      <div class="remember-row">
        <label class="remember-label"><input type="checkbox" name="remember" value="1" checked> <span>Keep me signed in</span></label>
        <span style="color: var(--primary-dark); font-weight: 600; font-size: 0.75rem;">SSL Secured</span>
      </div>
      <button type="submit" class="btn-login" id="btn-submit"><span>Sign In to System</span> <i class="ri-arrow-right-line"></i></button>
    </form>
    <div class="demo-box">
      <div class="demo-title"><i class="ri-key-2-line"></i> Quick Demo Access</div>
      <div class="demo-pills">
        <button type="button" class="demo-btn" onclick="fillCredentials('admin@pharmatrack.com', 'admin123')">
          <div><i class="ri-shield-user-fill"></i> Admin / Pharmacist</div>
          <span class="role">Full System Control</span>
        </button>
        <button type="button" class="demo-btn" onclick="fillCredentials('cashier@pharmatrack.local', 'cashier123')">
          <div><i class="ri-shopping-cart-line"></i> Cashier Terminal</div>
          <span class="role">Sales Counter Only</span>
        </button>
      </div>
    </div>
  </div>
  <script>
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-icon');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleIcon.className = type === 'password' ? 'ri-eye-line' : 'ri-eye-off-line';
      });
    }
    function fillCredentials(login, pwd) {
      document.getElementById('login').value = login;
      document.getElementById('password').value = pwd;
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, icon: 'info', title: 'Credentials filled!' });
    }
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Authenticating...';
        const formData = new FormData(loginForm);
        try {
          const res = await fetch("{{ route('login') }}", {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value },
            body: formData
          });
          const data = await res.json();
          if (res.ok && data.success) {
            Swal.fire({ icon: 'success', title: 'Access Granted', text: data.message || 'Welcome to PharmaTrack!', showConfirmButton: false, timer: 1200 }).then(() => {
              window.location.href = data.redirect || "{{ route('home') }}";
            });
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In to System';
            Swal.fire({ icon: 'error', title: 'Authentication Failed', text: data.message || 'Invalid email or password.' });
          }
        } catch (err) {
          loginForm.submit();
        }
      });
    }
  </script>
</body>
</html>
HTML;
    }
}

