import { AxiosError } from 'axios';

export function extractApiError(
    error: unknown,
    defaultMessage?: string,
): string {
    if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
            const apiMessage = error.response.data.message;
            return Array.isArray(apiMessage) ? apiMessage[0] : apiMessage;
        }

        if (error.response?.status) {
            const status = error.response.status;
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

    const message = (error as Error)?.message;
    if (message && !message.includes('status code')) {
        return message;
    }

    return defaultMessage || 'An error occurred';
}
