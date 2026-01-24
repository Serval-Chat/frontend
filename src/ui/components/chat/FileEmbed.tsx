import React from 'react';

import {
    Code,
    Download,
    EyeOff,
    File as FileIcon,
    Maximize2,
} from 'lucide-react';

import {
    useFileContent,
    useFileMetadata,
    useProxyContent,
    useProxyMetadata,
} from '@/api/files/files.queries';
import type { FileMetadata, ProxyMetadata } from '@/api/files/files.types';
import { Button } from '@/ui/components/common/Button';
import { CodeModal } from '@/ui/components/common/CodeModal';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';

interface FileEmbedProps {
    url: string;
}

export const FileEmbed: React.FC<FileEmbedProps> = ({ url }) => {
    const isLocal =
        url.includes('catfla.re/api/v1/files/download/') ||
        url.includes(window.location.origin);
    const filename = isLocal ? url.split('/').pop() : null;

    const { data: localMeta, isLoading: loadingLocal } = useFileMetadata(
        filename ?? null,
    );
    const { data: remoteMeta, isLoading: loadingRemote } = useProxyMetadata(
        isLocal ? null : url,
    );

    const isLoading = loadingLocal || loadingRemote;
    const meta = isLocal ? localMeta : remoteMeta;

    const isSpoiler = url.endsWith('#spoiler');
    const [isRevealed, setIsRevealed] = React.useState(false);

    if (isLoading) {
        return (
            <Box className="w-fit min-w-[200px] my-2 flex items-center gap-2 rounded-lg bg-bg-secondary p-4">
                <LoadingSpinner size="sm" />
                <Text size="sm" variant="muted">
                    Fetching file info...
                </Text>
            </Box>
        );
    }

    if (!meta) {
        return (
            <a
                className="text-primary hover:underline"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
            >
                {url}
            </a>
        );
    }

    const mimeType = isLocal
        ? (meta as FileMetadata).mimeType
        : (meta as ProxyMetadata).headers['content-type'];
    const size = meta.size ?? 0;
    const displayName = isLocal
        ? (meta as FileMetadata).filename
        : url.split('/').pop()?.split('?')[0] || 'file';

    // Image rendering
    if (mimeType?.startsWith('image/')) {
        const displayUrl = isLocal
            ? url
            : resolveApiUrl(
                  `/api/v1/file-proxy?url=${encodeURIComponent(url)}`,
              );

        return (
            <Box
                className="my-2 max-w-[min(550px,100%)] max-h-[min(450px,70vh)] w-fit overflow-hidden rounded-lg bg-bg-secondary relative cursor-pointer"
                onClick={() => isSpoiler && !isRevealed && setIsRevealed(true)}
            >
                <img
                    alt={displayName || 'File content'}
                    className={`h-auto max-h-inherit w-auto max-w-full object-contain transition-all duration-300 ${isSpoiler && !isRevealed ? 'blur-2xl' : ''}`}
                    src={displayUrl!}
                />
                {isSpoiler && !isRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <div className="bg-black/60 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                            <EyeOff size={16} />
                            <Text
                                className="text-white"
                                size="xs"
                                weight="bold"
                            >
                                SPOILER
                            </Text>
                        </div>
                    </div>
                )}
            </Box>
        );
    }

    // Video rendering
    if (mimeType?.startsWith('video/')) {
        const displayUrl = isLocal
            ? url
            : resolveApiUrl(
                  `/api/v1/file-proxy?url=${encodeURIComponent(url)}`,
              );

        return (
            <Box
                className="my-2 max-w-[min(550px,100%)] max-h-[min(450px,70vh)] w-fit overflow-hidden rounded-lg bg-bg-secondary relative"
                onClick={() => isSpoiler && !isRevealed && setIsRevealed(true)}
            >
                {isSpoiler && !isRevealed ? (
                    <div className="w-80 h-48 flex items-center justify-center bg-bg-secondary relative cursor-pointer">
                        <div className="bg-black/60 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                            <EyeOff size={16} />
                            <Text
                                className="text-white"
                                size="xs"
                                weight="bold"
                            >
                                SPOILER (VIDEO)
                            </Text>
                        </div>
                    </div>
                ) : (
                    <video
                        controls
                        className="h-auto max-h-inherit w-auto max-w-full"
                        src={displayUrl!}
                    >
                        <track kind="captions" />
                    </video>
                )}
            </Box>
        );
    }

    // Text/Code rendering
    const isText =
        (isLocal && (meta as FileMetadata).isBinary === false) ||
        mimeType?.startsWith('text/') ||
        mimeType === 'application/json' ||
        [
            'js',
            'ts',
            'tsx',
            'css',
            'html',
            'md',
            'py',
            'go',
            'rs',
            'c',
            'cpp',
            'h',
            'hpp',
            'java',
            'sh',
            'yaml',
            'json',
        ].some((ext) => displayName?.endsWith(`.${ext}`));
    if (isText) {
        return (
            <CodeEmbed
                filename={displayName || 'file'}
                isLocal={isLocal}
                size={size}
                url={url}
            />
        );
    }

    // Generic file rendering
    return (
        <Box className="my-2 flex w-[300px] items-center gap-3 rounded-lg bg-bg-secondary p-3 transition-all">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <FileIcon size={20} />
            </div>
            <div className="flex flex-1 flex-col min-w-0">
                <Text className="truncate" size="sm" weight="bold">
                    {displayName}
                </Text>
                <Text size="xs" variant="muted">
                    {(size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                </Text>
            </div>
            <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(url, '_blank')}
            >
                <Download size={16} />
            </Button>
        </Box>
    );
};

