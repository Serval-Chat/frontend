import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
    $getSelection,
    $isRangeSelection,
    CLEAR_EDITOR_COMMAND,
    type LexicalEditor,
} from 'lexical';
import { FileImage, Plus, Send, Smile, X } from 'lucide-react';

import { useChannelMessages, useUserMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import { filesApi } from '@/api/files/files.api';
import { useFriends } from '@/api/friends/friends.queries';
import {
    useChannels,
    useMembers,
    useRoles,
} from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import type { QueuedFile } from '@/hooks/chat/useFileQueue';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Button } from '@/ui/components/common/Button';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

import { FileQueue } from './FileQueue';
import { GifPicker } from './GifPicker';
import { $createChipNode, ChipNode } from './lexical/ChipNode';
import { LexicalAutocompletePlugin } from './lexical/LexicalAutocompletePlugin';
import { LexicalSubmitPlugin } from './lexical/LexicalSubmitPlugin';
import { $getRawMessageText } from './lexical/lexicalUtils';

const EditorBridge = ({
    onReady,
}: {
    onReady: (e: LexicalEditor) => void;
}): React.ReactNode => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        onReady(editor);
    }, [editor, onReady]);
    return null;
};

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
    replyingTo?: ProcessedChatMessage | null;
    onCancelReply?: () => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
}

const theme = {
    paragraph: 'mb-0',
    text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
    },
};

