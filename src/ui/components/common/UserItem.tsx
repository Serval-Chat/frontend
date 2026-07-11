import React, { type ReactNode, useCallback, useMemo } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import {
    Ban,
    Check,
    Copy,
    HeadphoneOff,
    ListTree,
    MessageSquare,
    MicOff,
    PanelBottomOpen,
    PanelLeftOpen,
    PanelRightOpen,
    PanelTopOpen,
    PanelsLeftRight,
    Pin,
    PinOff,
    Shield,
    Tag,
    User as UserIcon,
    UserMinus,
    UserPlus,
    UserX,
    Volume2,
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
    useBanMember,
    useKickMember,
    useMembers,
    useRemoveRoleFromMember,
    useServerDetails,
    useServers,
    useTimeoutMember,
} from '@/api/servers/servers.queries';
import type { Role, ServerMember } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import type { RootState } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSplitViewPane } from '@/store/slices/navSlice';
import type { UserPresenceStatus } from '@/store/slices/presenceSlice';
import { setUserVolume } from '@/store/slices/voiceSlice';
import { Box } from '@/ui/components/layout/Box';
import { isCustomEmojiId } from '@/utils/validation';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { BlockUserModal } from '@/ui/components/profile/modals/BlockUserModal';
import { NicknameModal } from '@/ui/components/profile/modals/NicknameModal';
import { InviteToServerModal } from '@/ui/components/servers/InviteToServerModal';
import { BanUserModal } from '@/ui/components/servers/modals/BanUserModal';
import { KickUserModal } from '@/ui/components/servers/modals/KickUserModal';
import { TimeoutUserModal } from '@/ui/components/servers/modals/TimeoutUserModal';
import { cn } from '@/utils/cn';
import { resolveDisplayName } from '@/utils/displayName';
import { buildUsernameColorResolverReport } from '@/utils/usernameColorResolver';
import { wsMessages } from '@/ws/messages';

import { BotTag } from './BotTag';
import { CodeModal } from './CodeModal';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { MarqueeText } from './MarqueeText';
import { ParsedEmoji } from './ParsedEmoji';
import { ParsedUnicodeEmoji } from './ParsedUnicodeEmoji';
import { RoleDot } from './RoleDot';
import { StyledUserName } from './StyledUserName';
import { UserProfilePicture } from './UserProfilePicture';
import type { UserStatus } from './UserProfileStatusIndicator';

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
    onClick?: () => void;
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

interface ServerData {
    addRole: ReturnType<typeof useAddRoleToMember>['mutate'];
    isAdding: boolean;
    removeRole: ReturnType<typeof useRemoveRoleFromMember>['mutate'];
    isRemoving: boolean;
    kickMember: ReturnType<typeof useKickMember>['mutate'];
    banMember: ReturnType<typeof useBanMember>['mutate'];
    timeoutMember: ReturnType<typeof useTimeoutMember>['mutate'];
    serverDetails: ReturnType<typeof useServerDetails>['data'];
    members: ReturnType<typeof useMembers>['data'];
}

const ServerDataInjector = React.memo(
    ({
        serverId,
        children,
    }: {
        serverId: string;
        children: (data: ServerData) => React.ReactNode;
    }): ReactNode => {
        const { mutate: addRole, isPending: isAdding } =
            useAddRoleToMember(serverId);
        const { mutate: removeRole, isPending: isRemoving } =
            useRemoveRoleFromMember(serverId);
        const { mutate: kickMember } = useKickMember(serverId);
        const { mutate: banMember } = useBanMember(serverId);
        const { mutate: timeoutMember } = useTimeoutMember(serverId);
        const { data: serverDetails } = useServerDetails(serverId, {
            enabled: true,
        });
        const { data: members } = useMembers(serverId, { enabled: true });

        const data = useMemo(
            () => ({
                addRole,
                isAdding,
                removeRole,
                isRemoving,
                kickMember,
                banMember,
                timeoutMember,
                serverDetails,
                members,
            }),
            [
                addRole,
                isAdding,
                removeRole,
                isRemoving,
                kickMember,
                banMember,
                timeoutMember,
                serverDetails,
                members,
            ],
        );

        return <>{children(data)}</>;
    },
);

