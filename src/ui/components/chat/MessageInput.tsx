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
import { useQueryClient } from '@tanstack/react-query';
import {
    $getSelection,
    $isRangeSelection,
    CLEAR_EDITOR_COMMAND,
    type LexicalEditor,
} from 'lexical';
import {
    ArrowUp,
    Clock,
    FileImage,
    Plus,
    Send,
    Smile,
    Sticker,
    X,
} from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { useClickAway } from 'react-use';

import { useChannelMessages, useUserMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import { filesApi } from '@/api/files/files.api';
import { useFriends } from '@/api/friends/friends.queries';
import { interactionsApi } from '@/api/interactions/interactions.api';
import { useServerCommands } from '@/api/interactions/interactions.queries';
import {
    SERVERS_QUERY_KEYS,
    useAllStickers,
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
    useServerStickers,
    useServers,
} from '@/api/servers/servers.queries';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import type { QueuedFile } from '@/hooks/chat/useFileQueue';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { useWebSocket } from '@/hooks/ws/useWebSocket';
import { useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import {
    $createChipNode,
    ChipNode,
} from '@/ui/components/chat/lexical/ChipNode';
import { SlashArgChipNode } from '@/ui/components/chat/lexical/SlashArgChipNode';
import { SlashCommandChipNode } from '@/ui/components/chat/lexical/SlashCommandChipNode';
import { $getSlashChipState } from '@/ui/components/chat/lexical/slashChipHelpers';
import { BotTag } from '@/ui/components/common/BotTag';
import { Button } from '@/ui/components/common/Button';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import {
    type StickerCategory,
    StickerPicker,
} from '@/ui/components/emoji/StickerPicker';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { clearDraft, getDraft, saveDraft } from '@/utils/drafts';
import { ParserPresets, parseText } from '@/utils/textParser/parser';
import { WsEvents } from '@/ws';

import { FileQueue } from './FileQueue';
import { GifPicker } from './GifPicker';
import { LexicalAutocompletePlugin } from './lexical/LexicalAutocompletePlugin';
import { LexicalEmojiPlugin } from './lexical/LexicalEmojiPlugin';
import { LexicalPastePlugin } from './lexical/LexicalPastePlugin';
import { LexicalSlashCommandPlugin } from './lexical/LexicalSlashCommandPlugin';
import { LexicalSubmitPlugin } from './lexical/LexicalSubmitPlugin';
import { $getRawMessageText } from './lexical/lexicalUtils';
import { tryExecuteSlashCommand } from './lexical/slashCommandExecution';
import { parseSlashInput } from './lexical/slashCommands';

const EmojiPicker = React.lazy(() =>
    import('@/ui/components/emoji/EmojiPicker').then((m) => ({
        default: m.EmojiPicker,
    })),
);

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
    disableColors?: boolean;
    disableGlow?: boolean;
    cooldown: number;
    setCooldown: (c: number) => void;
    canBypassSlowMode: boolean;
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
    disableColors,
    disableGlow,
    cooldown,
    setCooldown,
    canBypassSlowMode,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [hasText, setHasText] = useState(false);
    const [currentInputText, setCurrentInputText] = useState('');
    const [editor, setEditor] = useState<LexicalEditor | null>(null);
    const [isMentionAutocompleteOpen, setIsMentionAutocompleteOpen] =
        useState(false);
    const [isSlashAutocompleteOpen, setIsSlashAutocompleteOpen] =
        useState(false);
    const [slashChipState, setSlashChipState] = useState<{
        commandName: string;
        argValues: string[];
    } | null>(null);
    const queryClient = useQueryClient();
    const location = useLocation();
    const params = useParams();
    const [isSlowModeError, setIsSlowModeError] = useState(false);
    const MAX_LENGTH = Number(import.meta.env.VITE_MAX_MESSAGE_LENGTH || 2000);
    const remainingChars = MAX_LENGTH - currentInputText.length;
    const showCounter =
        remainingChars <= MAX_LENGTH * 0.1 || remainingChars < 0;

    const isAutocompleteOpenRef = useRef<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    useClickAway(emojiPickerRef, () => {
        setShowEmojiPicker(false);
        setShowStickerPicker(false);
    });

    useEffect(() => {
        const handleResize = (): void => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);

        const handleGlobalKeyDown = (e: KeyboardEvent): void => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return;
            }

            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                editor?.focus();

                setShowEmojiPicker(false);
                setShowGifPicker(false);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [editor]);

    useWebSocket(
        WsEvents.STICKER_UPDATED,
        useCallback(
            (payload: { serverId: string }): void => {
                void queryClient.invalidateQueries({
                    queryKey: SERVERS_QUERY_KEYS.stickers(payload.serverId),
                });
                void queryClient.invalidateQueries({
                    queryKey: ['stickers', 'all'],
                });
            },
            [queryClient],
        ),
    );

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

    const { customCategories } = useCustomEmojis({ enabled: showEmojiPicker });

    const isServerRoute = location.pathname.includes('/@server/');
    const isServerContextReady =
        !!selectedServerId &&
        isServerRoute &&
        selectedServerId === params.serverId;

    const { data: me } = useMe();
    const { data: friendsList = [] } = useFriends();
    const { data: members = [] } = useMembers(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: roles = [] } = useRoles(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: channels = [] } = useChannels(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: serverDetails } = useServerDetails(selectedServerId, {
        enabled: isServerContextReady,
    });
    const { data: serverCommands = [] } = useServerCommands(
        isServerContextReady ? selectedServerId : null,
    );
    const { data: serverList = [] } = useServers();
    const { data: currentServerStickers = [] } = useServerStickers(
        isServerContextReady ? selectedServerId : null,
    );
    const { data: allStickers = [] } = useAllStickers({
        enabled: showStickerPicker,
    });
    const myMember = useMemo(
        () => members.find((m) => m.userId === me?._id),
        [members, me?._id],
    );

    const isOwner = serverDetails?.ownerId === me?._id;
    const [remainingTimeoutMs, setRemainingTimeoutMs] = useState<number>(0);

    useEffect(() => {
        if (!myMember?.communicationDisabledUntil || isOwner) {
            setRemainingTimeoutMs(0);
            return;
        }

        const update = (): void => {
            const until = new Date(
                myMember.communicationDisabledUntil!,
            ).getTime();
            const now = Date.now();
            const diff = until - now;
            setRemainingTimeoutMs(Math.max(0, diff));
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [myMember?.communicationDisabledUntil, isOwner]);

    const isTimedOut = remainingTimeoutMs > 0;

    const formatTimeout = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };
    const slashPreview = useMemo(() => {
        if (slashChipState) {
            const command = serverCommands.find(
                (c) => c.name === slashChipState.commandName,
            );
            if (!command) return null;

            const options = command.options ?? [];
            const requiredCount = options.filter((o) => o.required).length;
            const providedCount = slashChipState.argValues.filter(
                (v) => (v ?? '').trim() !== '',
            ).length;
            const nextOption = options[providedCount];
            const usage =
                options.length > 0
                    ? options
                          .map((option) =>
                              option.required
                                  ? `<${option.name}>`
                                  : `[${option.name}]`,
                          )
                          .join(' ')
                    : 'No arguments';

            if (requiredCount > providedCount) {
                return {
                    commandName: command.name,
                    status: `Missing required arguments (${providedCount}/${requiredCount}). Next: ${nextOption?.name ?? 'argument'}`,
                    usage,
                };
            }

            return {
                commandName: command.name,
                status: options.length
                    ? `Arguments ready (${Math.min(providedCount, options.length)}/${options.length})`
                    : 'Ready to execute',
                usage,
            };
        }

        const parsed = parseSlashInput(currentInputText);
        if (!parsed) return null;
        const command = serverCommands.find(
            (c) => c.name === parsed.commandName,
        );
        if (!command) {
            return {
                commandName: parsed.commandName,
                status: `Unknown command /${parsed.commandName}`,
            };
        }

        const options = command.options ?? [];
        const requiredCount = options.filter(
            (option) => option.required,
        ).length;
        const providedCount = parsed.args.filter(
            (arg) => arg.trim() !== '',
        ).length;
        const nextOption = options[Math.min(providedCount, options.length - 1)];
        const usage =
            options.length > 0
                ? options
                      .map((option) =>
                          option.required
                              ? `<${option.name}>`
                              : `[${option.name}]`,
                      )
                      .join(' ')
                : 'No arguments';

        if (requiredCount > providedCount) {
            return {
                commandName: command.name,
                status: `Missing required arguments (${providedCount}/${requiredCount}). Next: ${nextOption?.name ?? 'argument'}`,
                usage,
            };
        }

        return {
            commandName: command.name,
            status: options.length
                ? `Arguments ready (${Math.min(providedCount, options.length)}/${options.length})`
                : 'Ready to execute',
            usage,
        };
    }, [currentInputText, serverCommands, slashChipState]);

    const { data: channelMessages } = useChannelMessages(
        selectedServerId,
        selectedChannelId,
    );
    const { data: userMessages } = useUserMessages(selectedFriendId);

    const friendUsers = useMemo(
        () => friendsList as unknown as User[],
        [friendsList],
    );

    const currentChannel = useMemo(
        () => channels.find((c) => c._id === selectedChannelId),
        [channels, selectedChannelId],
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

    const stickerCategories = useMemo(() => {
        const cats: StickerCategory[] = [];

        if (isServerContextReady && serverDetails) {
            cats.push({
                id: serverDetails._id,
                name: serverDetails.name,
                icon: serverDetails.icon,
                stickers: currentServerStickers,
            });
        }

        const otherServerIds = new Set(allStickers.map((s) => s.serverId));
        if (selectedServerId) otherServerIds.delete(selectedServerId);

        otherServerIds.forEach((sid) => {
            const serverStickers = allStickers.filter(
                (s) => s.serverId === sid,
            );
            if (serverStickers.length > 0) {
                const serverInfo = serverList.find((s) => s._id === sid);
                cats.push({
                    id: sid,
                    name: serverInfo?.name || 'Other Server',
                    icon: serverInfo?.icon,
                    stickers: serverStickers,
                });
            }
        });

        return cats;
    }, [
        isServerContextReady,
        serverDetails,
        currentServerStickers,
        allStickers,
        selectedServerId,
        serverList,
    ]);

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

        try {
            const uploadedUrls = await Promise.all(
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
                        return queuedFile.isSpoiler ? `${url}#spoiler` : url;
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
        async (text: string): Promise<boolean> => {
            const trimmedText = text.trim();
            const hasSlashChips = editor
                ? editor.getEditorState().read($getSlashChipState) !== null
                : false;
            if (!trimmedText && files.length === 0 && !hasSlashChips)
                return false;
            if (cooldown > 0 && !canBypassSlowMode) {
                setIsSlowModeError(true);
                setTimeout(() => setIsSlowModeError(false), 500);
                return false;
            }

            const slashResult = await tryExecuteSlashCommand({
                text: trimmedText,
                filesCount: files.length,
                selectedServerId,
                selectedChannelId,
                isServerRoute,
                serverCommands,
                editor,
                showToast,
                createInteraction: interactionsApi.createInteraction,
                onSuccess: () => {
                    clearQueue();
                    onCancelReply?.();
                },
            });
            if (slashResult.handled) {
                if (slashResult.success) {
                    clearDraft(
                        selectedFriendId,
                        selectedServerId,
                        selectedChannelId,
                    );
                }
                return slashResult.success;
            }

            const uploadedUrls = await handleUploadFiles();

            if (uploadedUrls.length === 0 && !trimmedText && files.length > 0) {
                return false;
            }

            const formattedUrls = uploadedUrls.map((url) => `[%file%](${url})`);
            const finalMessage = [trimmedText, ...formattedUrls]
                .filter(Boolean)
                .join('\n');

            if (finalMessage) {
                sendMessage(finalMessage, replyingTo?._id);
                if (currentChannel?.slowMode && currentChannel.slowMode > 0) {
                    setCooldown(currentChannel.slowMode);
                }
                clearQueue();
                onCancelReply?.();
                clearDraft(
                    selectedFriendId,
                    selectedServerId,
                    selectedChannelId,
                );
                return true;
            }

            return false;
        },
        [
            files,
            handleUploadFiles,
            clearQueue,
            sendMessage,
            replyingTo,
            onCancelReply,
            currentChannel?.slowMode,
            cooldown,
            canBypassSlowMode,
            setCooldown,
            selectedServerId,
            selectedChannelId,
            isServerRoute,
            showToast,
            serverCommands,
            editor,
        ],
    );

    useEffect(() => {
        isAutocompleteOpenRef.current =
            isMentionAutocompleteOpen || isSlashAutocompleteOpen;
    }, [isMentionAutocompleteOpen, isSlashAutocompleteOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files) {
            addFiles(e.target.files);
            e.target.value = '';
        }
    };

    const initialConfig = {
        namespace: 'MessageInput',
        nodes: [ChipNode, SlashCommandChipNode, SlashArgChipNode],
        onError: (error: Error) => console.error(error),
        theme,
    };

    const getPlaceholder = (): React.ReactNode => {
        if (isUploading) return 'Uploading...';

        if (currentChannel?.slowMode && currentChannel.slowMode > 0) {
            if (canBypassSlowMode) {
                return "Slowmode enabled. Huh? It doesn't affect YOU!";
            }
            return 'Slowmode enabled.';
        }

        const hasLastMessage = findLastMyMessage !== null;
        return (
            <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="shrink-0">Type a message...</span>
                <span className="flex shrink items-center gap-1 text-[11px] font-medium whitespace-nowrap">
                    <span className="ml-1 opacity-70">(</span>
                    <kbd className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-white/20 bg-white/10 px-1.5 shadow-sm">
                        Shift
                    </kbd>
                    <span className="opacity-70">+</span>
                    <kbd className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-white/20 bg-white/10 px-1.5 shadow-sm">
                        Enter
                    </kbd>
                    <span className="opacity-70">new line</span>
                    {hasLastMessage && (
                        <>
                            <span className="mx-0.5 h-3 w-px bg-white/10" />
                            <kbd className="flex h-[18px] min-w-[18px] items-center justify-center rounded border border-white/20 bg-white/10 px-1 shadow-sm">
                                <ArrowUp size={10} strokeWidth={3} />
                            </kbd>
                            <span className="opacity-70">edit</span>
                        </>
                    )}
                    <span className="opacity-70">)</span>
                </span>
            </div>
        );
    };

    useEffect(() => {
        if (!editor) return;

        const draftJson = getDraft(
            selectedFriendId,
            selectedServerId,
            selectedChannelId,
        );

        if (draftJson) {
            try {
                const parsedState = editor.parseEditorState(draftJson);
                editor.setEditorState(parsedState);
            } catch (e) {
                console.error('Failed to parse draft state:', e);
                editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            }
        } else {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
        }
    }, [editor, selectedFriendId, selectedServerId, selectedChannelId]);

    const isUnknownReplyingUser = replyingTo?.user?.username === 'Unknown';
    const { data: fetchedReplyingUser } = useUserById(
        replyingTo?.user?._id || '',
        {
            enabled: !!replyingTo && isUnknownReplyingUser,
        },
    );
    const replyingUser =
        isUnknownReplyingUser && fetchedReplyingUser
            ? fetchedReplyingUser
            : replyingTo?.user;

    if (isTimedOut) {
        return (
            <Box
                className={cn(
                    'relative mx-4 mb-4 flex h-[56px] items-center gap-3 overflow-visible rounded-lg border border-danger/30 bg-danger/5 px-4 transition-colors',
                )}
            >
                <Clock className="shrink-0 text-danger" size={20} />
                <div className="flex flex-1 items-center gap-2 overflow-hidden text-danger">
                    <Text
                        className="font-bold whitespace-nowrap"
                        variant="danger"
                    >
                        You've been timed out.
                    </Text>
                    <Text
                        className="text-sm whitespace-nowrap opacity-80"
                        variant="danger"
                    >
                        Remaining time: {formatTimeout(remainingTimeoutMs)}
                    </Text>
                </div>
            </Box>
        );
    }

    return (
        <Box
            className={cn(
                'relative mx-4 mb-4 flex flex-col overflow-visible rounded-lg border border-border-subtle bg-[var(--bg-msg-input)] transition-colors focus-within:border-primary/50',
                isSlowModeError && 'animate-shake !border-danger',
            )}
        >
            <FileQueue
                files={files}
                onRemove={removeFile}
                onToggleSpoiler={toggleSpoiler}
            />

            {replyingTo && replyingUser && (
                <Box className="flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-subtle/30 px-3 py-2">
                    <Box className="flex min-w-0 items-center gap-2">
                        <Text className="text-xs whitespace-nowrap text-muted-foreground">
                            Replying to
                        </Text>
                        <StyledUserName
                            className="text-xs font-bold whitespace-nowrap"
                            disableColors={disableColors}
                            disableCustomFonts={disableCustomFonts}
                            disableGlow={disableGlow}
                            disableGlowAndColors={disableGlowAndColors}
                            role={replyingTo.role}
                            user={replyingUser}
                        >
                            {replyingUser.displayName || replyingUser.username}
                        </StyledUserName>
                        {replyingUser.isBot && (
                            <BotTag className="h-3.5 px-1 text-[8px]" />
                        )}
                        <Box className="flex items-center gap-1 truncate overflow-hidden text-xs whitespace-nowrap text-muted-foreground opacity-80">
                            {replyingTo.interaction && !replyingTo.text && (
                                <span className="opacity-70">
                                    used{' '}
                                    <span className="font-bold text-primary">
                                        /{replyingTo.interaction.command}
                                    </span>
                                </span>
                            )}
                            <ParsedText
                                condenseFiles
                                condenseInvites
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
                    disabled={cooldown > 0 && !canBypassSlowMode}
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Plus size={20} />
                </Button>

                <div
                    className={cn(
                        'relative flex min-h-[40px] flex-1 cursor-text items-center rounded-md border border-border-subtle bg-bg-subtle transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:outline-none',
                        isSlowModeError &&
                            '!border-danger ring-2 !ring-danger ring-offset-1',
                    )}
                >
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
                                <div className="pointer-events-none absolute top-[9px] left-3 max-w-[calc(100%-24px)] truncate text-sm text-placeholder select-none">
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
                        <LexicalEmojiPlugin />
                        <LexicalPastePlugin onPasteFiles={addFiles} />
                        <LexicalAutocompletePlugin
                            channels={channels}
                            friends={friendUsers}
                            members={members}
                            roles={roles}
                            serverEmojis={allServerEmojis}
                            onOpenChange={(isOpen) => {
                                setIsMentionAutocompleteOpen(isOpen);
                            }}
                        />
                        <LexicalSlashCommandPlugin
                            commands={serverCommands}
                            enabled={isServerContextReady}
                            members={members}
                            onOpenChange={setIsSlashAutocompleteOpen}
                        />
                        <OnChangePlugin
                            onChange={(editorState) => {
                                let currentText = '';
                                let currentChip = null;
                                editorState.read(() => {
                                    const text = $getRawMessageText();
                                    const chipState = $getSlashChipState();
                                    currentText = text;
                                    currentChip = chipState;
                                    setCurrentInputText(text);
                                    setSlashChipState(chipState);
                                    const nonEmpty =
                                        text.trim().length > 0 ||
                                        chipState !== null;
                                    setHasText(nonEmpty);
                                    if (nonEmpty) {
                                        sendTyping();
                                    }
                                });

                                if (
                                    currentText.trim().length === 0 &&
                                    currentChip === null
                                ) {
                                    clearDraft(
                                        selectedFriendId,
                                        selectedServerId,
                                        selectedChannelId,
                                    );
                                } else {
                                    const json = JSON.stringify(
                                        editorState.toJSON(),
                                    );
                                    saveDraft(
                                        json,
                                        selectedFriendId,
                                        selectedServerId,
                                        selectedChannelId,
                                    );
                                }
                            }}
                        />
                    </LexicalComposer>

                    {showCounter && (
                        <div
                            className={cn(
                                'pointer-events-none absolute right-2 bottom-1 text-[10px] font-bold select-none',
                                remainingChars < 0
                                    ? 'text-danger'
                                    : 'text-muted-foreground/60',
                            )}
                        >
                            {remainingChars < 0
                                ? `-${Math.abs(remainingChars)}`
                                : remainingChars}
                        </div>
                    )}
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
                        setShowStickerPicker(false);
                        setShowGifPicker(false);
                    }}
                >
                    <Smile size={20} />
                </Button>

                <Button
                    className={cn(
                        'mb-1 h-8 w-8 shrink-0 p-0',
                        showStickerPicker && 'text-primary',
                    )}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setShowStickerPicker(!showStickerPicker);
                        setShowEmojiPicker(false);
                        setShowGifPicker(false);
                    }}
                >
                    <Sticker size={20} />
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
                            setShowStickerPicker(false);
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
                                        void (async () => {
                                            const result =
                                                await handleSendMessage(url);
                                            if (result) {
                                                editor.dispatchCommand(
                                                    CLEAR_EDITOR_COMMAND,
                                                    undefined,
                                                );
                                            }
                                        })();
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
                                    void (async () => {
                                        const result =
                                            await handleSendMessage(text);
                                        if (result) {
                                            editor.dispatchCommand(
                                                CLEAR_EDITOR_COMMAND,
                                                undefined,
                                            );
                                        }
                                    })();
                                });
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
                    <React.Suspense
                        fallback={
                            <div className="flex h-[400px] w-[320px] items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-muted-foreground shadow-xl">
                                Loading emojis...
                            </div>
                        }
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
                                editor?.focus();
                            }}
                            onEmojiSelect={(emoji: string): void => {
                                editor?.update(() => {
                                    const selection = $getSelection();
                                    if ($isRangeSelection(selection)) {
                                        selection.insertNodes([
                                            $createChipNode('unicode-emoji', {
                                                id: emoji,
                                            }),
                                        ]);
                                    }
                                });
                                editor?.focus();
                            }}
                        />
                    </React.Suspense>
                </div>
            )}

            {showStickerPicker && (
                <div
                    className="absolute right-0 bottom-full z-[var(--z-index-popover)] mb-2"
                    ref={emojiPickerRef}
                >
                    <StickerPicker
                        categories={stickerCategories}
                        onStickerSelect={(sticker) => {
                            sendMessage('', undefined, sticker.id);
                            setShowStickerPicker(false);
                        }}
                    />
                </div>
            )}

            {slashPreview && (
                <Box className="border-t border-border-subtle px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        /{slashPreview.commandName}
                    </span>
                    <span className="ml-2">{slashPreview.status}</span>
                    {'usage' in slashPreview && slashPreview.usage && (
                        <span className="ml-2 opacity-80">
                            Usage: {slashPreview.usage}
                        </span>
                    )}
                </Box>
            )}
        </Box>
    );
};
