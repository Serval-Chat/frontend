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
import type { QuickReactionEmoji } from '@/hooks/useFrequentlyUsedEmojis';
import { useFrequentlyUsedEmojis } from '@/hooks/useFrequentlyUsedEmojis';
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

export const Message = React.memo(
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
        retryMessage,
        discardMessage,
    }: MessageProps) => {
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
        const isDeleted = !!message.deletedAt;

        const [showProfile, setShowProfile] = React.useState(false);
        const [showPicker, setShowPicker] = React.useState(false);
        const [isEditing, setIsEditing] = React.useState(false);
        const [, setIsContextMenuOpen] = React.useState(false);
        const [colorResolverReport, setColorResolverReport] = React.useState<
            string | null
        >(null);
        const avatarRef = React.useRef<HTMLDivElement>(null);
        const pickerRef = React.useRef<HTMLDivElement>(null);
        const reactRef = React.useRef<HTMLButtonElement>(null);
        const showColorResolverDebug = useAppSelector(
            (state): boolean =>
                state.debugOptions?.usernameColorResolverContextMenu ?? false,
        );

        const { mutate: addReaction } = useAddReaction();
        const { mutate: deleteMessage } = useDeleteMessage();
        const { mutate: togglePin } = useTogglePin();
        const { mutate: toggleSticky } = useToggleSticky();
        const { data: friends } = useFriends();
        const { mutate: sendFriendRequest } = useSendFriendRequest();
        const { mutate: removeFriend } = useRemoveFriend();
        const { customCategories } = useCustomEmojis({ enabled: showPicker });
        const { quickReactions, frequentlyUsedCategory } =
            useFrequentlyUsedEmojis();
        const pickerCategories = React.useMemo(
            () =>
                frequentlyUsedCategory
                    ? [...customCategories, frequentlyUsedCategory]
                    : customCategories,
            [customCategories, frequentlyUsedCategory],
        );

        const { mutate: addRole } = useAddRoleToMember(message.serverId || '');
        const { mutate: removeRole } = useRemoveRoleFromMember(
            message.serverId || '',
        );

        const isMessageSender = me?.id === message.senderId;
        const { canEdit, canDelete, canPin } = useMessagePermissions(
            message,
            isMessageSender,
            isOwner,
            checkPermission,
        );

        const handleEmojiSelect = React.useCallback(
            (emoji: string): void => {
                addReaction({
                    messageId: message.id,
                    serverId: message.serverId,
                    channelId: message.channelId,
                    data: { emoji, emojiType: 'unicode' },
                });
                setShowPicker(false);
            },
            [addReaction, message.id, message.serverId, message.channelId],
        );

        const handleCustomEmojiSelect = React.useCallback(
            (emoji: { id: string; name: string }): void => {
                addReaction({
                    messageId: message.id,
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
            [addReaction, message.id, message.serverId, message.channelId],
        );

        const handleQuickReact = React.useCallback(
            (emoji: QuickReactionEmoji): void => {
                addReaction({
                    messageId: message.id,
                    serverId: message.serverId,
                    channelId: message.channelId,
                    data:
                        emoji.emojiType === 'custom'
                            ? {
                                  emoji: emoji.name ?? emoji.emoji,
                                  emojiType: 'custom',
                                  emojiId: emoji.emojiId,
                              }
                            : { emoji: emoji.emoji, emojiType: 'unicode' },
                });
            },
            [addReaction, message.id, message.serverId, message.channelId],
        );

        useClickAway(pickerRef, (): void => {
            setShowPicker(false);
        });

        useEvent('editLastMessage', (event: CustomEvent): void => {
            const { messageId } = event.detail;
            if (messageId === message.id && canEdit) {
                setIsEditing(true);
            }
        });

        const handleDelete = React.useCallback((): void => {
            deleteMessage({
                serverId: message.serverId,
                channelId: message.channelId,
                messageId: message.id,
                userId: message.receiverId ?? message.senderId,
            });
        }, [
            message.serverId,
            message.channelId,
            message.id,
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

        const handleAddReactionClick = React.useCallback((): void => {
            setShowPicker(true);
        }, []);

        const handleProfileClick = React.useCallback((): void => {
            setShowProfile(true);
        }, []);

        const handleTogglePin = React.useCallback((): void => {
            if (message.serverId && message.channelId) {
                togglePin({
                    serverId: message.serverId,
                    channelId: message.channelId,
                    messageId: message.id,
                });
            }
        }, [message.serverId, message.channelId, message.id, togglePin]);

        const handleToggleSticky = React.useCallback((): void => {
            if (message.serverId && message.channelId) {
                toggleSticky({
                    serverId: message.serverId,
                    channelId: message.channelId,
                    messageId: message.id,
                });
            }
        }, [message.serverId, message.channelId, message.id, toggleSticky]);

        const handleShowPicker = React.useCallback((): void => {
            setShowPicker(true);
        }, []);

        const handleTogglePicker = React.useCallback((): void => {
            setShowPicker((prev): boolean => !prev);
        }, []);

        const handleClosePicker = React.useCallback((): void => {
            setShowPicker(false);
        }, []);

        const handleCloseProfile = React.useCallback((): void => {
            setShowProfile(false);
        }, []);

        const handleDoubleClick = React.useCallback(
            (event: React.MouseEvent<HTMLElement>): void => {
                if (!onReplyToMessage || disableActions || isDeleted) return;

                const target = event.target;
                if (!(target instanceof Element)) return;

                const interactiveTarget = target.closest(
                    'a, button, input, textarea, select, [role="button"], [contenteditable="true"]',
                );
                if (interactiveTarget) return;

                onReplyToMessage(message);
            },
            [disableActions, isDeleted, message, onReplyToMessage],
        );

        const localNickname = React.useMemo(
            (): string | undefined =>
                friends?.find((f): boolean => f.id === user.id)?.nickname ??
                undefined,
            [friends, user.id],
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
                        localNickname ||
                        user.nickname ||
                        user.displayName ||
                        user.username,
                    user,
                    role: resolvedRole,
                    disableColors: isColorsDisabled,
                    disableGlow: isGlowDisabled,
                    disableGlowAndColors,
                    extraData: {
                        messageId: message.id,
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
            localNickname,
            resolvedRole,
            isColorsDisabled,
            isGlowDisabled,
            disableGlowAndColors,
            message.id,
            message.role,
            role,
            me?.settings,
            serverDetails?.disableUsernameGlowAndCustomColor,
        ]);

        const allServerRoles = React.useMemo(
            (): Role[] | undefined =>
                roleMap ? [...roleMap.values()] : undefined,
            [roleMap],
        );

        const canManageRoles = React.useMemo((): boolean => {
            if (!me || !senderRoles || !serverDetails) return false;
            if (isOwner) return true;

            return (
                checkPermission('administrator') ||
                checkPermission('manageRoles')
            );
        }, [me, senderRoles, serverDetails, isOwner, checkPermission]);

        const myHighestRolePosition = React.useMemo((): number => {
            if (!me || !roleMap || !fullMemberMap) return -1;
            const myMember = fullMemberMap.get(me.id);
            if (!myMember) return -1;

            const myRoles = myMember.roles
                .map((id): Role | undefined => roleMap.get(id))
                .filter((r): r is Role => !!r);

            if (myRoles.length === 0) return -1;
            return Math.max(...myRoles.map((r): number => r.position));
        }, [me, roleMap, fullMemberMap]);

        const contextMenuItems = useMessageContextMenu({
            message,
            user,
            isMessageSender,
            canEdit,
            canDelete,
            canPin,
            canReact: !isDeleted,
            friends,
            onReplyToMessage: isDeleted ? undefined : onReplyToMessage,
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
            onAddRole: (roleId): void => {
                addRole({ userId: message.senderId, roleId });
            },
            onRemoveRole: (roleId): void => {
                removeRole({ userId: message.senderId, roleId });
            },
            onRetryMessage:
                message._pending === 'failed' &&
                message._localId &&
                retryMessage
                    ? (): void => retryMessage(message._localId!)
                    : undefined,
            onDiscardMessage:
                message._pending != null && message._localId && discardMessage
                    ? (): void => discardMessage(message._localId!)
                    : undefined,
        });

        const handleRetry = React.useCallback((): void => {
            if (message._localId && retryMessage) {
                retryMessage(message._localId);
            }
        }, [message._localId, retryMessage]);

        const handleDiscard = React.useCallback((): void => {
            if (message._localId && discardMessage) {
                discardMessage(message._localId);
            }
        }, [message._localId, discardMessage]);

        const isMobile = React.useMemo(
            (): boolean =>
                globalThis.window !== undefined &&
                globalThis.matchMedia('(pointer: coarse)').matches,
            [],
        );

        useClickAway(pickerRef, (): void => {
            if (isMobile) return;
            setShowPicker(false);
        });

        const timeLabel = React.useMemo(
            (): string =>
                new Date(message.createdAt)
                    .toLocaleTimeString(APP_LOCALE, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: !(me?.settings?.use24HourTime ?? false),
                    })
                    .split(' ')[0] ?? '',
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
                {isGroupStart && message.replyTo ? (
                    <ReplyPreview
                        attachments={message.replyTo.attachments}
                        disableColors={isColorsDisabled}
                        disableCustomFonts={isFontsDisabled}
                        disableGlow={isGlowDisabled}
                        disableGlowAndColors={disableGlowAndColors}
                        interaction={message.replyTo.interaction}
                        isWebhook={message.replyTo.isWebhook}
                        replyToId={message.replyTo.id}
                        role={message.replyTo.role}
                        text={message.replyTo.text}
                        user={message.replyTo.user}
                        onClick={onReplyClick}
                    />
                ) : null}

                {isGroupStart &&
                message.interaction?.command?.trim() &&
                message.interaction.user ? (
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
                ) : null}

                <Box className="flex items-start gap-1">
                    <Box
                        className="mt-1 flex w-12 flex-shrink-0 justify-center"
                        ref={avatarRef}
                    >
                        {isGroupStart ? (
                            <UserProfilePicture
                                noIndicator
                                decorationId={user.decorationId}
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
                            localNickname={localNickname}
                            role={resolvedRole}
                            showUsersPronouns={me?.settings?.showUsersPronouns}
                            timestamp={message.createdAt}
                            use24HourTime={me?.settings?.use24HourTime}
                            user={user}
                            onClickName={handleProfileClick}
                        />
                        {isEditing ? (
                            <MessageEdit
                                channelId={message.channelId}
                                initialText={message.text}
                                messageId={message.id}
                                receiverId={message.receiverId}
                                serverId={message.serverId}
                                onCancel={handleCancelEdit}
                            />
                        ) : (
                            <MessageContent
                                attachments={message.attachments}
                                channelId={message.channelId}
                                components={message.components}
                                embeds={message.embeds}
                                invocationId={message.invocationId}
                                isDeleted={!!message.deletedAt}
                                isEdited={message.isEdited && !isGroupStart}
                                isEphemeral={message.isEphemeral}
                                isFailed={message._pending === 'failed'}
                                messageId={message.id}
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
                            isDeleted={isDeleted}
                            messageId={message.id}
                            reactions={message.reactions ?? EMPTY_REACTIONS}
                            serverId={message.serverId}
                            onAddClick={handleAddReactionClick}
                        />
                        {message.isEphemeral ? (
                            <Text className="mt-1 flex items-center gap-1 text-[11px] text-text-muted italic">
                                Only you can see this
                            </Text>
                        ) : null}
                    </Box>
                </Box>

                {disableActions || isDeleted ? null : (
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
                            canReact={!isDeleted}
                            message={message}
                            quickReactions={quickReactions}
                            reactRef={reactRef}
                            showPicker={showPicker}
                            onDelete={handleDelete}
                            onDiscard={handleDiscard}
                            onEdit={handleEdit}
                            onQuickReact={handleQuickReact}
                            onReplyToMessage={
                                isDeleted ? undefined : onReplyToMessage
                            }
                            onRetry={handleRetry}
                            onTogglePicker={handleTogglePicker}
                            onTogglePin={handleTogglePin}
                            onToggleSticky={handleToggleSticky}
                        />

                        <MessageEmojiPicker
                            coords={pickerCoords}
                            customCategories={pickerCategories}
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
                    message._pending === 'sending' && 'opacity-50',
                )}
                id={`message-${message.id}`}
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
                    userId={user.id}
                    onClose={handleCloseProfile}
                />
                <CodeModal
                    content={colorResolverReport ?? ''}
                    isOpen={!!colorResolverReport}
                    language="json"
                    onClose={(): void => {
                        setColorResolverReport(null);
                    }}
                />
            </Box>
        );
    },
);

Message.displayName = 'Message';
