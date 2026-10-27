import { db } from './schema';

const sanitizeData = (data) => {
  if (data === undefined || data === null) return data;
  if (data instanceof Blob) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const copy = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val instanceof Blob) {
      copy[key] = val;
    } else if (typeof val === 'object' && val !== null) {
      try {
        copy[key] = JSON.parse(JSON.stringify(val));
      } catch (e) {
        copy[key] = val;
      }
    } else {
      copy[key] = val;
    }
  }
  return copy;
};

// Category Repository
export const CategoryRepository = {
  async getAll() {
    return await db.categories.toArray();
  },
  async getById(id) {
    return await db.categories.get(id);
  },
  async add(category) {
    const raw = sanitizeData(category);
    const isAuto = db.categories?.schema?.primKey?.auto;
    const categoryData = { name: raw.name };
    if (raw.id || !isAuto) {
      categoryData.id = raw.id || Date.now();
    }
    const id = await db.categories.put(categoryData);
    return { id, ...categoryData };
  },
  async update(id, changes) {
    const raw = sanitizeData(changes);
    await db.categories.update(id, raw);
    return { id, ...raw };
  },
  async delete(id) {
    await db.categories.delete(id);
  },
};

// Product Repository
export const ProductRepository = {
  async getAll() {
    return await db.products.toArray();
  },
  async getFeatured() {
    // Implementasi untuk mendapatkan produk unggulan (misalnya, berdasarkan properti 'featured')
    return await db.products.where('featured').equals(1).toArray();
  },
  async getById(id) {
    return await db.products.get(id);
  },
  async add(product) {
    const raw = sanitizeData(product);
    if (raw.featured === undefined && raw.isFeatured !== undefined) {
      raw.featured = raw.isFeatured ? 1 : 0;
    }
    const id = await db.products.add(raw);
    return { id, ...raw };
  },
  async update(id, changes) {
    const raw = sanitizeData(changes);
    if (raw.featured === undefined && raw.isFeatured !== undefined) {
      raw.featured = raw.isFeatured ? 1 : 0;
    }
    await db.products.update(id, raw);
    return { id, ...raw };
  },
  async delete(id) {
    await db.products.delete(id);
  },
};

const createRepo = (tableName) => ({
    async add(record) {
      const raw = sanitizeData(record);
      const id = await db[tableName].add({ ...raw, createdAt: new Date().toISOString() });
      return { id, ...raw };
    },
    async bulkAdd(records) {
      const rawRecords = sanitizeData(records);
      return db[tableName].bulkAdd(rawRecords.map(r => ({ ...r, createdAt: new Date().toISOString() })));
    },
    async update(id, changes) {
      const raw = sanitizeData(changes);
      return await db[tableName].update(id, { ...raw, updatedAt: new Date().toISOString() });
    },
    async delete(id) {
      await db[tableName].delete(id);
    },
    async getById(id) {
      return db[tableName].get(id);
    },
    async getAll() {
      return db[tableName].toArray();
    },
    async where(index, value) {
      return db[tableName].where(index).equals(value).toArray();
    },
});

export const savingsRepo = createRepo('savings');
export const debtsRepo = createRepo('debts');
export const incomesRepo = createRepo('incomes');
export const expensesRepo = createRepo('expenses');
export const dailyLedgerRepo = createRepo('dailyLedger');
export const salesRepo = createRepo('sales');
export const stockMutationsRepo = createRepo('stockMutations');
export const savingAccountsRepo = createRepo('saving_accounts');
export const savingTransactionsRepo = createRepo('saving_transactions');

export const expenseAttachmentsRepo = {
  ...createRepo('expense_attachments'),
  async getByExpenseId(expenseId) {
    if (!expenseId) return null;
    return await db.expense_attachments.where('expenseId').equals(Number(expenseId)).first();
  },
  async getAllByExpenseId(expenseId) {
    if (!expenseId) return [];
    return await db.expense_attachments.where('expenseId').equals(Number(expenseId)).toArray();
  },
  async deleteByExpenseId(expenseId) {
    if (!expenseId) return;
    return await db.expense_attachments.where('expenseId').equals(Number(expenseId)).delete();
  }
};

export const transactionAttachmentsRepo = {
  ...createRepo('transaction_attachments'),
  async getByTransactionId(transactionId) {
    if (!transactionId) return null;
    return await db.transaction_attachments.where('transactionId').equals(Number(transactionId)).first();
  },
  async getAllByTransactionId(transactionId) {
    if (!transactionId) return [];
    return await db.transaction_attachments.where('transactionId').equals(Number(transactionId)).toArray();
  },
  async deleteByTransactionId(transactionId) {
    if (!transactionId) return;
    return await db.transaction_attachments.where('transactionId').equals(Number(transactionId)).delete();
  }
};



