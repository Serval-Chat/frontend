import React, { useMemo } from 'react';

import { Check, Eye, EyeOff, X } from 'lucide-react';

import { type QueuedFile } from '@/hooks/chat/useFileQueue';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface FileQueueProps {
    files: QueuedFile[];
    onRemove: (id: string) => void;
    onToggleSpoiler: (id: string) => void;
}

export const FileQueue: React.FC<FileQueueProps> = ({
    files,
    onRemove,
    onToggleSpoiler,
}) => {
    if (files.length === 0) return null;

    return (
        <Box className="flex flex-wrap gap-2 p-2 bg-bg-secondary/50 border-t border-border-subtle">
            {files.map((file) => (
                <FileQueueItem
                    file={file}
                    key={file.id}
                    onRemove={() => onRemove(file.id)}
                    onToggleSpoiler={() => onToggleSpoiler(file.id)}
                />
            ))}
        </Box>
    );
};

const FileQueueItem: React.FC<{
    file: QueuedFile;
    onRemove: () => void;
    onToggleSpoiler: () => void;
}> = ({ file, onRemove, onToggleSpoiler }) => {
    const isImage = file.file.type.startsWith('image/');
    const previewUrl = useMemo(() => {
        if (!isImage) return null;
        return URL.createObjectURL(file.file);
    }, [file.file, isImage]);

    React.useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        },
        [previewUrl],
    );

    return (
        <Box className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border-subtle bg-bg-primary">
            {isImage && previewUrl ? (
                <img
                    alt={file.file.name}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                        file.isSpoiler ? 'blur-md' : ''
                    } ${file.status === 'uploading' ? 'opacity-50' : ''}`}
                    src={previewUrl}
                />
            ) : (
                <div
                    className={`w-full h-full flex flex-col items-center justify-center p-1 text-center ${
                        file.status === 'uploading' ? 'opacity-50' : ''
                    }`}
                >
                    <Text className="truncate w-full text-[10px]" size="xs">
                        {file.file.name}
                    </Text>
                    <Text size="xs" variant="muted">
                        {(file.file.size / 1024).toFixed(1)} KB
                    </Text>
                </div>
            )}

            {file.status === 'idle' && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {isImage && (
                        <Button
                            className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 border-none"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
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
                    )}
                    <Button
                        className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 border-none text-red-400 hover:text-red-300"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                    >
                        <X size={14} />
                    </Button>
                </div>
            )}

            {/* Uploading indicator */}
            {file.status === 'uploading' && (
                <div className="absolute inset-x-2 bottom-2 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                    />
                </div>
            )}

            {/* Completed indicator */}
            {file.status === 'completed' && (
                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                    <Check className="text-white" size={10} />
                </div>
            )}

            {/* Error indicator */}
            {file.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <X className="text-red-500" size={20} />
                </div>
            )}

            {/* Spoiler indicator tag */}
            {file.isSpoiler && (
                <div className="absolute top-1 left-1 bg-black/60 px-1 rounded text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm pointer-events-none">
                    Spoiler
                </div>
            )}
        </Box>
    );
};
