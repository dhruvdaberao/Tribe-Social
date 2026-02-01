
/**
 * Safe wrapper for localStorage operations to prevent crashes when storage limit is exceeded.
 */

export const safeSetItem = (key: string, value: string): boolean => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn(`⚠️ Tribe Storage Warning: Failed to save key "${key}" (Quota Exceeded or Private Mode)`);
        return false;
    }
};

export const safeGetItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn(`⚠️ Tribe Storage Warning: Failed to read key "${key}"`);
        return null;
    }
};

export const safeRemoveItem = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(`⚠️ Tribe Storage Warning: Failed to remove key "${key}"`);
    }
};

export const safeClear = (): void => {
    try {
        localStorage.clear();
    } catch (error) {
        console.warn(`⚠️ Tribe Storage Warning: Failed to clear storage`);
    }
};
