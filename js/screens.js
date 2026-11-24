// Language strings
const STR = {
  sw: {
    sell: 'Uza',
    debts: 'Madeni',
    dayend: 'Siku',
    products: 'Bidhaa',
    cash: 'Pesa Taslimu',
    credit: 'Deni',
    total: 'Jumla',
    profit: 'Faida',
    owed: 'Madeni Yote',
    sold: 'Imeuzwa',
    cost: 'Gharama',
    addProduct: 'Ongeza Bidhaa',
    editProduct: 'Badilisha Bidhaa',
    customerName: 'Jina la Mteja',
    amount: 'Kiasi',
    save: 'Hifadhi',
    cancel: 'Ghairi',
    delete: 'Futa',
    edit: 'Badilisha',
    search: 'Tafuta bidhaa...',
    confirmDelete: 'Una uhakika? / Are you sure?'
  },
  en: {
    sell: 'Sell',
    debts: 'Debts',
    dayend: 'Day End',
    products: 'Products',
    cash: 'Cash',
    credit: 'Credit',
    total: 'Total',
    profit: 'Profit',
    owed: 'Total Owed',
    sold: 'Sold',
    cost: 'Cost',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    customerName: 'Customer Name',
    amount: 'Amount',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search products...',
    confirmDelete: 'Are you sure?'
  }
};

let currentLang = DB.get('settings').language || 'sw';
let currentSaleType = 'cash';
let selectedProduct = null;
let searchQuery = '';
let editingProductId = null;

function t(key) {
  return STR[currentLang][key] || key;
}

// SELL SCREEN
function renderSellScreen() {
  const products = DB.get('products');
  
  // Filter products by search
  const filtered = searchQuery 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  const html = `
    <h2 style="margin-bottom: 16px;">${t('sell')}</h2>
    
    <!-- Search bar -->
    <div class="form-group" style="margin-bottom: 16px;">
      <input 
        type="text" 
        id="product-search" 
        placeholder="${t('search')}" 
        value="${searchQuery}"
        oninput="updateSearch(this.value)"
        style="padding: 12px; font-size: 16px;"
      >
    </div>
    
    <div class="sale-type">
      <button class="${currentSaleType === 'cash' ? 'active' : ''}" onclick="setSaleType('cash')">
        ${t('cash')}
      </button>
      <button class="${currentSaleType === 'credit' ? 'active' : ''}" onclick="setSaleType('credit')">
        ${t('credit')}
      </button>
    </div>
    
    <div class="product-grid">
      ${filtered.map(p => `
        <button class="product-btn" onclick="selectProduct(${p.id})">
          <span>${currentLang === 'sw' ? p.name : p.nameEn}</span>
          <span class="price">KSh ${p.price}</span>
        </button>
      `).join('')}
    </div>
    
    ${filtered.length === 0 ? '<p style="text-align:center;color:#666;padding:20px;">Hakuna bidhaa / No products found</p>' : ''}
    
    <div id="sale-form" style="display: none;">
      <div class="form-group">
        <label>${t('amount')}</label>
        <input type="number" id="sale-qty" value="1" min="1">
      </div>
      
      ${currentSaleType === 'credit' ? `
        <div class="form-group">
          <label>${t('customerName')}</label>
          <input type="text" id="sale-customer" list="customers-list">
          <datalist id="customers-list">
            ${DB.get('customers').map(c => `<option value="${c.name}">`).join('')}
          </datalist>
        </div>
      ` : ''}
      
      <button class="primary" onclick="completeSale()">${t('save')}</button>
    </div>
  `;
  
  document.getElementById('sell-screen').innerHTML = html;
}

