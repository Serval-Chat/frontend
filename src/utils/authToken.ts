const AUTH_TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.dispatchEvent(new Event('auth-change'));
};

export const removeAuthToken = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.dispatchEvent(new Event('auth-change'));
};

export const hasAuthToken = (): boolean => {
    return !!getAuthToken();
};
