export const STORAGE_PREFIX = 'tribe_config_';

export const safeSet = (key: string, value: any) => {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
        console.warn('LocalStorage Quota Exceeded. Clearing non-essential data...');
        try {
            // Critical Auth Preservation
            const token = localStorage.getItem('token');
            const currentUser = localStorage.getItem('currentUser');
            const theme = localStorage.getItem('theme'); // If stored raw

            localStorage.clear();

            if (token) localStorage.setItem('token', token);
            if (currentUser) localStorage.setItem('currentUser', currentUser);
            if (theme) localStorage.setItem('theme', theme);

            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        } catch (err) {
            console.error('Critical Storage Failure', err);
        }
    }
};

export const safeGet = (key: string) => {
    try {
        const item = localStorage.getItem(STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

export const safeRemove = (key: string) => {
    try {
        localStorage.removeItem(STORAGE_PREFIX + key);
    } catch { }
};
