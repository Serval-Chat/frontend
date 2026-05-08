import React, { useMemo } from 'react';

import {
    Calendar,
    Camera,
    MessageSquare,
    Server,
    UserMinus,
    UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useFriends,
    useRemoveFriend,
    useSendFriendRequest,
} from '@/api/friends/friends.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import type { AdminExtendedUser } from '@/types/admin';
import { BotTag } from '@/ui/components/common/BotTag';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { UserBadge } from '@/ui/components/common/UserBadge';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { type UserStatus } from '@/ui/components/common/UserProfileStatusIndicator';
import { Box } from '@/ui/components/layout/Box';
import { ProfileBanner } from '@/ui/components/profile/ProfileBanner';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

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
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    adminData?: AdminExtendedUser;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
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
    disableCustomFonts,
    disableGlowAndColors,
    disableColors,
    disableGlow,
    adminData,
}) => {
    const { data: currentUser } = useMe();
    const navigate = useNavigate();
    const { data: friends } = useFriends();
    const { mutate: sendFriendRequest } = useSendFriendRequest();
    const { mutate: removeFriend } = useRemoveFriend();

    const userId = user?._id;
    const presence = useAppSelector((state) =>
        userId ? state.presence.users[userId] : undefined,
    );

    const finalStatus = (propPresenceStatus ||
        presence?.status ||
        'offline') as UserStatus;
    const finalCustomText =
        customStatus?.text ??
        presence?.customStatus?.text ??
        user?.customStatus?.text;
    const finalCustomEmoji =
        customStatus?.emoji ??
        presence?.customStatus?.emoji ??
        user?.customStatus?.emoji;
    const userBio = user?.bio;
    const bioNodes = useMemo(
        () => (userBio ? parseText(userBio, ParserPresets.BIO) : []),
        [userBio],
    );

    return (
        <div
            className={`flex w-[340px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-background shadow-2xl ${className || ''}`}
            style={style}
        >
            <ProfileBanner
                banner={user?.banner}
                bannerColor={user?.bannerColor}
                height={120}
                usernameGradient={user?.usernameGradient}
                onBannerClick={onBannerClick}
            />

            <Box className="relative z-content -mt-[50px] px-4">
                <Box
                    className={`relative inline-block rounded-full bg-background p-1.5 ${onAvatarClick ? 'group/avatar cursor-pointer' : ''}`}
                    onClick={onAvatarClick}
                >
                    <UserProfilePicture
                        noIndicator={false}
                        size="xl"
                        src={user?.profilePicture}
                        status={finalStatus}
                        username={user?.username || ''}
                    />
                    {onAvatarClick && (
                        <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100">
                            <Camera size={20} />
                        </div>
                    )}
                </Box>
            </Box>

            <Box className="p-4 pt-2">
                <Box className="mb-4">
                    <Box className="flex min-w-0 items-center gap-2">
                        <StyledUserName
                            className="min-w-0 truncate text-xl leading-tight font-bold"
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
                            user={user as User}
                        >
                            {user?.displayName || user?.username}
                        </StyledUserName>
                        {user?.isBot && <BotTag className="ml-0" />}
                    </Box>

                    <Box className="mt-1 text-sm font-medium text-muted-foreground select-text">
                        @{user?.username}
                        {user?.pronouns && (
                            <Text
                                as="span"
                                className="ml-2 text-muted-foreground/60"
                            >
                                • {user.pronouns}
                            </Text>
                        )}
                    </Box>

                    {user?.badges && user?.badges.length > 0 && (
                        <Box className="mt-2 flex flex-wrap gap-1.5">
                            {user.badges.map((badge) => (
                                <UserBadge badge={badge} key={badge._id} />
                            ))}
                        </Box>
                    )}
                </Box>

                {(finalCustomText || finalCustomEmoji) && (
                    <Box className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                        {finalCustomEmoji && (
                            <Box className="flex shrink-0 items-center">
                                {/^[0-9a-fA-F]{24}$/.test(finalCustomEmoji) ? (
                                    <ParsedEmoji
                                        className="h-4 w-4"
                                        emojiId={finalCustomEmoji}
                                    />
                                ) : (
                                    <ParsedUnicodeEmoji
                                        className="h-4 w-4 text-[16px]"
                                        content={finalCustomEmoji}
                                    />
                                )}
                            </Box>
                        )}
                        <Text as="span" size="xs" variant="muted">
                            {finalCustomText}
                        </Text>
                    </Box>
                )}

                <Box className="my-3 h-px w-full bg-divider" />

                {user?.bio && (
                    <Box className="mb-4">
                        <Heading
                            className="mb-2 text-xs font-bold text-muted-foreground uppercase"
                            level={3}
                        >
                            About Me
                        </Heading>
                        <Box className="text-[10px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                            <ParsedText
                                nodes={bioNodes}
                                size="xs"
                                wrap="preWrap"
                            />
                        </Box>
                    </Box>
                )}

                <Box className="mb-4 flex gap-4">
                    <Box className="min-w-0 flex-1">
                        <Heading
                            className="mb-2 text-xs font-bold text-muted-foreground uppercase"
                            level={3}
                        >
                            Member Since
                        </Heading>
                        <Box className="flex items-center gap-2 text-sm text-foreground/80">
                            <Calendar className="shrink-0" size={14} />
                            <Text as="span" className="truncate">
                                {user?.createdAt &&
                                    new Date(user.createdAt).toLocaleDateString(
                                        'en-GB',
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        },
                                    )}
                            </Text>
                        </Box>
                    </Box>

                    {joinedAt && (
                        <Box className="min-w-0 flex-1">
                            <Heading
                                className="mb-2 truncate text-xs font-bold text-muted-foreground uppercase"
                                level={3}
                            >
                                Joined Server
                            </Heading>
                            <Box className="flex items-center gap-2 text-sm text-foreground/80">
                                <Calendar className="shrink-0" size={14} />
                                <Text as="span" className="truncate">
                                    {new Date(joinedAt).toLocaleDateString(
                                        'en-GB',
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        },
                                    )}
                                </Text>
                            </Box>
                        </Box>
                    )}
                </Box>

                {roles && roles.length > 0 && (
                    <Box className="mb-4">
                        <Heading
                            className="mb-2 text-xs font-bold text-muted-foreground uppercase"
                            level={3}
                        >
                            Roles
                        </Heading>
                        <Box className="flex flex-wrap gap-2">
                            {[...roles]
                                .sort((a, b) => b.position - a.position)
                                .map((r) => (
                                    <Box
                                        className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary px-2 py-1"
                                        key={r._id}
                                    >
                                        <RoleDot role={r} />
                                        <Text
                                            as="span"
                                            className="text-xs font-medium text-foreground/90"
                                        >
                                            {r.name}
                                        </Text>
                                    </Box>
                                ))}
                        </Box>
                    </Box>
                )}

                {currentUser?._id !== user?._id && !user?.isBot && (
                    <Box className="mt-4 flex gap-2">
                        <Button
                            className="flex-1 gap-2"
                            size="sm"
                            onClick={() => {
                                if (user?._id) {
                                    void navigate(`/chat/@user/${user._id}`);
                                }
                            }}
                        >
                            <MessageSquare size={14} />
                            Message
                        </Button>
                        {friends?.some((f) => f._id === user?._id) ? (
                            <Button
                                className="gap-2"
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                    if (user?._id) {
                                        removeFriend(user._id);
                                    }
                                }}
                            >
                                <UserMinus size={14} />
                            </Button>
                        ) : (
                            <Button
                                className="gap-2"
                                size="sm"
                                variant="normal"
                                onClick={() => {
                                    if (user?.username) {
                                        sendFriendRequest(user.username);
                                    }
                                }}
                            >
                                <UserPlus size={14} />
                                Add Friend
                            </Button>
                        )}
                    </Box>
                )}

                {adminData && (
                    <Box className="mt-2 space-y-4 border-t border-divider pt-4">
                        <Heading
                            className="mb-2 text-[10px] font-black tracking-[0.2em] text-danger uppercase"
                            level={3}
                        >
                            Administrative View
                        </Heading>

                        {/* Admin Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 p-2">
                                <span className="block text-[9px] font-bold tracking-tight text-muted-foreground uppercase">
                                    Warnings
                                </span>
                                <span
                                    className={cn(
                                        'text-sm font-black',
                                        adminData.warningCount > 0
                                            ? 'text-caution'
                                            : 'text-foreground',
                                    )}
                                >
                                    {adminData.warningCount}
                                </span>
                            </div>
                            <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 p-2">
                                <span className="block text-[9px] font-bold tracking-tight text-muted-foreground uppercase">
                                    Account Status
                                </span>
                                <span className="text-sm font-black text-success">
                                    Active
                                </span>
                            </div>
                        </div>

                        {/* Banned Info */}
                        {adminData.banExpiry && (
                            <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                                <span className="font-bold tracking-tight uppercase">
                                    Banned Until:
                                </span>
                                <span className="mt-0.5 block font-black">
                                    {new Date(
                                        adminData.banExpiry,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Servers List */}
                        <Box>
                            <Heading
                                className="mb-2 flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-muted-foreground uppercase"
                                level={3}
                            >
                                <Server size={10} /> Joined Servers (
                                {adminData.servers.length})
                            </Heading>
                            <Box className="custom-scrollbar max-h-[200px] space-y-1.5 overflow-y-auto pr-1">
                                {adminData.servers.map((server) => (
                                    <div
                                        className="flex items-center gap-2 rounded-lg border border-border-subtle/50 bg-bg-secondary/30 p-1.5 transition-colors hover:bg-bg-secondary/50"
                                        key={server._id}
                                    >
                                        <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-bg-secondary">
                                            {server.icon ? (
                                                <img
                                                    alt={server.name}
                                                    className="h-full w-full object-cover"
                                                    src={
                                                        resolveApiUrl(
                                                            server.icon,
                                                        ) || ''
                                                    }
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-black text-primary">
                                                    {server.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[11px] leading-tight font-bold">
                                                {server.name}
                                                {server.isOwner && (
                                                    <span className="ml-1 text-[8px] font-black text-caution uppercase">
                                                        Owner
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[9px] font-medium text-muted-foreground uppercase">
                                                Joined{' '}
                                                {new Date(
                                                    server.joinedAt,
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </div>
    );
};
