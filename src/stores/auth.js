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
    userName: (state) => {
      if (!state.user) return '';
      if (state.user.name) return state.user.name;
      if (state.user.email) {
        const prefix = state.user.email.split('@')[0];
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
      return 'User';
    },
    userRoleText: (state) => {
      if (!state.user) return '';
      const r = state.user.role;
      if (r === 'admin') return 'Admin';
      if (r === 'staff') return 'Staff';
      return r ? r.toUpperCase() : 'USER';
    },
  },

  actions: {
    initAuth() {
      try {
        const saved = localStorage.getItem('dairy_current_user');
        if (saved) {
          this.user = JSON.parse(saved);
        } else {
          // Auto-initialize with default Admin for immediate out-of-the-box dashboard access
          const defaultAdmin = {
            id: 'user_admin_default',
            uid: 'user_admin_default',
            email: 'admin@dairy.com',
            name: 'Dairy Admin',
            role: 'admin',
          };
          this.user = defaultAdmin;
          localStorage.setItem('dairy_current_user', JSON.stringify(defaultAdmin));
        }
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    },

    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const profile = await authService.login(email, password);
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
