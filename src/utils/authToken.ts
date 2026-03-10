import { del, set } from 'idb-keyval';

const AUTH_TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null =>
    localStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = async (token: string): Promise<void> => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    try {
        await set(AUTH_TOKEN_KEY, token);
    } catch (err) {
        console.error('[AuthToken] Failed to write to IndexedDB:', err);
    }
    window.dispatchEvent(new Event('auth-change'));
};

export const removeAuthToken = async (): Promise<void> => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    try {
        await del(AUTH_TOKEN_KEY);
    } catch (err) {
        console.error('[AuthToken] Failed to delete from IndexedDB:', err);
    }
    window.dispatchEvent(new Event('auth-change'));
};

export const hasAuthToken = (): boolean => !!getAuthToken();
