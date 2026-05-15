import React, { useCallback, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import JSZip from 'jszip';
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

export const ServerStickerSettings: React.FC<ServerStickerSettingsProps> = ({
    serverId,
}) => {
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
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const isCancelledRef = useRef(false);
    const uploadedIdsRef = useRef<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState({
        total: 0,
        uploaded: 0,
        errors: 0,
        isOpen: false,
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
                const name = file.name
                    .split('.')[0]
                    .replace(INVALID_STICKER_NAME_CHARS_REGEX, '');
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
                onSuccess: () => {
                    setStickerName('');
                    setSelectedFile(null);
                },
            },
        );
    };

    const handleUploadClick = (): void => {
        fileInputRef.current?.click();
    };

    const convertToWebp = (blob: Blob, fileName: string): Promise<File> =>
        new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((convertedBlob) => {
                    if (convertedBlob) {
                        const newName =
                            fileName.replace(/\.[^/.]+$/, '') + '.webp';
                        resolve(
                            new File([convertedBlob], newName, {
                                type: 'image/webp',
                            }),
                        );
                    } else {
                        reject(new Error('Failed to convert to webp'));
                    }
                    URL.revokeObjectURL(url);
                }, 'image/webp');
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            img.src = url;
        });

    const handleBulkFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (bulkFileInputRef.current) {
            bulkFileInputRef.current.value = '';
        }

        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);

            const validFiles = Object.entries(loadedZip.files).filter(
                ([relativePath, zipEntry]) => {
                    if (zipEntry.dir) return false;
                    const isImage = relativePath.match(
                        /\.(png|jpg|jpeg|webp|gif)$/i,
                    );
                    if (!isImage) return false;
                    const fileName = zipEntry.name.split('/').pop() || '';
                    if (fileName.startsWith('.')) return false;
                    return true;
                },
            );

            if (validFiles.length === 0) return;

            setBulkStatus({
                total: validFiles.length,
                uploaded: 0,
                errors: 0,
                isOpen: true,
            });

            setIsBulkUploading(true);
            isCancelledRef.current = false;
            uploadedIdsRef.current = [];

            for (const [, zipEntry] of validFiles) {
                if (isCancelledRef.current) break;

                const fileName = zipEntry.name.split('/').pop() || '';
                const name = fileName
                    .split('.')[0]
                    .replace(INVALID_STICKER_NAME_CHARS_REGEX, '');
                const finalName = name.slice(0, STICKER_NAME_MAX_LENGTH);

                const blob = await zipEntry.async('blob');
                try {
                    let fileToUpload: File;
                    if (fileName.toLowerCase().endsWith('.gif')) {
                        fileToUpload = new File([blob], fileName, {
                            type: 'image/gif',
                        });
                    } else {
                        fileToUpload = await convertToWebp(blob, fileName);
                    }
                    const newSticker = await uploadStickerAsync({
                        name: finalName,
                        file: fileToUpload,
                    });
                    uploadedIdsRef.current.push(newSticker.id);
                    setBulkStatus((prev) => ({
                        ...prev,
                        uploaded: prev.uploaded + 1,
                    }));
                } catch (err) {
                    console.error(`Failed to process ${fileName}:`, err);
                    setBulkStatus((prev) => ({
                        ...prev,
                        errors: prev.errors + 1,
                    }));
                }
            }
        } catch (err) {
            console.error('Failed to process zip file', err);
        } finally {
            setIsBulkUploading(false);
        }
    };

    const handleCancelBulk = async (): Promise<void> => {
        isCancelledRef.current = true;
        setIsCancelling(true);

        // Delete already uploaded stickers
        const idsToDelete = [...uploadedIdsRef.current];
        for (const id of idsToDelete) {
            try {
                await deleteStickerAsync(id);
            } catch (err) {
                console.error(`Failed to delete sticker ${id}:`, err);
            }
        }

        uploadedIdsRef.current = [];
        setIsCancelling(false);
        setBulkStatus((prev) => ({ ...prev, isOpen: false }));
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
                        onChange={(e) => setStickerName(e.target.value)}
                    />
                    <Text size="xs" variant="muted">
                        Up to {STICKER_NAME_MAX_LENGTH} characters.
                    </Text>
                </div>

                <input
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                />
                <input
                    accept=".zip,application/zip"
                    className="hidden"
                    ref={bulkFileInputRef}
                    type="file"
                    onChange={(e) => void handleBulkFileSelect(e)}
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
                            onClick={() => bulkFileInputRef.current?.click()}
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
                            <div
                                className="group relative aspect-square overflow-hidden rounded-lg border border-border-subtle bg-bg-subtle transition-all hover:border-primary"
                                key={sticker.id}
                                onMouseEnter={() =>
                                    setHoveredStickerId(sticker.id)
                                }
                                onMouseLeave={() => setHoveredStickerId(null)}
                            >
                                <div className="flex h-full w-full items-center justify-center p-2">
                                    <img
                                        alt={sticker.name}
                                        className="max-h-full max-w-full object-contain"
                                        src={
                                            resolveApiUrl(sticker.imageUrl) ||
                                            ''
                                        }
                                    />
                                </div>
                                {hoveredStickerId === sticker.id && (
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
                                            onClick={() =>
                                                deleteSticker(sticker.id)
                                            }
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ImageCropModal
                imageFile={selectedFile}
                isOpen={isCropModalOpen}
                type="sticker"
                onClose={() => {
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
                onCancel={() => void handleCancelBulk()}
                onClose={() =>
                    setBulkStatus((prev) => ({ ...prev, isOpen: false }))
                }
            />
        </div>
    );
};
