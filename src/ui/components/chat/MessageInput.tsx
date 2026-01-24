import React, { useRef, useState } from 'react';

import { Plus } from 'lucide-react';

import { filesApi } from '@/api/files/files.api';
import type { QueuedFile } from '@/hooks/chat/useFileQueue';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/ui/components/common/Button';
import { TextArea } from '@/ui/components/common/TextArea';
import { useToast } from '@/ui/components/common/Toast';
import { Box } from '@/ui/components/layout/Box';

import { FileQueue } from './FileQueue';

interface MessageInputProps {
    fileQueueResult: {
        files: QueuedFile[];
        addFiles: (newFiles: FileList | File[]) => void;
        removeFile: (id: string) => void;
        toggleSpoiler: (id: string) => void;
        updateFileProgress: (id: string, progress: number) => void;
        updateFileStatus: (id: string, status: QueuedFile['status']) => void;
        clearQueue: () => void;
    };
}

/**
 * @description Input component for sending messages in the chat.
 */
export const MessageInput: React.FC<MessageInputProps> = ({
    fileQueueResult,
}) => {
    const [value, setValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const {
        files,
        addFiles,
        removeFile,
        toggleSpoiler,
        updateFileProgress,
        updateFileStatus,
        clearQueue,
    } = fileQueueResult;

    const selectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId,
    );
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId,
    );

    const { sendMessage, sendTyping } = useChatWS(
        selectedFriendId ?? undefined,
        selectedServerId ?? undefined,
        selectedChannelId ?? undefined,
    );

    const handleUploadFiles = async (): Promise<string[]> => {
        if (files.length === 0) return [];

        setIsUploading(true);
        const uploadedUrls: string[] = [];

        try {
            await Promise.all(
                files.map(async (queuedFile) => {
                    updateFileStatus(queuedFile.id, 'uploading');
                    try {
                        const url = await filesApi.uploadFile(
                            queuedFile.file,
                            (progress) => {
                                updateFileProgress(queuedFile.id, progress);
                            },
                        );
                        updateFileStatus(queuedFile.id, 'completed');
                        uploadedUrls.push(
                            queuedFile.isSpoiler ? `${url}#spoiler` : url,
                        );
                    } catch (error) {
                        updateFileStatus(queuedFile.id, 'error');
                        throw error;
                    }
                }),
            );

            return uploadedUrls;
        } catch (error) {
            console.error('Failed to upload files:', error);
            showToast(
                'Failed to upload one or more files. Please try again.',
                'error',
            );
            return [];
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendMessage = async (text: string): Promise<void> => {
        const trimmedText = text.trim();
        if (!trimmedText && files.length === 0) return;

        const uploadedUrls = await handleUploadFiles();

        // If upload failed and we only had files, don't send anything
        if (uploadedUrls.length === 0 && !trimmedText && files.length > 0) {
            return;
        }

        const formattedUrls = uploadedUrls.map((url) => `[%file%](${url})`);
        const finalMessage = [trimmedText, ...formattedUrls]
            .filter(Boolean)
            .join('\n');

        if (finalMessage) {
            sendMessage(finalMessage);
            setValue('');
            clearQueue();
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isUploading) {
                void handleSendMessage(value);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files) {
            addFiles(e.target.files);
            // Reset input so the same file can be selected again if removed
            e.target.value = '';
        }
    };

    return (
        <Box className="flex flex-col bg-[var(--bg-msg-input)] rounded-lg mx-4 mb-4 overflow-hidden border border-border-subtle focus-within:border-primary/50 transition-colors">
            <FileQueue
                files={files}
                onRemove={removeFile}
                onToggleSpoiler={toggleSpoiler}
            />

            <Box className="flex items-end p-2 gap-2">
                <input
                    multiple
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    type="file"
                    onChange={handleFileChange}
                />
                <Button
                    className="mb-1 h-8 w-8 p-0 shrink-0"
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Plus size={20} />
                </Button>

                <TextArea
                    className="flex-1 bg-transparent border-none focus:ring-0 min-h-[40px] py-2 resize-none scrollbar-none"
                    placeholder={
                        isUploading ? 'Uploading...' : 'Type a message...'
                    }
                    rows={1}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        sendTyping();
                    }}
                    onKeyDown={handleKeyDown}
                />
            </Box>
        </Box>
    );
};
