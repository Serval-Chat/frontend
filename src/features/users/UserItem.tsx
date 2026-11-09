import React, { type ReactNode, useCallback, useMemo } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import {
    Copy,
    Flag,
    HeadphoneOff,
    ListTree,
    MicOff,
    Pin,
    User as UserIcon,
} from 'lucide-react';
import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
    useBlockProfiles,
    useBlocks,
    useCreateBlockProfile,
    useRemoveBlock,
    useUpsertBlock,
} from '@/api/blocks/blocks.queries';
import {
    useFriends,
    useRemoveFriend,
    useSendFriendRequest,
    useTogglePinFriend,
} from '@/api/friends/friends.queries';
import {
    useAddRoleToMember,
    useMemberByUserId,
    useRemoveRoleFromMember,
    useServers,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { CodeModal } from '@/features/messages/CodeModal';
import { ParsedEmoji } from '@/features/messages/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/features/messages/ParsedUnicodeEmoji';
import { ReportModal } from '@/features/moderation/ReportModal';
import { InviteToServerModal } from '@/features/servers/InviteToServerModal';
import { BanUserModal } from '@/features/servers/modals/BanUserModal';
import { KickUserModal } from '@/features/servers/modals/KickUserModal';
import { TimeoutUserModal } from '@/features/servers/modals/TimeoutUserModal';
import { ProfilePopup } from '@/features/users/profile/ProfilePopup';
import { BlockUserModal } from '@/features/users/profile/modals/BlockUserModal';
import { NicknameModal } from '@/features/users/profile/modals/NicknameModal';
import { useSelfStatus } from '@/hooks/useSelfStatus';
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type {
    UserPresenceMode,
    UserPresenceStatus,
} from '@/store/slices/presenceSlice';
import { Box } from '@/ui/primitives/Box';
import { ContextMenu, type ContextMenuItem } from '@/ui/primitives/ContextMenu';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';
import { resolveDisplayName } from '@/utils/displayName';
import { buildUsernameColorResolverReport } from '@/utils/usernameColorResolver';
import { isCustomEmojiId } from '@/utils/validation';

import { BotTag } from './BotTag';
import { StyledUserName } from './StyledUserName';
import {
    ServerDataInjector,
    UserItemViewportProvider,
} from './UserItemServerDataProvider';
import { UserProfilePicture } from './UserProfilePicture';
import type { UserStatus } from './UserProfileStatusIndicator';
import { useMemberModeration } from './useMemberModeration';
import type { ServerData } from './userItemContext';
import { ServerDataContext, UserItemViewportContext } from './userItemContext';
import {
    buildDmItems,
    buildModerationItems,
    buildRelationshipItems,
    buildRolesSubmenu,
    buildVolumeItems,
} from './userItemMenu';

interface UserItemProps {
    userId: string;
    serverId?: string;
    user?: User;

    initialData?: {
        username: string;
        displayName?: string | null;
        profilePicture?: string | null;
        customStatus?: { text?: string; emoji?: string } | null;
    };
    nickname?: string;
    isActive?: boolean;
    onClick?: (userId: string) => void;
    className?: string;
    noFetch?: boolean;
    role?: Role; // Highest role for display
    iconRole?: Role; // Highest role with icon
    allRoles?: Role[]; // User's roles
    serverRoles?: Role[]; // All available roles in server
    joinedAt?: string;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    initialPresenceStatus?: UserStatus;
    hideUnread?: boolean;
    showPinIcon?: boolean;
}

/**
 * @description Renders a user item with avatar, styled username, and custom status.
 */
const UserItemInner = React.memo(
    ({
        serverData,
        userId,
        serverId: providedServerId,
        user: providedUser,
        initialData,

        isActive,
        onClick,
        className,
        noFetch,
        role,
        iconRole,
        allRoles,
        serverRoles,
        joinedAt,
        nickname,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
        initialPresenceStatus,
        hideUnread,
        showPinIcon,
        isMobile,
    }: UserItemProps & {
        serverData: ServerData | null;
        isMobile: boolean;
    }): ReactNode => {
        const dispatch = useAppDispatch();
        const navigate = useNavigate();

        const serverId =
            providedServerId ||
            role?.serverId ||
            serverRoles?.[0]?.serverId ||
            '';
        const sid = serverId || null;

        const { mutate: addRole, isPending: isAdding } = useAddRoleToMember(
            sid ?? '',
        );
        const { mutate: removeRole, isPending: isRemoving } =
            useRemoveRoleFromMember(sid ?? '');

        const noopMutate = useCallback((..._args: unknown[]): void => {}, []);
        const {
            kickMember = noopMutate,
            banMember = noopMutate,
            timeoutMember = noopMutate,
            serverDetails,
            currentUserMember,
        } = serverData || {};

        const { data: currentUser } = useMe();
        const { data: targetMember } = useMemberByUserId(sid, userId, {
            enabled: !!sid,
        });
        const { status: selfStatus } = useSelfStatus();

        const [isKickModalOpen, setIsKickModalOpen] = React.useState(false);
        const [isBanModalOpen, setIsBanModalOpen] = React.useState(false);
        const [isTimeoutModalOpen, setIsTimeoutModalOpen] =
            React.useState(false);
        const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);
        const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
        const [isInviteToServerModalOpen, setIsInviteToServerModalOpen] =
            React.useState(false);
        const [isNicknameModalOpen, setIsNicknameModalOpen] =
            React.useState(false);
        const [colorResolverReport, setColorResolverReport] = React.useState<
            string | null
        >(null);
        const { data: fetchedUser } = useUserById(userId, {
            enabled: !noFetch && !providedUser,
        });
        const userProfile = providedUser || fetchedUser;
        const { data: friends } = useFriends();
        const { data: servers } = useServers();
        const canInviteToAnyServer = useMemo(
            (): boolean =>
                servers?.some((s): boolean => !!s.canInvite) ?? false,
            [servers],
        );

        const { mutate: sendFriendRequest } = useSendFriendRequest();
        const { mutate: removeFriend } = useRemoveFriend();
        const { mutate: togglePinFriend } = useTogglePinFriend();

        const { data: blocks } = useBlocks();
        const { data: blockProfiles } = useBlockProfiles();
        const { mutate: upsertBlock } = useUpsertBlock();
        const { mutate: removeBlock } = useRemoveBlock();
        const { mutateAsync: createProfile } = useCreateBlockProfile();

        const [showProfile, setShowProfile] = React.useState(false);
        const itemRef = React.useRef<HTMLDivElement>(null);

        const localNickname = useMemo(
            (): string | undefined =>
                friends?.find((f): boolean => f.id === userId)?.nickname ??
                undefined,
            [friends, userId],
        );

        const {
            username,
            displayName,
            profilePicture,
            customStatus,
            decorationId,
        } = useMemo(
            () => ({
                username: userProfile?.username || initialData?.username || '',
                displayName: resolveDisplayName(
                    localNickname,
                    nickname,
                    userProfile?.nickname,
                    userProfile?.displayName,
                    initialData?.displayName,
                ),
                profilePicture:
                    userProfile?.profilePicture ||
                    initialData?.profilePicture ||
                    null,
                decorationId: userProfile?.decorationId || null,
                customStatus:
                    userProfile?.customStatus || initialData?.customStatus,
            }),
            [initialData, localNickname, nickname, userProfile],
        );

        const isFriend = useMemo(
            (): boolean =>
                friends?.some((f): boolean => f.id === userId) ?? false,
            [friends, userId],
        );
        const isPinnedFriend = useMemo(
            (): boolean =>
                friends?.find((f): boolean => f.id === userId)?.isPinned ??
                false,
            [friends, userId],
        );
        const isMe = currentUser?.id === userId;

        const activeVoiceChannelId = useAppSelector(
            (state): string | null => state.voice.activeVoiceChannelId,
        );
        const userVoiceChannelId = useAppSelector(
            useMemo(
                (): ((state: RootState) => string | undefined) =>
                    createSelector(
                        (state: RootState): Record<string, string[]> =>
                            state.voice.voiceParticipants,
                        (vp): string | undefined => {
                            const userToChannel = new Map<string, string>();
                            for (const [cid, userIds] of Object.entries(vp)) {
                                if (userIds) {
                                    for (const uid of userIds) {
                                        userToChannel.set(uid, cid);
                                    }
                                }
                            }
                            return userToChannel.get(userId);
                        },
                    ),
                [userId],
            ),
        );
        const userVolume = useAppSelector(
            (state): number | undefined => state.voice.userVolumes[userId],
        );
        const userVoiceState = useAppSelector(
            (state): { isMuted: boolean; isDeafened: boolean } | undefined =>
                state.voice.voiceUserStates[userId],
            shallowEqual,
        );
        const unreadCount = useAppSelector(
            (state): number => state.unread.unreadDms[userId] || 0,
        );
        const storePresenceStatus = useAppSelector(
            (state): UserPresenceStatus | undefined =>
                state.presence.users[userId]?.status,
        );
        const storePresenceMode = useAppSelector(
            (state): UserPresenceMode | undefined =>
                state.presence.users[userId]?.presenceStatus,
        );
        const storePresenceCustomText = useAppSelector(
            (state): string | undefined =>
                state.presence.users[userId]?.customStatus?.text,
        );
        const storePresenceCustomEmoji = useAppSelector(
            (state): string | null | undefined =>
                state.presence.users[userId]?.customStatus?.emoji,
        );
        const showColorResolverDebug = useAppSelector(
            (state): boolean =>
                state.debugOptions?.usernameColorResolverContextMenu ?? false,
        );

        const isInSameVoiceChannel = Boolean(
            activeVoiceChannelId &&
            userVoiceChannelId === activeVoiceChannelId &&
            !isMe,
        );
        const hasUnread =
            unreadCount > 0 && !hideUnread && !providedServerId && !isActive;

        const {
            isOwner,
            myHighestRole,
            canManageRoles,
            canKick,
            canBan,
            canTimeout,
            isHigherHierarchy,
        } = useMemberModeration({
            serverRoles,
            myMember: currentUserMember,
            targetMember,
            ownerId: serverDetails?.ownerId,
            currentUserId: currentUser?.id,
        });

        const contextMenuItems = useMemo((): ContextMenuItem[] => {
            const items: ContextMenuItem[] = [];
            const resolvedDisableColors =
                disableColors ||
                currentUser?.settings?.disableCustomUsernameColors ||
                serverDetails?.disableUsernameGlowAndCustomColor;
            const resolvedDisableGlow =
                disableGlow ||
                currentUser?.settings?.disableCustomUsernameGlow ||
                serverDetails?.disableUsernameGlowAndCustomColor;

            // Group 0: Profile
            items.push({
                label: 'Show Profile',
                icon: UserIcon,
                onClick: (): void => {
                    setShowProfile(true);
                },
            });

            if (!isMe && !userProfile?.isBot) {
                items.push({
                    label: 'Report User',
                    icon: Flag,
                    variant: 'danger',
                    onClick: (): void => setIsReportModalOpen(true),
                });
            }

            if (isFriend) {
                items.push(
                    ...buildDmItems({
                        userId,
                        isMobile,
                        isPinnedFriend,
                        hasNickname: Boolean(localNickname),
                        hasUnread,
                        canInviteToAnyServer,
                        dispatch,
                        navigate,
                        togglePinFriend,
                        openInviteToServer: (): void => {
                            setIsInviteToServerModalOpen(true);
                        },
                        openNickname: (): void => {
                            setIsNicknameModalOpen(true);
                        },
                    }),
                );
            }

            if (isInSameVoiceChannel) {
                items.push(
                    ...buildVolumeItems({ userId, userVolume, dispatch }),
                );
            }

            if (!isMe) {
                items.push(
                    ...buildRelationshipItems({
                        isFriend,
                        isBot: userProfile?.isBot,
                        isBlocked: blocks?.some(
                            (b): boolean => b.targetUserId === userId,
                        ),
                        removeFriend: (): void => {
                            removeFriend(userId);
                        },
                        addFriend: (): void => {
                            sendFriendRequest(username);
                        },
                        unblock: (): void => {
                            removeBlock(userId);
                        },
                        block: (): void => {
                            void (async (): Promise<void> => {
                                const profiles = blockProfiles || [];
                                if (profiles.length === 0) {
                                    try {
                                        const profileToAssign =
                                            await createProfile({
                                                name: 'Default',
                                                flags: 4095,
                                            });
                                        if (profileToAssign) {
                                            upsertBlock({
                                                targetUserId: userId,
                                                profileId: profileToAssign.id,
                                            });
                                        }
                                    } catch {
                                        // Ignore
                                    }
                                } else if (
                                    profiles.length === 1 &&
                                    profiles[0]
                                ) {
                                    upsertBlock({
                                        targetUserId: userId,
                                        profileId: profiles[0].id,
                                    });
                                } else {
                                    setIsBlockModalOpen(true);
                                }
                            })();
                        },
                    }),
                );
            }

            if (serverRoles && sid && canManageRoles) {
                items.push(
                    { type: 'divider' },
                    buildRolesSubmenu({
                        userId,
                        serverRoles,
                        memberRoles: allRoles,
                        isOwner,
                        myHighestRole,
                        isBusy: isAdding || isRemoving,
                        addRole,
                        removeRole,
                    }),
                );
            }

            items.push({ type: 'divider' });

            if (showColorResolverDebug) {
                items.push({
                    label: 'Show color resolver order',
                    icon: ListTree,
                    onClick: (): void => {
                        setColorResolverReport(
                            buildUsernameColorResolverReport({
                                label: 'User item username',
                                renderedName: resolveDisplayName(
                                    displayName,
                                    username,
                                ),
                                user: userProfile,
                                role,
                                disableColors: resolvedDisableColors,
                                disableGlow: resolvedDisableGlow,
                                disableGlowAndColors,
                                extraData: {
                                    userId,
                                    initialData,
                                    allRoles,
                                    iconRole,
                                    currentUserSettings: currentUser?.settings,
                                    serverDisableUsernameGlowAndCustomColor:
                                        serverDetails?.disableUsernameGlowAndCustomColor,
                                },
                            }),
                        );
                    },
                });
            }

            if (
                !isMe &&
                sid &&
                (canKick || canBan || canTimeout) &&
                isHigherHierarchy
            ) {
                items.push(
                    ...buildModerationItems({
                        canTimeout,
                        canKick,
                        canBan,
                        openTimeout: (): void => {
                            setIsTimeoutModalOpen(true);
                        },
                        openKick: (): void => {
                            setIsKickModalOpen(true);
                        },
                        openBan: (): void => {
                            setIsBanModalOpen(true);
                        },
                    }),
                );
            }

            items.push({
                label: 'Copy User ID',
                icon: Copy,
                onClick: (): void => {
                    void navigator.clipboard.writeText(userId);
                },
            });

            return items;
        }, [
            setShowProfile,
            isFriend,
            canInviteToAnyServer,
            isPinnedFriend,
            togglePinFriend,
            isMobile,
            dispatch,
            navigate,
            userId,
            hasUnread,
            isInSameVoiceChannel,
            userVolume,
            isMe,
            removeFriend,
            sendFriendRequest,
            username,
            blocks,
            blockProfiles,
            createProfile,
            upsertBlock,
            removeBlock,
            setIsBlockModalOpen,
            setIsReportModalOpen,
            setIsInviteToServerModalOpen,
            localNickname,
            setIsNicknameModalOpen,
            serverRoles,
            sid,
            canManageRoles,
            allRoles,
            isOwner,
            myHighestRole,
            isAdding,
            isRemoving,
            removeRole,
            addRole,
            canKick,
            canBan,
            canTimeout,
            isHigherHierarchy,
            setIsTimeoutModalOpen,
            setIsKickModalOpen,
            setIsBanModalOpen,
            showColorResolverDebug,
            disableColors,
            currentUser?.settings,
            serverDetails?.disableUsernameGlowAndCustomColor,
            disableGlow,
            displayName,
            userProfile,
            role,
            disableGlowAndColors,
            initialData,
            iconRole,
        ]);

        const presenceStatus = isMe
            ? selfStatus
            : storePresenceStatus === 'online'
              ? (storePresenceMode ?? 'online')
              : (storePresenceStatus ?? initialPresenceStatus ?? 'offline');
        const presenceCustomText =
            storePresenceCustomText ?? customStatus?.text;
        const presenceCustomEmoji =
            storePresenceCustomEmoji ?? customStatus?.emoji;

        const handleItemClick = useCallback((): void => {
            if (onClick) {
                onClick(userId);
            } else {
                setShowProfile(true);
            }
        }, [onClick, userId]);

        const handleAvatarClick = useCallback((e: React.MouseEvent): void => {
            e.stopPropagation();
            setShowProfile(true);
        }, []);

        return (
            <>
                <ContextMenu items={contextMenuItems}>
                    <Box
                        className={cn(
                            'flex h-11 w-full shrink-0 cursor-pointer items-center gap-3 overflow-hidden rounded-md px-3 transition-colors',
                            'hover:bg-bg-subtle',
                            isActive
                                ? 'bg-bg-subtle text-foreground'
                                : hasUnread
                                  ? 'bg-bg-subtle/40 font-medium text-foreground'
                                  : 'text-muted-foreground',
                            className,
                        )}
                        ref={itemRef}
                        onClick={handleItemClick}
                    >
                        <UserProfilePicture
                            decorationId={decorationId}
                            size="sm"
                            src={profilePicture}
                            status={presenceStatus}
                            username={
                                resolveDisplayName(displayName, username) ??
                                username
                            }
                            onClick={handleAvatarClick}
                        />

                        <Box className="flex min-w-0 flex-1 flex-col overflow-hidden">
                            <Box className="flex min-w-0 items-center gap-1.5">
                                <StyledUserName
                                    disableColors={
                                        disableColors ||
                                        currentUser?.settings
                                            ?.disableCustomUsernameColors ||
                                        serverDetails?.disableUsernameGlowAndCustomColor
                                    }
                                    disableCustomFonts={
                                        disableCustomFonts ||
                                        currentUser?.settings
                                            ?.disableCustomUsernameFonts ||
                                        serverDetails?.disableCustomFonts
                                    }
                                    disableGlow={
                                        disableGlow ||
                                        currentUser?.settings
                                            ?.disableCustomUsernameGlow ||
                                        serverDetails?.disableUsernameGlowAndCustomColor
                                    }
                                    disableGlowAndColors={disableGlowAndColors}
                                    iconRole={iconRole}
                                    role={role}
                                    user={userProfile}
                                >
                                    {resolveDisplayName(displayName, username)}
                                </StyledUserName>
                                {userProfile?.isBot ? (
                                    <BotTag
                                        className="h-4"
                                        verified={userProfile.botVerified}
                                    />
                                ) : null}
                            </Box>

                            {presenceCustomText || presenceCustomEmoji ? (
                                <div className="flex min-w-0 items-center gap-1">
                                    {presenceCustomEmoji ? (
                                        <Text className="flex shrink-0 items-center">
                                            {isCustomEmojiId(
                                                presenceCustomEmoji,
                                            ) ? (
                                                <ParsedEmoji
                                                    nonInteractive
                                                    className="h-3.5 w-3.5"
                                                    emojiId={
                                                        presenceCustomEmoji
                                                    }
                                                />
                                            ) : (
                                                <ParsedUnicodeEmoji
                                                    className="text-xs"
                                                    content={
                                                        presenceCustomEmoji
                                                    }
                                                />
                                            )}
                                        </Text>
                                    ) : null}
                                    {presenceCustomText ? (
                                        <Text
                                            className="min-w-0 flex-1 truncate"
                                            size="xs"
                                            variant="muted"
                                        >
                                            {presenceCustomText}
                                        </Text>
                                    ) : null}
                                </div>
                            ) : null}
                        </Box>

                        <Box className="ml-auto flex shrink-0 items-center gap-1.5">
                            {showPinIcon && isPinnedFriend ? (
                                <Pin className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : null}

                            {hasUnread && !userVoiceChannelId ? (
                                <Box className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm">
                                    {unreadCount}
                                </Box>
                            ) : null}

                            {userVoiceChannelId ? (
                                <>
                                    {userVoiceState?.isMuted ? (
                                        <MicOff
                                            className="text-danger"
                                            size={14}
                                        />
                                    ) : null}
                                    {userVoiceState?.isDeafened ? (
                                        <HeadphoneOff
                                            className="text-danger"
                                            size={14}
                                        />
                                    ) : null}
                                </>
                            ) : null}
                        </Box>
                    </Box>
                </ContextMenu>
                <ProfilePopup
                    disableColors={
                        disableColors ||
                        currentUser?.settings?.disableCustomUsernameColors ||
                        serverDetails?.disableUsernameGlowAndCustomColor
                    }
                    disableCustomFonts={
                        disableCustomFonts ||
                        currentUser?.settings?.disableCustomUsernameFonts ||
                        serverDetails?.disableCustomFonts
                    }
                    disableGlow={
                        disableGlow ||
                        currentUser?.settings?.disableCustomUsernameGlow ||
                        serverDetails?.disableUsernameGlowAndCustomColor
                    }
                    disableGlowAndColors={disableGlowAndColors}
                    iconRole={iconRole}
                    isOpen={showProfile}
                    joinedAt={joinedAt}
                    role={role}
                    roles={allRoles}
                    serverId={serverId}
                    triggerRef={itemRef}
                    user={userProfile || undefined}
                    userId={userId}
                    onClose={(): void => {
                        setShowProfile(false);
                    }}
                />
                {isReportModalOpen ? (
                    <ReportModal
                        isOpen
                        targetId={userId}
                        targetType="user"
                        onClose={(): void => setIsReportModalOpen(false)}
                    />
                ) : null}
                {isKickModalOpen ? (
                    <KickUserModal
                        isOpen={isKickModalOpen}
                        userAvatar={userProfile?.profilePicture}
                        username={username}
                        onClose={(): void => {
                            setIsKickModalOpen(false);
                        }}
                        onConfirm={(): void => {
                            kickMember(userId);
                        }}
                    />
                ) : null}

                {isBanModalOpen ? (
                    <BanUserModal
                        isOpen={isBanModalOpen}
                        userAvatar={userProfile?.profilePicture}
                        username={username}
                        onClose={(): void => {
                            setIsBanModalOpen(false);
                        }}
                        onConfirm={(reason, deleteMessageDuration): void => {
                            banMember({
                                userId,
                                reason,
                                deleteMessageDuration,
                            });
                        }}
                    />
                ) : null}

                {isBlockModalOpen ? (
                    <BlockUserModal
                        isOpen={isBlockModalOpen}
                        profiles={blockProfiles || []}
                        userAvatar={userProfile?.profilePicture}
                        username={username}
                        onClose={(): void => {
                            setIsBlockModalOpen(false);
                        }}
                        onConfirm={(profileId): void => {
                            upsertBlock({ targetUserId: userId, profileId });
                        }}
                    />
                ) : null}

                {isTimeoutModalOpen ? (
                    <TimeoutUserModal
                        isOpen={isTimeoutModalOpen}
                        userAvatar={userProfile?.profilePicture}
                        username={username}
                        onClose={(): void => {
                            setIsTimeoutModalOpen(false);
                        }}
                        onConfirm={(duration, reason): void => {
                            timeoutMember({ userId, duration, reason });
                        }}
                    />
                ) : null}
                {colorResolverReport ? (
                    <CodeModal
                        isOpen
                        content={colorResolverReport}
                        language="json"
                        onClose={(): void => {
                            setColorResolverReport(null);
                        }}
                    />
                ) : null}

                {isInviteToServerModalOpen ? (
                    <InviteToServerModal
                        isOpen={isInviteToServerModalOpen}
                        userId={userId}
                        username={
                            resolveDisplayName(displayName, username) ??
                            username
                        }
                        onClose={(): void => {
                            setIsInviteToServerModalOpen(false);
                        }}
                    />
                ) : null}

                {isNicknameModalOpen ? (
                    <NicknameModal
                        currentNickname={localNickname}
                        friendId={userId}
                        friendUsername={username}
                        isOpen={isNicknameModalOpen}
                        onClose={(): void => {
                            setIsNicknameModalOpen(false);
                        }}
                    />
                ) : null}
            </>
        );
    },
);

UserItemInner.displayName = 'UserItemInner';

const UserItemWithViewport = React.memo(
    (props: UserItemProps & { isMobile: boolean }): ReactNode => {
        const sharedServerData = React.useContext(ServerDataContext);
        const isServerContext = !!props.serverId;
        const serverId =
            props.serverId ||
            props.role?.serverId ||
            props.serverRoles?.[0]?.serverId ||
            '';
        const sid = serverId || null;

        if (isServerContext && sid) {
            if (sharedServerData?.serverId === sid) {
                return (
                    <UserItemInner
                        allRoles={props.allRoles}
                        className={props.className}
                        disableColors={props.disableColors}
                        disableCustomFonts={props.disableCustomFonts}
                        disableGlow={props.disableGlow}
                        disableGlowAndColors={props.disableGlowAndColors}
                        hideUnread={props.hideUnread}
                        iconRole={props.iconRole}
                        initialData={props.initialData}
                        initialPresenceStatus={props.initialPresenceStatus}
                        isActive={props.isActive}
                        isMobile={props.isMobile}
                        joinedAt={props.joinedAt}
                        nickname={props.nickname}
                        noFetch={props.noFetch}
                        role={props.role}
                        serverData={sharedServerData.data}
                        serverId={props.serverId}
                        serverRoles={props.serverRoles}
                        showPinIcon={props.showPinIcon}
                        user={props.user}
                        userId={props.userId}
                        onClick={props.onClick}
                    />
                );
            }

            return (
                <ServerDataInjector serverId={sid}>
                    {(serverData): ReactNode => (
                        <UserItemInner
                            allRoles={props.allRoles}
                            className={props.className}
                            disableColors={props.disableColors}
                            disableCustomFonts={props.disableCustomFonts}
                            disableGlow={props.disableGlow}
                            disableGlowAndColors={props.disableGlowAndColors}
                            hideUnread={props.hideUnread}
                            iconRole={props.iconRole}
                            initialData={props.initialData}
                            initialPresenceStatus={props.initialPresenceStatus}
                            isActive={props.isActive}
                            isMobile={props.isMobile}
                            joinedAt={props.joinedAt}
                            nickname={props.nickname}
                            noFetch={props.noFetch}
                            role={props.role}
                            serverData={serverData}
                            serverId={props.serverId}
                            serverRoles={props.serverRoles}
                            showPinIcon={props.showPinIcon}
                            user={props.user}
                            userId={props.userId}
                            onClick={props.onClick}
                        />
                    )}
                </ServerDataInjector>
            );
        }

        return (
            <UserItemInner
                allRoles={props.allRoles}
                className={props.className}
                disableColors={props.disableColors}
                disableCustomFonts={props.disableCustomFonts}
                disableGlow={props.disableGlow}
                disableGlowAndColors={props.disableGlowAndColors}
                hideUnread={props.hideUnread}
                iconRole={props.iconRole}
                initialData={props.initialData}
                initialPresenceStatus={props.initialPresenceStatus}
                isActive={props.isActive}
                isMobile={props.isMobile}
                joinedAt={props.joinedAt}
                nickname={props.nickname}
                noFetch={props.noFetch}
                role={props.role}
                serverData={null}
                serverId={props.serverId}
                serverRoles={props.serverRoles}
                showPinIcon={props.showPinIcon}
                user={props.user}
                userId={props.userId}
                onClick={props.onClick}
            />
        );
    },
);
UserItemWithViewport.displayName = 'UserItemWithViewport';

const UserItemWithViewportContext = ({
    props,
}: {
    props: UserItemProps;
}): ReactNode => {
    const isMobile = React.useContext(UserItemViewportContext);
    if (isMobile === null) return null;
    return React.createElement(UserItemWithViewport, {
        ...props,
        isMobile,
    });
};

export const UserItem = React.memo((props: UserItemProps): ReactNode => {
    const isMobile = React.useContext(UserItemViewportContext);
    if (isMobile !== null) {
        return React.createElement(UserItemWithViewport, {
            ...props,
            isMobile,
        });
    }

    return (
        <UserItemViewportProvider>
            <UserItemWithViewportContext props={props} />
        </UserItemViewportProvider>
    );
});

UserItem.displayName = 'UserItem';
