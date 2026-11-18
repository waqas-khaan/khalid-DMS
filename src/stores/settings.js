import { defineStore } from 'pinia';
import { settingsService } from '../services/settingsService';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      literToKgFactor: 1.03,
      defaultMilkPrice: 180,
      canWeightKg: 50,
      currency: 'Rs.',
      companyName: 'DMS',
      allowedFreeAbsents: 2,
      allowEditDispatch: true,
      allowDeleteDispatch: true,
    },
    loading: false,
  }),

  actions: {
    async loadSettings() {
      this.loading = true;
      try {
        const data = await settingsService.getSettings();
        if (data) {
          this.settings = { ...this.settings, ...data };
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(updates) {
      this.loading = true;
      try {
        const saved = await settingsService.updateSettings(updates);
        this.settings = { ...this.settings, ...saved };
        return saved;
      } finally {
        this.loading = false;
      }
    },
  },
});

