import { get, set, del } from 'idb-keyval';

export async function storageGet<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  try {
    const val = await get<T>(key);
    if (val !== undefined) return val;
    return defaultValue;
  } catch (error) {
    console.warn(`Failed to read from IndexedDB for key "${key}", falling back to localStorage:`, error);
    try {
      const lsVal = localStorage.getItem(key);
      if (lsVal !== null) {
        return JSON.parse(lsVal) as T;
      }
    } catch {
      // Ignore
    }
    return defaultValue;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch (error) {
    console.warn(`Failed to write to IndexedDB for key "${key}", falling back to localStorage:`, error);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore
    }
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await del(key);
  } catch (error) {
    console.warn(`Failed to remove from IndexedDB for key "${key}", falling back to localStorage:`, error);
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
}
