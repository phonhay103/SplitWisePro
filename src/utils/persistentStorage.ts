/**
 * Persistent Storage Layer for PWA and Long-term Data Retention
 * 
 * Uses IndexedDB (via idb-keyval) as the primary durable storage engine,
 * with synchronous localStorage as a secondary instant-load cache.
 * 
 * Also utilizes the StorageManager API (`navigator.storage.persist()`)
 * to request browser exemption from automatic data eviction.
 */

import { get, set, del } from 'idb-keyval';
import { Group } from '../types';

export const IDB_KEY_GROUPS = 'splitwise_groups_v3';
export const IDB_KEY_ACTIVE_GROUP_ID = 'splitwise_active_group_id_v3';
export const IDB_KEY_LANG = 'splitwise_app_lang_v3';
export const IDB_KEY_THEME = 'splitwise_theme_v3';
export const IDB_KEY_LAST_PAYER = 'splitwise_last_payer_id_v3';

export interface StorageStatus {
  isPersistent: boolean;
  quotaBytes?: number;
  usageBytes?: number;
  engine: 'IndexedDB (Persistent)' | 'IndexedDB' | 'localStorage';
}

/**
 * Request browser storage persistence so data is never evicted under storage pressure.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return true;
    } catch (e) {
      console.warn('StorageManager.persist() not available or denied', e);
    }
  }
  return false;
}

/**
 * Get current storage health and persistence status
 */
export async function getStorageStatus(): Promise<StorageStatus> {
  let isPersistent = false;
  let quotaBytes: number | undefined;
  let usageBytes: number | undefined;

  if (typeof navigator !== 'undefined' && navigator.storage) {
    try {
      if (navigator.storage.persisted) {
        isPersistent = await navigator.storage.persisted();
      }
      if (navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        quotaBytes = est.quota;
        usageBytes = est.usage;
      }
    } catch (e) {
      console.warn('Failed to query storage estimate', e);
    }
  }

  const hasIDB = typeof indexedDB !== 'undefined';
  const engine = isPersistent ? 'IndexedDB (Persistent)' : hasIDB ? 'IndexedDB' : 'localStorage';

  return {
    isPersistent,
    quotaBytes,
    usageBytes,
    engine,
  };
}

/**
 * Load groups with graceful migration from localStorage -> IndexedDB
 */
export async function loadPersistentGroups(fallback: Group[]): Promise<Group[]> {
  try {
    // 1. Try reading from IndexedDB (primary long-term storage)
    const idbData = await get<Group[]>(IDB_KEY_GROUPS);
    if (Array.isArray(idbData) && idbData.length > 0) {
      // Keep localStorage in sync as warm cache
      try {
        localStorage.setItem(IDB_KEY_GROUPS, JSON.stringify(idbData));
      } catch {}
      return idbData;
    }

    // 2. Check localStorage for existing data to migrate to IndexedDB
    const localRaw = localStorage.getItem(IDB_KEY_GROUPS);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate to IndexedDB for long-term survival
        await set(IDB_KEY_GROUPS, parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading persistent groups:', e);
  }

  return fallback;
}

/**
 * Save groups to both IndexedDB (durable long-term) and localStorage (fast cache)
 */
export async function savePersistentGroups(groups: Group[]): Promise<void> {
  // 1. Write to localStorage for instant synchronous recovery
  try {
    localStorage.setItem(IDB_KEY_GROUPS, JSON.stringify(groups));
  } catch (e) {
    console.warn('localStorage quota might be reached, rely on IndexedDB:', e);
  }

  // 2. Write to IndexedDB for durable, high-capacity, un-evicted storage
  try {
    await set(IDB_KEY_GROUPS, groups);
  } catch (e) {
    console.error('Failed to write to IndexedDB:', e);
  }
}

/**
 * Generic persistent state helper (reads IDB -> falls back to localStorage)
 */
export async function loadPersistentItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const val = await get<T>(key);
    if (val !== undefined && val !== null) {
      return val;
    }
    const local = localStorage.getItem(key);
    if (local !== null) {
      return local as unknown as T;
    }
  } catch (e) {
    console.warn(`Error loading item ${key}:`, e);
  }
  return fallback;
}

/**
 * Generic persistent state saver
 */
export async function savePersistentItem<T>(key: string, value: T): Promise<void> {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {}

  try {
    await set(key, value);
  } catch (e) {
    console.warn(`Error saving item ${key} to IndexedDB:`, e);
  }
}
