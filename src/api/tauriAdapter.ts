import { fetch } from '@tauri-apps/plugin-http';
import type { AxiosAdapter, AxiosResponse } from 'axios';

/**
 * @description Native Tauri HTTP adapter for Axios.
 * This bypasses the browser's CORS preflight (OPTIONS) requests.
 */
export const tauriAdapter: AxiosAdapter = async (config) => {
    const { url, method, data, headers, params, timeout } = config;

    // Construct full URL with params
    let fullUrl = url || '';
    if (params && Object.keys(params).length > 0) {
        const queryParams = new URLSearchParams(params).toString();
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryParams;
    }

    try {
        const response = await fetch(fullUrl, {
            method: method?.toUpperCase() || 'GET',
            headers: Object.fromEntries(
                Object.entries(headers || {}).map(([k, v]) => [k, String(v)]),
            ),
            body: data,
            connectTimeout: timeout,
        });

        const responseData = await response.json().catch(() => response.text());

        const axiosResponse: AxiosResponse = {
            data: responseData,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            config,
            request: null, // Tauri fetch doesn't expose the original request object in the same way
        };

        return axiosResponse;
    } catch (error) {
        const errorMsg =
            error instanceof Error ? error.message : 'Network Error';
        const axiosError = new Error(errorMsg) as Error & {
            config: unknown;
            request: unknown;
            response: unknown;
            isAxiosError: boolean;
        };
        axiosError.config = config;
        axiosError.request = null;
        axiosError.response = (error as { response?: unknown })?.response;
        axiosError.isAxiosError = true;
        throw axiosError;
    }
};
