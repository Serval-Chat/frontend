import { apiClient } from '@/api/client';

import type { Warning } from './warnings.types';

export const warningsApi = {
    getMyWarnings: (acknowledged?: boolean) =>
        apiClient
            .get<Warning[]>('/api/v1/warnings/me', {
                params: { acknowledged },
            })
            .then((r) => r.data),

    acknowledgeWarning: (id: string) =>
        apiClient
            .post<Warning>(`/api/v1/warnings/${id}/acknowledge`)
            .then((r) => r.data),

    getUserWarnings: (userId: string) =>
        apiClient
            .get<Warning[]>(`/api/v1/admin/users/${userId}/warnings`)
            .then((r) => r.data),
};
