import React from 'react';

import {
    Code,
    Download,
    EyeOff,
    File as FileIcon,
    Maximize2,
} from 'lucide-react';

import type { MessageAttachment } from '@/api/chat/chat.types';
import {
    useFileContent,
    useFileMetadata,
    useProxyContent,
    useProxyMetadata,
} from '@/api/files/files.queries';
import type { FileMetadata, ProxyMetadata } from '@/api/files/files.types';
import { Button } from '@/ui/components/common/Button';
import { CodeModal } from '@/ui/components/common/CodeModal';
import { ImageLightbox } from '@/ui/components/common/ImageLightbox';
import { Link } from '@/ui/components/common/Link';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { getSafeUrl, isInternalUrl } from '@/utils/proxy';

interface FileEmbedProps {
    url?: string;
    attachment?: MessageAttachment;
    onResize?: () => void;
}

const FALLBACK_MEDIA_WIDTH = 320;
const FALLBACK_MEDIA_HEIGHT = 180;
const MAX_MEDIA_WIDTH = 550;

const getMediaDimensions = (
    attachment: MessageAttachment | undefined,
): { width: number; height: number; hasMetadata: boolean } => {
    if (attachment?.width && attachment.height) {
        return {
            width: attachment.width,
            height: attachment.height,
            hasMetadata: true,
        };
    }

    return {
        width: FALLBACK_MEDIA_WIDTH,
        height: FALLBACK_MEDIA_HEIGHT,
        hasMetadata: false,
    };
};

const getMediaBoxStyle = (
    attachment: MessageAttachment | undefined,
): React.CSSProperties => {
    const { width, height } = getMediaDimensions(attachment);
    return {
        aspectRatio: `${width} / ${height}`,
        width: `min(${width}px, 100%)`,
        maxWidth: `${Math.min(width, MAX_MEDIA_WIDTH)}px`,
    };
};

