import { AxiosError } from 'axios';

interface ApiErrorData {
    message?: string | string[];
    error?: string;
}

export function extractApiError(
    error: unknown,
    defaultMessage?: string,
): string {
    if (error instanceof AxiosError) {
        if (!error.response) {
            return 'Could not reach the server. Please check your connection.';
        }

        const data = error.response.data as ApiErrorData | undefined;

        const rawMessage = data?.message ?? data?.error;
        if (rawMessage !== undefined) {
            if (Array.isArray(rawMessage)) {
                return rawMessage[0] ?? defaultMessage ?? 'An error occurred';
            }
            return rawMessage;
        }

        const status = error.response.status;
        if (status === 400)
            return 'Invalid request. Please check your input.';
        if (status === 401) return 'You need to be logged in to do this.';
        if (status === 403) return "You don't have permission to do this.";
        if (status === 404) return 'The requested resource was not found.';
        if (status === 409)
            return 'This already exists or there is a conflict.';
        if (status === 413)
            return 'The file is too large. Please use a smaller file.';
        if (status === 415)
            return 'Unsupported file type. Please try a different format.';
        if (status === 422)
            return 'The file could not be processed. Please try a different file.';
        if (status === 429)
            return 'You are doing that too much. Please try again later.';
        if (status >= 500) return 'Something went wrong on our end. Please try again later.';
    }

    const message = error instanceof Error ? error.message : '';
    if (message !== '' && !message.includes('status code')) {
        return message;
    }

    return defaultMessage ?? 'An error occurred';
}
