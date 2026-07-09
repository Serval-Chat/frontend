import axios, {
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';

import { getBrowserApiBaseUrl } from '@/utils/apiBaseUrl';
import { getAuthToken, removeAuthToken } from '@/utils/authToken';

import { tauriAdapter } from './tauriAdapter';

const isTauri = (): boolean =>
    'window' in globalThis && '__TAURI__' in globalThis;

// serialize arrays as repeated keys (inChannel=a&inChannel=b) so NestJS
// whitelist validation doesn't choke on bracket notation (inChannel[]=a).
const serializeParams = (params: Record<string, unknown>): string => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item !== undefined && item !== null)
                    sp.append(key, String(item));
            }
        } else {
            sp.append(key, String(value));
        }
    }
    return sp.toString();
};

export const apiClient = axios.create({
    baseURL: getBrowserApiBaseUrl(),
    timeout: 30_000,
    withCredentials: true,
    adapter: isTauri() ? tauriAdapter : undefined,
    paramsSerializer: serializeParams,
});

const isInvalidRequest = (url: string | undefined): boolean => {
    if (!url) return false;
    if (url.includes('/profile/@')) return true;
    return false;
};

apiClient.interceptors.request.use(
    (config): InternalAxiosRequestConfig<unknown> => {
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
    },
);

apiClient.interceptors.response.use(
    (response): AxiosResponse => response,
    async (error): Promise<never> => {
        if (error.response?.status === 401) {
            await removeAuthToken();
        }
        throw error;
    },
);
