import axios from 'axios';

import { getAuthToken, removeAuthToken } from '@/utils/authToken';

import { tauriAdapter } from './tauriAdapter';

const isTauri = (): boolean =>
    typeof window !== 'undefined' && '__TAURI__' in window;

export const apiClient = axios.create({
    baseURL: isTauri() ? import.meta.env.VITE_API_BASE_URL : '',
    timeout: 30000,
    withCredentials: true,
    adapter: isTauri() ? tauriAdapter : undefined,
});

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
