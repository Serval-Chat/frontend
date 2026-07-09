import { AxiosError } from 'axios';

interface ApiErrorData {
    message?: string | string[];
}

export function extractApiError(
    error: unknown,
    defaultMessage?: string,
): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as ApiErrorData | undefined;
        if (data?.message !== undefined) {
            const apiMessage = data.message;
            if (Array.isArray(apiMessage)) {
                return apiMessage[0] ?? defaultMessage ?? 'An error occurred';
            }
            return apiMessage;
        }

        const status = error.response?.status;
        if (status !== undefined) {
            if (status === 400)
                return 'Invalid request. Please check your input.';
            if (status === 401) return 'You need to be logged in to do this.';
            if (status === 403) return "You don't have permission to do this.";
            if (status === 404) return 'The requested resource was not found.';
            if (status === 409)
                return 'This already exists or there is a conflict.';
            if (status === 429)
                return 'You are doing that too much. Please try again later.';
            if (status >= 500) return 'Server error. Please try again later.';
        }
    }

    const message = error instanceof Error ? error.message : '';
    if (message !== '' && !message.includes('status code')) {
        return message;
    }

    return defaultMessage ?? 'An error occurred';
}
