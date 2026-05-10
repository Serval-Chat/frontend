import axios from 'axios';

import { getAuthToken, removeAuthToken } from '@/utils/authToken';

import { tauriAdapter } from './tauriAdapter';

const isTauri = (): boolean =>
    typeof window !== 'undefined' && '__TAURI__' in window;

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 30000,
    withCredentials: true,
    adapter: isTauri() ? tauriAdapter : undefined,
});

const isInvalidRequest = (url: string | undefined): boolean => {
    if (!url) return false;
    if (url.includes('/profile/@')) return true;
    return false;
};

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.url && isInvalidRequest(config.url)) {
        const readableUrl = config.url.replace(/^https?:\/\/[^/]+\//, '/');
        const trace = new Error(
            `[INVALID REQUEST] ${config.method?.toUpperCase() || 'GET'} ${readableUrl}`,
        );
        console.error(trace.message);
        console.error(trace.stack);
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await removeAuthToken();
        }
        return Promise.reject(error);
    },
);