export const FileEmbed: React.FC<FileEmbedProps> = ({
    url,
    attachment,
    onResize,
}) => {
    const attachmentUrl =
        attachment !== undefined
            ? `/api/v1/files/download/${encodeURIComponent(attachment.attachmentId)}${attachment.spoiler === true ? '#spoiler' : ''}`
            : undefined;
    const resolvedUrl = attachmentUrl ?? url;
    const baseUrl = (resolvedUrl ?? '').split('#')[0];
    const isLocal =
        attachment !== undefined || (baseUrl !== '' && isInternalUrl(baseUrl));
    const filename =
        attachment === undefined && isLocal ? baseUrl.split('/').pop() : null;

    const { data: localMeta, isLoading: loadingLocal } = useFileMetadata(
        attachment === undefined ? (filename ?? null) : null,
    );
    const { data: remoteMeta, isLoading: loadingRemote } = useProxyMetadata(
        attachment === undefined && !isLocal ? baseUrl : null,
    );

    const isLoading =
        attachment === undefined && (loadingLocal || loadingRemote);
    const meta = attachment ?? (isLocal ? localMeta : remoteMeta);

    const isSpoiler =
        attachment?.spoiler === true ||
        resolvedUrl?.endsWith('#spoiler') === true;
    const [isRevealed, setIsRevealed] = React.useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

    if (resolvedUrl === undefined) return null;

    if (isLoading) {
        return (
            <Box className="my-2 flex w-fit min-w-[200px] items-center gap-2 rounded-lg bg-bg-secondary p-4">
                <LoadingSpinner size="sm" />
                <Text size="sm" variant="muted">
                    Fetching file info...
                </Text>
            </Box>
        );
    }

    if (!meta) {
        return (
            <Link href={resolvedUrl} target="_blank">
                {resolvedUrl}
            </Link>
        );
    }

    const mimeType =
        attachment?.mimeType ??
        (isLocal
            ? (meta as FileMetadata).mimeType
            : (meta as ProxyMetadata).headers['content-type']);
    const size = meta.size ?? 0;
    const displayName =
        attachment?.name ??
        (isLocal
            ? (meta as FileMetadata).filename
            : resolvedUrl.split('/').pop()?.split('?')[0] || 'file');

    // Image rendering
    if (mimeType?.startsWith('image/')) {
        const displayUrl = getSafeUrl(resolvedUrl);
        const mediaDimensions = getMediaDimensions(attachment);
        const mediaBoxStyle = getMediaBoxStyle(attachment);

        return (
            <>
                <Box
                    className="group relative my-2 max-h-[min(450px,70vh)] cursor-pointer rounded-lg"
                    style={mediaBoxStyle}
                    onClick={() => {
                        if (isSpoiler && !isRevealed) {
                            setIsRevealed(true);
                        } else {
                            setIsLightboxOpen(true);
                        }
                    }}
                >
                    <img
                        alt={displayName || 'File content'}
                        className={cn(
                            'block h-full max-h-[min(450px,70vh)] w-full rounded-lg object-contain transition-opacity duration-300',
                            isSpoiler && !isRevealed
                                ? 'opacity-0'
                                : 'opacity-100',
                        )}
                        decoding="async"
                        height={mediaDimensions.height}
                        loading="eager"
                        src={displayUrl!}
                        style={{ aspectRatio: mediaBoxStyle.aspectRatio }}
                        width={mediaDimensions.width}
                        onLoad={onResize}
                    />
                    {isSpoiler && !isRevealed && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background">
                            <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-secondary px-3 py-1.5">
                                <EyeOff
                                    className="text-muted-foreground"
                                    size={16}
                                />
                                <Text
                                    className="text-muted-foreground"
                                    size="xs"
                                    weight="bold"
                                >
                                    SPOILER
                                </Text>
                            </div>
                        </div>
                    )}
                    {isSpoiler && isRevealed && (
                        <Button
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 p-0 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsRevealed(false);
                            }}
                        >
                            <EyeOff size={14} />
                        </Button>
                    )}
                </Box>
                <ImageLightbox
                    alt={displayName || 'Image'}
                    isOpen={isLightboxOpen}
                    src={displayUrl!}
                    onClose={() => setIsLightboxOpen(false)}
                />
            </>
        );
    }

    // Video rendering
    if (mimeType?.startsWith('video/')) {
        const displayUrl = resolvedUrl;
        const mediaDimensions = getMediaDimensions(attachment);
        const mediaBoxStyle = getMediaBoxStyle(attachment);

        return (
            <Box
                className="group relative my-2 max-h-[min(450px,70vh)] overflow-hidden rounded-lg"
                style={mediaBoxStyle}
                onClick={() => isSpoiler && !isRevealed && setIsRevealed(true)}
            >
                {isSpoiler && !isRevealed ? (
                    <div
                        className="relative flex h-full w-full cursor-pointer items-center justify-center bg-background"
                        style={{ aspectRatio: mediaBoxStyle.aspectRatio }}
                    >
                        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-secondary px-3 py-1.5">
                            <EyeOff
                                className="text-muted-foreground"
                                size={16}
                            />
                            <Text
                                className="text-muted-foreground"
                                size="xs"
                                weight="bold"
                            >
                                SPOILER (VIDEO)
                            </Text>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            controls
                            playsInline
                            className="h-full max-h-[min(450px,70vh)] w-full object-contain"
                            height={mediaDimensions.height}
                            preload="metadata"
                            src={displayUrl!}
                            style={{ aspectRatio: mediaBoxStyle.aspectRatio }}
                            width={mediaDimensions.width}
                            onLoadedData={onResize}
                            onLoadedMetadata={onResize}
                        >
                            <track kind="captions" />
                        </video>
                        {isSpoiler && isRevealed && (
                            <Button
                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 p-0 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsRevealed(false);
                                }}
                            >
                                <EyeOff size={14} />
                            </Button>
                        )}
                    </>
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
                url={resolvedUrl}
                onResize={onResize}
            />
        );
    }

    // Generic file rendering
    return (
        <Box className="my-2 flex w-[300px] items-center gap-3 rounded-lg bg-bg-secondary p-3 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileIcon size={20} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
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
                onClick={() => window.open(resolvedUrl, '_blank')}
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
    onResize?: () => void;
}> = ({ url, isLocal, filename, size, onResize }) => {
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

    React.useEffect(() => {
        onResize?.();
    }, [content, isLoading, onResize]);

    // If it's too large, don't try to render it as code
    if (isTooLarge) {
        return (
            <Box className="my-2 flex w-[300px] items-center gap-3 rounded-lg bg-bg-secondary p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Code size={20} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
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
            <Box className="my-2 flex w-fit min-w-[200px] items-center gap-2 rounded-lg bg-bg-secondary p-4">
                <LoadingSpinner size="sm" />
                <Text size="sm" variant="muted">
                    Loading content...
                </Text>
            </Box>
        );
    }

    const lines = (content || '').split('\n');
    const isTruncated =
        lines.length > 20 ||
        (content || '').length >
            Number(import.meta.env.VITE_MAX_MESSAGE_LENGTH || 2000);
    const previewContent = isTruncated
        ? lines.slice(0, 20).join('\n')
        : content;

    const extension = filename.split('.').pop() || 'text';

    return (
        <>
            <Box className="my-2 max-w-[600px] overflow-hidden rounded-lg border border-border-subtle/50 bg-bg-secondary">
                <div className="flex items-center justify-between border-b border-border-subtle/50 bg-bg-primary/50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
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
                    <pre
                        className="scrollbar-none overflow-x-auto bg-bg-secondary/30 p-4 font-mono text-xs"
                        style={{ minHeight: '1.6em' }}
                    >
                        <code className="text-foreground/90">
                            {previewContent || 'No content'}
                        </code>
                    </pre>

                    {isTruncated && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-secondary to-transparent" />
                    )}
                </div>

                {isTruncated && (
                    <div className="flex justify-center border-t border-border-subtle/30 bg-bg-primary/30 px-3 py-2">
                        <Button
                            className="flex items-center gap-1.5 border-none bg-transparent text-[11px] font-bold text-primary shadow-none transition-colors hover:text-primary-hover"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowFull(true)}
                        >
                            <Maximize2 size={12} />
                            Show whole
                        </Button>
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
