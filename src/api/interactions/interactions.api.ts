import { apiClient } from '@/api/client';
import type { InteractionValue } from '@/types/interactions';

export interface SlashCommand {
    id: string;
    name: string;
    description: string;
    options: {
        type: number;
        name: string;
        description: string;
        required?: boolean;
    }[];
}

export const interactionsApi = {
    getServerCommands: async (serverId: string): Promise<SlashCommand[]> => {
        const res = await apiClient.get<SlashCommand[]>(
            `/api/v1/servers/${serverId}/commands`,
        );
        return res.data;
    },

    createInteraction: async (data: {
        command: string;
        commandId?: string;
        options?: { name: string; value: InteractionValue }[];
        serverId: string;
        channelId: string;
    }): Promise<{ success: boolean }> => {
        const res = await apiClient.post<{ success: boolean }>(
            '/api/v1/interactions',
            data,
        );
        return res.data;
    },
};
