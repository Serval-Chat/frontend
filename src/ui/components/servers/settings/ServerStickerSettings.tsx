import React, { useCallback, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import {
    SERVERS_QUERY_KEYS,
    useDeleteSticker,
    useServerStickers,
    useUploadSticker,
} from '@/api/servers/servers.queries';
import {
    INVALID_STICKER_NAME_CHARS_REGEX,
    STICKER_MAX_SIZE_BYTES,
    STICKER_NAME_MAX_LENGTH,
} from '@/constants/stickers';
import { useBulkAssetUpload } from '@/hooks/useBulkAssetUpload';
import { useWebSocket } from '@/hooks/ws/useWebSocket';
import { BulkUploadModal } from '@/ui/components/common/BulkUploadModal';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { ImageCropModal } from '@/ui/components/settings/ImageCropModal';
import { resolveApiUrl } from '@/utils/apiUrl';
import { WsEvents } from '@/ws';

interface ServerStickerSettingsProps {
    serverId: string;
}

const StickerGridItem = ({
    sticker,
    isHovered,
    onHover,
    onLeave,
    onDelete,
}: {
    sticker: { id: string; name: string; imageUrl: string };
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
    onDelete: () => void;
}) => (
    <div
        className="group relative aspect-square overflow-hidden rounded-lg border border-border-subtle bg-bg-subtle transition-all hover:border-primary"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
    >
        <div className="flex h-full w-full items-center justify-center p-2">
            <img
                alt={sticker.name}
                className="max-h-full max-w-full object-contain"
                src={resolveApiUrl(sticker.imageUrl) || ''}
                onError={(e): void => {
                    console.error('[Sticker Image Load Error]', {
                        id: sticker.id,
                        name: sticker.name,
                        imageUrl: sticker.imageUrl,
                        resolvedUrl: resolveApiUrl(sticker.imageUrl),
                        error: e,
                    });
                }}
            />
        </div>
        {isHovered ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 p-2">
                <Text
                    align="center"
                    leading="tight"
                    size="xs"
                    variant="inverse"
                    weight="medium"
                    wrap="breakAll"
                >
                    {sticker.name}
                </Text>
                <Button
                    aria-label="Delete sticker"
                    size="sm"
                    variant="danger"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        ) : null}
    </div>
);

