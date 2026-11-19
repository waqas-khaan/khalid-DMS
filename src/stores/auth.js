import { defineStore } from 'pinia';
import { authService } from '../services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    role: (state) => (state.user ? state.user.role : null),
    isAdmin: (state) => state.user && state.user.role === 'admin',
    isStaff: (state) => state.user && state.user.role === 'staff',
    canEdit: (state) => state.user && state.user.role === 'admin',
    canDelete: (state) => state.user && state.user.role === 'admin',
    canAdd: (state) => Boolean(state.user),
    userName: (state) => {
      if (!state.user) return '';
      return 'Administrator';
    },
    userRoleText: () => '',
  },

  actions: {
    initAuth() {
      try {
        const saved = localStorage.getItem('dairy_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.role === 'admin' || parsed.role === 'staff')) {
            this.user = parsed;
            return;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
      this.user = null;
    },

    async login(username, password) {
      this.loading = true;
      this.error = null;
      try {
        const profile = await authService.login(username, password);
        this.user = profile;
        localStorage.setItem('dairy_current_user', JSON.stringify(profile));
        return profile;
      } catch (err) {
        this.error = err.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await authService.logout();
      } catch (e) {
        console.error(e);
      }
      this.user = null;
      localStorage.removeItem('dairy_current_user');
    },
  },
});
