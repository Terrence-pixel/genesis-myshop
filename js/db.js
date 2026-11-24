// We'll add Dexie.js CDN link in index.html later
// For now, simple localStorage wrapper

const DB = {
  get(key) {
    const data = localStorage.getItem('genesis_' + key);
    return data ? JSON.parse(data) : null;
  },
  
  set(key, value) {
    localStorage.setItem('genesis_' + key, JSON.stringify(value));
  },
  
  // Initialize default data
  init() {
    if (!this.get('products')) {
      this.set('products', [
        { id: 1, name: 'Mkate', nameEn: 'Bread', price: 50, cost: 35 },
        { id: 2, name: 'Maziwa', nameEn: 'Milk', price: 60, cost: 45 },
        { id: 3, name: 'Sukari', nameEn: 'Sugar', price: 120, cost: 100 },
        { id: 4, name: 'Chai', nameEn: 'Tea', price: 20, cost: 12 },
        { id: 5, name: 'Mafuta', nameEn: 'Cooking Oil', price: 250, cost: 200 },
        { id: 6, name: 'Unga', nameEn: 'Flour', price: 140, cost: 110 }
      ]);
    }
    
    if (!this.get('sales')) this.set('sales', []);
    if (!this.get('debts')) this.set('debts', []);
    if (!this.get('customers')) this.set('customers', []);
    if (!this.get('settings')) {
      this.set('settings', { language: 'sw', pin: '1234', shopName: 'Duka Langu' });
    }
  }
};

DB.init();