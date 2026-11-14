import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';

const envApiKey = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_API_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
  '';

const envAuthDomain = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_AUTH_DOMAIN) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
  '';

const envProjectId = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_PROJECT_ID) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
  '';

const envStorageBucket = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_STORAGE_BUCKET) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
  '';

const envSenderId = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_MESSAGING_SENDER_ID) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
  '';

const envAppId = (typeof process !== 'undefined' && process.env?.VUE_APP_FIREBASE_APP_ID) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
  '';

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
