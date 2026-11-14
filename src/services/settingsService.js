import { storageAdapter } from './storageAdapter';

const DEFAULT_SETTINGS = {
  literToKgFactor: 1.03,
  defaultMilkPrice: 180,
  canWeightKg: 50,
  currency: 'Rs.',
  companyName: 'Dairy Farm Management System',
  allowedFreeAbsents: 2,
  allowEditDispatch: true,
  allowDeleteDispatch: true,
};

export const settingsService = {
  async getSettings() {
    const doc = await storageAdapter.getDoc('settings', 'general');
    if (doc) {
      return { ...DEFAULT_SETTINGS, ...doc };
    }
    return { ...DEFAULT_SETTINGS };
  },

  async updateSettings(updates) {
    const existing = await storageAdapter.getDoc('settings', 'general');
    const payload = existing ? updates : { ...DEFAULT_SETTINGS, ...updates };
    return await storageAdapter.setDoc('settings', 'general', payload, true);
  },
};

