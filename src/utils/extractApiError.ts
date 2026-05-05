import { AxiosError } from 'axios';

export function extractApiError(
    error: unknown,
    defaultMessage?: string,
): string {
    if (error instanceof AxiosError && error.response?.data?.message) {
        const apiMessage = error.response.data.message;
        return Array.isArray(apiMessage) ? apiMessage[0] : apiMessage;
    }

    return (error as Error)?.message || defaultMessage || 'An error occurred';
}