const CodeEmbed: React.FC<{
    url: string;
    isLocal: boolean;
    filename: string;
    size: number;
}> = ({ url, isLocal, filename, size }) => {
    const [showFull, setShowFull] = React.useState(false);
    const isTooLarge = size > 1024 * 1024;

    const { data: remoteContent, isLoading: loadingRemote } = useProxyContent(
        !isLocal && !isTooLarge ? url : null,
    );
    const { data: localContent, isLoading: loadingLocal } = useFileContent(
        isLocal && !isTooLarge ? url : null,
    );

    const isLoading = isLocal ? loadingLocal : loadingRemote;
    const content = isLocal ? localContent : remoteContent;

    // If it's too large, don't try to render it as code
    if (isTooLarge) {
        return (
            <Box className="my-2 flex w-[300px] items-center gap-3 rounded-lg bg-bg-secondary p-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <Code size={20} />
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                    <Text className="truncate" size="sm" weight="bold">
                        {filename}
                    </Text>
                    <Text size="xs" variant="muted">
                        File too large to preview (
                        {(size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(url, '_blank')}
                >
                    <Download size={16} />
                </Button>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box className="w-fit min-w-[200px] my-2 flex items-center gap-2 rounded-lg bg-bg-secondary p-4">
                <LoadingSpinner size="sm" />
                <Text size="sm" variant="muted">
                    Loading content...
                </Text>
            </Box>
        );
    }

    const lines = (content || '').split('\n');
    const isTruncated = lines.length > 20 || (content || '').length > 2000;
    const previewContent = isTruncated
        ? lines.slice(0, 20).join('\n')
        : content;

    const extension = filename.split('.').pop() || 'text';

    return (
        <>
            <Box className="my-2 max-w-[600px] overflow-hidden rounded-lg bg-bg-secondary border border-border-subtle/50">
                <div className="flex items-center justify-between px-3 py-2 bg-bg-primary/50 border-b border-border-subtle/50">
                    <div className="flex items-center gap-2 min-w-0">
                        <Code className="text-muted-foreground" size={14} />
                        <Text
                            className="truncate text-foreground/80"
                            size="xs"
                            weight="bold"
                        >
                            {filename}
                        </Text>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            className="h-7 w-7 p-0 hover:bg-white/5"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowFull(true)}
                        >
                            <Maximize2
                                className="text-muted-foreground"
                                size={14}
                            />
                        </Button>
                        <Button
                            className="h-7 w-7 p-0 hover:bg-white/5"
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(url, '_blank')}
                        >
                            <Download
                                className="text-muted-foreground"
                                size={14}
                            />
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <pre className="p-4 overflow-x-auto text-xs font-mono bg-bg-secondary/30 scrollbar-none">
                        <code className="text-foreground/90">
                            {previewContent || 'No content'}
                        </code>
                    </pre>

                    {isTruncated && (
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-secondary to-transparent pointer-events-none" />
                    )}
                </div>

                {isTruncated && (
                    <div className="px-3 py-2 bg-bg-primary/30 border-t border-border-subtle/30 flex justify-center">
                        <button
                            className="text-[11px] font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5"
                            onClick={() => setShowFull(true)}
                        >
                            <Maximize2 size={12} />
                            Show whole
                        </button>
                    </div>
                )}
            </Box>

            <CodeModal
                content={content || ''}
                isOpen={showFull}
                language={extension}
                onClose={() => setShowFull(false)}
            />
        </>
    );
};
