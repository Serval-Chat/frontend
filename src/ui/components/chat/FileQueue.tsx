import React, { useMemo, useRef } from 'react';

import { Check, Eye, EyeOff, X } from 'lucide-react';
import { getIcon } from 'material-file-icons';

import type { QueuedFile } from '@/hooks/chat/useFileQueue';
import { formatFileSize } from '@/lib/autosizer';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { Box } from '@/ui/components/layout/Box';
import { svgDataUrl } from '@/utils/svgDataUrl';

interface FileQueueProps {
    files: QueuedFile[];
    onRemove: (id: string) => void;
    onToggleSpoiler: (id: string) => void;
}

export const FileQueue = ({
    files,
    onRemove,
    onToggleSpoiler,
}: FileQueueProps) => {
    if (files.length === 0) return null;

    return (
        <Box className="flex flex-wrap gap-2 border-t border-border-subtle bg-bg-secondary/50 p-2">
            {files.map((file) => (
                <FileQueueItem
                    file={file}
                    key={file.id}
                    onRemove={(): void => {
                        onRemove(file.id);
                    }}
                    onToggleSpoiler={(): void => {
                        onToggleSpoiler(file.id);
                    }}
                />
            ))}
        </Box>
    );
};

const FileQueueItem = ({
    file,
    onRemove,
    onToggleSpoiler,
}: {
    file: QueuedFile;
    onRemove: () => void;
    onToggleSpoiler: () => void;
}) => {
    const isImage = file.file.type.startsWith('image/');
    const previewRef = useRef<HTMLImageElement>(null);
    const fileTypeIcon = useMemo(
        (): ReturnType<typeof getIcon> | undefined =>
            isImage ? undefined : getIcon(file.file.name),
        [file.file.name, isImage],
    );

    React.useLayoutEffect((): (() => void) | undefined => {
        const img = previewRef.current;
        if (!img) return undefined;
        const url = URL.createObjectURL(file.file);
        img.src = url;
        return (): void => {
            URL.revokeObjectURL(url);
        };
    }, [file.file, isImage]);

    return (
        <Box className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border-subtle bg-bg-primary">
            {isImage ? (
                <img
                    alt={file.file.name}
                    className={`h-full w-full object-cover transition-all duration-300 ${
                        file.isSpoiler ? 'blur-md' : ''
                    } ${file.status === 'uploading' ? 'opacity-50' : ''}`}
                    ref={previewRef}
                />
            ) : (
                <div
                    className={`flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center ${
                        file.status === 'uploading' ? 'opacity-50' : ''
                    }`}
                >
                    {fileTypeIcon ? (
                        <img
                            alt=""
                            className="h-8 w-8 shrink-0"
                            src={svgDataUrl(fileTypeIcon.svg)}
                        />
                    ) : null}
                    <Tooltip fullWidth content={file.file.name} position="top">
                        <Text className="w-full truncate text-[10px]" size="xs">
                            {file.file.name}
                        </Text>
                    </Tooltip>
                    <Text size="xs" variant="muted">
                        {formatFileSize(file.file.size)}
                    </Text>
                </div>
            )}

            {file.status === 'idle' && isImage ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        aria-label={`${file.isSpoiler ? 'Hide' : 'Show'} spoiler for ${file.file.name}`}
                        className="h-8 w-8 border-none bg-black/60 p-0 hover:bg-black/80"
                        size="sm"
                        variant="ghost"
                        onClick={(e): void => {
                            e.stopPropagation();
                            onToggleSpoiler();
                        }}
                    >
                        {file.isSpoiler ? (
                            <EyeOff size={14} />
                        ) : (
                            <Eye size={14} />
                        )}
                    </Button>
                </div>
            ) : null}

            {file.status === 'idle' ? (
                <div className="absolute top-1 right-1">
                    <Button
                        aria-label={`Remove ${file.file.name}`}
                        className="h-6 w-6 rounded-full border-none bg-black/60 p-0 text-white hover:bg-black/80"
                        size="sm"
                        variant="ghost"
                        onClick={(e): void => {
                            e.stopPropagation();
                            onRemove();
                        }}
                    >
                        <X size={12} />
                    </Button>
                </div>
            ) : null}

            {/* Uploading indicator */}
            {file.status === 'uploading' ? (
                <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/20">
                    <div
                        className="h-full w-full origin-left bg-primary transition-transform duration-300"
                        style={{ transform: `scaleX(${file.progress / 100})` }}
                    />
                </div>
            ) : null}

            {/* Completed indicator */}
            {file.status === 'completed' ? (
                <div className="absolute top-1 right-1 rounded-full bg-green-500 p-0.5">
                    <Check className="text-white" size={10} />
                </div>
            ) : null}

            {/* Error indicator */}
            {file.status === 'error' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                    <X className="text-red-500" size={20} />
                </div>
            ) : null}

            {/* Spoiler indicator tag */}
            {file.isSpoiler ? (
                <div className="pointer-events-none absolute top-1 left-1 rounded bg-black/60 px-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
                    Spoiler
                </div>
            ) : null}
        </Box>
    );
};
