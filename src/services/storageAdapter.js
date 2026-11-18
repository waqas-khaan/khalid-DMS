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

/**
 * Purge any legacy data previously cached in browser localStorage.
 * Keeps auth credentials (dairy_current_user) intact.
 */
export function purgeLocalStorageData() {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      if (keysToRemove.length > 0) {
        console.log(`[Storage] Purged ${keysToRemove.length} legacy data items from localStorage. All data now uses Cloud Firestore.`);
      }
    }
  } catch (e) {
    // Ignore storage access errors
  }
}

// Automatically clean up legacy localStorage data on startup
purgeLocalStorageData();

function getMemoryCollection(name) {
  const cached = memoryCache.get(name);
  return cached ? [...cached] : [];
}

function saveMemoryCollection(name, list) {
  memoryCache.set(name, [...list]);
}

function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizePayload(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

export const storageAdapter = {
  async getCollection(colName, filters = [], sortField = null, sortDir = 'desc') {
    if (isConfigured && db) {
      try {
        let q = collection(db, colName);
        const queryConstraints = [];
        for (const f of filters) {
          if (f.value !== undefined) {
            queryConstraints.push(where(f.field, f.operator || '==', f.value));
          }
        }
        // Do NOT pass orderBy to Firestore query when filters exist:
        // Firestore requires composite indexes for any equality filter combined with orderBy.
        // Performing sorting in memory guarantees 100% reliability with ZERO manual composite indexes!
        if (queryConstraints.length > 0) {
          q = query(q, ...queryConstraints);
        } else if (sortField) {
          q = query(q, orderBy(sortField, sortDir));
        }
        const snapshot = await getDocs(q);
        let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (sortField) {
          items.sort((a, b) => {
            const valA = a[sortField] !== undefined && a[sortField] !== null ? a[sortField] : '';
            const valB = b[sortField] !== undefined && b[sortField] !== null ? b[sortField] : '';
            if (sortDir === 'asc') return valA > valB ? 1 : (valA < valB ? -1 : 0);
            return valA < valB ? 1 : (valA > valB ? -1 : 0);
          });
        }
        saveMemoryCollection(colName, items);
        return items;
      } catch (err) {
        console.warn(`Firestore getCollection(${colName}) fallback to memory:`, err.message);
      }
    }

    // In-memory fallback (never touches localStorage)
    let list = getMemoryCollection(colName);
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
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
        return null;
      } catch (err) {
        console.warn(`Firestore getDoc(${colName}/${id}) fallback to memory:`, err.message);
      }
    }

    const list = getMemoryCollection(colName);
    return list.find((item) => item.id === id) || null;
  },

  async setDoc(colName, id, data, merge = true) {
    const payload = sanitizePayload({ ...data, updatedAt: new Date().toISOString() });
    
    // Save in-memory cache
    const list = getMemoryCollection(colName);
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) {
      list[index] = merge ? { ...list[index], ...payload, id } : { ...payload, id };
    } else {
      list.push({ ...payload, id, createdAt: new Date().toISOString() });
    }
    saveMemoryCollection(colName, list);

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      await setDoc(ref, payload, { merge });
    }

    return { id, ...payload };
  },

  async addDoc(colName, data) {
    const id = `${colName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = sanitizePayload({
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Save in-memory cache
    const list = getMemoryCollection(colName);
    list.unshift(payload);
    saveMemoryCollection(colName, list);

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      await setDoc(ref, payload);
    }

    return payload;
  },

  async updateDoc(colName, id, updates) {
    const payload = sanitizePayload({ ...updates, updatedAt: new Date().toISOString() });
    const list = getMemoryCollection(colName);
    const index = list.findIndex((item) => item.id === id);
    let updatedItem = null;

    if (index >= 0) {
      list[index] = { ...list[index], ...payload };
      saveMemoryCollection(colName, list);
      updatedItem = list[index];
    }

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      await updateDoc(ref, payload);
    }

    return updatedItem || { id, ...payload };
  },

  async deleteDoc(colName, id) {
    const list = getMemoryCollection(colName);
    const filtered = list.filter((item) => item.id !== id);
    saveMemoryCollection(colName, filtered);

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      await deleteDoc(ref);
    }

    return true;
  },

  async getSubcollection(parentCol, parentId, subCol) {
    const key = `${parentCol}_${parentId}_${subCol}`;
    if (isConfigured && db) {
      try {
        const subRef = collection(db, parentCol, parentId, subCol);
        const snap = await getDocs(subRef);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        saveMemoryCollection(key, items);
        return items;
      } catch (err) {
        console.warn(`Firestore getSubcollection error:`, err.message);
      }
    }
    return getMemoryCollection(key);
  },

  async saveSubcollectionItems(parentCol, parentId, subCol, items) {
    const key = `${parentCol}_${parentId}_${subCol}`;
    saveMemoryCollection(key, items);

    if (isConfigured && db) {
      try {
        const batch = writeBatch(db);
        for (const item of items) {
          const itemId = item.id || doc(collection(db, parentCol, parentId, subCol)).id;
          const ref = doc(db, parentCol, parentId, subCol, itemId);
          batch.set(ref, { ...item, id: itemId });
        }
        await batch.commit();
      } catch (err) {
        console.warn('Firestore subcollection write error:', err.message);
      }
    }
  },
};
