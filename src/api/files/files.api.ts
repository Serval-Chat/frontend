import { apiClient } from '@/api/client';

import type { FileMetadata, ProxyMetadata } from './files.types';

export const filesApi = {
    getFileMetadata: async (filename: string): Promise<FileMetadata> => {
        const response = await apiClient.get<FileMetadata>(
            `/api/v1/files/metadata/${filename}`,
        );
        return response.data;
    },

    getProxyMetadata: async (url: string): Promise<ProxyMetadata> => {
        const response = await apiClient.get<ProxyMetadata>(
            `/api/v1/file-proxy/meta`,
            {
                params: { url },
            },
        );
        return response.data;
    },

    getProxyContent: async (url: string): Promise<string> => {
        const response = await apiClient.get<string>(`/api/v1/file-proxy`, {
            params: { url },
            responseType: 'text',
        });
        return response.data;
    },

    getFileContent: async (url: string): Promise<string> => {
        const response = await apiClient.get<string>(url, {
            responseType: 'text',
        });
        return response.data;
    },
};
