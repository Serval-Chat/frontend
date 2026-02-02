import React, { useMemo, useRef, useState } from 'react';

import { Plus, Smile } from 'lucide-react';

import { filesApi } from '@/api/files/files.api';
import { useFriends } from '@/api/friends/friends.queries';
import { useMembers, useRoles } from '@/api/servers/servers.queries';
import type { User } from '@/api/users/users.types';
import type { QueuedFile } from '@/hooks/chat/useFileQueue';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppSelector } from '@/store/hooks';
import { AutocompleteSuggestion } from '@/ui/components/common/AutocompleteSuggestion';
import { Button } from '@/ui/components/common/Button';
import { TextArea } from '@/ui/components/common/TextArea';
import { useToast } from '@/ui/components/common/Toast';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
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
    const [cursorPosition, setCursorPosition] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
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

    const { customCategories } = useCustomEmojis();

    const { data: friendsList = [] } = useFriends();
    const { data: members = [] } = useMembers(selectedServerId);
    const { data: roles = [] } = useRoles(selectedServerId);

    const friendUsers = useMemo(
        () => friendsList as unknown as User[],
        [friendsList],
    );

    const allServerEmojis = useMemo(
        () =>
            customCategories.flatMap((cat) =>
                cat.emojis.map((e) => ({
                    _id: e.id,
                    name: e.name,
                    imageUrl: e.url,
                    serverId: cat.id,
                    createdBy: '',
                    createdAt: '',
                })),
            ),
        [customCategories],
    );

    const autocomplete = useMentionAutocomplete({
        value,
        cursorPosition,
        members,
        roles,
        friends: friendUsers,
        serverEmojis: allServerEmojis,
    });

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

    const handleEmojiSelect = (emoji: string): void => {
        setValue((prev) => prev + emoji);
    };

    const handleCustomEmojiSelect = (emoji: { id: string }): void => {
        setValue((prev) => prev + `<emoji:${emoji.id}>`);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ): void => {
        if (autocomplete.hasSuggestions) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                autocomplete.moveSelection('up');
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                autocomplete.moveSelection('down');
                return;
            }
            if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                e.preventDefault();
                const newValue = autocomplete.selectCurrent();
                if (newValue) {
                    setValue(newValue);
                    const newCursor = newValue.length;
                    setCursorPosition(newCursor);
                    setTimeout(() => {
                        textAreaRef.current?.setSelectionRange(
                            newCursor,
                            newCursor,
                        );
                    }, 0);
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                return;
            }
        }

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
        <Box className="flex flex-col bg-[var(--bg-msg-input)] rounded-lg mx-4 mb-4 overflow-visible border border-border-subtle focus-within:border-primary/50 transition-colors relative">
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
                    ref={textAreaRef}
                    rows={1}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setCursorPosition(e.target.selectionStart);
                        sendTyping();
                    }}
                    onClick={(e) => {
                        setCursorPosition(e.currentTarget.selectionStart);
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={(e) => {
                        setCursorPosition(e.currentTarget.selectionStart);
                    }}
                />

                <Button
                    className="mb-1 h-8 w-8 p-0 shrink-0"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                    <Smile size={20} />
                </Button>
            </Box>

            {autocomplete.hasSuggestions && (
                <AutocompleteSuggestion
                    selectedIndex={autocomplete.selectedIndex}
                    suggestions={autocomplete.suggestions}
                    onSelect={(suggestion) => {
                        const newValue =
                            autocomplete.selectSuggestion(suggestion);
                        setValue(newValue);
                        const newCursor = newValue.length;
                        setCursorPosition(newCursor);
                        setTimeout(() => {
                            textAreaRef.current?.focus();
                            textAreaRef.current?.setSelectionRange(
                                newCursor,
                                newCursor,
                            );
                        }, 0);
                    }}
                />
            )}

            {showEmojiPicker && (
                <div
                    className="absolute bottom-full right-0 mb-2 z-[var(--z-popover)]"
                    ref={emojiPickerRef}
                >
                    <EmojiPicker
                        customCategories={customCategories}
                        onCustomEmojiSelect={handleCustomEmojiSelect}
                        onEmojiSelect={handleEmojiSelect}
                    />
                </div>
            )}
        </Box>
    );
};
