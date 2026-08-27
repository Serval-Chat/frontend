import { apiClient as api } from '@/api/client';

import type { SetVanityLinkRequest, VanityLink } from './vanity.types';

export const getVanityLink = async (serverId: string): Promise<VanityLink> => {
    const response = await api.get<VanityLink>(
        `/api/v1/servers/${serverId}/vanity-link`,
    );
    return response.data;
};

export const setVanityLink = async (
    serverId: string,
    data: SetVanityLinkRequest,
): Promise<VanityLink> => {
    const response = await api.put<VanityLink>(
        `/api/v1/servers/${serverId}/vanity-link`,
        data,
    );
    return response.data;
};

export const deleteVanityLink = async (serverId: string): Promise<void> => {
    await api.delete(`/api/v1/servers/${serverId}/vanity-link`);
};
