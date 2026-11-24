// Supabase configuration - REPLACE THESE WITH YOUR ACTUAL KEYS
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current user session
let currentUser = null;
let currentShopId = null;

// Auth functions
async function signUp(email, password, shopName, phone) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });
  
  if (error) {
    alert('Error: ' + error.message);
    return null;
  }
  
  if (data.user) {
    // Create shop record
    const { error: shopError } = await supabase
      .from('shops')
      .insert([
        { 
          id: data.user.id, 
          shop_name: shopName,
          phone: phone,
          language: 'sw'
        }
      ]);
    
    if (shopError) {
      alert('Error creating shop: ' + shopError.message);
      return null;
    }
    
    return data.user;
  }
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) {
    alert('Error: ' + error.message);
    return null;
  }
  
  if (data.user) {
    currentUser = data.user;
    await loadShopData();
    return data.user;
  }
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    currentUser = null;
    currentShopId = null;
    // Clear local data
    localStorage.clear();
    location.reload();
  }
}

async function loadShopData() {
  if (!currentUser) return;
  
  // Get shop info
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  if (shop) {
    currentShopId = shop.id;
    currentLang = shop.language || 'sw';
    
    // Load products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', currentShopId);
    
    if (products) {
      DB.set('products', products.map(p => ({
        id: p.id,
        name: p.name,
        nameEn: p.name_en,
        price: p.price,
        cost: p.cost
      })));
    }
    
    // Load sales
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .eq('shop_id', currentShopId)
      .order('timestamp', { ascending: false });
    
    if (sales) {
      DB.set('sales', sales.map(s => ({
        id: s.id,
        productId: s.product_id,
        productName: s.product_name,
        qty: s.qty,
        price: s.price,
        cost: s.cost,
        total: s.total,
        totalCost: s.total_cost,
        type: s.type,
        customer: s.customer,
        timestamp: s.timestamp
      })));
    }
    
    // Load debts
    const { data: debts } = await supabase
      .from('debts')
      .select('*')
      .eq('shop_id', currentShopId);
    
    if (debts) {
      DB.set('debts', debts.map(d => ({
        customer: d.customer,
        amount: d.amount,
        history: d.history || []
      })));
    }
    
    // Load customers
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', currentShopId);
    
    if (customers) {
      DB.set('customers', customers.map(c => ({ name: c.name })));
    }
  }
}

// Sync functions
async function syncProductToCloud(product) {
  if (!currentShopId) return;
  
  const { error } = await supabase
    .from('products')
    .upsert({
      id: product.id,
      shop_id: currentShopId,
      name: product.name,
      name_en: product.nameEn,
      price: product.price,
      cost: product.cost
    });
  
  if (error) console.error('Error syncing product:', error);
}

async function syncSaleToCloud(sale) {
  if (!currentShopId) return;
  
  const { error } = await supabase
    .from('sales')
    .insert({
      shop_id: currentShopId,
      product_id: sale.productId,
      product_name: sale.productName,
      qty: sale.qty,
      price: sale.price,
      cost: sale.cost,
      total: sale.total,
      total_cost: sale.totalCost,
      type: sale.type,
      customer: sale.customer,
      timestamp: sale.timestamp
    });
  
  if (error) console.error('Error syncing sale:', error);
}

async function syncDebtToCloud(debt) {
  if (!currentShopId) return;
  
  const { error } = await supabase
    .from('debts')
    .upsert({
      shop_id: currentShopId,
      customer: debt.customer,
      amount: debt.amount,
      history: debt.history
    }, {
      onConflict: 'shop_id,customer'
    });
  
  if (error) console.error('Error syncing debt:', error);
}

async function syncCustomerToCloud(customer) {
  if (!currentShopId) return;
  
  const { error } = await supabase
    .from('customers')
    .upsert({
      shop_id: currentShopId,
      name: customer.name
    }, {
      onConflict: 'shop_id,name'
    });
  
  if (error) console.error('Error syncing customer:', error);
}

// Check auth state on load
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    currentUser = session.user;
    loadShopData().then(() => {
      document.getElementById('auth-screen').classList.add('hidden');
      document.getElementById('main-app').classList.remove('hidden');
      showScreen('sell');
    });
  }
});