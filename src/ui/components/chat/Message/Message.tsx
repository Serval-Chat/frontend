import React from 'react';

import { useClickAway, useEvent } from 'react-use';

import {
    useDeleteMessage,
    useTogglePin,
    useToggleSticky,
} from '@/api/chat/chat.queries';
import {
    useFriends,
    useRemoveFriend,
    useSendFriendRequest,
} from '@/api/friends/friends.queries';
import { useAddReaction } from '@/api/reactions/reactions.queries';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { InteractionHeader } from '@/ui/components/chat/InteractionHeader';
import { MessageContent } from '@/ui/components/chat/MessageContent';
import { MessageEdit } from '@/ui/components/chat/MessageEdit';
import { MessageHeader } from '@/ui/components/chat/MessageHeader';
import { Reactions } from '@/ui/components/chat/Reactions';
import { ReplyPreview } from '@/ui/components/chat/ReplyPreview';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';

import { useMessageData, useMessagePermissions } from './Message.hooks';
import type { MessageProps } from './Message.types';
import { MessageActions } from './MessageActions';
import { useMessageContextMenu } from './MessageContextMenu';
import { MessageEmojiPicker } from './MessageEmojiPicker';

const EMPTY_REACTIONS: never[] = [];

export const Message: React.FC<MessageProps> = React.memo(
    ({
        message,
        user: initialUser,
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
        me: passedMe,
        serverDetails: passedServerDetails,
        senderMember: passedSenderMember,
        senderRoles: passedSenderRoles,
        hasPermission: passedHasPermission,
        isOwner: passedIsOwner,
        fullMemberMap,
        roleMap,
    }) => {
        const {
            user,
            me,
            serverDetails,
            senderMember,
            senderRoles,
            hasPermission,
            isOwner,
            mentionsMe,
            interactionUser,
            interactionRole,
        } = useMessageData(message, initialUser, {
            me: passedMe,
            serverDetails: passedServerDetails,
            senderMember: passedSenderMember,
            senderRoles: passedSenderRoles,
            hasPermission: passedHasPermission,
            isOwner: passedIsOwner,
            fullMemberMap,
            roleMap,
        });

        const [showProfile, setShowProfile] = React.useState(false);
        const [showPicker, setShowPicker] = React.useState(false);
        const [isEditing, setIsEditing] = React.useState(false);
        const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);
        const avatarRef = React.useRef<HTMLDivElement>(null);
        const pickerRef = React.useRef<HTMLDivElement>(null);
        const reactRef = React.useRef<HTMLButtonElement>(null);

        const { mutate: addReaction } = useAddReaction();
        const { mutate: deleteMessage } = useDeleteMessage();
        const { mutate: togglePin } = useTogglePin();
        const { mutate: toggleSticky } = useToggleSticky();
        const { data: friends } = useFriends({ enabled: isContextMenuOpen });
        const { mutate: sendFriendRequest } = useSendFriendRequest();
        const { mutate: removeFriend } = useRemoveFriend();
        const { customCategories } = useCustomEmojis({ enabled: showPicker });

        const isMessageSender = me?._id === message.senderId;
        const { canEdit, canDelete, canPin } = useMessagePermissions(
            message,
            isMessageSender,
            isOwner,
            hasPermission,
        );

        const handleEmojiSelect = React.useCallback(
            (emoji: string): void => {
                addReaction({
                    messageId: message._id,
                    serverId: message.serverId,
                    channelId: message.channelId,
                    data: { emoji, emojiType: 'unicode' },
                });
                setShowPicker(false);
            },
            [addReaction, message._id, message.serverId, message.channelId],
        );

        const handleCustomEmojiSelect = React.useCallback(
            (emoji: { id: string; name: string }): void => {
                addReaction({
                    messageId: message._id,
                    serverId: message.serverId,
                    channelId: message.channelId,
                    data: {
                        emoji: emoji.name,
                        emojiType: 'custom',
                        emojiId: emoji.id,
                    },
                });
                setShowPicker(false);
            },
            [addReaction, message._id, message.serverId, message.channelId],
        );

        useClickAway(pickerRef, () => setShowPicker(false));

        useEvent('editLastMessage', (event: CustomEvent) => {
            const { messageId } = event.detail;
            if (messageId === message._id && canEdit) {
                setIsEditing(true);
            }
        });

        const handleDelete = React.useCallback((): void => {
            if (!message.serverId || !message.channelId) return;
            deleteMessage({
                serverId: message.serverId,
                channelId: message.channelId,
                messageId: message._id,
            });
        }, [message.serverId, message.channelId, message._id, deleteMessage]);

        const handleEdit = React.useCallback((): void => {
            setIsEditing(true);
        }, []);

        const handleCancelEdit = React.useCallback((): void => {
            setIsEditing(false);
        }, []);

        const handleAddReactionClick = React.useCallback(() => {
            setShowPicker(true);
        }, []);

        const handleProfileClick = React.useCallback(() => {
            setShowProfile(true);
        }, []);

        const handleTogglePin = React.useCallback((): void => {
            if (message.serverId && message.channelId) {
                togglePin({
                    serverId: message.serverId,
                    channelId: message.channelId,
                    messageId: message._id,
                });
            }
        }, [message.serverId, message.channelId, message._id, togglePin]);

        const handleToggleSticky = React.useCallback((): void => {
            if (message.serverId && message.channelId) {
                toggleSticky({
                    serverId: message.serverId,
                    channelId: message.channelId,
                    messageId: message._id,
                });
            }
        }, [message.serverId, message.channelId, message._id, toggleSticky]);

        const handleShowPicker = React.useCallback((): void => {
            setShowPicker(true);
        }, []);

        const handleTogglePicker = React.useCallback((): void => {
            setShowPicker((prev) => !prev);
        }, []);

        const handleClosePicker = React.useCallback((): void => {
            setShowPicker(false);
        }, []);

        const handleCloseProfile = React.useCallback((): void => {
            setShowProfile(false);
        }, []);

        const contextMenuItems = useMessageContextMenu({
            message,
            user,
            isMessageSender,
            canEdit,
            canDelete,
            canPin,
            friends,
            onReplyToMessage,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onTogglePin: handleTogglePin,
            onToggleSticky: handleToggleSticky,
            onRemoveFriend: removeFriend,
            onAddFriend: sendFriendRequest,
            onShowPicker: handleShowPicker,
        });

        const isMobile = React.useMemo(
            () =>
                typeof window !== 'undefined' &&
                window.matchMedia('(pointer: coarse)').matches,
            [],
        );

        const timeLabel = React.useMemo(
            () =>
                new Date(message.createdAt)
                    .toLocaleTimeString(APP_LOCALE, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    })
                    .split(' ')[0],
            [message.createdAt],
        );
        const pickerCoords = useSmartPosition({
            isOpen: showPicker && !isMobile,
            elementRef: pickerRef,
            triggerRef: reactRef,
            padding: 16,
            offset: 8,
        });

        const isColorsDisabled =
            disableColors ||
            me?.settings?.disableCustomUsernameColors ||
            serverDetails?.disableUsernameGlowAndCustomColor;
        const isFontsDisabled =
            disableCustomFonts ||
            me?.settings?.disableCustomUsernameFonts ||
            serverDetails?.disableCustomFonts;
        const isGlowDisabled =
            disableGlow ||
            me?.settings?.disableCustomUsernameGlow ||
            serverDetails?.disableUsernameGlowAndCustomColor;

        const messageContent = (
            <>
                {isGroupStart && message.replyTo && (
                    <ReplyPreview
                        disableColors={isColorsDisabled}
                        disableCustomFonts={isFontsDisabled}
                        disableGlow={isGlowDisabled}
                        disableGlowAndColors={disableGlowAndColors}
                        interaction={message.replyTo.interaction}
                        replyToId={message.replyTo._id}
                        role={message.replyTo.role}
                        text={message.replyTo.text}
                        user={message.replyTo.user}
                        onClick={onReplyClick}
                    />
                )}

                {isGroupStart &&
                    message.interaction &&
                    message.interaction.user && (
                        <InteractionHeader
                            command={message.interaction.command}
                            disableColors={isColorsDisabled}
                            disableCustomFonts={isFontsDisabled}
                            disableGlow={isGlowDisabled}
                            disableGlowAndColors={disableGlowAndColors}
                            isDeleted={!!message.deletedAt}
                            resolvedUser={interactionUser}
                            role={interactionRole}
                            user={message.interaction.user}
                        />
                    )}

                <Box className="flex items-start gap-1">
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
                                onClick={handleProfileClick}
                            />
                        ) : (
                            <Text className="mt-1 text-[10px] font-medium text-muted-foreground opacity-0 select-none group-hover:opacity-40">
                                {timeLabel}
                            </Text>
                        )}
                    </Box>

                    <Box className="min-w-0 flex-1">
                        <MessageHeader
                            disableColors={isColorsDisabled}
                            disableCustomFonts={isFontsDisabled}
                            disableGlow={isGlowDisabled}
                            disableGlowAndColors={disableGlowAndColors}
                            editedAt={message.editedAt}
                            iconRole={iconRole || message.iconRole}
                            isEdited={message.isEdited}
                            isGroupStart={isGroupStart}
                            isWebhook={message.isWebhook}
                            role={role || message.role}
                            timestamp={message.createdAt}
                            user={user}
                            onClickName={handleProfileClick}
                        />
                        {isEditing ? (
                            <MessageEdit
                                channelId={message.channelId}
                                initialText={message.text}
                                messageId={message._id}
                                receiverId={message.receiverId}
                                serverId={message.serverId}
                                onCancel={handleCancelEdit}
                            />
                        ) : (
                            <MessageContent
                                attachments={message.attachments}
                                channelId={message.channelId}
                                embeds={message.embeds}
                                isDeleted={!!message.deletedAt}
                                messageId={message._id}
                                poll={message.poll}
                                serverId={message.serverId}
                                stickerId={message.stickerId}
                                text={message.text}
                            />
                        )}
                        <Reactions
                            channelId={message.channelId}
                            messageId={message._id}
                            reactions={message.reactions ?? EMPTY_REACTIONS}
                            serverId={message.serverId}
                            onAddClick={handleAddReactionClick}
                        />
                    </Box>
                </Box>

                {!disableActions && (
                    <Box
                        className={cn(
                            'absolute top-0 right-4 z-[var(--z-index-effect-md)] -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100',
                            showPicker && 'opacity-100',
                        )}
                    >
                        <MessageActions
                            canDelete={canDelete}
                            canEdit={canEdit}
                            canPin={canPin}
                            message={message}
                            reactRef={reactRef}
                            showPicker={showPicker}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onReplyToMessage={onReplyToMessage}
                            onTogglePicker={handleTogglePicker}
                            onTogglePin={handleTogglePin}
                            onToggleSticky={handleToggleSticky}
                        />

                        <MessageEmojiPicker
                            coords={pickerCoords}
                            customCategories={customCategories}
                            isMobile={isMobile}
                            isOpen={showPicker}
                            pickerRef={pickerRef}
                            onClose={handleClosePicker}
                            onCustomSelect={handleCustomEmojiSelect}
                            onSelect={handleEmojiSelect}
                        />
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
                onMouseLeave={handleClosePicker}
            >
                {disableActions ? (
                    messageContent
                ) : (
                    <ContextMenu
                        className="h-full w-full"
                        items={contextMenuItems}
                        onOpenChange={setIsContextMenuOpen}
                    >
                        {messageContent}
                    </ContextMenu>
                )}

                <ProfilePopup
                    disableColors={isColorsDisabled}
                    disableCustomFonts={isFontsDisabled}
                    disableGlow={isGlowDisabled}
                    disableGlowAndColors={disableGlowAndColors}
                    iconRole={iconRole}
                    isOpen={showProfile}
                    joinedAt={senderMember?.joinedAt}
                    role={role}
                    roles={senderRoles}
                    serverId={message.serverId}
                    triggerRef={avatarRef}
                    user={user}
                    userId={user._id}
                    onClose={handleCloseProfile}
                />
            </Box>
        );
    },
);

Message.displayName = 'Message';
