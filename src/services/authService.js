import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isConfigured } from './firebase';
import { storageAdapter } from './storageAdapter';

export const authService = {
  async login(email, password) {
    const trimmedEmail = (email || '').trim().toLowerCase();

    // 1. If Firebase is active and configured
    if (isConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const fbUser = userCredential.user;
        let profile = await storageAdapter.getDoc('users', fbUser.uid);
        if (!profile) {
          // If no profile yet, create one
          profile = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || trimmedEmail.split('@')[0],
            role: trimmedEmail.includes('admin') ? 'admin' : 'staff',
            createdAt: new Date().toISOString(),
          };
          await storageAdapter.setDoc('users', fbUser.uid, profile);
        }
        return profile;
      } catch (err) {
        console.warn('Firebase auth attempt failed, checking database users:', err.message);
      }
    }

    // 2. Local fallback / Offline mode with predefined or registered users
    const users = await storageAdapter.getCollection('users');
    const matched = users.find(
      (u) => u.email.toLowerCase() === trimmedEmail && (u.password === password || !u.password)
    );

    if (matched) {
      return matched;
    }

    // Default system accounts fallback
    if (trimmedEmail === 'admin@dairy.com' && password === 'admin123') {
      const adminProfile = {
        id: 'user_admin_default',
        uid: 'user_admin_default',
        email: 'admin@dairy.com',
        name: 'Dairy Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      await storageAdapter.setDoc('users', adminProfile.id, adminProfile);
      return adminProfile;
    }

    if (trimmedEmail === 'staff@dairy.com' && password === 'staff123') {
      const staffProfile = {
        id: 'user_staff_default',
        uid: 'user_staff_default',
        email: 'staff@dairy.com',
        name: 'Dairy Staff',
        role: 'staff',
        createdAt: new Date().toISOString(),
      };
      await storageAdapter.setDoc('users', staffProfile.id, staffProfile);
      return staffProfile;
    }

    throw new Error('Invalid email or password. Please use admin@dairy.com / admin123 or staff@dairy.com / staff123');
  },

  async logout() {
    if (isConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    localStorage.removeItem('dairy_current_user');
  },

  async createUser({ email, password, name, role }) {
    let uid = `user_${Date.now()}`;
    if (isConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
      } catch (err) {
        console.warn('Firebase user creation fallback:', err.message);
      }
    }

    const profile = {
      id: uid,
      uid,
      email,
      name,
      role: role || 'staff',
      password, // stored locally for offline fallback
      createdAt: new Date().toISOString(),
    };
    await storageAdapter.setDoc('users', uid, profile);
    return profile;
  },

  async getAllUsers() {
    return await storageAdapter.getCollection('users', [], 'createdAt', 'desc');
  },
};