function updateSearch(value) {
  searchQuery = value;
  
  const products = DB.get('products');
  const filtered = searchQuery 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  // Find the list container and update it directly
  const listContainer = document.getElementById('product-list-container');
  if (listContainer) {
    listContainer.innerHTML = filtered.map(p => `
      <div class="product-item">
        <div>
          <div style="font-weight:600;">${currentLang === 'sw' ? p.name : p.nameEn}</div>
          <div style="font-size:12px;color:#666;">
            Sell: KSh ${p.price} | Cost: KSh ${p.cost}
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="editProduct(${p.id})" style="padding:8px 12px;background:#22c55e;color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
            ${t('edit')}
          </button>
          <button onclick="deleteProduct(${p.id})" style="padding:8px 12px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
            ${t('delete')}
          </button>
        </div>
      </div>
    `).join('') || '<p style="text-align:center;color:#666;padding:20px;">Hakuna bidhaa / No products found</p>';
  }
}

function setSaleType(type) {
  currentSaleType = type;
  selectedProduct = null;
  renderSellScreen();
}

function selectProduct(id) {
  selectedProduct = DB.get('products').find(p => p.id === id);
  document.getElementById('sale-form').style.display = 'block';
  document.getElementById('sale-qty').focus();
}

function completeSale() {
  const qty = parseInt(document.getElementById('sale-qty').value) || 1;
  const sale = {
    id: Date.now(),
    productId: selectedProduct.id,
    productName: currentLang === 'sw' ? selectedProduct.name : selectedProduct.nameEn,
    qty: qty,
    price: selectedProduct.price,
    cost: selectedProduct.cost,
    total: selectedProduct.price * qty,
    totalCost: selectedProduct.cost * qty,
    type: currentSaleType,
    customer: currentSaleType === 'credit' ? document.getElementById('sale-customer').value : null,
    timestamp: new Date().toISOString()
  };
  
  const sales = DB.get('sales');
  sales.push(sale);
  DB.set('sales', sales);
  
  // Sync to cloud
  syncSaleToCloud(sale);
  
  // Rest of function stays the same...
  
  // If credit, add to debts
  if (currentSaleType === 'credit' && sale.customer) {
    const debts = DB.get('debts');
    const existingDebt = debts.find(d => d.customer === sale.customer);
    
    if (existingDebt) {
      existingDebt.amount += sale.total;
      existingDebt.history.push({ amount: sale.total, date: sale.timestamp, type: 'add' });
    } else {
      debts.push({
        customer: sale.customer,
        amount: sale.total,
        history: [{ amount: sale.total, date: sale.timestamp, type: 'add' }]
      });
    }
    DB.set('debts', debts);
    
    // Add customer if new
    const customers = DB.get('customers');
    if (!customers.find(c => c.name === sale.customer)) {
      customers.push({ name: sale.customer });
      DB.set('customers', customers);
    }
  }
  
  // Reset
  selectedProduct = null;
  renderSellScreen();
  alert(`${t('save')}: KSh ${sale.total}`);
}

// DEBTS SCREEN
function renderDebtsScreen() {
  const debts = DB.get('debts');
  const html = `
    <h2 style="margin-bottom: 16px;">${t('debts')}</h2>
    
    ${debts.length === 0 ? '<p style="text-align:center;color:#666;padding:40px;">Hakuna madeni</p>' : ''}
    
    ${debts.map((d, i) => `
      <div class="debt-item">
        <div>
          <div style="font-weight:600;">${d.customer}</div>
          <div style="font-size:12px;color:#666;">${d.history.length} transactions</div>
        </div>
        <div style="text-align:right;">
          <div class="amount">KSh ${d.amount}</div>
          <button onclick="showDebtPayment(${i})" style="font-size:12px;color:#22c55e;background:none;border:none;cursor:pointer;">
            Lipa
          </button>
        </div>
      </div>
    `).join('')}
    
    <div id="debt-payment-form" style="display:none;margin-top:20px;padding:16px;background:#f8fafc;border-radius:12px;">
      <div class="form-group">
        <label>${t('amount')}</label>
        <input type="number" id="payment-amount" min="1">
      </div>
      <button class="primary" onclick="recordPayment()">${t('save')}</button>
      <button onclick="cancelPayment()" style="width:100%;padding:12px;margin-top:8px;background:none;border:1px solid #ddd;border-radius:12px;">
        ${t('cancel')}
      </button>
    </div>
  `;
  
  document.getElementById('debts-screen').innerHTML = html;
}

