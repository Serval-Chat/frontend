import React, { useMemo, useReducer, useRef } from 'react';

import type { LexicalEditor } from 'lexical';
import { Plus } from 'lucide-react';

import type { MessageAttachment, OutgoingPoll } from '@/api/chat/chat.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import { useComposerRestrictions } from '@/hooks/chat/useComposerRestrictions';
import type { QueuedFile } from '@/hooks/chat/useFileQueue';
import { useMessageInputData } from '@/hooks/chat/useMessageInputData';
import { useMessageInputEffects } from '@/hooks/chat/useMessageInputEffects';
import { useMessageSend } from '@/hooks/chat/useMessageSend';
import { useKeybindManager } from '@/keybinds/useKeybindManager';
import { useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Button } from '@/ui/components/common/Button';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { mergeReducer } from '@/utils/mergeReducer';

import { ComposerRestrictionNotice } from './ComposerRestrictionNotice';
import { FileQueue } from './FileQueue';
import { MessageComposerActions } from './MessageComposerActions';
import { MessageComposerEditor } from './MessageComposerEditor';
import { MessageComposerOverlays } from './MessageComposerOverlays';
import { ReplyBanner } from './ReplyBanner';
import { getSlashPreview } from './messageInputSlashPreview';

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
    sendMessage: (
        text: string,
        replyToId?: string,
        stickerId?: string,
        poll?: OutgoingPoll,
        attachments?: MessageAttachment[],
        noEmbedsUrls?: string[],
    ) => void;
    sendTyping: () => void;
}

type ComposerPanel = 'emoji' | 'sticker' | 'gif' | null;

interface MessageInputUiState {
    editor: LexicalEditor | null;
    activePanel: ComposerPanel;
    showPollModal: boolean;
    isMobile: boolean;
    hasText: boolean;
    currentInputText: string;
    slashChipState: {
        commandName: string;
        commandId?: string;
        argValues: string[];
    } | null;
}