ServerDataInjector.displayName = 'ServerDataInjector';

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
    }: UserItemProps & { serverData: ServerData | null }): ReactNode => {
        const dispatch = useAppDispatch();
        const navigate = useNavigate();

        const serverId =
            providedServerId ||
            role?.serverId ||
            serverRoles?.[0]?.serverId ||
            '';
        const sid = serverId || null;

        const noopMutate = useCallback((..._args: unknown[]): void => {}, []);
        const {
            addRole = noopMutate,
            isAdding = false,
            removeRole = noopMutate,
            isRemoving = false,
            kickMember = noopMutate,
            banMember = noopMutate,
            timeoutMember = noopMutate,
            serverDetails,
            members,
        } = serverData || {};

        const { data: currentUser } = useMe();

        const [isKickModalOpen, setIsKickModalOpen] = React.useState(false);
        const [isBanModalOpen, setIsBanModalOpen] = React.useState(false);
        const [isTimeoutModalOpen, setIsTimeoutModalOpen] =
            React.useState(false);
        const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);
        const [isInviteToServerModalOpen, setIsInviteToServerModalOpen] =
            React.useState(false);
        const [isNicknameModalOpen, setIsNicknameModalOpen] =
            React.useState(false);
        const [colorResolverReport, setColorResolverReport] = React.useState<
            string | null
        >(null);
        const [isMobile, setIsMobile] = React.useState(
            (): boolean => window.innerWidth < 768,
        );

        React.useEffect((): (() => void) => {
            const handleResize = (): void => {
                setIsMobile(window.innerWidth < 768);
            };
            window.addEventListener('resize', handleResize);
            return (): void => {
                window.removeEventListener('resize', handleResize);
            };
        }, []);

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
            (
                state,
            ): { isMuted: boolean; isDeafened: boolean } | undefined =>
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

        const myMember = useMemo(
            (): ServerMember | undefined =>
                members?.find((m): boolean => m.userId === currentUser?.id),
            [members, currentUser?.id],
        );
        const myRoles = useMemo(
            (): Role[] | undefined =>
                serverRoles?.filter(
                    (r) =>
                        myMember?.roles.includes(r.id) ||
                        r.name === '@everyone',
                ),
            [serverRoles, myMember?.roles],
        );
        const isOwner = serverDetails?.ownerId === currentUser?.id;

        const myHighestRole = useMemo((): Role | undefined => {
            if (!myRoles?.length) return undefined;
            const maxPos = Math.max(...myRoles.map((r): number => r.position));
            return myRoles.find((r): boolean => r.position === maxPos);
        }, [myRoles]);

        const canManageRoles =
            isOwner ||
            (myRoles?.some(
                (r): boolean | undefined =>
                    r.permissions?.administrator || r.permissions?.manageRoles,
            ) ??
                false);

        const canKick =
            isOwner ||
            (myRoles?.some(
                (r): boolean | undefined =>
                    r.permissions?.administrator || r.permissions?.kickMembers,
            ) ??
                false);

        const canBan =
            isOwner ||
            (myRoles?.some(
                (r): boolean | undefined =>
                    r.permissions?.administrator || r.permissions?.banMembers,
            ) ??
                false);

        const canTimeout =
            isOwner ||
            (myRoles?.some(
                (r): boolean | undefined =>
                    r.permissions?.administrator ||
                    r.permissions?.moderateMembers,
            ) ??
                false);

        const targetMember = useMemo(
            (): ServerMember | undefined =>
                members?.find((m): boolean => m.userId === userId),
            [members, userId],
        );
        const targetRoles = useMemo(
            (): Role[] | undefined =>
                serverRoles?.filter((r) => targetMember?.roles.includes(r.id)),
            [serverRoles, targetMember?.roles],
        );
        const targetHighestRole = useMemo((): Role | undefined => {
            if (!targetRoles?.length) return undefined;
            const maxPos = Math.max(
                ...targetRoles.map((r): number => r.position),
            );
            return targetRoles.find((r): boolean => r.position === maxPos);
        }, [targetRoles]);
        const targetHighestPosition = targetHighestRole
            ? targetHighestRole.position
            : -1;
        const myHighestPosition = myHighestRole ? myHighestRole.position : -1;

        const isHigherHierarchy =
            isOwner || myHighestPosition > targetHighestPosition;

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

            // Group 1: DM Actions
            if (isFriend) {
                items.push(
                    { type: 'divider' },
                    {
                        label: 'Open DMs',
                        icon: MessageSquare,
                        onClick: (): void => {
                            void navigate(`/chat/@user/${userId}`);
                        },
                    },
                );
                if (canInviteToAnyServer) {
                    items.push({
                        label: 'Invite to Server',
                        icon: UserPlus,
                        onClick: (): void => {
                            setIsInviteToServerModalOpen(true);
                        },
                    });
                }
                items.push(
                    {
                        label: 'Add to Split View',
                        type: 'submenu',
                        icon: PanelsLeftRight,
                        items: [
                            {
                                label: isMobile ? 'Top Pane' : 'Left Side',
                                icon: isMobile ? PanelTopOpen : PanelLeftOpen,
                                onClick: (): void => {
                                    dispatch(
                                        setSplitViewPane({
                                            side: 'left',
                                            conversation: {
                                                type: 'dm',
                                                friendId: userId,
                                            },
                                        }),
                                    );
                                },
                            },
                            {
                                label: isMobile ? 'Bottom Pane' : 'Right Side',
                                icon: isMobile
                                    ? PanelBottomOpen
                                    : PanelRightOpen,
                                onClick: (): void => {
                                    dispatch(
                                        setSplitViewPane({
                                            side: 'right',
                                            conversation: {
                                                type: 'dm',
                                                friendId: userId,
                                            },
                                        }),
                                    );
                                },
                            },
                        ],
                    },
                    {
                        label: isPinnedFriend ? 'Unpin DM' : 'Pin DM',
                        icon: isPinnedFriend ? PinOff : Pin,
                        onClick: (): void => {
                            togglePinFriend(userId);
                        },
                    },
                    {
                        label: localNickname
                            ? 'Edit Nickname'
                            : 'Add Friend Nickname',
                        icon: Tag,
                        onClick: (): void => {
                            setIsNicknameModalOpen(true);
                        },
                    },
                );

                if (hasUnread) {
                    items.push({
                        label: 'Mark as Read',
                        icon: Check,
                        onClick: (): void => {
                            wsMessages.markDmRead(userId);
                        },
                    });
                }
            }

            // Group 1.5: Voice Volume
            if (isInSameVoiceChannel) {
                const volume = userVolume ?? 1;
                items.push({ type: 'divider' });
                items.push({
                    type: 'custom',
                    content: (
                        <div className="flex flex-col gap-2 p-1">
                            <div className="flex items-center justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                <div className="flex items-center gap-1.5">
                                    <Volume2 size={12} />
                                    User Volume
                                </div>
                                <span>
                                    {Math.round(
                                        (isNaN(volume) ? 1 : volume) * 100,
                                    )}
                                    %
                                </span>
                            </div>
                            <input
                                aria-label="User volume"
                                className="w-full cursor-pointer accent-primary"
                                max="2"
                                min="0"
                                step="0.01"
                                type="range"
                                value={volume}
                                onChange={(e): void => {
                                    dispatch(
                                        setUserVolume({
                                            userId,
                                            volume: Number.parseFloat(
                                                e.target.value,
                                            ),
                                        }),
                                    );
                                }}
                            />
                        </div>
                    ),
                });
            }

            // Group 2: Friend Management (only if not me)
            if (!isMe) {
                items.push({ type: 'divider' });
                if (isFriend) {
                    items.push({
                        label: 'Remove Friend',
                        icon: UserMinus,
                        onClick: (): void => {
                            removeFriend(userId);
                        },
                        variant: 'danger',
                    });
                } else if (!userProfile?.isBot) {
                    items.push({
                        label: 'Add Friend',
                        icon: UserPlus,
                        onClick: (): void => {
                            sendFriendRequest(username);
                        },
                    });
                }

                const isUserBlocked = blocks?.some(
                    (b): boolean => b.targetUserId === userId,
                );
                if (isUserBlocked) {
                    items.push({
                        label: 'Unblock User',
                        icon: Shield,
                        onClick: (): void => {
                            removeBlock(userId);
                        },
                    });
                } else {
                    items.push({
                        label: 'Block User',
                        icon: Ban,
                        onClick: (): void => {
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
                        variant: 'danger',
                    });
                }
            }

            // Group 3: Server Management (Roles)
            if (serverRoles && sid && canManageRoles) {
                items.push({ type: 'divider' });

                // Sort roles by position (descending)
                const sortedRoles = serverRoles.toSorted(
                    (a, b): number => b.position - a.position,
                );
                const rolesToDisplay = sortedRoles.filter(
                    (r): boolean => r.name !== '@everyone',
                );

                items.push({
                    icon: Shield,
                    items:
                        rolesToDisplay.length > 0
                            ? rolesToDisplay.map((r) => {
                                  const hasRole = allRoles?.some(
                                      (ur): boolean =>
                                          String(ur.id) === String(r.id),
                                  );

                                  // Hierarchy check: can only manage roles strictly below your highest role
                                  // unless you are the owner
                                  const canManageThisRole =
                                      isOwner ||
                                      (myHighestRole &&
                                          myHighestRole.position > r.position);

                                  return {
                                      indent: false,
                                      label: (
                                          <Box className="flex items-center gap-2">
                                              <RoleDot role={r} size={8} />
                                              <span className="truncate">
                                                  {r.name}
                                              </span>
                                          </Box>
                                      ),
                                      onClick: (): void => {
                                          if (isAdding || isRemoving) return;

                                          if (hasRole) {
                                              removeRole({
                                                  roleId: r.id,
                                                  userId,
                                              });
                                          } else {
                                              addRole({
                                                  roleId: r.id,
                                                  userId,
                                              });
                                          }
                                      },
                                      preventClose: true,
                                      rightIcon: hasRole ? Check : undefined,
                                      type: 'action',
                                      variant: canManageThisRole
                                          ? isAdding || isRemoving
                                              ? 'ghost'
                                              : 'normal'
                                          : 'ghost',
                                  };
                              })
                            : [
                                  {
                                      label: 'No roles',
                                      onClick: (): void => {},
                                      type: 'action',
                                      variant: 'ghost',
                                  },
                              ],
                    label: 'Roles',
                    type: 'submenu',
                });
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
                if (canTimeout) {
                    items.push({
                        label: 'Timeout Member',
                        icon: Shield,
                        onClick: (): void => {
                            setIsTimeoutModalOpen(true);
                        },
                        variant: 'danger',
                    });
                }
                if (canKick) {
                    items.push({
                        label: 'Kick Member',
                        icon: UserX,
                        onClick: (): void => {
                            setIsKickModalOpen(true);
                        },
                        variant: 'danger',
                    });
                }
                if (canBan) {
                    items.push({
                        label: 'Ban Member',
                        icon: Ban,
                        onClick: (): void => {
                            setIsBanModalOpen(true);
                        },
                        variant: 'danger',
                    });
                }
                items.push({ type: 'divider' });
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

        const presenceStatus =
            storePresenceStatus ?? initialPresenceStatus ?? 'offline';
        const presenceCustomText =
            storePresenceCustomText ?? customStatus?.text;
        const presenceCustomEmoji =
            storePresenceCustomEmoji ?? customStatus?.emoji;

        const handleItemClick = useCallback((): void => {
            if (onClick) {
                onClick();
            } else {
                setShowProfile(true);
            }
        }, [onClick]);

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
                                  : 'text-foreground-muted',
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
                            username={resolveDisplayName(displayName, username) ?? username}
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
                                        <span className="flex shrink-0 items-center">
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
                                        </span>
                                    ) : null}
                                    {presenceCustomText ? (
                                        <MarqueeText
                                            className="text-foreground-muted min-w-0 flex-1 text-xs"
                                            speed={40}
                                        >
                                            {presenceCustomText}
                                        </MarqueeText>
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
                                            className="text-destructive"
                                            size={14}
                                        />
                                    ) : null}
                                    {userVoiceState?.isDeafened ? (
                                        <HeadphoneOff
                                            className="text-destructive"
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
                        onConfirm={(reason): void => {
                            banMember({ userId, reason });
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
                <CodeModal
                    content={colorResolverReport ?? ''}
                    isOpen={!!colorResolverReport}
                    language="json"
                    onClose={(): void => {
                        setColorResolverReport(null);
                    }}
                />

                {isInviteToServerModalOpen ? (
                    <InviteToServerModal
                        isOpen={isInviteToServerModalOpen}
                        userId={userId}
                        username={resolveDisplayName(displayName, username) ?? username}
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

export const UserItem = React.memo((props: UserItemProps): ReactNode => {
    const isServerContext = !!props.serverId;
    const serverId =
        props.serverId ||
        props.role?.serverId ||
        props.serverRoles?.[0]?.serverId ||
        '';
    const sid = serverId || null;

    if (isServerContext && sid) {
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
});

UserItem.displayName = 'UserItem';