export const ServerStickerSettings = ({
    serverId,
}: ServerStickerSettingsProps) => {
    const queryClient = useQueryClient();
    const { data: stickers = [], isLoading } = useServerStickers(serverId);
    const {
        mutate: uploadSticker,
        mutateAsync: uploadStickerAsync,
        isPending: isUploading,
    } = useUploadSticker(serverId);
    const { mutate: deleteSticker, mutateAsync: deleteStickerAsync } =
        useDeleteSticker(serverId);

    const [stickerName, setStickerName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [hoveredStickerId, setHoveredStickerId] = useState<string | null>(
        null,
    );
    const {
        isBulkUploading,
        isCancelling,
        bulkStatus,
        handleBulkFileSelect,
        handleCancelBulk,
        closeBulkStatus,
    } = useBulkAssetUpload({
        uploadAsync: uploadStickerAsync,
        deleteAsync: deleteStickerAsync,
        toName: (fileName): string =>
            (fileName.split('.')[0] ?? '')
                .replace(INVALID_STICKER_NAME_CHARS_REGEX, '')
                .slice(0, STICKER_NAME_MAX_LENGTH),
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);

    useWebSocket(
        WsEvents.STICKER_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.stickers(serverId),
                    });
                }
            },
            [serverId, queryClient],
        ),
    );

    const handleFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                console.error('Invalid file type selected');
                return;
            }

            if (file.size > STICKER_MAX_SIZE_BYTES) {
                console.error('File too large');
                return;
            }

            setSelectedFile(file);
            setIsCropModalOpen(true);

            if (!stickerName) {
                const name = (file.name.split('.')[0] ?? '').replace(
                    INVALID_STICKER_NAME_CHARS_REGEX,
                    '',
                );
                setStickerName(name.slice(0, STICKER_NAME_MAX_LENGTH));
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropConfirm = (processedFile: File): void => {
        setSelectedFile(processedFile);
        uploadSticker(
            { name: stickerName, file: processedFile },
            {
                onSuccess: (newSticker): void => {
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.log('[Sticker Upload Success]', {
                            id: newSticker.id,
                            name: newSticker.name,
                            imageUrl: newSticker.imageUrl,
                            resolvedUrl: resolveApiUrl(newSticker.imageUrl),
                        });
                    }
                    setStickerName('');
                    setSelectedFile(null);
                },
                onError: (error): void => {
                    console.error('[Sticker Upload Error]', error);
                },
            },
        );
    };

    const handleUploadClick = (): void => {
        fileInputRef.current?.click();
    };

    return (
        <div className="max-w-5xl space-y-10 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Server Stickers
                </Heading>
                <Text variant="muted">
                    Upload custom stickers for your server members to use.
                </Text>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="sticker-name"
                    >
                        Sticker Name
                    </label>
                    <Input
                        id="sticker-name"
                        maxLength={STICKER_NAME_MAX_LENGTH}
                        placeholder="My cool sticker"
                        value={stickerName}
                        onChange={(e): void => {
                            setStickerName(e.target.value);
                        }}
                    />
                    <Text size="xs" variant="muted">
                        Up to {STICKER_NAME_MAX_LENGTH} characters.
                    </Text>
                </div>

                <input
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    aria-label="Upload sticker image"
                    className="hidden"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                />
                <input
                    accept=".zip,application/zip"
                    aria-label="Upload sticker archive"
                    className="hidden"
                    ref={bulkFileInputRef}
                    type="file"
                    onChange={(e): undefined => void handleBulkFileSelect(e)}
                />

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                        {/* Upload Box */}
                        <button
                            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-subtle p-3 transition-all hover:border-primary hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={
                                isUploading || isBulkUploading || !stickerName
                            }
                            type="button"
                            onClick={handleUploadClick}
                        >
                            {isUploading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                    <Text
                                        align="center"
                                        leading="tight"
                                        size="xs"
                                        variant="muted"
                                    >
                                        Upload
                                    </Text>
                                </>
                            )}
                        </button>

                        {/* Bulk Upload Box */}
                        <button
                            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-subtle p-3 transition-all hover:border-primary hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isUploading || isBulkUploading}
                            type="button"
                            onClick={(): void | undefined =>
                                bulkFileInputRef.current?.click()
                            }
                        >
                            {isBulkUploading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                    <Text
                                        align="center"
                                        leading="tight"
                                        size="xs"
                                        variant="muted"
                                    >
                                        Bulk
                                    </Text>
                                </>
                            )}
                        </button>

                        {/* Sticker Grid */}
                        {stickers.map((sticker) => (
                            <StickerGridItem
                                isHovered={hoveredStickerId === sticker.id}
                                key={sticker.id}
                                sticker={sticker}
                                onDelete={(): void => {
                                    deleteSticker(sticker.id);
                                }}
                                onHover={(): void => {
                                    setHoveredStickerId(sticker.id);
                                }}
                                onLeave={(): void => {
                                    setHoveredStickerId(null);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ImageCropModal
                imageFile={selectedFile}
                isOpen={isCropModalOpen}
                type="sticker"
                onClose={(): void => {
                    setIsCropModalOpen(false);
                    setSelectedFile(null);
                }}
                onConfirm={handleCropConfirm}
            />

            <BulkUploadModal
                errors={bulkStatus.errors}
                isCancelling={isCancelling}
                isOpen={bulkStatus.isOpen}
                title="Bulk Upload Stickers"
                total={bulkStatus.total}
                uploaded={bulkStatus.uploaded}
                onCancel={(): undefined => void handleCancelBulk()}
                onClose={closeBulkStatus}
            />
        </div>
    );
};
