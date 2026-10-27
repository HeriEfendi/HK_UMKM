import Dexie from 'dexie';

export const db = new Dexie('FinancialAppDB');

// We define all stores under version 6.
// If the database does not exist or is at version 5 (created by raw idb),
// Dexie will upgrade it to version 6 and create the missing stores.
db.version(6).stores({
  // Existing FinancialAppDB stores (from native IndexedDB)
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id',
  ceklok_logs: 'id',
  ceklok_settings: 'key',

  // Merged umkm_marketplace stores (from Dexie)
  categories: '++id, name',
  products: '++id, name, price, stock, categoryId, featured',
  capitalCosts: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes'
});

// Version 7: Add project_id index to transactions for proper relational querying
db.version(7).stores({
  // Existing FinancialAppDB stores (from native IndexedDB)
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id, project_id',   // <-- tambah index project_id
  ceklok_logs: 'id',
  ceklok_settings: 'key',

  // Merged umkm_marketplace stores (from Dexie)
  categories: 'id, name',
  products: '++id, name, price, stock, categoryId, featured',
  savings: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes'
});

// Version 8: Add saving_accounts and saving_transactions for bank-like savings management
db.version(8).stores({
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id, project_id',
  ceklok_logs: 'id',
  ceklok_settings: 'key',
  categories: 'id, name',
  products: '++id, name, price, stock, categoryId, featured',
  savings: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes',
  saving_accounts: '++id, name, category',
  saving_transactions: '++id, accountId, type, date'
});

// Version 9: Standardize database tables and prevent SchemaDiff warnings
db.version(9).stores({
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id, project_id',
  ceklok_logs: 'id',
  ceklok_settings: 'key',
  categories: 'id, name',
  products: '++id, name, price, stock, categoryId, featured',
  savings: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes',
  saving_accounts: '++id, name, category',
  saving_transactions: '++id, accountId, type, date'
});

// Version 10: Add reminders table
db.version(10).stores({
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id, project_id',
  ceklok_logs: 'id',
  ceklok_settings: 'key',
  categories: 'id, name',
  products: '++id, name, price, stock, categoryId, featured',
  savings: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes',
  saving_accounts: '++id, name, category',
  saving_transactions: '++id, accountId, type, date',
  reminders: '++id, date, recurring'
});

// Version 11: Add notes and note_labels table for Google Keep feature
db.version(11).stores({
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id, project_id',
  ceklok_logs: 'id',
  ceklok_settings: 'key',
  categories: 'id, name',
  products: '++id, name, price, stock, categoryId, featured',
  savings: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes',
  saving_accounts: '++id, name, category',
  saving_transactions: '++id, accountId, type, date',
  reminders: '++id, date, recurring',
  notes: '++id, title, isPinned, isArchived, isTrashed, color, createdAt, updatedAt',
  note_labels: '++id, name'
});

// Version 12: Add expense_attachments and transaction_attachments for receipt photos / invoices
db.version(12).stores({
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id, project_id',
  ceklok_logs: 'id',
  ceklok_settings: 'key',
  categories: 'id, name',
  products: '++id, name, price, stock, categoryId, featured',
  savings: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes',
  saving_accounts: '++id, name, category',
  saving_transactions: '++id, accountId, type, date',
  reminders: '++id, date, recurring',
  notes: '++id, title, isPinned, isArchived, isTrashed, color, createdAt, updatedAt',
  note_labels: '++id, name',
  expense_attachments: '++id, expenseId, createdAt',
  transaction_attachments: '++id, transactionId, createdAt'
});

// Version 13: Ensure transaction_attachments store is available on upgrade
db.version(13).stores({
  projects: 'id',
  todos: 'id',
  team_todos: 'id',
  users: 'id',
  transactions: 'id, project_id',
  ceklok_logs: 'id',
  ceklok_settings: 'key',
  categories: 'id, name',
  products: '++id, name, price, stock, categoryId, featured',
  savings: '++id, createdAt, name, amount',
  debts: '++id, createdAt, name, amount, dueDate',
  incomes: '++id, createdAt, name, amount',
  expenses: '++id, createdAt, description, amount, date, category',
  dailyLedger: '++id, createdAt, description, amount, type',
  sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
  stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes',
  saving_accounts: '++id, name, category',
  saving_transactions: '++id, accountId, type, date',
  reminders: '++id, date, recurring',
  notes: '++id, title, isPinned, isArchived, isTrashed, color, createdAt, updatedAt',
  note_labels: '++id, name',
  expense_attachments: '++id, expenseId, createdAt',
  transaction_attachments: '++id, transactionId, createdAt'
});

let databaseSeeded = false;

export async function seedDatabase() {
  if (databaseSeeded) {
    return;
  }

  // 1. One-time data migration from the old umkm_marketplace database if it exists
  try {
    const oldDbExists = await Dexie.exists('umkm_marketplace');
    if (oldDbExists) {
      console.log('Migrating data from umkm_marketplace to FinancialAppDB...');
      const oldDb = new Dexie('umkm_marketplace');
      oldDb.version(3).stores({
        categories: 'id, name',
        products: '++id, name, price, stock, categoryId, featured',
        savings: '++id, createdAt, name, amount',
        debts: '++id, createdAt, name, amount, dueDate',
        incomes: '++id, createdAt, name, amount',
        expenses: '++id, createdAt, description, amount, date, category',
        dailyLedger: '++id, createdAt, description, amount, type',
        sales: '++id, createdAt, totalAmount, paymentMethod, amountPaid, changeAmount, items, notes',
        stockMutations: '++id, productId, type, changeQuantity, beforeStock, afterStock, createdAt, notes'
      });
      
      await oldDb.open();
      
      // Copy data from all tables in the old database to our new database
      for (const table of oldDb.tables) {
        const data = await table.toArray();
        if (data.length > 0) {
          console.log(`Copying ${data.length} records for table ${table.name}...`);
          await db.table(table.name).bulkPut(data);
        }
      }
      
      await oldDb.close();
      await Dexie.delete('umkm_marketplace');
      console.log('Migration completed and umkm_marketplace database deleted.');
    }
  } catch (err) {
    console.error('Failed to migrate data from umkm_marketplace:', err);
  }

  // 2. Safe seeding: Check if categories already exist to prevent wiping user data on refresh
  const categoryCount = await db.categories.count();
  if (categoryCount > 0) {
    databaseSeeded = true;
    return;
  }

  // Seeding initial categories and dummy products
  console.log('Seeding initial categories and products into FinancialAppDB...');
  
  const categories = [
    { id: 1, name: 'Makanan' },
    { id: 2, name: 'Minuman' },
    { id: 3, name: 'Kerajinan Tangan' },
    { id: 4, name: 'Pakaian' },
  ];

  await db.categories.bulkAdd(categories);

  function generateDummyProducts(count) {
    const products = [];
    for (let i = 1; i <= count; i++) {
      products.push({
        name: `Produk Makanan ${i}`,
        price: Math.floor(Math.random() * 100000) + 20000,
        stock: Math.floor(Math.random() * 100) + 10,
        description: `Deskripsi produk makanan ${i}. Ini adalah produk unggulan dari UMKM kami.`,
        image: '404',
        categoryId: 1,
        featured: 0 // 0 means not featured by default
      });
    }
    return products;
  }

  const products = generateDummyProducts(20);
  await db.products.bulkAdd(products);

  databaseSeeded = true;
  console.log('Database seeding successfully completed.');
}