let selectedDebtIndex = null;

function showDebtPayment(index) {
  selectedDebtIndex = index;
  document.getElementById('debt-payment-form').style.display = 'block';
  document.getElementById('payment-amount').focus();
}

function recordPayment() {
  const amount = parseInt(document.getElementById('payment-amount').value);
  if (!amount || amount <= 0) return;
  
  const debts = DB.get('debts');
  const debt = debts[selectedDebtIndex];
  
  debt.amount -= amount;
  debt.history.push({ amount: -amount, date: new Date().toISOString(), type: 'payment' });
  
  if (debt.amount <= 0) {
    debts.splice(selectedDebtIndex, 1);
  }
  
  DB.set('debts', debts);
    // Sync to cloud
  syncDebtToCloud(debt);
  selectedDebtIndex = null;
  renderDebtsScreen();
}

function cancelPayment() {
  selectedDebtIndex = null;
  document.getElementById('debt-payment-form').style.display = 'none';
}

// DAY END SCREEN
function renderDayEndScreen() {
  const today = new Date().toDateString();
  const sales = DB.get('sales').filter(s => 
    new Date(s.timestamp).toDateString() === today
  );
  
  const totalSold = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = sales.reduce((sum, s) => sum + s.totalCost, 0);
  const grossProfit = totalSold - totalCost;
  const totalOwed = DB.get('debts').reduce((sum, d) => sum + d.amount, 0);
  
  const html = `
    <h2 style="margin-bottom: 16px;">${t('dayend')}</h2>
    
    <div class="stat-card">
      <div class="label">${t('sold')}</div>
      <div class="value">KSh ${totalSold.toLocaleString()}</div>
    </div>
    
    <div class="stat-card">
      <div class="label">${t('cost')}</div>
      <div class="value">KSh ${totalCost.toLocaleString()}</div>
    </div>
    
    <div class="stat-card profit">
      <div class="label">${t('profit')}</div>
      <div class="value">KSh ${grossProfit.toLocaleString()}</div>
    </div>
    
    <div class="stat-card owed">
      <div class="label">${t('owed')}</div>
      <div class="value">KSh ${totalOwed.toLocaleString()}</div>
    </div>
    
    <h3 style="margin:20px 0 12px;">Mauzo Ya Leo / Today's Sales</h3>
    ${sales.map(s => `
      <div style="padding:12px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;">
        <div>
          <div style="font-weight:500;">${s.productName} × ${s.qty}</div>
          <div style="font-size:12px;color:#666;">
            ${s.type === 'credit' ? 'Deni' : 'Cash'} ${s.customer ? '• ' + s.customer : ''}
          </div>
        </div>
        <div style="font-weight:600;">KSh ${s.total}</div>
      </div>
    `).join('')}
  `;
  
  document.getElementById('dayend-screen').innerHTML = html;
}

