import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';

const envApiKey = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_API_KEY) ||
  'AIzaSyCAROQvlMsPVVucvRzc1hVW0KKHztWY0UY';

const envAuthDomain = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_AUTH_DOMAIN) ||
  'khalid-dms.firebaseapp.com';

const envProjectId = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_PROJECT_ID) ||
  'khalid-dms';

const envStorageBucket = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_STORAGE_BUCKET) ||
  'khalid-dms.firebasestorage.app';

const envSenderId = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_MESSAGING_SENDER_ID) ||
  '231068831912';

const envAppId = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_APP_ID) ||
  '1:231068831912:web:9a1f9d33c36b1b72d2329d';

// Strictly verify whether valid production Firebase credentials are provided
export const isConfigured = Boolean(
  envApiKey &&
  !envApiKey.includes('FakeKey') &&
  !envApiKey.includes('MockKey') &&
  !envApiKey.startsWith('AIzaSyFake') &&
  envApiKey.length > 20 &&
  envProjectId &&
  !envProjectId.includes('fake')
);

let app = null;
let auth = null;
let db = null;

// Only initialize Firebase network instances if a valid project is configured
// This avoids network timeouts and hanging on local dev or unconfigured setups
if (isConfigured) {
  try {
    const firebaseConfig = {
      apiKey: envApiKey,
      authDomain: envAuthDomain,
      projectId: envProjectId,
      storageBucket: envStorageBucket,
      messagingSenderId: envSenderId,
      appId: envAppId,
    };

    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    // Enable Cloud Firestore offline persistence
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (err) {
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn('Firebase initialization fallback:', err.message);
  }
}

export { app, auth, db };
