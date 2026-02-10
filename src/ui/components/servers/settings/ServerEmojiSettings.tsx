import React, { useCallback, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import {
    SERVERS_QUERY_KEYS,
    useDeleteEmoji,
    useServerEmojis,
    useUploadEmoji,
} from '@/api/servers/servers.queries';
import { useWebSocket } from '@/hooks/ws/useWebSocket';
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

export const ServerEmojiSettings: React.FC<ServerEmojiSettingsProps> = ({
    serverId,
}) => {
    const queryClient = useQueryClient();
    const { data: emojis = [], isLoading } = useServerEmojis(serverId);
    const { mutate: uploadEmoji, isPending: isUploading } =
        useUploadEmoji(serverId);
    const { mutate: deleteEmoji } = useDeleteEmoji(serverId);

    const [emojiName, setEmojiName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [hoveredEmojiId, setHoveredEmojiId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                const name = file.name
                    .split('.')[0]
                    .replace(/[^a-zA-Z0-9_-]/g, '_');
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
                onSuccess: () => {
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
                <Text className="text-[var(--color-muted-foreground)]">
                    Upload custom emojis for your server members to use.
                </Text>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                        htmlFor="emoji-name"
                    >
                        Emoji Name
                    </label>
                    <Input
                        id="emoji-name"
                        maxLength={32}
                        placeholder="cool_doge"
                        value={emojiName}
                        onChange={(e) => setEmojiName(e.target.value)}
                    />
                    <Text
                        className="text-[var(--color-muted-foreground)]"
                        size="xs"
                    >
                        Only alphanumeric characters, underscores, and dashes.
                    </Text>
                </div>

                <input
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                />

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin w-8 h-8 text-[var(--color-muted-foreground)]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                        {/* Upload Box */}
                        <button
                            className="aspect-square border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)] transition-all flex flex-col items-center justify-center gap-2 p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isUploading || !emojiName}
                            type="button"
                            onClick={handleUploadClick}
                        >
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted-foreground)]" />
                            ) : (
                                <>
                                    <Plus className="w-6 h-6 text-[var(--color-muted-foreground)]" />
                                    <Text
                                        className="text-[var(--color-muted-foreground)] text-center leading-tight"
                                        size="xs"
                                    >
                                        Upload
                                    </Text>
                                </>
                            )}
                        </button>

                        {/* Emoji Grid */}
                        {emojis.map((emoji) => (
                            <div
                                className="relative aspect-square border border-[var(--color-border-subtle)] rounded-lg hover:border-[var(--color-primary)] transition-all overflow-hidden group bg-[var(--color-bg-subtle)]"
                                key={emoji._id}
                                onMouseEnter={() =>
                                    setHoveredEmojiId(emoji._id)
                                }
                                onMouseLeave={() => setHoveredEmojiId(null)}
                            >
                                <div className="w-full h-full flex items-center justify-center p-2">
                                    <img
                                        alt={emoji.name}
                                        className="max-w-full max-h-full object-contain"
                                        src={
                                            resolveApiUrl(emoji.imageUrl) || ''
                                        }
                                    />
                                </div>
                                {hoveredEmojiId === emoji._id && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 p-2">
                                        <Text
                                            className="text-white text-center leading-tight break-all"
                                            size="xs"
                                            weight="medium"
                                        >
                                            :{emoji.name}:
                                        </Text>
                                        <Button
                                            aria-label="Delete emoji"
                                            size="sm"
                                            variant="danger"
                                            onClick={() =>
                                                deleteEmoji(emoji._id)
                                            }
                                        >
                                            <Trash2 className="w-3 h-3" />
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
                type="emoji"
                onClose={() => {
                    setIsCropModalOpen(false);
                    setSelectedFile(null);
                }}
                onConfirm={handleCropConfirm}
            />
        </div>
    );
};
