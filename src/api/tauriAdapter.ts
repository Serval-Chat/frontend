import { fetch } from '@tauri-apps/plugin-http';
import type { AxiosAdapter, AxiosResponse } from 'axios';

const isAbsoluteUrl = (url: string): boolean =>
    /^[a-z][a-z\d+\-.]*:\/\//i.test(url);

const resolveUrl = (
    url: string | undefined,
    baseURL: string | undefined,
): string => {
    if (!url) return '';
    if (isAbsoluteUrl(url)) return url;

    const base =
        baseURL ||
        (typeof window !== 'undefined' ? window.location.origin : undefined);

    return base ? new URL(url, base).toString() : url;
};

const appendSearchParams = (url: string, params: unknown): string => {
    if (!params || typeof params !== 'object') return url;

    const searchParams = new URLSearchParams();
    Object.entries(params as Record<string, unknown>).forEach(
        ([key, value]) => {
            if (value === undefined || value === null) return;

            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (item !== undefined && item !== null) {
                        searchParams.append(key, String(item));
                    }
                });
                return;
            }

            searchParams.append(key, String(value));
        },
    );

    const queryParams = searchParams.toString();
    return queryParams
        ? `${url}${url.includes('?') ? '&' : '?'}${queryParams}`
        : url;
};

/**
 * @description Native Tauri HTTP adapter for Axios.
 * This bypasses the browser's CORS preflight (OPTIONS) requests.
 */
export const tauriAdapter: AxiosAdapter = async (config) => {
    const { url, baseURL, method, data, headers, params, timeout } = config;

    const fullUrl = appendSearchParams(resolveUrl(url, baseURL), params);

    try {
        const response = await fetch(fullUrl, {
            method: method?.toUpperCase() || 'GET',
            headers: Object.fromEntries(
                Object.entries(headers || {}).map(([k, v]) => [k, String(v)]),
            ),
            body: data,
            connectTimeout: timeout,
        });

        const responseText = await response.text();
        let responseData: unknown = responseText;
        if (responseText) {
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }
        }

        const axiosResponse: AxiosResponse = {
            data: responseData,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            config,
            request: null, // Tauri fetch doesn't expose the original request object in the same way
        };

        if (response.status < 200 || response.status >= 300) {
            const axiosError = new Error(
                `Request failed with status code ${response.status}`,
            ) as Error & {
                config: unknown;
                request: unknown;
                response: AxiosResponse;
                isAxiosError: boolean;
            };
            axiosError.config = config;
            axiosError.request = null;
            axiosError.response = axiosResponse;
            axiosError.isAxiosError = true;
            throw axiosError;
        }

        return axiosResponse;
    } catch (error) {
        if (error && typeof error === 'object' && 'isAxiosError' in error) {
            throw error;
        }

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
