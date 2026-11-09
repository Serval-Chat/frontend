import React, { useMemo } from 'react';

import { Camera, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useAcceptFriendRequest,
    useCancelFriendRequest,
    useFriends,
    useIncomingRequests,
    useOutgoingRequests,
    useRemoveFriend,
    useSendFriendRequest,
} from '@/api/friends/friends.queries';
import {
    useAddRoleToMember,
    useRemoveRoleFromMember,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { BotTag } from '@/features/users/BotTag';
import { StyledUserName } from '@/features/users/StyledUserName';
import { UserBadge } from '@/features/users/UserBadge';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import type { UserStatus } from '@/features/users/UserProfileStatusIndicator';
import { useSelfStatus } from '@/features/users/hooks/useSelfStatus';
import { ProfileBanner } from '@/features/users/profile/ProfileBanner';
import { useAppSelector } from '@/store/hooks';
import type { AdminExtendedUser } from '@/types/admin';
import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';
import { Tooltip } from '@/ui/primitives/Tooltip';
import { isWebhookUser } from '@/ui/utils/chat';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

import { InlineEditableField } from './card/InlineEditableField';
import { PrivateFieldHint } from './card/PrivateFieldHint';
import type { FriendRelationshipStatus } from './card/ProfileCardActions';
import { ProfileCardActions } from './card/ProfileCardActions';
import { ProfileCardAdminView } from './card/ProfileCardAdminView';
import { ProfileCardDetails } from './card/ProfileCardDetails';
import { ProfileCardRoles } from './card/ProfileCardRoles';
import { cardTextVars, mixHex, shouldApplyDarkFilter } from './card/cardColors';

interface UserProfileCardProps {
    user?: User | Partial<User>;
    role?: Role;
    iconRole?: Role;
    roles?: Role[];
    joinedAt?: string;
    className?: string;
    style?: React.CSSProperties;
    presenceStatus?: UserStatus;
    customStatus?: { text?: string; emoji?: string };
    onBannerClick?: () => void;
    onAvatarClick?: () => void;
    displayNameValue?: string;
    onDisplayNameChange?: (value: string) => void;
    usernameValue?: string;
    onUsernameChange?: (value: string) => void;
    pronounsValue?: string;
    onPronounsChange?: (value: string) => void;
    bioValue?: string;
    onBioChange?: (value: string) => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    adminData?: AdminExtendedUser;
    nickname?: string;
    hideActions?: boolean;
    adminView?: boolean;
    ignoreLivePresence?: boolean;

    allServerRoles?: Role[];
    canManageRoles?: boolean;
    isOwner?: boolean;
    myHighestRolePosition?: number;
    serverId?: string;
    userId?: string;
}

export const UserProfileCard = ({
    user,
    role,
    iconRole,
    roles,
    joinedAt,
    className,
    style,
    presenceStatus: propPresenceStatus,
    customStatus,
    onBannerClick,
    onAvatarClick,
    displayNameValue,
    onDisplayNameChange,
    usernameValue,
    onUsernameChange,
    pronounsValue,
    onPronounsChange,
    bioValue,
    onBioChange,
    disableCustomFonts,
    disableGlowAndColors,
    disableColors,
    disableGlow,
    adminData,
    allServerRoles,
    canManageRoles,
    isOwner,
    myHighestRolePosition,
    serverId,
    userId: propUserId,
    nickname,
    hideActions,
    adminView,
    ignoreLivePresence,
}: UserProfileCardProps) => {
    const { data: currentUser } = useMe();
    const { status: selfStatus } = useSelfStatus();
    const navigate = useNavigate();
    const { data: friends } = useFriends();
    const { data: incomingRequests } = useIncomingRequests();
    const { data: outgoingRequests } = useOutgoingRequests();
    const { mutate: sendFriendRequest } = useSendFriendRequest();
    const { mutate: removeFriend } = useRemoveFriend();
    const { mutate: acceptFriendRequest } = useAcceptFriendRequest();
    const { mutate: cancelFriendRequest } = useCancelFriendRequest();

    const { mutate: addRole } = useAddRoleToMember(serverId || '');
    const { mutate: removeRole } = useRemoveRoleFromMember(serverId || '');

    const userId = propUserId || user?.id;
    const presence = useAppSelector((state) =>
        userId ? state.presence.users[userId] : undefined,
    );

    const finalStatus = (
        ignoreLivePresence
            ? (propPresenceStatus ?? 'offline')
            : userId && userId === currentUser?.id
              ? selfStatus
              : presence?.status === 'online'
                ? (presence.presenceStatus ?? 'online')
                : (presence?.status ?? propPresenceStatus ?? 'offline')
    ) as UserStatus;
    const finalCustomText =
        customStatus?.text ??
        (ignoreLivePresence ? undefined : presence?.customStatus?.text) ??
        user?.customStatus?.text;
    const finalCustomEmoji =
        customStatus?.emoji ??
        (ignoreLivePresence ? undefined : presence?.customStatus?.emoji) ??
        user?.customStatus?.emoji;
    const userBio = user?.bio;
    const bioNodes = useMemo(
        () => (userBio ? parseText(userBio, ParserPresets.BIO) : []),
        [userBio],
    );
    const visibleConnections = useMemo(
        () =>
            (user?.connections ?? []).filter(
                (connection): boolean =>
                    connection.type === 'Website' &&
                    connection.status !== 'pending',
            ),
        [user?.connections],
    );

    const hasCustomColors = !!(
        user?.profilePrimaryColor || user?.profileAccentColor
    );
    const cardOnDark =
        hasCustomColors &&
        shouldApplyDarkFilter(
            user.profilePrimaryColor || user.profileAccentColor!,
        );

    const isOwnProfile = currentUser?.id === user?.id;
    const ps = user?.privacySettings;

    const incomingRequest = incomingRequests?.find(
        (request): boolean => request.fromId === user?.id,
    );
    const outgoingRequest = outgoingRequests?.find(
        (request): boolean => request.toId === user?.id,
    );
    const isFriend = !!friends?.some((f): boolean => f.id === user?.id);
    const friendStatus: FriendRelationshipStatus = isFriend
        ? 'friend'
        : incomingRequest
          ? 'incoming'
          : outgoingRequest
            ? 'outgoing'
            : 'none';

    // Webhook authors are synthetic (see resolveWebhookUser) and are not server
    // members, so role management does not apply to them.
    const isWebhook = isWebhookUser(user);

    const displayNameContent = (
        <StyledUserName
            className="min-w-0 truncate text-xl leading-tight font-bold"
            disableColors={
                disableColors ||
                currentUser?.settings?.disableCustomUsernameColors
            }
            disableCustomFonts={
                disableCustomFonts ||
                currentUser?.settings?.disableCustomUsernameFonts
            }
            disableGlow={
                disableGlow || currentUser?.settings?.disableCustomUsernameGlow
            }
            disableGlowAndColors={disableGlowAndColors}
            iconRole={iconRole}
            role={role}
            user={user as User}
        >
            {nickname || user?.displayName || user?.username}
        </StyledUserName>
    );

    return (
        <div
            className={`relative isolate flex w-85 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-background shadow-2xl ${className || ''}`}
            style={{
                ...style,
                ...(hasCustomColors
                    ? (() => {
                          const p =
                              user.profilePrimaryColor ||
                              user.profileAccentColor!;
                          const rawAccent =
                              user.profileAccentColor ||
                              user.profilePrimaryColor!;
                          const a = mixHex(p, rawAccent, 0.35);
                          const { vars, color } = cardTextVars(p);
                          const isDark = shouldApplyDarkFilter(p);
                          const avatarRingColor = isDark
                              ? mixHex(p, '#000000', 0.35)
                              : p;
                          return {
                              background: `linear-gradient(to bottom, ${p} 0%, ${p} 30%, ${a} 100%) padding-box, linear-gradient(to bottom, ${p} 0%, ${a} 100%) border-box`,
                              border: '2px solid transparent',
                              color,
                              '--color-background': avatarRingColor,
                              ...vars,
                          } as React.CSSProperties;
                      })()
                    : {}),
            }}
        >
            {cardOnDark ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-negative bg-black/35"
                />
            ) : null}
            <ProfileBanner
                banner={user?.banner}
                bannerColor={user?.bannerColor}
                height={120}
                usernameGradient={user?.usernameGradient}
                onBannerClick={onBannerClick}
            />
            <ProfileCardActions
                currentUserId={currentUser?.id}
                friendStatus={friendStatus}
                hideActions={hideActions}
                targetUserId={userId}
                user={user}
                onAcceptFriend={(): void => {
                    if (incomingRequest)
                        acceptFriendRequest(incomingRequest.id);
                }}
                onAddFriend={(): void => {
                    if (user?.username) sendFriendRequest(user.username);
                }}
                onCancelFriendRequest={(): void => {
                    if (outgoingRequest)
                        cancelFriendRequest(outgoingRequest.id);
                }}
                onMessage={(): void => {
                    if (userId) void navigate(`/chat/@user/${userId}`);
                }}
                onRemoveFriend={(): void => {
                    if (user?.id) removeFriend(user.id);
                }}
            />
            {user?.isPrivate === true &&
            currentUser?.id !== user?.id &&
            user?.privacySettings === undefined ? (
                <div className="absolute top-3 left-3 z-10">
                    <Tooltip
                        content="This profile is private. Some fields may be hidden from you."
                        position="left"
                    >
                        <div className="flex cursor-default items-center justify-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm">
                            <HelpCircle size={16} />
                        </div>
                    </Tooltip>
                </div>
            ) : null}

            <Box className="pointer-events-none relative z-content -mt-[50px] px-4">
                <Box
                    className={`pointer-events-auto relative flex h-[92px] w-[92px] items-center justify-center rounded-full bg-background p-1.5 ${onAvatarClick ? 'group/avatar cursor-pointer' : ''}`}
                    style={
                        hasCustomColors
                            ? {
                                  backgroundColor: cardOnDark
                                      ? mixHex(
                                            user.profilePrimaryColor ||
                                                user.profileAccentColor!,
                                            '#000000',
                                            0.35,
                                        )
                                      : user.profilePrimaryColor ||
                                        user.profileAccentColor!,
                              }
                            : undefined
                    }
                    onClick={onAvatarClick}
                >
                    <UserProfilePicture
                        decorationId={user?.decorationId}
                        noIndicator={false}
                        size="xl"
                        src={user?.profilePicture}
                        status={finalStatus}
                        username={user?.username || ''}
                    />
                    {onAvatarClick ? (
                        <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100">
                            <Camera size={20} />
                        </div>
                    ) : null}
                </Box>
            </Box>

            <Box className="px-4 pt-2 pb-0">
                <Box className="mb-4">
                    <Box className="flex min-w-0 items-center gap-2">
                        {onDisplayNameChange ? (
                            <InlineEditableField
                                inputClassName="min-w-0 flex-1 rounded-md border border-primary bg-bg-subtle px-1.5 py-0.5 text-xl leading-tight font-bold text-foreground focus:outline-none"
                                title="Edit display name"
                                value={
                                    displayNameValue ?? user?.displayName ?? ''
                                }
                                onChange={onDisplayNameChange}
                            >
                                {displayNameContent}
                            </InlineEditableField>
                        ) : (
                            displayNameContent
                        )}
                        {user?.isBot ? (
                            <BotTag
                                className="ml-0 h-4"
                                verified={user.botVerified}
                            />
                        ) : null}
                        <PrivateFieldHint
                            adminView={adminView}
                            isOwnProfile={isOwnProfile}
                            visible={ps?.hideDisplayName === true}
                        />
                    </Box>

                    <Box className="mt-1 text-sm font-medium text-muted-foreground select-text">
                        {onUsernameChange ? (
                            <InlineEditableField
                                inputClassName="min-w-0 rounded-md border border-primary bg-bg-subtle px-1.5 py-0.5 text-sm font-medium text-foreground focus:outline-none"
                                title="Edit username"
                                value={usernameValue ?? user?.username ?? ''}
                                onChange={onUsernameChange}
                            >
                                @{user?.username}
                            </InlineEditableField>
                        ) : (
                            `@${user?.username ?? ''}`
                        )}
                        {user?.pronouns || onPronounsChange ? (
                            <Text
                                as="span"
                                className={
                                    hasCustomColors
                                        ? 'ml-1 inline-flex items-center gap-1 text-foreground/70'
                                        : 'ml-1 inline-flex items-center gap-1 text-muted-foreground/60'
                                }
                            >
                                <Text>•</Text>
                                {onPronounsChange ? (
                                    <InlineEditableField
                                        inputClassName="min-w-0 rounded-md border border-primary bg-bg-subtle px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                                        title="Edit pronouns"
                                        value={
                                            pronounsValue ??
                                            user?.pronouns ??
                                            ''
                                        }
                                        onChange={onPronounsChange}
                                    >
                                        {user?.pronouns || 'Add pronouns'}
                                    </InlineEditableField>
                                ) : (
                                    user?.pronouns
                                )}
                                <PrivateFieldHint
                                    adminView={adminView}
                                    isOwnProfile={isOwnProfile}
                                    visible={ps?.hidePronouns === true}
                                />
                            </Text>
                        ) : null}
                    </Box>
                    {user?.badges && user?.badges.length > 0 ? (
                        <Box className="mt-2 flex flex-wrap gap-1.5">
                            {user?.badges?.map((badge) => (
                                <UserBadge
                                    badge={badge}
                                    darkCard={cardOnDark}
                                    key={badge.id}
                                    solidBg={hasCustomColors}
                                />
                            ))}
                        </Box>
                    ) : null}
                </Box>

                <ProfileCardDetails
                    adminView={adminView}
                    bioNodes={bioNodes}
                    bioValue={bioValue}
                    finalCustomEmoji={finalCustomEmoji}
                    finalCustomText={finalCustomText}
                    isOwnProfile={isOwnProfile}
                    isWebhook={isWebhook}
                    joinedAt={joinedAt}
                    ps={ps}
                    user={user}
                    visibleConnections={visibleConnections}
                    onBioChange={onBioChange}
                />

                <ProfileCardRoles
                    allServerRoles={allServerRoles}
                    canManageRoles={canManageRoles ? !isWebhook : undefined}
                    isOwner={isOwner}
                    myHighestRolePosition={myHighestRolePosition}
                    roles={roles}
                    serverId={serverId}
                    userId={userId}
                    onAddRole={(roleId): void => {
                        if (userId) addRole({ userId, roleId });
                    }}
                    onRemoveRole={(roleId): void => {
                        if (userId) removeRole({ userId, roleId });
                    }}
                />

                {adminData ? (
                    <ProfileCardAdminView adminData={adminData} />
                ) : null}
            </Box>
        </div>
    );
};