export const MessageInput: React.FC<MessageInputProps> = ({
    fileQueueResult,
    replyingTo,
    onCancelReply,
    disableCustomFonts,
    disableGlowAndColors,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [hasText, setHasText] = useState(false);
    const [editor, setEditor] = useState<LexicalEditor | null>(null);

    const isAutocompleteOpenRef = useRef<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const handleResize = (): void => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const { data: me } = useMe();
    const { data: friendsList = [] } = useFriends();
    const { data: members = [] } = useMembers(selectedServerId);
    const { data: roles = [] } = useRoles(selectedServerId);
    const { data: channels = [] } = useChannels(selectedServerId);

    const { data: channelMessages } = useChannelMessages(
        selectedServerId,
        selectedChannelId,
    );
    const { data: userMessages } = useUserMessages(selectedFriendId);

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

    const findLastMyMessage = useMemo(() => {
        if (!me?._id) return null;

        let messages: ChatMessage[] = [];

        if (selectedServerId && selectedChannelId && channelMessages?.pages) {
            messages = channelMessages.pages.flat();
        } else if (selectedFriendId && userMessages?.pages) {
            messages = userMessages.pages.flat();
        }

        const myMessages = messages.filter(
            (msg) =>
                msg.senderId === me._id && msg.text && msg.text.trim() !== '',
        );

        return myMessages.length > 0 ? myMessages[myMessages.length - 1] : null;
    }, [
        me?._id,
        selectedServerId,
        selectedChannelId,
        selectedFriendId,
        channelMessages,
        userMessages,
    ]);

    const handleUploadFiles = useCallback(async (): Promise<string[]> => {
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
    }, [files, updateFileStatus, updateFileProgress, showToast]);

    const handleSendMessage = useCallback(
        async (text: string): Promise<void> => {
            const trimmedText = text.trim();
            if (!trimmedText && files.length === 0) return;

            const uploadedUrls = await handleUploadFiles();

            if (uploadedUrls.length === 0 && !trimmedText && files.length > 0) {
                return;
            }

            const formattedUrls = uploadedUrls.map((url) => `[%file%](${url})`);
            const finalMessage = [trimmedText, ...formattedUrls]
                .filter(Boolean)
                .join('\n');

            if (finalMessage) {
                sendMessage(finalMessage, replyingTo?._id);
                clearQueue();
                onCancelReply?.();
            }
        },
        [
            files,
            handleUploadFiles,
            clearQueue,
            sendMessage,
            replyingTo,
            onCancelReply,
        ],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files) {
            addFiles(e.target.files);
            e.target.value = '';
        }
    };

    const initialConfig = {
        namespace: 'MessageInput',
        nodes: [ChipNode],
        onError: (error: Error) => console.error(error),
        theme,
    };

    const getPlaceholder = (): string => {
        if (isUploading) return 'Uploading...';
        const hasLastMessage = findLastMyMessage !== null;
        if (hasLastMessage && !hasText) {
            return 'Type a message... (ArrowUp to edit last message)';
        }
        return 'Type a message...';
    };

    return (
        <Box className="relative mx-4 mb-4 flex flex-col overflow-visible rounded-lg border border-border-subtle bg-[var(--bg-msg-input)] transition-colors focus-within:border-primary/50">
            <FileQueue
                files={files}
                onRemove={removeFile}
                onToggleSpoiler={toggleSpoiler}
            />

            {replyingTo && (
                <Box className="flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-subtle/30 px-3 py-2">
                    <Box className="flex min-w-0 items-center gap-2">
                        <Text className="text-xs whitespace-nowrap text-muted-foreground">
                            Replying to
                        </Text>
                        <StyledUserName
                            className="text-xs font-bold whitespace-nowrap"
                            disableCustomFonts={disableCustomFonts}
                            disableGlowAndColors={disableGlowAndColors}
                            role={replyingTo.role}
                            user={replyingTo.user}
                        >
                            {replyingTo.user.displayName ||
                                replyingTo.user.username}
                        </StyledUserName>
                        <Box className="flex items-center gap-1 truncate overflow-hidden text-xs whitespace-nowrap text-muted-foreground opacity-80">
                            <ParsedText
                                nodes={parseText(
                                    replyingTo.text || '',
                                    ParserPresets.MESSAGE,
                                )}
                                size="xs"
                                wrap="nowrap"
                            />
                        </Box>
                    </Box>
                    <Button
                        className="h-7 w-7 shrink-0 p-0"
                        size="sm"
                        title="Cancel reply"
                        variant="ghost"
                        onClick={onCancelReply}
                    >
                        <X size={16} />
                    </Button>
                </Box>
            )}

            <Box className="relative flex items-end gap-2 p-2">
                <input
                    multiple
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    type="file"
                    onChange={handleFileChange}
                />
                <Button
                    className="mb-1 h-8 w-8 shrink-0 p-0"
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Plus size={20} />
                </Button>

                <div className="relative flex min-h-[40px] flex-1 cursor-text items-center rounded-md border border-border-subtle bg-bg-subtle transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:outline-none">
                    <LexicalComposer initialConfig={initialConfig}>
                        <EditorBridge onReady={setEditor} />
                        <RichTextPlugin
                            ErrorBoundary={LexicalErrorBoundary}
                            contentEditable={
                                <ContentEditable
                                    className="custom-scrollbar h-full max-h-[200px] w-full resize-none overflow-y-auto px-3 py-2 text-sm text-foreground outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'ArrowUp' && !hasText) {
                                            const lastMessage =
                                                findLastMyMessage;
                                            if (lastMessage) {
                                                e.preventDefault();
                                                const editEvent =
                                                    new CustomEvent(
                                                        'editLastMessage',
                                                        {
                                                            detail: {
                                                                messageId:
                                                                    lastMessage._id,
                                                                serverId:
                                                                    lastMessage.serverId,
                                                                channelId:
                                                                    lastMessage.channelId,
                                                                receiverId:
                                                                    lastMessage.receiverId,
                                                            },
                                                        },
                                                    );
                                                window.dispatchEvent(editEvent);
                                            }
                                        }
                                    }}
                                />
                            }
                            placeholder={
                                <div className="pointer-events-none absolute top-[9px] left-3 text-sm text-placeholder select-none">
                                    {getPlaceholder()}
                                </div>
                            }
                        />
                        <HistoryPlugin />
                        <ClearEditorPlugin />
                        <LexicalSubmitPlugin
                            isAutocompleteOpenRef={isAutocompleteOpenRef}
                            onSendMessage={handleSendMessage}
                        />
                        <LexicalAutocompletePlugin
                            channels={channels}
                            friends={friendUsers}
                            members={members}
                            roles={roles}
                            serverEmojis={allServerEmojis}
                            onOpenChange={(isOpen) => {
                                isAutocompleteOpenRef.current = isOpen;
                            }}
                        />
                        <OnChangePlugin
                            onChange={(editorState) => {
                                editorState.read(() => {
                                    const text = $getRawMessageText();
                                    setHasText(text.trim().length > 0);
                                    if (text.trim().length > 0) {
                                        sendTyping();
                                    }
                                });
                            }}
                        />
                    </LexicalComposer>
                </div>

                <Button
                    className={cn(
                        'mb-1 h-8 w-8 shrink-0 p-0',
                        showEmojiPicker && 'text-primary',
                    )}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowGifPicker(false);
                    }}
                >
                    <Smile size={20} />
                </Button>

                <Box className="relative">
                    <Button
                        className={cn(
                            'mb-1 h-8 w-8 shrink-0 p-0',
                            showGifPicker && 'text-primary',
                        )}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setShowGifPicker(!showGifPicker);
                            setShowEmojiPicker(false);
                        }}
                    >
                        <FileImage size={20} />
                    </Button>
                    {showGifPicker && (
                        <Box className="absolute right-0 bottom-full z-50 mb-2">
                            <GifPicker
                                onClose={() => setShowGifPicker(false)}
                                onSelect={(url) => {
                                    if (editor) {
                                        void handleSendMessage(url);
                                    }
                                    setShowGifPicker(false);
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {(hasText || files.length > 0) && isMobile && (
                    <Button
                        className="mb-1 h-8 w-8 shrink-0 p-0 text-primary"
                        disabled={isUploading}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            if (editor) {
                                editor.getEditorState().read(() => {
                                    const text = $getRawMessageText();
                                    void handleSendMessage(text);
                                });
                                editor.dispatchCommand(
                                    CLEAR_EDITOR_COMMAND,
                                    undefined,
                                );
                            }
                        }}
                    >
                        <Send size={20} />
                    </Button>
                )}
            </Box>

            {showEmojiPicker && (
                <div
                    className="absolute right-0 bottom-full z-[var(--z-index-popover)] mb-2"
                    ref={emojiPickerRef}
                >
                    <EmojiPicker
                        customCategories={customCategories}
                        onCustomEmojiSelect={(emoji) => {
                            editor?.update(() => {
                                const selection = $getSelection();
                                if ($isRangeSelection(selection)) {
                                    const chip = $createChipNode('emoji', {
                                        id: emoji.id,
                                        label: emoji.name,
                                        imageUrl: emoji.url,
                                    });
                                    selection.insertNodes([chip]);
                                }
                            });
                        }}
                        onEmojiSelect={(emoji) => {
                            editor?.update(() => {
                                const selection = $getSelection();
                                if ($isRangeSelection(selection)) {
                                    selection.insertText(emoji);
                                }
                            });
                        }}
                    />
                </div>
            )}
        </Box>
    );
};
