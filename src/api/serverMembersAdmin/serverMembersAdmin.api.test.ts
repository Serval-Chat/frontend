import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/api/client';

import { serverMembersAdminApi } from './serverMembersAdmin.api';

vi.mock('@/api/client', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

const mockResponse = {
    data: { members: [], total: 0, limit: 25, offset: 0 },
};

describe('serverMembersAdminApi.getServerMembersAdmin', () => {
    it('GETs the admin members endpoint for the given server', async () => {
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        await serverMembersAdminApi.getServerMembersAdmin('server-1');

        expect(apiClient.get).toHaveBeenCalledWith(
            '/api/v1/servers/server-1/members/admin',
            { params: {} },
        );
    });

    it('drops undefined and empty-string params before sending the request', async () => {
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        await serverMembersAdminApi.getServerMembersAdmin('server-1', {
            search: '',
            roleId: undefined,
            sortBy: 'joinedAt',
            limit: 25,
            offset: 0,
        });

        expect(apiClient.get).toHaveBeenCalledWith(
            '/api/v1/servers/server-1/members/admin',
            { params: { sortBy: 'joinedAt', limit: 25, offset: 0 } },
        );
    });

    it('keeps a non-empty search/roleId param', async () => {
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        await serverMembersAdminApi.getServerMembersAdmin('server-1', {
            search: 'ali',
            roleId: 'role-1',
        });

        expect(apiClient.get).toHaveBeenCalledWith(
            '/api/v1/servers/server-1/members/admin',
            { params: { search: 'ali', roleId: 'role-1' } },
        );
    });
});
