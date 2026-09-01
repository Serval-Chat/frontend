import React from 'react';

import { Download, EyeOff, File as FileIcon } from 'lucide-react';
import { getIcon } from 'material-file-icons';

import type { MessageAttachment } from '@/api/chat/chat.types';
import {
    useFileContent,
    useFileMetadata,
    useProxyContent,
    useProxyMetadata,
} from '@/api/files/files.queries';
import type { FileMetadata, ProxyMetadata } from '@/api/files/files.types';
import { formatFileSize } from '@/lib/autosizer';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { Button } from '@/ui/components/common/Button';
import { CodeBlock } from '@/ui/components/common/CodeBlock';
import { ImageLightbox } from '@/ui/components/common/ImageLightbox';
import { Link } from '@/ui/components/common/Link';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { PausedAnimatedImage } from '@/ui/components/common/PausedAnimatedImage';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { isAnimatedImageUrl } from '@/utils/animationPreferences';
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

const MAX_CODE_PREVIEW_BYTES = 50 * 1024;
const CODE_PREVIEW_MAX_LINES = 30;

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

export const FileEmbed = ({ url, attachment, onResize }: FileEmbedProps) => {
    const limitedAnimations = useLimitedAnimations();
    const attachmentUrl =
        attachment === undefined
            ? undefined
            : `/api/v1/files/download/${encodeURIComponent(attachment.attachmentId)}${attachment.spoiler === true ? '#spoiler' : ''}`;
    const resolvedUrl = attachmentUrl ?? url;
    const baseUrl = (resolvedUrl ?? '').split('#')[0] ?? '';
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
                    onClick={(): void => {
                        if (isSpoiler && !isRevealed) {
                            setIsRevealed(true);
                        } else {
                            setIsLightboxOpen(true);
                        }
                    }}
                >
                    <PausedAnimatedImage
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
                        paused={
                            limitedAnimations
                                ? mimeType === 'image/gif' ||
                                  isAnimatedImageUrl(displayUrl)
                                : false
                        }
                        src={displayUrl}
                        style={{ aspectRatio: mediaBoxStyle.aspectRatio }}
                        width={mediaDimensions.width}
                        onLoad={onResize}
                    />
                    {isSpoiler && !isRevealed ? (
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
                    ) : null}
                    {isSpoiler && isRevealed ? (
                        <Button
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 p-0 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                            size="sm"
                            variant="ghost"
                            onClick={(e): void => {
                                e.stopPropagation();
                                setIsRevealed(false);
                            }}
                        >
                            <EyeOff size={14} />
                        </Button>
                    ) : null}
                </Box>
                <ImageLightbox
                    alt={displayName || 'Image'}
                    isOpen={isLightboxOpen}
                    src={displayUrl!}
                    onClose={(): void => {
                        setIsLightboxOpen(false);
                    }}
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
                onClick={(): false | void =>
                    isSpoiler && !isRevealed && setIsRevealed(true)
                }
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
                            aria-label="Embedded video"
                            className="h-full max-h-[min(450px,70vh)] w-full object-contain"
                            height={mediaDimensions.height}
                            preload="metadata"
                            src={displayUrl}
                            style={{ aspectRatio: mediaBoxStyle.aspectRatio }}
                            width={mediaDimensions.width}
                            onLoadedData={onResize}
                            onLoadedMetadata={onResize}
                        >
                            <track kind="captions" />
                        </video>
                        {isSpoiler && isRevealed ? (
                            <Button
                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 p-0 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
                                size="sm"
                                variant="ghost"
                                onClick={(e): void => {
                                    e.stopPropagation();
                                    setIsRevealed(false);
                                }}
                            >
                                <EyeOff size={14} />
                            </Button>
                        ) : null}
                    </>
                )}
            </Box>
        );
    }

    // Text/Code rendering
    const isText =
        attachment?.type === 'text' ||
        (isLocal && (meta as FileMetadata).isBinary === false) ||
        mimeType?.startsWith('text/') ||
        mimeType === 'application/json';
    if (isText && meta.size !== undefined && meta.size < MAX_CODE_PREVIEW_BYTES) {
        return (
            <CodeEmbed
                content={attachment?.content}
                estimatedBytes={meta.size}
                filename={displayName || 'file'}
                isLocal={isLocal}
                url={resolvedUrl}
                onResize={onResize}
            />
        );
    }

    // Generic file rendering
    const fileTypeIcon = displayName ? getIcon(displayName) : undefined;
    const archiveExtension =
        fileTypeIcon?.name === 'zip'
            ? displayName?.split('.').pop()?.toUpperCase().slice(0, 4)
            : undefined;

    return (
        <Box className="my-2 flex w-75 items-center gap-3 rounded-lg bg-bg-secondary p-3 transition-all">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {fileTypeIcon ? (
                    <div
                        className="h-6 w-6"
                        dangerouslySetInnerHTML={{ __html: fileTypeIcon.svg }}
                    />
                ) : (
                    <FileIcon size={20} />
                )}
                {archiveExtension ? (
                    <span className="absolute -right-1.5 -bottom-1.5 rounded border border-border-subtle bg-background px-1.5 py-0.5 text-[10px] leading-none font-bold whitespace-nowrap text-muted-foreground">
                        {archiveExtension}
                    </span>
                ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <Text className="truncate" size="sm" weight="bold">
                    {displayName}
                </Text>
                <Text size="xs" variant="muted">
                    {formatFileSize(size)} •{' '}
                    {displayName?.split('.').pop()?.toUpperCase() || 'FILE'}
                </Text>
            </div>
            <Button
                size="sm"
                variant="ghost"
                onClick={(): Window | null =>
                    window.open(resolvedUrl, '_blank')
                }
            >
                <Download size={16} />
            </Button>
        </Box>
    );
};

const AVG_CODE_BYTES_PER_LINE = 40;
const MIN_PREVIEW_SKELETON_LINES = 3;

const estimatePreviewLines = (bytes: number | undefined): number => {
    if (!bytes) return MIN_PREVIEW_SKELETON_LINES;
    const estimated = Math.round(bytes / AVG_CODE_BYTES_PER_LINE);
    return Math.min(
        CODE_PREVIEW_MAX_LINES,
        Math.max(MIN_PREVIEW_SKELETON_LINES, estimated),
    );
};

const CodeEmbed = ({
    url,
    isLocal,
    filename,
    content: embeddedContent,
    estimatedBytes,
    onResize,
}: {
    url: string;
    isLocal: boolean;
    filename: string;
    content?: string;
    estimatedBytes?: number;
    onResize?: () => void;
}) => {
    const hasEmbeddedContent = embeddedContent !== undefined;
    const { data: remoteContent, isLoading: loadingRemote } = useProxyContent(
        !isLocal && !hasEmbeddedContent ? url : null,
    );
    const { data: localContent, isLoading: loadingLocal } = useFileContent(
        isLocal && !hasEmbeddedContent ? url : null,
    );

    const isLoading = hasEmbeddedContent
        ? false
        : isLocal
          ? loadingLocal
          : loadingRemote;
    const content = hasEmbeddedContent
        ? embeddedContent
        : isLocal
          ? localContent
          : remoteContent;

    React.useEffect((): void => {
        onResize?.();
    }, [content, isLoading, onResize]);

    if (isLoading) {
        const skeletonLines = estimatePreviewLines(estimatedBytes);
        return (
            <div
                className="my-2 overflow-hidden rounded-lg border border-border-subtle bg-background shadow-sm"
                data-testid="code-embed-skeleton"
            >
                <div className="flex items-center justify-between border-b border-border-subtle bg-bg-subtle px-3 py-2">
                    <span className="truncate text-xs font-bold text-foreground/80">
                        {filename}
                    </span>
                    <LoadingSpinner size="sm" />
                </div>
                <div className="bg-bg-secondary/50 p-0">
                    {Array.from({ length: skeletonLines }).map((_, i) => (
                        <div
                            className="flex h-6 items-center px-3"
                            data-testid="code-embed-skeleton-line"
                            key={`skeleton-line-${i}`}
                        >
                            <div
                                className="h-3 animate-pulse rounded bg-bg-subtle"
                                style={{
                                    width: `${35 + ((i * 17) % 50)}%`,
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const extension = filename.split('.').pop() || 'text';

    return (
        <CodeBlock
            content={content || ''}
            filename={filename}
            language={extension}
            maxLines={CODE_PREVIEW_MAX_LINES}
            onDownload={(): Window | null => window.open(url, '_blank')}
        />
    );
};
