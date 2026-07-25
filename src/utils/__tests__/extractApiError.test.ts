import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { extractApiError } from '@/utils/extractApiError';

describe('extractApiError', () => {
    it('returns custom message from data.message', () => {
        const error = new AxiosError(
            'Request failed',
            'ERR_BAD_REQUEST',
            undefined,
            undefined,
            {
                data: { message: 'Custom server error message' },
                status: 400,
                statusText: 'Bad Request',
                headers: {},
                config: { headers: new AxiosHeaders() },
            } as AxiosResponse,
        );

        expect(extractApiError(error)).toBe('Custom server error message');
    });

    it('returns custom message from data.error (ApiErrorFilter shape)', () => {
        const error = new AxiosError(
            'Request failed',
            'ERR_BAD_REQUEST',
            undefined,
            undefined,
            {
                data: { error: 'File type not allowed' },
                status: 400,
                statusText: 'Bad Request',
                headers: {},
                config: { headers: new AxiosHeaders() },
            } as AxiosResponse,
        );

        expect(extractApiError(error)).toBe('File type not allowed');
    });

    it('handles HTTP 413 Payload Too Large explicitly', () => {
        const error = new AxiosError(
            'Request failed',
            'ERR_BAD_REQUEST',
            undefined,
            undefined,
            {
                data: {},
                status: 413,
                statusText: 'Payload Too Large',
                headers: {},
                config: { headers: new AxiosHeaders() },
            } as AxiosResponse,
        );

        expect(extractApiError(error)).toBe('The file is too large. Please use a smaller file.');
    });

    it('handles HTTP 415 Unsupported Media Type explicitly', () => {
        const error = new AxiosError(
            'Request failed',
            'ERR_BAD_REQUEST',
            undefined,
            undefined,
            {
                data: {},
                status: 415,
                statusText: 'Unsupported Media Type',
                headers: {},
                config: { headers: new AxiosHeaders() },
            } as AxiosResponse,
        );

        expect(extractApiError(error)).toBe('Unsupported file type. Please try a different format.');
    });

    it('handles HTTP 500+ server errors with a clear user-friendly message', () => {
        const error = new AxiosError(
            'Request failed',
            'ERR_BAD_RESPONSE',
            undefined,
            undefined,
            {
                data: {},
                status: 500,
                statusText: 'Internal Server Error',
                headers: {},
                config: { headers: new AxiosHeaders() },
            } as AxiosResponse,
        );

        expect(extractApiError(error)).toBe('Something went wrong on our end. Please try again later.');
    });

    it('handles network errors (no response received)', () => {
        const error = new AxiosError('Network Error', 'ERR_NETWORK');

        expect(extractApiError(error)).toBe('Could not reach the server. Please check your connection.');
    });
});
