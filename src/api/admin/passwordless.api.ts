import { apiClient } from '@/api/client';

export interface AdminPasswordlessResetResult {
    message: string;
    temporaryPassword: string;
}

export const adminPasswordlessApi = {
    reset: async (userId: string): Promise<AdminPasswordlessResetResult> => {
        const response = await apiClient.post<AdminPasswordlessResetResult>(
            `/api/v1/admin/passwordless/users/${userId}/reset`,
        );
        return response.data;
    },
};
