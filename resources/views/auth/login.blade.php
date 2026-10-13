<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Login | PharmaTrack - Xyra Andrea Pharmacy</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- RemixIcon -->
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet">
  
  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            pharmacy: {
              50: '#f0fdfa',
              100: '#ccfbf1',
              500: '#00a896',
              600: '#028090',
              700: '#05668d',
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            heading: ['Outfit', 'sans-serif'],
          }
        }
      }
    }
  </script>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white relative overflow-hidden">
  
  <!-- Decorative Ambient Glows -->
  <div class="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>
  <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

  <main class="w-full max-w-[440px] bg-white/95 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl shadow-black/40 p-7 sm:p-9 relative z-10">
    
    <!-- Brand Header -->
    <header class="text-center mb-7">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white text-3xl shadow-lg shadow-teal-500/30 mb-3.5 transform transition hover:scale-105">
        <i class="ri-capsule-fill"></i>
      </div>
      <h1 class="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">PharmaTrack</h1>
      <p class="text-xs font-bold uppercase tracking-wider text-teal-600 mt-0.5">Xyra Andrea Pharmacy</p>
      <p class="text-xs text-slate-500 mt-1">POS Sales & Inventory with AI Demand Forecasting</p>
    </header>

    @if ($errors->any())
      <div class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
        <i class="ri-error-warning-fill text-lg shrink-0 text-red-500"></i>
        <span>{{ $errors->first() }}</span>
      </div>
    @endif

    <!-- Login Form -->
    <form id="login-form" action="{{ route('login') }}" method="POST" class="space-y-4">
      @csrf
      
      <div>
        <label for="login" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Email or Username
        </label>
        <div class="relative flex items-center">
          <i class="ri-user-3-line absolute left-3.5 text-slate-400 text-lg pointer-events-none"></i>
          <input 
            type="text" 
            id="login" 
            name="login" 
            value="{{ old('login', 'admin@pharmatrack.com') }}" 
            placeholder="admin@pharmatrack.com or admin"
            required 
            autofocus
            class="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition"
          >
        </div>
      </div>

      <div>
        <label for="password" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <div class="relative flex items-center">
          <i class="ri-lock-2-line absolute left-3.5 text-slate-400 text-lg pointer-events-none"></i>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value="admin123" 
            placeholder="••••••••"
            required
            class="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition"
          >
          <button 
            type="button" 
            id="toggle-password" 
            class="absolute right-3.5 text-slate-400 hover:text-slate-600 transition text-lg"
            title="Toggle password visibility"
          >
            <i class="ri-eye-line" id="toggle-icon"></i>
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-500 pt-0.5">
        <label class="flex items-center gap-2 cursor-pointer font-medium select-none">
          <input type="checkbox" name="remember" value="1" checked class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300">
          <span>Remember session</span>
        </label>
        <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
          <i class="ri-shield-check-line"></i> TLS Secure
        </span>
      </div>

      <button 
        type="submit" 
        id="btn-submit"
        class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-heading font-bold text-sm tracking-wide shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition transform active:scale-[0.99] cursor-pointer"
      >
        <span>Sign In to System</span>
        <i class="ri-arrow-right-line"></i>
      </button>
    </form>

    <!-- Quick Demo Accounts -->
    <footer class="mt-6 pt-5 border-t border-dashed border-slate-200 text-center">
      <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1">
        <i class="ri-key-2-line text-teal-600"></i> Click to Auto-Fill Credentials
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button 
          type="button" 
          onclick="fillCredentials('admin@pharmatrack.com', 'admin123')"
          class="p-3 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/90 hover:border-teal-400 rounded-xl text-left transition group cursor-pointer shadow-sm"
        >
          <div class="text-xs font-bold text-slate-800 group-hover:text-teal-800 flex items-center justify-between">
            <span class="flex items-center gap-1.5"><i class="ri-shield-user-fill text-teal-600 text-sm"></i> Admin</span>
            <span class="text-[10px] font-bold text-teal-700 bg-white/90 px-1.5 py-0.5 rounded shadow-xs">Auto Fill</span>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600 font-mono leading-tight space-y-0.5">
            <div><span class="text-slate-400 font-sans">User:</span> <strong class="text-slate-700">admin@pharmatrack.com</strong></div>
            <div><span class="text-slate-400 font-sans">Pass:</span> <strong class="text-teal-700">admin123</strong></div>
          </div>
        </button>

        <button 
          type="button" 
          onclick="fillCredentials('cashier@pharmatrack.local', 'cashier123')"
          class="p-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 rounded-xl text-left transition group cursor-pointer shadow-sm"
        >
          <div class="text-xs font-bold text-slate-800 group-hover:text-slate-900 flex items-center justify-between">
            <span class="flex items-center gap-1.5"><i class="ri-shopping-cart-line text-teal-600 text-sm"></i> Cashier</span>
            <span class="text-[10px] font-bold text-slate-600 bg-white/90 px-1.5 py-0.5 rounded shadow-xs">Auto Fill</span>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600 font-mono leading-tight space-y-0.5">
            <div><span class="text-slate-400 font-sans">User:</span> <strong class="text-slate-700">cashier@pharmatrack.local</strong></div>
            <div><span class="text-slate-400 font-sans">Pass:</span> <strong class="text-teal-700">cashier123</strong></div>
          </div>
        </button>
      </div>
    </footer>
  </main>

  <script>
    // Password visibility toggle
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-icon');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        toggleIcon.className = isPassword ? 'ri-eye-off-line' : 'ri-eye-line';
      });
    }

    // Quick credentials autofill
    function fillCredentials(login, pwd) {
      document.getElementById('login').value = login;
      document.getElementById('password').value = pwd;
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        icon: 'info',
        title: 'Credentials Loaded!'
      });
    }

    // Form submission with loading indicator
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
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
            },
            body: formData
          });

          const data = await res.json();

          if (res.ok && data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Access Granted',
              text: data.message || 'Welcome to PharmaTrack!',
              showConfirmButton: false,
              timer: 1000
            }).then(() => {
              window.location.href = data.redirect || "{{ route('home') }}";
            });
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In to System</span> <i class="ri-arrow-right-line"></i>';
            Swal.fire({
              icon: 'error',
              title: 'Authentication Failed',
              text: data.message || 'Invalid email or password.'
            });
          }
        } catch (err) {
          loginForm.submit();
        }
      });
    }
  </script>
</body>
</html>