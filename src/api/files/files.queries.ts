import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { filesApi } from './files.api';
import type { FileMetadata, ProxyMetadata } from './files.types';

export const useFileMetadata = (
    filename: string | null,
): UseQueryResult<FileMetadata | null> =>
    useQuery({
        queryKey: ['fileMetadata', filename],
        queryFn: (): Promise<FileMetadata> | null =>
            filename ? filesApi.getFileMetadata(filename) : null,
        enabled: !!filename,
    });

export const useProxyMetadata = (
    url: string | null,
): UseQueryResult<ProxyMetadata | null> =>
    useQuery({
        queryKey: ['proxyMetadata', url],
        queryFn: (): Promise<ProxyMetadata> | null =>
            url ? filesApi.getProxyMetadata(url) : null,
        enabled: !!url,
    });

export const useProxyContent = (
    url: string | null,
): UseQueryResult<string | null> =>
    useQuery({
        queryKey: ['proxyContent', url],
        queryFn: (): Promise<string> | null =>
            url ? filesApi.getProxyContent(url) : null,
        enabled: !!url,
    });

export const useFileContent = (
    url: string | null,
): UseQueryResult<string | null> =>
    useQuery({
        queryKey: ['fileContent', url],
        queryFn: (): Promise<string> | null =>
            url ? filesApi.getFileContent(url) : null,
        enabled: !!url,
    });
