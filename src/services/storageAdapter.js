import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';

const LOCAL_STORAGE_PREFIX = 'dairy_db_';
const memoryCache = new Map();

function getLocalCollection(name) {
  const storageKey = `${LOCAL_STORAGE_PREFIX}${name}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      memoryCache.delete(name);
      return [];
    }
    const cached = memoryCache.get(name);
    if (cached && cached.raw === raw) {
      return [...cached.list];
    }
    const list = JSON.parse(raw);
    memoryCache.set(name, { raw, list });
    return [...list];
  } catch (e) {
    memoryCache.delete(name);
    return [];
  }
}

function saveLocalCollection(name, list) {
  try {
    const raw = JSON.stringify(list);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${name}`, raw);
    memoryCache.set(name, { raw, list });
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

// Timeout wrapper to prevent any network hanging
function withTimeout(promise, ms = 2500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
  ]);
}

export const storageAdapter = {
  async getCollection(colName, filters = [], sortField = null, sortDir = 'desc') {
    if (isConfigured && db) {
      try {
        let q = collection(db, colName);
        const queryConstraints = [];
        for (const f of filters) {
          queryConstraints.push(where(f.field, f.operator || '==', f.value));
        }
        if (sortField) {
          queryConstraints.push(orderBy(sortField, sortDir));
        }
        if (queryConstraints.length > 0) {
          q = query(q, ...queryConstraints);
        }
        const snapshot = await withTimeout(getDocs(q));
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        saveLocalCollection(colName, items);
        return items;
      } catch (err) {
        // Fall through to instant local cache
      }
    }

    // Instant local memory / persistence access (0ms)
    let list = getLocalCollection(colName);
    for (const f of filters) {
      const op = f.operator || '==';
      list = list.filter((item) => {
        const val = item[f.field];
        if (op === '==') return val === f.value;
        if (op === '>=') return val >= f.value;
        if (op === '<=') return val <= f.value;
        if (op === '!=') return val !== f.value;
        return true;
      });
    }

    if (sortField) {
      list = [...list].sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        if (sortDir === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
    }
    return list;
  },

  async getDoc(colName, id) {
    if (!id) return null;
    if (isConfigured && db) {
      try {
        const ref = doc(db, colName, id);
        const snap = await withTimeout(getDoc(ref));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      } catch (err) {
        // Fall through to instant local cache
      }
    }

    const list = getLocalCollection(colName);
    return list.find((item) => item.id === id) || null;
  },

  async setDoc(colName, id, data, merge = true) {
    const payload = { ...data, updatedAt: new Date().toISOString() };
    
    // Save to local cache immediately
    const list = getLocalCollection(colName);
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) {
      list[index] = merge ? { ...list[index], ...payload, id } : { ...payload, id };
    } else {
      list.push({ ...payload, id, createdAt: new Date().toISOString() });
    }
    saveLocalCollection(colName, list);

    if (isConfigured && db) {
      // Background sync to Firestore without blocking the UI
      const ref = doc(db, colName, id);
      setDoc(ref, payload, { merge }).catch((err) => {
        console.warn(`Background setDoc to ${colName} delayed:`, err.message);
      });
    }

    return { id, ...payload };
  },

  async addDoc(colName, data) {
    const id = `${colName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = getLocalCollection(colName);
    list.unshift(payload);
    saveLocalCollection(colName, list);

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      setDoc(ref, payload).catch((err) => {
        console.warn(`Background addDoc to ${colName} delayed:`, err.message);
      });
    }

    return payload;
  },

  async updateDoc(colName, id, updates) {
    const payload = { ...updates, updatedAt: new Date().toISOString() };
    const list = getLocalCollection(colName);
    const index = list.findIndex((item) => item.id === id);
    let updatedItem = null;

    if (index >= 0) {
      list[index] = { ...list[index], ...payload };
      saveLocalCollection(colName, list);
      updatedItem = list[index];
    }

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      updateDoc(ref, payload).catch((err) => {
        console.warn(`Background updateDoc to ${colName} delayed:`, err.message);
      });
    }

    return updatedItem;
  },

  async deleteDoc(colName, id) {
    const list = getLocalCollection(colName);
    const filtered = list.filter((item) => item.id !== id);
    saveLocalCollection(colName, filtered);

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      deleteDoc(ref).catch((err) => {
        console.warn(`Background deleteDoc from ${colName} delayed:`, err.message);
      });
    }

    return true;
  },

  async getSubcollection(parentCol, parentId, subCol) {
    const key = `${parentCol}_${parentId}_${subCol}`;
    if (isConfigured && db) {
      try {
        const subRef = collection(db, parentCol, parentId, subCol);
        const snap = await withTimeout(getDocs(subRef));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        saveLocalCollection(key, items);
        return items;
      } catch (err) {
        // Fall through to instant local cache
      }
    }
    return getLocalCollection(key);
  },

  async saveSubcollectionItems(parentCol, parentId, subCol, items) {
    const key = `${parentCol}_${parentId}_${subCol}`;
    saveLocalCollection(key, items);

    if (isConfigured && db) {
      try {
        const batch = writeBatch(db);
        for (const item of items) {
          const itemId = item.id || doc(collection(db, parentCol, parentId, subCol)).id;
          const ref = doc(db, parentCol, parentId, subCol, itemId);
          batch.set(ref, { ...item, id: itemId });
        }
        batch.commit().catch((err) => {
          console.warn('Background subcollection write delayed:', err.message);
        });
      } catch (err) {
        // Silently handled
      }
    }
  },
};
