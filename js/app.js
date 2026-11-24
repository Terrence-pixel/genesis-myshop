// Auth handlers
function showSignup() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
  document.getElementById('auth-title').textContent = 'Create your shop account';
}

function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('auth-title').textContent = 'Sign in to your shop';
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }
  
  await signIn(email, password);
}

async function handleSignup() {
  const shopName = document.getElementById('signup-shopname').value;
  const phone = document.getElementById('signup-phone').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  if (!shopName || !email || !password) {
    alert('Please fill in all required fields');
    return;
  }
  
  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }
  
  const user = await signUp(email, password, shopName, phone);
  if (user) {
    alert('Account created! Please check your email to confirm, then sign in.');
    showLogin();
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      currentUser = session.user;
      loadShopData().then(() => {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Set shop name in header
        supabase
          .from('shops')
          .select('shop_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              document.getElementById('shop-name-display').textContent = data.shop_name;
            }
          });
        
        showScreen('sell');
      });
    }
  });
});

// Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}