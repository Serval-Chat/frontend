import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { filesApi } from './files.api';
import type { FileMetadata, ProxyMetadata } from './files.types';

export const useFileMetadata = (
    filename: string | null,
): UseQueryResult<FileMetadata | null, Error> =>
    useQuery({
        queryKey: ['fileMetadata', filename],
        queryFn: () => (filename ? filesApi.getFileMetadata(filename) : null),
        enabled: !!filename,
    });

export const useProxyMetadata = (
    url: string | null,
): UseQueryResult<ProxyMetadata | null, Error> =>
    useQuery({
        queryKey: ['proxyMetadata', url],
        queryFn: () => (url ? filesApi.getProxyMetadata(url) : null),
        enabled: !!url,
    });

export const useProxyContent = (
    url: string | null,
): UseQueryResult<string | null, Error> =>
    useQuery({
        queryKey: ['proxyContent', url],
        queryFn: () => (url ? filesApi.getProxyContent(url) : null),
        enabled: !!url,
    });

export const useFileContent = (
    url: string | null,
): UseQueryResult<string | null, Error> =>
    useQuery({
        queryKey: ['fileContent', url],
        queryFn: () => (url ? filesApi.getFileContent(url) : null),
        enabled: !!url,
    });
