import { storageAdapter } from './storageAdapter';
import { statsService } from './statsService';

const DEFAULT_CATEGORIES = [
  { name: 'Food', isDefault: true },
  { name: 'Home', isDefault: true },
  { name: 'Transport', subTypes: ['Diesel', 'Maintenance'], isDefault: true },
];

export const expenseService = {
  // ---- CATEGORIES ----
  async getCategories() {
    const stored = await storageAdapter.getCollection('expenseCategories', [], 'name', 'asc');
    const existingNames = new Set((stored || []).map((c) => (c.name || '').trim().toLowerCase()));
    const merged = [...(stored || [])];

    // Supply built-in system categories in memory without auto-writing sample data to storage
    for (const cat of DEFAULT_CATEGORIES) {
      if (!existingNames.has(cat.name.toLowerCase())) {
        merged.push({ ...cat, id: `default_${cat.name.toLowerCase()}` });
      }
    }

    return merged.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  },

  async addCategory(name, subTypes = []) {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new Error('Category name is required');
    }
    const existing = await this.getCategories();
    if (existing.some((c) => (c.name || '').trim().toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Category "${cleanName}" already exists`);
    }
    return await storageAdapter.addDoc('expenseCategories', {
      name: cleanName,
      subTypes: Array.isArray(subTypes) ? subTypes : [],
      isDefault: false,
    });
  },

  async updateCategory(id, data) {
    const cleanName = (data?.name || '').trim();
    if (!cleanName) {
      throw new Error('Category name is required');
    }
    const existing = await this.getCategories();
    const conflict = existing.find(
      (c) => c.id !== id && (c.name || '').trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (conflict) {
      throw new Error(`Category "${cleanName}" already exists`);
    }
    return await storageAdapter.updateDoc('expenseCategories', id, {
      name: cleanName,
      subTypes: Array.isArray(data?.subTypes) ? data.subTypes : [],
      isDefault: false,
    });
  },

  async deleteCategory(id) {
    return await storageAdapter.deleteDoc('expenseCategories', id);
  },

  // ---- EXPENSES ----
  async getExpenses({ date = null, startDate = null, endDate = null, category = null } = {}) {
    const list = await storageAdapter.getCollection('expenses', [], 'date', 'desc');

    return list.filter((item) => {
      if (date && item.date !== date) return false;
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      if (category && item.category !== category) return false;
      return true;
    });
  },

  async addExpense(data) {
    const payload = {
      date: data.date,
      category: data.category,
      subCategory: data.subCategory || '',
      vehicleId: data.vehicleId || null,
      vehicleNumber: data.vehicleNumber || '',
      amount: Number(data.amount) || 0,
      notes: data.notes?.trim() || '',
    };
    const saved = await storageAdapter.addDoc('expenses', payload);

    // Refresh daily stats
    await statsService.refreshDailyStats(data.date);
    return saved;
  },

  async updateExpense(id, data) {
    const payload = {
      date: data.date,
      category: data.category,
      subCategory: data.subCategory || '',
      vehicleId: data.vehicleId || null,
      vehicleNumber: data.vehicleNumber || '',
      amount: Number(data.amount) || 0,
      notes: data.notes?.trim() || '',
    };
    const updated = await storageAdapter.updateDoc('expenses', id, payload);

    await statsService.refreshDailyStats(data.date);
    return updated;
  },

  async deleteExpense(id, date) {
    const deleted = await storageAdapter.deleteDoc('expenses', id);
    if (date) {
      await statsService.refreshDailyStats(date);
    }
    return deleted;
  },

  calculateTotals(expenses) {
    let overall = 0;
    let food = 0;
    let home = 0;
    let transport = 0;
    let diesel = 0;
    let maintenance = 0;
    const byCategory = {};

    for (const item of expenses) {
      const amt = Number(item.amount) || 0;
      overall += amt;
      const cat = item.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + amt;

      const catLower = cat.toLowerCase();
      if (catLower === 'food') {
        food += amt;
      } else if (catLower === 'home') {
        home += amt;
      } else if (catLower === 'transport') {
        transport += amt;
        const sub = (item.subCategory || '').toLowerCase();
        if (sub.includes('diesel') || sub.includes('fuel')) {
          diesel += amt;
        } else if (sub.includes('maintenance') || sub.includes('repair')) {
          maintenance += amt;
        }
      }
    }

    return {
      overall,
      food,
      home,
      transport,
      diesel,
      maintenance,
      byCategory,
    };
  },
};

