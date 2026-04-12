import React from 'react';

import {
    Ban,
    Check,
    Copy,
    HeadphoneOff,
    MessageSquare,
    MicOff,
    Shield,
    User as UserIcon,
    UserMinus,
    UserPlus,
    UserX,
    Volume2,
} from 'lucide-react';

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
} from '@/api/friends/friends.queries';
import {
    useAddRoleToMember,
    useBanMember,
    useKickMember,
    useMembers,
    useRemoveRoleFromMember,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedFriendId } from '@/store/slices/navSlice';
import { setUserVolume } from '@/store/slices/voiceSlice';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { BlockUserModal } from '@/ui/components/profile/modals/BlockUserModal';
import { BanUserModal } from '@/ui/components/servers/modals/BanUserModal';
import { KickUserModal } from '@/ui/components/servers/modals/KickUserModal';
import { cn } from '@/utils/cn';

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
}

/**
 * @description Renders a user item with avatar, styled username, and custom status.
 */
export const UserItem: React.FC<UserItemProps> = ({
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
    disableCustomFonts,
    disableGlowAndColors,
    disableColors,
    disableGlow,
    initialPresenceStatus,
}) => {
    const dispatch = useAppDispatch();

    const serverId =
        providedServerId || role?.serverId || serverRoles?.[0]?.serverId || '';
    const sid = serverId || null;

    const { mutate: addRole, isPending: isAdding } =
        useAddRoleToMember(serverId);
    const { mutate: removeRole, isPending: isRemoving } =
        useRemoveRoleFromMember(serverId);

    const { mutate: kickMember } = useKickMember(serverId);
    const { mutate: banMember } = useBanMember(serverId);

    const { data: serverDetails } = useServerDetails(sid);
    const { data: members } = useMembers(sid);

    const { data: currentUser } = useMe();

    const [isKickModalOpen, setIsKickModalOpen] = React.useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = React.useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);

    const { data: fetchedUser } = useUserById(userId, {
        enabled: !noFetch && !providedUser,
    });
    const userProfile = providedUser || fetchedUser;
    const { data: friends } = useFriends();

    const { mutate: sendFriendRequest } = useSendFriendRequest();
    const { mutate: removeFriend } = useRemoveFriend();

    const { data: blocks } = useBlocks();
    const { data: blockProfiles } = useBlockProfiles();
    const { mutate: upsertBlock } = useUpsertBlock();
    const { mutate: removeBlock } = useRemoveBlock();
    const { mutateAsync: createProfile } = useCreateBlockProfile();

    const [showProfile, setShowProfile] = React.useState(false);
    const itemRef = React.useRef<HTMLDivElement>(null);

    const username = userProfile?.username || initialData?.username || '';
    const displayName = userProfile?.displayName || initialData?.displayName;
    const profilePicture =
        userProfile?.profilePicture || initialData?.profilePicture || null;
    const customStatus = userProfile?.customStatus || initialData?.customStatus;

    const isFriend = friends?.some((f) => f._id === userId);
    const isMe = currentUser?._id === userId;

    const {
        activeVoiceChannelId,
        voiceParticipants,
        userVolumes,
        voiceUserStates,
    } = useAppSelector((state) => state.voice);

    const userVoiceChannelId = Object.keys(voiceParticipants).find((cid) =>
        voiceParticipants[cid]?.includes(userId),
    );

    const userVoiceState = voiceUserStates[userId];

    const isInSameVoiceChannel =
        activeVoiceChannelId &&
        userVoiceChannelId === activeVoiceChannelId &&
        !isMe;

    const items: ContextMenuItem[] = [];

    // Group 0: Profile
    items.push({
        label: 'Show Profile',
        icon: UserIcon,
        onClick: () => setShowProfile(true),
    });

    // Group 1: DM Actions
    if (isFriend) {
        items.push({ type: 'divider' });
        items.push({
            label: 'Open DMs',
            icon: MessageSquare,
            onClick: () => dispatch(setSelectedFriendId(userId)),
        });
    }

    // Group 1.5: Voice Volume
    if (isInSameVoiceChannel) {
        const volume = userVolumes[userId] ?? 1;
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
                            {Math.round((isNaN(volume) ? 1.0 : volume) * 100)}%
                        </span>
                    </div>
                    <input
                        className="w-full cursor-pointer accent-primary"
                        max="2"
                        min="0"
                        step="0.01"
                        type="range"
                        value={volume}
                        onChange={(e) => {
                            dispatch(
                                setUserVolume({
                                    userId,
                                    volume: parseFloat(e.target.value),
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
                onClick: () => removeFriend(userId),
                variant: 'danger',
            });
        } else {
            items.push({
                label: 'Add Friend',
                icon: UserPlus,
                onClick: () => sendFriendRequest(username),
            });
        }

        const isUserBlocked = blocks?.some((b) => b.targetUserId === userId);
        if (isUserBlocked) {
            items.push({
                label: 'Unblock User',
                icon: Shield,
                onClick: () => removeBlock(userId),
            });
        } else {
            items.push({
                label: 'Block User',
                icon: Ban,
                onClick: () => {
                    void (async () => {
                        const profiles = blockProfiles || [];
                        if (profiles.length === 0) {
                            try {
                                const profileToAssign = await createProfile({
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
                        } else if (profiles.length === 1) {
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
    const myMember = members?.find((m) => m.userId === currentUser?._id);
    const myRoles = serverRoles?.filter(
        (r) => myMember?.roles.includes(r._id) || r.name === '@everyone',
    );
    const isOwner = serverDetails?.ownerId === currentUser?._id;

    const myHighestRole = myRoles?.sort((a, b) => b.position - a.position)[0];

    const canManageRoles =
        isOwner ||
        myRoles?.some(
            (r) => r.permissions?.administrator || r.permissions?.manageRoles,
        );

    if (serverRoles && sid && canManageRoles) {
        items.push({ type: 'divider' });

        // Sort roles by position (descending)
        const sortedRoles = [...serverRoles].sort(
            (a, b) => b.position - a.position,
        );
        const rolesToDisplay = sortedRoles.filter(
            (r) => r.name !== '@everyone',
        );

        items.push({
            icon: Shield,
            items:
                rolesToDisplay.length > 0
                    ? rolesToDisplay.map((r) => {
                          const hasRole = allRoles?.some(
                              (ur) => String(ur._id) === String(r._id),
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
                                      <span className="truncate">{r.name}</span>
                                  </Box>
                              ),
                              onClick: () => {
                                  if (isAdding || isRemoving) return;

                                  if (hasRole) {
                                      removeRole({
                                          roleId: r._id,
                                          userId,
                                      });
                                  } else {
                                      addRole({
                                          roleId: r._id,
                                          userId,
                                      });
                                  }
                              },
                              preventClose: true,
                              rightIcon: hasRole ? Check : undefined,
                              type: 'action',
                              variant: !canManageThisRole
                                  ? 'ghost'
                                  : isAdding || isRemoving
                                    ? 'ghost'
                                    : 'normal',
                          };
                      })
                    : [
                          {
                              label: 'No roles',
                              onClick: () => {},
                              type: 'action',
                              variant: 'ghost',
                          },
                      ],
            label: 'Roles',
            type: 'submenu',
        });
    }

    items.push({ type: 'divider' });

    // Group 4: Moderation
    const canKick =
        isOwner ||
        myRoles?.some(
            (r) => r.permissions?.administrator || r.permissions?.kickMembers,
        );
    const canBan =
        isOwner ||
        myRoles?.some(
            (r) => r.permissions?.administrator || r.permissions?.banMembers,
        );

    const targetMember = members?.find((m) => m.userId === userId);
    const targetRoles = serverRoles?.filter((r) =>
        targetMember?.roles.includes(r._id),
    );
    const targetHighestRole = targetRoles?.sort(
        (a, b) => b.position - a.position,
    )[0];
    const targetHighestPosition = targetHighestRole
        ? targetHighestRole.position
        : -1;
    const myHighestPosition = myHighestRole ? myHighestRole.position : -1;

    // Current user must have strictly higher role than target, OR be owner
    const isHigherHierarchy =
        isOwner || myHighestPosition > targetHighestPosition;

    if (!isMe && sid && (canKick || canBan) && isHigherHierarchy) {
        if (canKick) {
            items.push({
                label: 'Kick Member',
                icon: UserX,
                onClick: () => {
                    setIsKickModalOpen(true);
                },
                variant: 'danger',
            });
        }
        if (canBan) {
            items.push({
                label: 'Ban Member',
                icon: Ban,
                onClick: () => {
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
        onClick: () => {
            void navigator.clipboard.writeText(userId);
        },
    });

    const contextMenuItems = items;

    const presence = useAppSelector((state) => state.presence.users[userId]);
    const presenceStatus =
        presence?.status ?? initialPresenceStatus ?? 'offline';
    const presenceCustomText =
        presence?.customStatus?.text ?? customStatus?.text;
    const presenceCustomEmoji =
        presence?.customStatus?.emoji ?? customStatus?.emoji;

    return (
        <>
            <ContextMenu items={contextMenuItems}>
                <Box
                    className={cn(
                        'flex h-11 w-60 shrink-0 cursor-pointer items-center gap-3 overflow-hidden rounded-md px-3 transition-colors',
                        'hover:bg-bg-subtle',
                        isActive
                            ? 'bg-bg-subtle text-foreground'
                            : 'text-foreground-muted',
                        className,
                    )}
                    ref={itemRef}
                    onClick={() => {
                        if (onClick) {
                            onClick();
                        } else {
                            setShowProfile(true);
                        }
                    }}
                >
                    <UserProfilePicture
                        size="sm"
                        src={profilePicture}
                        status={presenceStatus}
                        username={displayName || username}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfile(true);
                        }}
                    />

                    <Box className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        <StyledUserName
                            disableColors={
                                disableColors ||
                                currentUser?.settings
                                    ?.disableCustomUsernameColors
                            }
                            disableCustomFonts={
                                disableCustomFonts ||
                                currentUser?.settings
                                    ?.disableCustomUsernameFonts
                            }
                            disableGlow={
                                disableGlow ||
                                currentUser?.settings?.disableCustomUsernameGlow
                            }
                            disableGlowAndColors={disableGlowAndColors}
                            iconRole={iconRole}
                            role={role}
                            user={userProfile}
                        >
                            {displayName || username}
                        </StyledUserName>

                        {(presenceCustomText || presenceCustomEmoji) && (
                            <div className="flex min-w-0 items-center gap-1">
                                {presenceCustomEmoji && (
                                    <span className="flex shrink-0 items-center">
                                        {/^[0-9a-fA-F]{24}$/.test(
                                            presenceCustomEmoji,
                                        ) ? (
                                            <ParsedEmoji
                                                className="h-3.5 w-3.5"
                                                emojiId={presenceCustomEmoji}
                                            />
                                        ) : (
                                            <ParsedUnicodeEmoji
                                                className="text-xs"
                                                content={presenceCustomEmoji}
                                            />
                                        )}
                                    </span>
                                )}
                                {presenceCustomText && (
                                    <MarqueeText
                                        className="text-foreground-muted min-w-0 flex-1 text-xs"
                                        speed={40}
                                    >
                                        {presenceCustomText}
                                    </MarqueeText>
                                )}
                            </div>
                        )}
                    </Box>

                    {userVoiceChannelId && (
                        <Box
                            className={cn(
                                'ml-auto flex shrink-0 items-center gap-1.5',
                            )}
                        >
                            {userVoiceState?.isMuted && (
                                <MicOff
                                    className="text-destructive"
                                    size={14}
                                />
                            )}
                            {userVoiceState?.isDeafened && (
                                <HeadphoneOff
                                    className="text-destructive"
                                    size={14}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            </ContextMenu>
            <ProfilePopup
                disableColors={
                    disableColors ||
                    currentUser?.settings?.disableCustomUsernameColors
                }
                disableCustomFonts={
                    disableCustomFonts ||
                    currentUser?.settings?.disableCustomUsernameFonts
                }
                disableGlow={
                    disableGlow ||
                    currentUser?.settings?.disableCustomUsernameGlow
                }
                disableGlowAndColors={disableGlowAndColors}
                iconRole={iconRole}
                isOpen={showProfile}
                joinedAt={joinedAt}
                role={role}
                roles={allRoles}
                triggerRef={itemRef}
                user={userProfile || undefined}
                userId={userId}
                onClose={() => setShowProfile(false)}
            />

            <KickUserModal
                isOpen={isKickModalOpen}
                userAvatar={userProfile?.profilePicture}
                username={username}
                onClose={() => setIsKickModalOpen(false)}
                onConfirm={() => kickMember(userId)}
            />

            <BanUserModal
                isOpen={isBanModalOpen}
                userAvatar={userProfile?.profilePicture}
                username={username}
                onClose={() => setIsBanModalOpen(false)}
                onConfirm={(reason) => banMember({ userId, reason })}
            />

            <BlockUserModal
                isOpen={isBlockModalOpen}
                profiles={blockProfiles || []}
                userAvatar={userProfile?.profilePicture}
                username={username}
                onClose={() => setIsBlockModalOpen(false)}
                onConfirm={(profileId) =>
                    upsertBlock({ targetUserId: userId, profileId })
                }
            />
        </>
    );
};
