import React from 'react';

import {
    Copy,
    CornerUpLeft,
    Edit,
    Pin,
    SmilePlus,
    StickyNote,
    Trash2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useClickAway, useEvent } from 'react-use';

import {
    useDeleteMessage,
    useTogglePin,
    useToggleSticky,
} from '@/api/chat/chat.queries';
import { useAddReaction } from '@/api/reactions/reactions.queries';
import { useMembers, useRoles } from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { usePermissions } from '@/hooks/usePermissions';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Button } from '@/ui/components/common/Button';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { cn } from '@/utils/cn';

import { MessageContent } from './MessageContent';
import { MessageEdit } from './MessageEdit';
import { MessageHeader } from './MessageHeader';
import { Reactions } from './Reactions';
import { ReplyPreview } from './ReplyPreview';

interface MessageProps {
    message: ProcessedChatMessage;
    user: User;
    role?: Role;
    iconRole?: Role;
    isGroupStart?: boolean;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    disableActions?: boolean;
}

export const Message: React.FC<MessageProps> = ({
    message,
    user,
    role,
    iconRole,
    isGroupStart = true,
    isHighlighted = false,
    onReplyClick,
    onReplyToMessage,
    disableCustomFonts,
    disableGlowAndColors,
    disableColors,
    disableGlow,
    disableActions = false,
}) => {
    const [showProfile, setShowProfile] = React.useState(false);
    const [showPicker, setShowPicker] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const avatarRef = React.useRef<HTMLDivElement>(null);
    const pickerRef = React.useRef<HTMLDivElement>(null);
    const reactRef = React.useRef<HTMLButtonElement>(null);
    const { data: me } = useMe();
    const { data: members } = useMembers(
        message.serverId === 'preview' ? null : (message.serverId ?? null),
    );
    const { data: serverRoles } = useRoles(
        message.serverId === 'preview' ? null : (message.serverId ?? null),
    );

    const senderMember = React.useMemo(
        () => members?.find((m) => m.userId === message.senderId),
        [members, message.senderId],
    );
    const senderRoles = React.useMemo(() => {
        if (!senderMember || !serverRoles) return undefined;
        return serverRoles.filter((r) => senderMember.roles.includes(r._id));
    }, [senderMember, serverRoles]);
    const addReaction = useAddReaction();
    const deleteMessage = useDeleteMessage();
    const { mutate: togglePin } = useTogglePin();
    const { mutate: toggleSticky } = useToggleSticky();
    const { hasPermission, isOwner } = usePermissions(
        message.serverId === 'preview' ? null : (message.serverId ?? null),
    );
    const { customCategories } = useCustomEmojis();

    const myId = me?._id;
    const mentionsMe = React.useMemo(() => {
        if (!myId) return false;

        // Direct mention
        if (message.text.includes(`<userid:'${myId}'>`)) return true;

        // Everyone mention
        if (message.text.includes('<everyone>')) return true;

        // Role mention
        const myMember = members?.find((m) => m.userId === myId);
        if (
            myMember &&
            myMember.roles.some((roleId) =>
                message.text.includes(`<roleid:'${roleId}'>`),
            )
        ) {
            return true;
        }

        return false;
    }, [message.text, myId, members]);

    const handleEmojiSelect = (emoji: string): void => {
        addReaction.mutate({
            messageId: message._id,
            serverId: message.serverId,
            channelId: message.channelId,
            data: { emoji, emojiType: 'unicode' },
        });
        setShowPicker(false);
    };

    const handleCustomEmojiSelect = (emoji: {
        id: string;
        name: string;
    }): void => {
        addReaction.mutate({
            messageId: message._id,
            serverId: message.serverId,
            channelId: message.channelId,
            data: { emoji: emoji.name, emojiType: 'custom', emojiId: emoji.id },
        });
        setShowPicker(false);
    };

    // Close picker when clicking outside
    useClickAway(pickerRef, () => {
        setShowPicker(false);
    });

    const isMessageSender = me?._id === message.senderId;
    const canEdit = isMessageSender;

    // Listen for editLastMessage event from MessageInput
    useEvent('editLastMessage', (event: CustomEvent) => {
        const { messageId } = event.detail;
        if (messageId === message._id && canEdit) {
            setIsEditing(true);
        }
    });

    const canDelete =
        isMessageSender ||
        isOwner ||
        hasPermission('administrator') ||
        hasPermission('manageMessages') ||
        hasPermission('deleteMessagesOfOthers');

    const canPin =
        hasPermission('administrator') || hasPermission('pinMessages');

    const handleDelete = React.useCallback((): void => {
        if (!message.serverId || !message.channelId) return;
        deleteMessage.mutate({
            serverId: message.serverId,
            channelId: message.channelId,
            messageId: message._id,
        });
    }, [message.serverId, message.channelId, message._id, deleteMessage]);

    const handleEdit = React.useCallback((): void => {
        setIsEditing(true);
    }, []);

    const contextMenuItems = React.useMemo(() => {
        const items: ContextMenuItem[] = [];

        if (message.serverId && message.channelId) {
            items.push({
                label: 'Copy Message Link',
                icon: Copy,
                onClick: () => {
                    const link = `/chat/@server/${message.serverId}/channel/${message.channelId}/message/${message._id}`;
                    void navigator.clipboard.writeText(
                        `${window.location.origin}${link}`,
                    );
                },
            });
            items.push({ type: 'divider' });
        }

        items.push({
            label: 'Copy Message ID',
            icon: Copy,
            onClick: () => {
                void navigator.clipboard.writeText(message._id);
            },
        });

        if (onReplyToMessage) {
            items.unshift({
                label: 'Reply',
                icon: CornerUpLeft,
                onClick: () => onReplyToMessage(message),
            });
        }

        items.splice(onReplyToMessage ? 1 : 0, 0, {
            label: 'Add Reaction',
            icon: SmilePlus,
            onClick: () => setShowPicker(true),
        });

        if (canEdit) {
            items.push({
                label: 'Edit Message',
                icon: Edit,
                onClick: handleEdit,
            });
        }

        if (canPin && message.serverId && message.channelId) {
            items.push({ type: 'divider' });
            items.push({
                label: message.isPinned ? 'Unpin Message' : 'Pin Message',
                icon: Pin,
                onClick: () => {
                    togglePin({
                        serverId: message.serverId!,
                        channelId: message.channelId!,
                        messageId: message._id,
                    });
                },
            });
            items.push({
                label: message.isSticky ? 'Unsticky Message' : 'Sticky Message',
                icon: StickyNote,
                onClick: () => {
                    toggleSticky({
                        serverId: message.serverId!,
                        channelId: message.channelId!,
                        messageId: message._id,
                    });
                },
            });
        }

        if (canDelete) {
            items.push({ type: 'divider' });
            items.push({
                label: 'Delete Message',
                icon: Trash2,
                variant: 'danger',
                onClick: handleDelete,
            });
        }

        return items;
    }, [
        message,
        canEdit,
        canDelete,
        onReplyToMessage,
        handleEdit,
        handleDelete,
        canPin,
        togglePin,
        toggleSticky,
    ]);

    const isMobile =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches;

    const pickerCoords = useSmartPosition({
        isOpen: showPicker && !isMobile,
        elementRef: pickerRef,
        triggerRef: reactRef,
        padding: 16,
        offset: 8,
    });

    const messageContent = (
        <>
            {/* Reply Preview */}
            {isGroupStart && message.replyTo && (
                <ReplyPreview
                    disableColors={disableColors}
                    disableCustomFonts={disableCustomFonts}
                    disableGlow={disableGlow}
                    disableGlowAndColors={disableGlowAndColors}
                    replyToId={message.replyTo._id}
                    role={message.replyTo.role}
                    text={message.replyTo.text}
                    user={message.replyTo.user}
                    onClick={onReplyClick}
                />
            )}

            <Box className="flex items-start gap-1">
                {/* Avatar */}
                <Box
                    className="mt-1 flex w-12 flex-shrink-0 justify-center"
                    ref={avatarRef}
                >
                    {isGroupStart ? (
                        <UserProfilePicture
                            noIndicator
                            size="md"
                            src={user.profilePicture}
                            username={user.username}
                            onClick={() => setShowProfile(true)}
                        />
                    ) : (
                        <Text className="mt-1 text-[10px] font-medium text-muted-foreground opacity-0 select-none group-hover:opacity-40">
                            {
                                new Date(message.createdAt)
                                    .toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                    })
                                    .split(' ')[0]
                            }
                        </Text>
                    )}
                </Box>

                {/* Content Area */}
                <Box className="min-w-0 flex-1">
                    <MessageHeader
                        disableColors={disableColors}
                        disableCustomFonts={disableCustomFonts}
                        disableGlow={disableGlow}
                        disableGlowAndColors={disableGlowAndColors}
                        editedAt={message.editedAt}
                        iconRole={iconRole || message.iconRole}
                        isEdited={message.isEdited}
                        isGroupStart={isGroupStart}
                        role={role || message.role}
                        timestamp={message.createdAt}
                        user={user}
                        onClickName={() => setShowProfile(true)}
                    />
                    {isEditing ? (
                        <MessageEdit
                            channelId={message.channelId}
                            initialText={message.text}
                            messageId={message._id}
                            receiverId={message.receiverId}
                            serverId={message.serverId}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <MessageContent text={message.text} />
                    )}
                    <Reactions
                        channelId={message.channelId}
                        messageId={message._id}
                        reactions={message.reactions || []}
                        serverId={message.serverId}
                        onAddClick={() => setShowPicker(true)}
                    />
                </Box>
            </Box>

            {/* Hover Actions */}
            {!disableActions && (
                <Box
                    className={cn(
                        'absolute top-0 right-4 z-[var(--z-index-effect-md)] -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100',
                        showPicker && 'opacity-100',
                    )}
                >
                    <Box className="flex items-center gap-1 rounded border border-white/5 bg-bg-secondary px-1 py-1 shadow-xl max-md:hidden">
                        {onReplyToMessage && (
                            <Button
                                className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                                size="sm"
                                title="Reply"
                                variant="ghost"
                                onClick={() => onReplyToMessage(message)}
                            >
                                <CornerUpLeft size={18} />
                            </Button>
                        )}
                        <Button
                            className={cn(
                                'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                                showPicker && 'bg-white/10 text-foreground',
                            )}
                            ref={reactRef}
                            size="sm"
                            title="Add Reaction"
                            variant="ghost"
                            onClick={() => setShowPicker(!showPicker)}
                        >
                            <SmilePlus size={18} />
                        </Button>

                        {canEdit && (
                            <Button
                                className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                                size="sm"
                                title="Edit Message"
                                variant="ghost"
                                onClick={handleEdit}
                            >
                                <Edit size={18} />
                            </Button>
                        )}

                        {canPin && message.serverId && message.channelId && (
                            <>
                                <Button
                                    className={cn(
                                        'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                                        message.isPinned && 'text-primary',
                                    )}
                                    size="sm"
                                    title={
                                        message.isPinned
                                            ? 'Unpin Message'
                                            : 'Pin Message'
                                    }
                                    variant="ghost"
                                    onClick={() =>
                                        togglePin({
                                            serverId: message.serverId!,
                                            channelId: message.channelId!,
                                            messageId: message._id,
                                        })
                                    }
                                >
                                    <Pin
                                        className={cn(
                                            'h-4 w-4',
                                            message.isPinned && 'fill-primary',
                                        )}
                                        size={18}
                                    />
                                </Button>
                                <Button
                                    className={cn(
                                        'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                                        message.isSticky && 'text-primary',
                                    )}
                                    size="sm"
                                    title={
                                        message.isSticky
                                            ? 'Unsticky Message'
                                            : 'Sticky Message'
                                    }
                                    variant="ghost"
                                    onClick={() =>
                                        toggleSticky({
                                            serverId: message.serverId!,
                                            channelId: message.channelId!,
                                            messageId: message._id,
                                        })
                                    }
                                >
                                    <StickyNote
                                        className={cn(
                                            'h-4 w-4',
                                            message.isSticky && 'fill-primary',
                                        )}
                                        size={18}
                                    />
                                </Button>
                            </>
                        )}

                        {canDelete && (
                            <Button
                                className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-danger/20 hover:text-danger"
                                size="sm"
                                title="Delete Message"
                                variant="ghost"
                                onClick={handleDelete}
                            >
                                <Trash2 size={18} />
                            </Button>
                        )}
                    </Box>

                    {showPicker &&
                        (isMobile ? (
                            <Modal
                                fullScreen
                                noPadding
                                isOpen={showPicker}
                                title="Add Reaction"
                                onClose={() => setShowPicker(false)}
                            >
                                <EmojiPicker
                                    className="h-full !max-h-none w-full !max-w-none rounded-none border-none shadow-none"
                                    customCategories={customCategories}
                                    onCustomEmojiSelect={
                                        handleCustomEmojiSelect
                                    }
                                    onEmojiSelect={handleEmojiSelect}
                                />
                            </Modal>
                        ) : (
                            createPortal(
                                <Box
                                    className="z-[var(--z-index-popover)]"
                                    ref={pickerRef}
                                    style={{
                                        position: 'fixed',
                                        left: pickerCoords.x,
                                        top: pickerCoords.y,
                                    }}
                                >
                                    <EmojiPicker
                                        customCategories={customCategories}
                                        onCustomEmojiSelect={
                                            handleCustomEmojiSelect
                                        }
                                        onEmojiSelect={handleEmojiSelect}
                                    />
                                </Box>,
                                document.body,
                            )
                        ))}
                </Box>
            )}
        </>
    );

    return (
        <Box
            className={cn(
                'group relative flex flex-col px-4 py-0.5 transition-all duration-500 hover:bg-white/2',
                isGroupStart ? 'mt-1' : 'mt-0',
                isHighlighted &&
                    'border-l-2 border-[var(--primary)] bg-[var(--primary-muted)]',
                mentionsMe && 'border-l-2 border-[var(--caution)]',
            )}
            id={`message-${message._id}`}
            onMouseLeave={() => setShowPicker(false)}
        >
            {disableActions ? (
                messageContent
            ) : (
                <ContextMenu className="h-full w-full" items={contextMenuItems}>
                    {messageContent}
                </ContextMenu>
            )}

            <ProfilePopup
                disableColors={disableColors}
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                disableGlowAndColors={disableGlowAndColors}
                iconRole={iconRole}
                isOpen={showProfile}
                joinedAt={senderMember?.joinedAt}
                role={role}
                roles={senderRoles}
                triggerRef={avatarRef}
                user={user}
                userId={user._id}
                onClose={() => setShowProfile(false)}
            />
        </Box>
    );
};
