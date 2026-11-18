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

// High-speed in-memory cache
const memoryCache = new Map();
const cacheTimestamps = new Map();
const inFlightRequests = new Map();

// 30 seconds fresh cache, background revalidation after 5 seconds
const CACHE_TTL_MS = 30000;
const REVALIDATE_AFTER_MS = 5000;

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
  cacheTimestamps.set(name, Date.now());
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

function applyFiltersAndSort(items, filters = [], sortField = null, sortDir = 'desc') {
  let list = [...items];
  for (const f of filters) {
    if (f.value === undefined) continue;
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
    list.sort((a, b) => {
      const valA = a[sortField] !== undefined && a[sortField] !== null ? a[sortField] : '';
      const valB = b[sortField] !== undefined && b[sortField] !== null ? b[sortField] : '';
      if (sortDir === 'asc') return valA > valB ? 1 : (valA < valB ? -1 : 0);
      return valA < valB ? 1 : (valA > valB ? -1 : 0);
    });
  }

  return list;
}

async function fetchCollectionFromFirestore(colName) {
  if (!isConfigured || !db) {
    return getMemoryCollection(colName);
  }

  const q = collection(db, colName);
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  saveMemoryCollection(colName, items);
  return items;
}

export const storageAdapter = {
  /**
   * Invalidate the local cache for a specific collection or all collections.
   */
  invalidateCache(colName = null) {
    if (colName) {
      cacheTimestamps.delete(colName);
    } else {
      cacheTimestamps.clear();
    }
  },

  /**
   * Fast collection retrieval with instant in-memory cache and background sync.
   */
  async getCollection(colName, filters = [], sortField = null, sortDir = 'desc', options = {}) {
    const cached = memoryCache.get(colName);
    const lastTimestamp = cacheTimestamps.get(colName) || 0;
    const isFresh = Date.now() - lastTimestamp < CACHE_TTL_MS;
    const needsRevalidation = Date.now() - lastTimestamp > REVALIDATE_AFTER_MS;

    // 1. If we have fresh cached items in memory and no force refresh requested, return immediately (sub-1ms!)
    if (cached && cached.length > 0 && isFresh && !options.force) {
      // Trigger non-blocking background revalidation if data is older than 5 seconds
      if (needsRevalidation && isConfigured && db && !inFlightRequests.has(colName)) {
        const bgPromise = fetchCollectionFromFirestore(colName)
          .catch((err) => console.warn(`[Storage] Background sync error for ${colName}:`, err.message))
          .finally(() => inFlightRequests.delete(colName));
        inFlightRequests.set(colName, bgPromise);
      }
      return applyFiltersAndSort(cached, filters, sortField, sortDir);
    }

    // 2. If already fetching this collection, reuse the active promise (request deduplication)
    if (inFlightRequests.has(colName)) {
      try {
        const items = await inFlightRequests.get(colName);
        return applyFiltersAndSort(items, filters, sortField, sortDir);
      } catch (err) {
        // Fallback to memory on rejection
        return applyFiltersAndSort(getMemoryCollection(colName), filters, sortField, sortDir);
      }
    }

    // 3. Fetch from Cloud Firestore
    const fetchPromise = (async () => {
      try {
        let q = collection(db, colName);
        const queryConstraints = [];
        for (const f of filters) {
          if (f.value !== undefined) {
            queryConstraints.push(where(f.field, f.operator || '==', f.value));
          }
        }

        // When no filters are passed, fetch full collection to warm up local cache
        if (queryConstraints.length === 0) {
          return await fetchCollectionFromFirestore(colName);
        }

        // When filters are present, execute filtered query directly
        q = query(q, ...queryConstraints);
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Merge filtered results into master in-memory cache
        const existing = memoryCache.get(colName) || [];
        const map = new Map(existing.map((item) => [item.id, item]));
        for (const it of items) {
          map.set(it.id, it);
        }
        memoryCache.set(colName, Array.from(map.values()));
        return items;
      } catch (err) {
        console.warn(`Firestore getCollection(${colName}) error:`, err.message);
        return getMemoryCollection(colName);
      }
    })();

    inFlightRequests.set(colName, fetchPromise);
    try {
      const items = await fetchPromise;
      return applyFiltersAndSort(items, filters, sortField, sortDir);
    } finally {
      inFlightRequests.delete(colName);
    }
  },

  async getDoc(colName, id) {
    if (!id) return null;

    // Check in-memory collection cache first (0ms!)
    const cachedList = memoryCache.get(colName);
    if (cachedList) {
      const found = cachedList.find((item) => item.id === id);
      if (found) return found;
    }

    if (isConfigured && db) {
      try {
        const ref = doc(db, colName, id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const item = { id: snap.id, ...snap.data() };
          const list = getMemoryCollection(colName);
          const idx = list.findIndex((x) => x.id === id);
          if (idx >= 0) {
            list[idx] = item;
          } else {
            list.push(item);
          }
          saveMemoryCollection(colName, list);
          return item;
        }
        return null;
      } catch (err) {
        console.warn(`Firestore getDoc(${colName}/${id}) error:`, err.message);
      }
    }

    const list = getMemoryCollection(colName);
    return list.find((item) => item.id === id) || null;
  },

  /**
   * Fast Optimistic Set: updates memory immediately and syncs with Firestore in background.
   */
  async setDoc(colName, id, data, merge = true) {
    const payload = sanitizePayload({ ...data, updatedAt: new Date().toISOString() });
    
    // 1. Optimistic in-memory update (0ms latency for UI)
    const list = getMemoryCollection(colName);
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) {
      list[index] = merge ? { ...list[index], ...payload, id } : { ...payload, id };
    } else {
      list.push({ ...payload, id, createdAt: new Date().toISOString() });
    }
    saveMemoryCollection(colName, list);

    // 2. Cloud Firestore persistence
    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      setDoc(ref, payload, { merge }).catch((err) => {
        console.error(`[Storage] Background setDoc error on ${colName}/${id}:`, err);
      });
    }

    return { id, ...payload };
  },

  /**
   * Fast Optimistic Add: updates memory immediately and syncs with Firestore in background.
   */
  async addDoc(colName, data) {
    const id = `${colName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = sanitizePayload({
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Optimistic in-memory update (0ms latency for UI)
    const list = getMemoryCollection(colName);
    list.unshift(payload);
    saveMemoryCollection(colName, list);

    // 2. Cloud Firestore persistence
    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      setDoc(ref, payload).catch((err) => {
        console.error(`[Storage] Background addDoc error on ${colName}/${id}:`, err);
      });
    }

    return payload;
  },

  /**
   * Fast Optimistic Update: updates memory immediately and syncs with Firestore in background.
   */
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
      updateDoc(ref, payload).catch((err) => {
        console.error(`[Storage] Background updateDoc error on ${colName}/${id}:`, err);
      });
    }

    return updatedItem || { id, ...payload };
  },

  /**
   * Fast Optimistic Delete: updates memory immediately and syncs with Firestore in background.
   */
  async deleteDoc(colName, id) {
    const list = getMemoryCollection(colName);
    const filtered = list.filter((item) => item.id !== id);
    saveMemoryCollection(colName, filtered);

    if (isConfigured && db) {
      const ref = doc(db, colName, id);
      deleteDoc(ref).catch((err) => {
        console.error(`[Storage] Background deleteDoc error on ${colName}/${id}:`, err);
      });
    }

    return true;
  },

  async getSubcollection(parentCol, parentId, subCol) {
    const key = `${parentCol}_${parentId}_${subCol}`;
    const cached = memoryCache.get(key);
    if (cached && cached.length > 0) {
      return [...cached];
    }

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
          batch.set(ref, sanitizePayload({ ...item, id: itemId }));
        }
        batch.commit().catch((err) => {
          console.error(`[Storage] Background batch commit error:`, err);
        });
      } catch (err) {
        console.warn('Firestore subcollection write error:', err.message);
      }
    }
  },
};
