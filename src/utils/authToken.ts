const AUTH_TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const hasAuthToken = (): boolean => {
    return !!getAuthToken();
};
