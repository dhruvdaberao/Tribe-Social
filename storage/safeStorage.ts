
// Safe Storage Utility to prevent QuotaExceededError
// Uses an LRU strategy to clear old tribe_cache_* keys if storage is full.

const isQuotaExceededError = (e: unknown): boolean => {
  return (
    e instanceof DOMException &&
    // everything except Firefox
    (e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
    // acknowledge QuotaExceededError only if there's something already stored
    sessionStorage.length !== 0
  );
};

export const safeGetSession = <T>(key: string): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.warn(`Error reading ${key} from sessionStorage`, e);
    return null;
  }
};

export const safeSetSession = (key: string, value: any): boolean => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (isQuotaExceededError(e)) {
      console.warn('SessionStorage quota exceeded. Attempting cleanup...');
      try {
        // Simple cleanup: remove all tribe cache keys except current
        // In a real LRU we would track timestamps, but clearing "other" cache is a good heuristic
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith('tribe_cache_') && k !== key) {
            sessionStorage.removeItem(k);
          }
        });
        // Try again
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryError) {
        console.error('Failed to save to sessionStorage even after cleanup.', retryError);
        return false;
      }
    } else {
      console.error('Unknown storage error', e);
      return false;
    }
  }
};

// Fallback stub for IndexedDB (future implementation)
export const fallbackToIndexedDB = async (key: string, value: any) => {
    // TODO: Implement idb-keyval or similar here if sessionStorage limit is strictly insufficient.
    console.log('Would fall back to IndexedDB for', key);
};
