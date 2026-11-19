export const authService = {
  /**
   * Hardcoded authentication service
   * - admin / falconadmin2021 -> Full admin access (Add, Edit, Delete)
   * - staff / staff12345      -> Staff access (Add only, No Edit, No Delete)
   */
  async login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      throw new Error('Please select a username.');
    }
    if (!cleanPass) {
      throw new Error('Please enter your password.');
    }

    if (cleanUser === 'admin') {
      if (cleanPass === 'falconadmin2021') {
        const adminProfile = {
          id: 'user_admin',
          uid: 'user_admin',
          username: 'admin',
          name: 'Administrator',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        return adminProfile;
      }
      throw new Error('Invalid password for Admin.');
    }

    if (cleanUser === 'staff') {
      if (cleanPass === 'staff12345') {
        const staffProfile = {
          id: 'user_staff',
          uid: 'user_staff',
          username: 'staff',
          name: 'Administrator',
          role: 'staff',
          createdAt: new Date().toISOString(),
        };
        return staffProfile;
      }
      throw new Error('Invalid password for Staff.');
    }

    throw new Error('Invalid username. Please select either "admin" or "staff".');
  },

  async logout() {
    localStorage.removeItem('dairy_current_user');
  },

  async getAllUsers() {
    return [
      { id: 'user_admin', username: 'admin', name: 'Administrator', role: 'admin' },
      { id: 'user_staff', username: 'staff', name: 'Staff Clean Pass', role: 'staff' },
    ];
  },
};
