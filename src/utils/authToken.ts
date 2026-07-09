import { del, set } from 'idb-keyval';

const AUTH_TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null =>
    localStorage.getItem(AUTH_TOKEN_KEY) ??
    sessionStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = async (
    token: string,
    rememberMe = true,
): Promise<void> => {
    if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        try {
            await set(AUTH_TOKEN_KEY, token);
        } catch (error) {
            console.error('[AuthToken] Failed to write to IndexedDB:', error);
        }
    } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    globalThis.dispatchEvent(new Event('auth-change'));
};

export const removeAuthToken = async (): Promise<void> => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    try {
        await del(AUTH_TOKEN_KEY);
    } catch (error) {
        console.error('[AuthToken] Failed to delete from IndexedDB:', error);
    }
    globalThis.dispatchEvent(new Event('auth-change'));
};

export const hasAuthToken = (): boolean => !!getAuthToken();
