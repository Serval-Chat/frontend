import React, { useCallback, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import {
    SERVERS_QUERY_KEYS,
    useDeleteEmoji,
    useServerEmojis,
    useUploadEmoji,
} from '@/api/servers/servers.queries';
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

interface ServerEmojiSettingsProps {
    serverId: string;
}

const EmojiGridItem = ({
    emoji,
    isHovered,
    onHover,
    onLeave,
    onDelete,
}: {
    emoji: { id: string; name: string; imageUrl: string };
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
                alt={emoji.name}
                className="max-h-full max-w-full object-contain"
                src={resolveApiUrl(emoji.imageUrl) || ''}
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
                    :{emoji.name}:
                </Text>
                <Button
                    aria-label="Delete emoji"
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

export const ServerEmojiSettings = ({ serverId }: ServerEmojiSettingsProps) => {
    const queryClient = useQueryClient();
    const { data: emojis = [], isLoading } = useServerEmojis(serverId);
    const {
        mutate: uploadEmoji,
        mutateAsync: uploadEmojiAsync,
        isPending: isUploading,
    } = useUploadEmoji(serverId);
    const { mutate: deleteEmoji, mutateAsync: deleteEmojiAsync } =
        useDeleteEmoji(serverId);

    const [emojiName, setEmojiName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [hoveredEmojiId, setHoveredEmojiId] = useState<string | null>(null);
    const {
        isBulkUploading,
        isCancelling,
        bulkStatus,
        handleBulkFileSelect,
        handleCancelBulk,
        closeBulkStatus,
    } = useBulkAssetUpload({
        uploadAsync: uploadEmojiAsync,
        deleteAsync: deleteEmojiAsync,
        toName: (fileName): string =>
            (fileName.split('.')[0] ?? '').replaceAll(
                /[^a-zA-Z0-9_-]/g,
                '_',
            ),
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);

    useWebSocket(
        WsEvents.EMOJI_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                if (payload.serverId === serverId) {
                    void queryClient.invalidateQueries({
                        queryKey: SERVERS_QUERY_KEYS.emojis(serverId),
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

            setSelectedFile(file);
            setIsCropModalOpen(true);

            if (!emojiName) {
                const name = (file.name.split('.')[0] ?? file.name).replaceAll(
                    /[^a-zA-Z0-9_-]/g,
                    '_',
                );
                setEmojiName(name);
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropConfirm = (processedFile: File): void => {
        setSelectedFile(processedFile);
        uploadEmoji(
            { name: emojiName, file: processedFile },
            {
                onSuccess: (): void => {
                    setEmojiName('');
                    setSelectedFile(null);
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
                    Server Emojis
                </Heading>
                <Text variant="muted">
                    Upload custom emojis for your server members to use.
                </Text>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="emoji-name"
                    >
                        Emoji Name
                    </label>
                    <Input
                        id="emoji-name"
                        maxLength={32}
                        placeholder="cool_doge"
                        value={emojiName}
                        onChange={(e): void => {
                            setEmojiName(e.target.value);
                        }}
                    />
                    <Text size="xs" variant="muted">
                        Only alphanumeric characters, underscores, and dashes.
                    </Text>
                </div>

                <input
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    aria-label="Upload emoji image"
                    className="hidden"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                />
                <input
                    accept=".zip,application/zip"
                    aria-label="Upload emoji archive"
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
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                        {/* Upload Box */}
                        <button
                            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-subtle p-3 transition-all hover:border-primary hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={
                                isUploading || isBulkUploading || !emojiName
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

                        {/* Emoji Grid */}
                        {emojis.map((emoji) => (
                            <EmojiGridItem
                                emoji={emoji}
                                isHovered={hoveredEmojiId === emoji.id}
                                key={emoji.id}
                                onDelete={(): void => {
                                    deleteEmoji(emoji.id);
                                }}
                                onHover={(): void => {
                                    setHoveredEmojiId(emoji.id);
                                }}
                                onLeave={(): void => {
                                    setHoveredEmojiId(null);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ImageCropModal
                imageFile={selectedFile}
                isOpen={isCropModalOpen}
                type="emoji"
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
                title="Bulk Upload Emojis"
                total={bulkStatus.total}
                uploaded={bulkStatus.uploaded}
                onCancel={(): undefined => void handleCancelBulk()}
                onClose={closeBulkStatus}
            />
        </div>
    );
};
