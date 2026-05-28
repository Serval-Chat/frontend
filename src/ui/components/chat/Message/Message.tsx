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
import {
    useAddRoleToMember,
    useRemoveRoleFromMember,
} from '@/api/servers/servers.queries';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { useAppSelector } from '@/store/hooks';
import { InteractionHeader } from '@/ui/components/chat/InteractionHeader';
import { MessageContent } from '@/ui/components/chat/MessageContent';
import { MessageEdit } from '@/ui/components/chat/MessageEdit';
import { MessageHeader } from '@/ui/components/chat/MessageHeader';
import { Reactions } from '@/ui/components/chat/Reactions';
import { ReplyPreview } from '@/ui/components/chat/ReplyPreview';
import { CodeModal } from '@/ui/components/common/CodeModal';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';
import { buildUsernameColorResolverReport } from '@/utils/usernameColorResolver';

import { useMessageData, useMessagePermissions } from './Message.hooks';
import type { MessageProps, Role } from './Message.types';
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
        disableActions: disableActionsProp = false,
        onResize,
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
            hasPermission: checkPermission,
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

        const disableActions = disableActionsProp || message.isEphemeral;

        const [showProfile, setShowProfile] = React.useState(false);
        const [showPicker, setShowPicker] = React.useState(false);
        const [isEditing, setIsEditing] = React.useState(false);
        const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);
        const [colorResolverReport, setColorResolverReport] = React.useState<
            string | null
        >(null);
        const avatarRef = React.useRef<HTMLDivElement>(null);
        const pickerRef = React.useRef<HTMLDivElement>(null);
        const reactRef = React.useRef<HTMLButtonElement>(null);
        const showColorResolverDebug = useAppSelector(
            (state) =>
                state.debugOptions?.usernameColorResolverContextMenu ?? false,
        );

        const { mutate: addReaction } = useAddReaction();
        const { mutate: deleteMessage } = useDeleteMessage();
        const { mutate: togglePin } = useTogglePin();
        const { mutate: toggleSticky } = useToggleSticky();
        const { data: friends } = useFriends({ enabled: isContextMenuOpen });
        const { mutate: sendFriendRequest } = useSendFriendRequest();
        const { mutate: removeFriend } = useRemoveFriend();
        const { customCategories } = useCustomEmojis({ enabled: showPicker });

        const { mutate: addRole } = useAddRoleToMember(message.serverId || '');
        const { mutate: removeRole } = useRemoveRoleFromMember(
            message.serverId || '',
        );

        const isMessageSender = me?._id === message.senderId;
        const { canEdit, canDelete, canPin } = useMessagePermissions(
            message,
            isMessageSender,
            isOwner,
            checkPermission,
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
            deleteMessage({
                serverId: message.serverId,
                channelId: message.channelId,
                messageId: message._id,
                userId: message.receiverId ?? message.senderId,
            });
        }, [
            message.serverId,
            message.channelId,
            message._id,
            message.receiverId,
            message.senderId,
            deleteMessage,
        ]);

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

        const handleDoubleClick = React.useCallback(
            (event: React.MouseEvent<HTMLElement>): void => {
                if (!onReplyToMessage || disableActions) return;

                const target = event.target;
                if (!(target instanceof Element)) return;

                const interactiveTarget = target.closest(
                    'a, button, input, textarea, select, [role="button"], [contenteditable="true"]',
                );
                if (interactiveTarget) return;

                onReplyToMessage(message);
            },
            [disableActions, message, onReplyToMessage],
        );

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
        const resolvedRole = role || message.role;

        const handleShowColorResolverOrder = React.useCallback((): void => {
            setColorResolverReport(
                buildUsernameColorResolverReport({
                    label: 'Message username',
                    renderedName:
                        user.nickname || user.displayName || user.username,
                    user,
                    role: resolvedRole,
                    disableColors: isColorsDisabled,
                    disableGlow: isGlowDisabled,
                    disableGlowAndColors,
                    extraData: {
                        messageId: message._id,
                        messageRole: message.role,
                        propRole: role,
                        currentUserSettings: me?.settings,
                        serverDisableUsernameGlowAndCustomColor:
                            serverDetails?.disableUsernameGlowAndCustomColor,
                    },
                }),
            );
        }, [
            user,
            resolvedRole,
            isColorsDisabled,
            isGlowDisabled,
            disableGlowAndColors,
            message._id,
            message.role,
            role,
            me?.settings,
            serverDetails?.disableUsernameGlowAndCustomColor,
        ]);

        const allServerRoles = React.useMemo(
            () => (roleMap ? Array.from(roleMap.values()) : undefined),
            [roleMap],
        );

        const canManageRoles = React.useMemo(() => {
            if (!me || !senderRoles || !serverDetails) return false;
            if (isOwner) return true;

            return (
                checkPermission('administrator') ||
                checkPermission('manageRoles')
            );
        }, [me, senderRoles, serverDetails, isOwner, checkPermission]);

        const myHighestRolePosition = React.useMemo(() => {
            if (!me || !roleMap || !fullMemberMap) return -1;
            const myMember = fullMemberMap.get(me._id);
            if (!myMember) return -1;

            const myRoles = myMember.roles
                .map((id) => roleMap.get(id))
                .filter((r): r is Role => !!r);

            if (myRoles.length === 0) return -1;
            return Math.max(...myRoles.map((r) => r.position));
        }, [me, roleMap, fullMemberMap]);

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
            showColorResolverDebug,
            onShowColorResolverOrder: handleShowColorResolverOrder,
            allServerRoles,
            userRoles: senderRoles,
            canManageRoles,
            isOwner,
            myHighestRolePosition,
            onAddRole: (roleId) =>
                addRole({ userId: message.senderId, roleId }),
            onRemoveRole: (roleId) =>
                removeRole({ userId: message.senderId, roleId }),
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
                        hour12: !(me?.settings?.use24HourTime ?? false),
                    })
                    .split(' ')[0],
            [message.createdAt, me?.settings?.use24HourTime],
        );
        const pickerCoords = useSmartPosition({
            isOpen: showPicker && !isMobile,
            elementRef: pickerRef,
            triggerRef: reactRef,
            padding: 16,
            offset: 8,
        });

        const messageContent = (
            <>
                {isGroupStart && message.replyTo && (
                    <ReplyPreview
                        attachments={message.replyTo.attachments}
                        disableColors={isColorsDisabled}
                        disableCustomFonts={isFontsDisabled}
                        disableGlow={isGlowDisabled}
                        disableGlowAndColors={disableGlowAndColors}
                        interaction={message.replyTo.interaction}
                        isWebhook={message.replyTo.isWebhook}
                        replyToId={message.replyTo._id}
                        role={message.replyTo.role}
                        text={message.replyTo.text}
                        user={message.replyTo.user}
                        onClick={onReplyClick}
                    />
                )}

                {isGroupStart &&
                    message.interaction?.command?.trim() &&
                    message.interaction.user && (
                        <InteractionHeader
                            command={message.interaction.command}
                            disableColors={isColorsDisabled}
                            disableCustomFonts={isFontsDisabled}
                            disableGlow={isGlowDisabled}
                            disableGlowAndColors={disableGlowAndColors}
                            isDeleted={!!message.deletedAt}
                            options={message.interaction.options}
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
                            role={resolvedRole}
                            timestamp={message.createdAt}
                            use24HourTime={me?.settings?.use24HourTime}
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
                                senderId={message.senderId}
                                senderMember={senderMember}
                                senderRoles={senderRoles}
                                serverDetails={serverDetails}
                                serverId={message.serverId}
                                stickerId={message.stickerId}
                                text={message.text}
                                onResize={onResize}
                            />
                        )}
                        <Reactions
                            channelId={message.channelId}
                            messageId={message._id}
                            reactions={message.reactions ?? EMPTY_REACTIONS}
                            serverId={message.serverId}
                            onAddClick={handleAddReactionClick}
                        />
                        {message.isEphemeral && (
                            <Text className="mt-1 flex items-center gap-1 text-[11px] text-text-muted italic">
                                Only you can see this
                            </Text>
                        )}
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
                    message.isEphemeral && 'bg-[var(--primary-muted)]/30',
                    isHighlighted &&
                        'border-l-2 border-[var(--primary)] bg-[var(--primary-muted)]',
                    mentionsMe && 'border-l-2 border-[var(--caution)]',
                )}
                id={`message-${message._id}`}
                onDoubleClick={handleDoubleClick}
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
                <CodeModal
                    content={colorResolverReport ?? ''}
                    isOpen={!!colorResolverReport}
                    language="json"
                    onClose={() => setColorResolverReport(null)}
                />
            </Box>
        );
    },
);

Message.displayName = 'Message';
