import { useCallback, useState } from 'react';

import type { LexicalEditor } from 'lexical';

import type {
    useEditChannelMessage,
    useEditUserMessage,
} from '@/api/chat/chat.queries';
import type { MessageAttachment, OutgoingPoll } from '@/api/chat/chat.types';
import { filesApi } from '@/api/files/files.api';
import { interactionsApi } from '@/api/interactions/interactions.api';
import type { SlashCommand } from '@/api/interactions/interactions.api';
import type { Channel } from '@/api/servers/servers.types';
import type { QueuedFile } from '@/hooks/chat/useFileQueue';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { $getSlashChipState } from '@/ui/components/chat/lexical/slashChipHelpers';
import { tryExecuteSlashCommand } from '@/ui/components/chat/lexical/slashCommandExecution';
import { useToast } from '@/ui/components/common/Toast';
import { clearDraft } from '@/utils/drafts';
import {
    applyMediaDimensions,
    readMediaDimensions,
} from '@/utils/fileDimensions';
import { applySedCommand, isSedCommand } from '@/utils/sed';

type SendMessageFn = (
    text: string,
    replyToId?: string,
    stickerId?: string,
    poll?: OutgoingPoll,
    attachments?: MessageAttachment[],
    noEmbedsUrls?: string[],
) => void;

type LastMyMessage = {
    id: string;
    text?: string | null;
    serverId?: string | null;
    channelId?: string | null;
    receiverId?: string | null;
} | null;

interface UseMessageSendArgs {
    editor: LexicalEditor | null;
    files: QueuedFile[];
    updateFileStatus: (id: string, status: QueuedFile['status']) => void;
    updateFileProgress: (id: string, progress: number) => void;
    clearQueue: () => void;
    sendMessage: SendMessageFn;
    cooldown: number;
    canBypassSlowMode: boolean;
    setCooldown: (c: number) => void;
    currentChannel: Channel | undefined;
    replyingTo?: ProcessedChatMessage | null;
    onCancelReply?: () => void;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    selectedFriendId: string | null;
    isServerRoute: boolean;
    serverCommands: SlashCommand[];
    isGloballyMuted: boolean;
    findLastMyMessage: LastMyMessage;
    editChannelMessage: ReturnType<typeof useEditChannelMessage>;
    editUserMessage: ReturnType<typeof useEditUserMessage>;
}

/**
 * owns the composer's send pipeline: uploading queued files, executing slash
 * commands, `sed` edits of the last message, slow-mode gating, and dispatching
 * the actual send. Returns the transient upload / slow-mode-error UI flags.
 */
export const useMessageSend = ({
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
}: UseMessageSendArgs) => {
    const { showToast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [isSlowModeError, setIsSlowModeError] = useState(false);

    const handleUploadFiles = useCallback(async (): Promise<
        MessageAttachment[]
    > => {
        if (files.length === 0) return [];

        setIsUploading(true);

        try {
            const uploadedAttachments = await Promise.all(
                files.map(async (queuedFile) => {
                    updateFileStatus(queuedFile.id, 'uploading');
                    try {
                        const [upload, dimensions] = await Promise.all([
                            filesApi.uploadFile(
                                queuedFile.file,
                                (progress): void => {
                                    updateFileProgress(queuedFile.id, progress);
                                },
                            ),
                            readMediaDimensions(queuedFile.file),
                        ]);
                        updateFileStatus(queuedFile.id, 'completed');
                        return {
                            ...applyMediaDimensions(
                                upload.attachment,
                                dimensions,
                            ),
                            spoiler:
                                upload.attachment.spoiler ||
                                queuedFile.isSpoiler,
                        };
                    } catch (error) {
                        updateFileStatus(queuedFile.id, 'error');
                        throw error;
                    }
                }),
            );

            return uploadedAttachments;
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
            if (isGloballyMuted) {
                showToast(
                    'You are currently muted and cannot send messages.',
                    'error',
                );
                return false;
            }

            const trimmedText = text.trim();
            const hasSlashChips = editor
                ? editor.getEditorState().read($getSlashChipState) !== null
                : false;
            if (!trimmedText && files.length === 0 && !hasSlashChips)
                return false;
            if (cooldown > 0 && !canBypassSlowMode) {
                setIsSlowModeError(true);
                setTimeout((): void => {
                    setIsSlowModeError(false);
                }, 500);
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
                onSuccess: (): void => {
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

            const attachments = await handleUploadFiles();

            if (attachments.length === 0 && !trimmedText && files.length > 0) {
                return false;
            }

            const finalMessage = trimmedText;

            if (finalMessage && isSedCommand(finalMessage)) {
                if (findLastMyMessage?.text) {
                    const corrected = applySedCommand(
                        findLastMyMessage.text,
                        finalMessage,
                    );
                    if (
                        findLastMyMessage.serverId &&
                        findLastMyMessage.channelId
                    ) {
                        editChannelMessage.mutate({
                            serverId: findLastMyMessage.serverId,
                            channelId: findLastMyMessage.channelId,
                            messageId: findLastMyMessage.id,
                            content: corrected,
                        });
                    } else if (findLastMyMessage.receiverId) {
                        editUserMessage.mutate({
                            messageId: findLastMyMessage.id,
                            content: corrected,
                            userId: findLastMyMessage.receiverId,
                        });
                    }
                }
                return true;
            }

            if (finalMessage || attachments.length > 0) {
                sendMessage(
                    finalMessage,
                    replyingTo?.id,
                    undefined,
                    undefined,
                    attachments,
                );
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
            currentChannel,
            cooldown,
            canBypassSlowMode,
            setCooldown,
            selectedServerId,
            selectedChannelId,
            selectedFriendId,
            isServerRoute,
            showToast,
            serverCommands,
            editor,
            isGloballyMuted,
            findLastMyMessage,
            editChannelMessage,
            editUserMessage,
        ],
    );

    const handleSendPoll = useCallback(
        (poll: OutgoingPoll): void => {
            if (isGloballyMuted) {
                showToast(
                    'You are currently muted and cannot create polls.',
                    'error',
                );
                return;
            }
            sendMessage('', replyingTo?.id, undefined, poll);
            onCancelReply?.();
        },
        [
            sendMessage,
            replyingTo?.id,
            onCancelReply,
            isGloballyMuted,
            showToast,
        ],
    );

    return {
        isUploading,
        isSlowModeError,
        handleUploadFiles,
        handleSendMessage,
        handleSendPoll,
    };
};