// PRODUCTS SCREEN
function renderProductsScreen() {
  const products = DB.get('products');
  
  const html = `
    <h2 style="margin-bottom: 16px;">${t('products')}</h2>
    
    <!-- Search bar -->
    <div class="form-group" style="margin-bottom: 16px;">
      <input 
  type="text" 
  id="product-search" 
  placeholder="${t('search')}" 
  value="${searchQuery}"
  onkeyup="updateSearch(this.value)"
  style="padding: 12px; font-size: 16px;"
>
    </div>
    
    <!-- Product list container - this gets updated without re-rendering the form -->
    <div id="product-list-container">
      ${products.map(p => `
        <div class="product-item">
          <div>
            <div style="font-weight:600;">${currentLang === 'sw' ? p.name : p.nameEn}</div>
            <div style="font-size:12px;color:#666;">
              Sell: KSh ${p.price} | Cost: KSh ${p.cost}
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="editProduct(${p.id})" style="padding:8px 12px;background:#22c55e;color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
              ${t('edit')}
            </button>
            <button onclick="deleteProduct(${p.id})" style="padding:8px 12px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer;">
              ${t('delete')}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
    
    <h3 style="margin:20px 0 12px;">${editingProductId ? t('editProduct') : t('addProduct')}</h3>
    
    <div class="form-group">
      <label>Jina (Kiswahili)</label>
      <input type="text" id="prod-name-sw" value="${editingProductId ? getEditingProduct().name : ''}">
    </div>
    
    <div class="form-group">
      <label>Name (English)</label>
      <input type="text" id="prod-name-en" value="${editingProductId ? getEditingProduct().nameEn : ''}">
    </div>
    
    <div class="form-group">
      <label>Bei / Selling Price</label>
      <input type="number" id="prod-price" min="1" value="${editingProductId ? getEditingProduct().price : ''}">
    </div>
    
    <div class="form-group">
      <label>Gharama / Cost Price</label>
      <input type="number" id="prod-cost" min="1" value="${editingProductId ? getEditingProduct().cost : ''}">
    </div>
    
    <button class="primary" onclick="${editingProductId ? 'updateProduct()' : 'addProduct()'}">${t('save')}</button>
    
    ${editingProductId ? `
      <button onclick="cancelEdit()" style="width:100%;padding:12px;margin-top:8px;background:none;border:1px solid #ddd;border-radius:12px;">
        ${t('cancel')}
      </button>
    ` : ''}
  `;
  
  document.getElementById('products-screen').innerHTML = html;
}

function getEditingProduct() {
  return DB.get('products').find(p => p.id === editingProductId) || {};
}

function editProduct(id) {
  editingProductId = id;
  renderProductsScreen();
  // Scroll to form
  document.getElementById('prod-name-sw').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  editingProductId = null;
  renderProductsScreen();
}

function updateProduct() {
  const name = document.getElementById('prod-name-sw').value.trim();
  const nameEn = document.getElementById('prod-name-en').value.trim() || name;
  const price = parseInt(document.getElementById('prod-price').value);
  const cost = parseInt(document.getElementById('prod-cost').value);
  
  if (!name || !price || !cost) return;
  
  const products = DB.get('products');
  const index = products.findIndex(p => p.id === editingProductId);
  
  if (index !== -1) {
    products[index] = {
      id: editingProductId,
      name: name,
      nameEn: nameEn,
      price: price,
      cost: cost
    };
    DB.set('products', products);
  }
  
  editingProductId = null;
  renderProductsScreen();
}

function deleteProduct(id) {
  if (!confirm(t('confirmDelete'))) return;
  
  const products = DB.get('products');
  const filtered = products.filter(p => p.id !== id);
  DB.set('products', filtered);
  
  // Also remove from search if it was the only result
  if (searchQuery) {
    searchQuery = '';
  }
  
  renderProductsScreen();
}

function addProduct() {
  const name = document.getElementById('prod-name-sw').value.trim();
  const nameEn = document.getElementById('prod-name-en').value.trim() || name;
  const price = parseInt(document.getElementById('prod-price').value);
  const cost = parseInt(document.getElementById('prod-cost').value);
  
  if (!name || !price || !cost) return;
  
   const newProduct = {
    id: Date.now(),
    name: name,
    nameEn: nameEn,
    price: price,
    cost: cost
  };
  
  products.push(newProduct);
  DB.set('products', products);
  
  // Sync to cloud
  syncProductToCloud(newProduct);
  
  // Clear form
  document.getElementById('prod-name-sw').value = '';
  document.getElementById('prod-name-en').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-cost').value = '';
  
  renderProductsScreen();
}

// NAVIGATION
function showScreen(screenName) {
  // Reset search when switching screens
  searchQuery = '';
  
  // Hide all screens
  document.querySelectorAll('.screen-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  // Show selected
  document.getElementById(screenName + '-screen').classList.remove('hidden');
  event.target.classList.add('active');
  
  // Render the screen
  switch(screenName) {
    case 'sell': renderSellScreen(); break;
    case 'debts': renderDebtsScreen(); break;
    case 'dayend': renderDayEndScreen(); break;
    case 'products': renderProductsScreen(); break;
  }
}