export const MessageInput = ({
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
    sendMessage,
    sendTyping,
}: MessageInputProps) => {
    const [ui, patchUi] = useReducer(mergeReducer<MessageInputUiState>, {
        editor: null,
        activePanel: null,
        showPollModal: false,
        isMobile: globalThis.matchMedia('(max-width: 768px)').matches,
        hasText: false,
        currentInputText: '',
        slashChipState: null,
    });
    const {
        editor,
        activePanel,
        showPollModal,
        isMobile,
        hasText,
        currentInputText,
        slashChipState,
    } = ui;
    const showEmojiPicker = activePanel === 'emoji';
    const showStickerPicker = activePanel === 'sticker';
    const showGifPicker = activePanel === 'gif';

    const togglePanel = (panel: Exclude<ComposerPanel, null>): void => {
        patchUi((s) => ({
            activePanel: s.activePanel === panel ? null : panel,
        }));
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: me } = useMe();
    const keybindManager = useKeybindManager(me?.settings?.keybinds);

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
        (state): string | null => state.nav.selectedFriendId,
    );
    const selectedServerId = useAppSelector(
        (state): string | null => state.nav.selectedServerId,
    );
    const selectedChannelId = useAppSelector(
        (state): string | null => state.nav.selectedChannelId,
    );

    const {
        isServerContextReady,
        isServerRoute,
        members,
        roles,
        channels,
        serverDetails,
        serverCommands,
        myMember,
        friendUsers,
        currentChannel,
        allServerEmojis,
        stickerCategories,
        customCategories,
        findLastMyMessage,
        editChannelMessage,
        editUserMessage,
    } = useMessageInputData({
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        me,
        showStickerPicker,
    });

    const {
        isTimedOut,
        isGloballyMuted,
        remainingTimeoutMs,
        activeMute,
        formatMuteExpiry,
    } = useComposerRestrictions({ me, serverDetails, myMember });

    const { isUploading, isSlowModeError, handleSendMessage, handleSendPoll } =
        useMessageSend({
            editor,
            files,
            updateFileStatus,
            updateFileProgress,
            clearQueue,
            sendMessage,
            cooldown,
            canBypassSlowMode,
            setCooldown,
            currentChannel,
            replyingTo,
            onCancelReply,
            selectedServerId,
            selectedChannelId,
            selectedFriendId,
            isServerRoute,
            serverCommands,
            isGloballyMuted,
            findLastMyMessage,
            editChannelMessage,
            editUserMessage,
        });

    const slashPreview = useMemo(
        () => getSlashPreview(currentInputText, serverCommands, slashChipState),
        [currentInputText, serverCommands, slashChipState],
    );

    useMessageInputEffects({
        editor,
        keybindManager,
        replyingTo,
        selectedFriendId,
        selectedServerId,
        selectedChannelId,
        onIsMobileChange: (mobile): void => {
            patchUi({ isMobile: mobile });
        },
        onCloseFloatingPickers: (): void => {
            patchUi({ activePanel: null });
        },
    });

    const isUnknownReplyingUser = replyingTo?.user?.username === 'Unknown';
    const { data: fetchedReplyingUser } = useUserById(
        replyingTo?.user?.id || '',
        {
            enabled: !!replyingTo && isUnknownReplyingUser,
        },
    );
    const replyingUser =
        isUnknownReplyingUser && fetchedReplyingUser
            ? fetchedReplyingUser
            : replyingTo?.user;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files) {
            addFiles(e.target.files);
            e.target.value = '';
        }
    };

    if (isTimedOut) {
        return (
            <ComposerRestrictionNotice
                kind="timeout"
                remainingTimeoutMs={remainingTimeoutMs}
            />
        );
    }

    if (isGloballyMuted) {
        return (
            <ComposerRestrictionNotice
                kind="muted"
                muteExpiryLabel={formatMuteExpiry()}
                muteReason={activeMute?.reason}
            />
        );
    }

    return (
        <Box
            className={cn(
                'pride-glass-input relative mx-4 mb-4 flex flex-col overflow-visible rounded-lg border border-border-subtle bg-[var(--bg-msg-input)] transition-colors focus-within:border-primary/50',
                isSlowModeError && 'animate-shake !border-danger',
            )}
        >
            <FileQueue
                files={files}
                onRemove={removeFile}
                onToggleSpoiler={toggleSpoiler}
            />

            {replyingTo && replyingUser ? (
                <ReplyBanner
                    disableColors={disableColors}
                    disableCustomFonts={disableCustomFonts}
                    disableGlow={disableGlow}
                    disableGlowAndColors={disableGlowAndColors}
                    replyingTo={replyingTo}
                    replyingUser={replyingUser}
                    onCancelReply={onCancelReply}
                />
            ) : null}

            <Box className="relative flex items-center gap-2 p-2">
                <input
                    multiple
                    aria-label="Attach files"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    type="file"
                    onChange={handleFileChange}
                />
                <Button
                    className="h-8 w-8 shrink-0 p-0"
                    disabled={cooldown > 0 ? !canBypassSlowMode : undefined}
                    size="sm"
                    variant="ghost"
                    onClick={(): void | undefined =>
                        fileInputRef.current?.click()
                    }
                >
                    <Plus size={20} />
                </Button>

                <MessageComposerEditor
                    canBypassSlowMode={canBypassSlowMode}
                    channels={channels}
                    currentInputText={currentInputText}
                    editor={editor}
                    friends={friendUsers}
                    hasText={hasText}
                    isServerContextReady={isServerContextReady}
                    isSlowModeError={isSlowModeError}
                    isUploading={isUploading}
                    lastMessage={findLastMyMessage}
                    members={members}
                    roles={roles}
                    selectedChannelId={selectedChannelId}
                    selectedFriendId={selectedFriendId}
                    selectedServerId={selectedServerId}
                    serverCommands={serverCommands}
                    serverEmojis={allServerEmojis}
                    slowMode={currentChannel?.slowMode}
                    onEditorChange={(nextEditor): void => {
                        patchUi({ editor: nextEditor });
                    }}
                    onHasTextChange={(value): void => {
                        patchUi({ hasText: value });
                    }}
                    onPasteFiles={addFiles}
                    onSendMessage={handleSendMessage}
                    onSlashChipChange={(chip): void => {
                        patchUi({ slashChipState: chip });
                    }}
                    onTextChange={(text): void => {
                        patchUi({ currentInputText: text });
                    }}
                    onTyping={sendTyping}
                />

                <MessageComposerActions
                    editor={editor}
                    hasFiles={files.length > 0}
                    hasText={hasText}
                    isMobile={isMobile}
                    isUploading={isUploading}
                    showEmojiPicker={showEmojiPicker}
                    showGifPicker={showGifPicker}
                    showPollModal={showPollModal}
                    showStickerPicker={showStickerPicker}
                    onCloseGif={(): void => {
                        patchUi({ activePanel: null });
                    }}
                    onOpenPoll={(): void => {
                        patchUi({ showPollModal: true, activePanel: null });
                    }}
                    onSendMessage={handleSendMessage}
                    onToggleEmoji={(): void => {
                        togglePanel('emoji');
                    }}
                    onToggleGif={(): void => {
                        togglePanel('gif');
                    }}
                    onToggleSticker={(): void => {
                        togglePanel('sticker');
                    }}
                />
            </Box>

            <MessageComposerOverlays
                customCategories={customCategories}
                editor={editor}
                sendMessage={sendMessage}
                showEmojiPicker={showEmojiPicker}
                showPollModal={showPollModal}
                showStickerPicker={showStickerPicker}
                slashPreview={slashPreview}
                stickerCategories={stickerCategories}
                onClosePanels={(): void => {
                    patchUi({ activePanel: null });
                }}
                onClosePoll={(): void => {
                    patchUi({ showPollModal: false });
                }}
                onSubmitPoll={handleSendPoll}
            />
        </Box>
    );
};
