import { apiClient } from '@/api/client';

import type { Warning } from './warnings.types';

export const warningsApi = {
    getMyWarnings: (acknowledged?: boolean): Promise<Warning[]> =>
        apiClient
            .get<Warning[]>('/api/v1/warnings/me', {
                params: { acknowledged },
            })
            .then((r): Warning[] => r.data),

    acknowledgeWarning: (id: string): Promise<Warning> =>
        apiClient
            .post<Warning>(`/api/v1/warnings/${id}/acknowledge`)
            .then((r): Warning => r.data),

    getUserWarnings: (userId: string): Promise<Warning[]> =>
        apiClient
            .get<Warning[]>(`/api/v1/admin/users/${userId}/warnings`)
            .then((r): Warning[] => r.data),
};
