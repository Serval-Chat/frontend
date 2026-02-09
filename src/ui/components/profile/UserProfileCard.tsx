import React, { useMemo } from 'react';

import { Calendar, Camera, Server } from 'lucide-react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import type { AdminExtendedUser } from '@/types/admin';
import { Heading } from '@/ui/components/common/Heading';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { UserBadge } from '@/ui/components/common/UserBadge';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { type UserStatus } from '@/ui/components/common/UserProfileStatusIndicator';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

interface UserProfileCardProps {
    user?: User | Partial<User>;
    role?: Role;
    roles?: Role[];
    joinedAt?: string;
    className?: string;
    style?: React.CSSProperties;
    presenceStatus?: UserStatus;
    customStatus?: { text?: string; emoji?: string };
    onBannerClick?: () => void;
    onAvatarClick?: () => void;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
    adminData?: AdminExtendedUser;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
    user,
    role,
    roles,
    joinedAt,
    className,
    style,
    presenceStatus: propPresenceStatus,
    customStatus,
    onBannerClick,
    onAvatarClick,
    disableCustomFonts = false,
    disableGlow = false,
    adminData,
}) => {
    const userId = user?._id;
    const presence = useAppSelector((state) =>
        userId ? state.presence.users[userId] : undefined,
    );

    const finalStatus = (propPresenceStatus ||
        presence?.status ||
        'offline') as UserStatus;
    const finalCustomText =
        customStatus?.text ||
        presence?.customStatus ||
        user?.customStatus?.text;
    const finalCustomEmoji = customStatus?.emoji || user?.customStatus?.emoji;
    const defaultColor = '#5865F2';
    const bannerColor = disableCustomFonts
        ? defaultColor
        : user?.usernameGradient?.colors?.[0] || defaultColor;

    const userBio = user?.bio;
    const bioNodes = useMemo(
        () => (userBio ? parseText(userBio, ParserPresets.BIO) : []),
        [userBio],
    );

    return (
        <div
            className={`w-[340px] bg-[var(--color-background)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--color-border-subtle)] ${className || ''}`}
            style={style}
        >
            <Box
                className={`h-[120px] relative w-full overflow-hidden shrink-0 ${onBannerClick ? 'cursor-pointer group/banner' : ''}`}
                style={{
                    backgroundColor: bannerColor,
                }}
                onClick={onBannerClick}
            >
                {user?.banner && user.banner.trim() !== '' && (
                    <img
                        alt="User Banner"
                        className="w-full h-full object-cover"
                        src={resolveApiUrl(user.banner) || ''}
                    />
                )}
                {onBannerClick && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-200 text-white text-xs font-bold uppercase">
                        <Camera size={24} />
                        <span>Change Banner</span>
                    </div>
                )}
            </Box>

            <Box className="relative z-content -mt-[50px] px-4">
                <Box
                    className={`p-1.5 bg-[var(--color-background)] rounded-full inline-block relative ${onAvatarClick ? 'cursor-pointer group/avatar' : ''}`}
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
                        <div className="absolute inset-1.5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 text-white">
                            <Camera size={20} />
                        </div>
                    )}
                </Box>
            </Box>

            <Box className="p-4 pt-2">
                <Box className="mb-4">
                    <StyledUserName
                        className="text-xl font-bold leading-tight w-full truncate"
                        disableCustomFonts={disableCustomFonts}
                        disableGlow={disableGlow}
                        role={role}
                        user={user as User}
                    >
                        {user?.displayName || user?.username}
                    </StyledUserName>

                    <Box className="text-sm text-[var(--color-muted-foreground)] font-medium select-text">
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
                        <Box className="flex flex-wrap gap-1.5 mt-2">
                            {user.badges.map((badge) => (
                                <UserBadge badge={badge} key={badge._id} />
                            ))}
                        </Box>
                    )}
                </Box>

                {(finalCustomText || finalCustomEmoji) &&
                    finalStatus !== 'offline' && (
                        <Box className="mb-4 text-sm text-foreground/80 flex items-center gap-2">
                            {finalCustomEmoji && (
                                <Text as="span">{finalCustomEmoji}</Text>
                            )}
                            <Text as="span">{finalCustomText}</Text>
                        </Box>
                    )}

                <Box className="h-px bg-[var(--color-divider)] w-full my-3" />

                {user?.bio && (
                    <Box className="mb-4">
                        <Heading
                            className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2"
                            level={3}
                        >
                            About Me
                        </Heading>
                        <Box className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            <ParsedText nodes={bioNodes} size="xs" />
                        </Box>
                    </Box>
                )}

                <Box className="flex gap-4 mb-4">
                    <Box className="flex-1 min-w-0">
                        <Heading
                            className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2"
                            level={3}
                        >
                            Member Since
                        </Heading>
                        <Box className="text-sm text-foreground/80 flex items-center gap-2">
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
                        <Box className="flex-1 min-w-0">
                            <Heading
                                className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2 truncate"
                                level={3}
                            >
                                Joined Server
                            </Heading>
                            <Box className="text-sm text-foreground/80 flex items-center gap-2">
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
                            className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2"
                            level={3}
                        >
                            Roles
                        </Heading>
                        <Box className="flex flex-wrap gap-2">
                            {[...roles]
                                .sort((a, b) => b.position - a.position)
                                .map((r) => (
                                    <Box
                                        className="flex items-center gap-1.5 px-2 py-1 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border-subtle)]"
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

                {adminData && (
                    <Box className="mt-2 space-y-4 border-t border-[var(--color-divider)] pt-4">
                        <Heading
                            className="uppercase text-[10px] font-black text-danger tracking-[0.2em] mb-2"
                            level={3}
                        >
                            Administrative View
                        </Heading>

                        {/* Admin Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-bg-secondary/50 border border-border-subtle">
                                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
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
                            <div className="p-2 rounded-lg bg-bg-secondary/50 border border-border-subtle">
                                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                    Account Status
                                </span>
                                <span className="text-sm font-black text-success">
                                    Active
                                </span>
                            </div>
                        </div>

                        {/* Banned Info */}
                        {adminData.banExpiry && (
                            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">
                                <span className="font-bold uppercase tracking-tight">
                                    Banned Until:
                                </span>
                                <span className="block font-black mt-0.5">
                                    {new Date(
                                        adminData.banExpiry,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Servers List */}
                        <Box>
                            <Heading
                                className="uppercase text-[9px] font-bold text-muted-foreground tracking-widest mb-2 flex items-center gap-1.5"
                                level={3}
                            >
                                <Server size={10} /> Joined Servers (
                                {adminData.servers.length})
                            </Heading>
                            <Box className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {adminData.servers.map((server) => (
                                    <div
                                        className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-secondary/30 border border-border-subtle/50 hover:bg-bg-secondary/50 transition-colors"
                                        key={server._id}
                                    >
                                        <div className="w-6 h-6 rounded bg-bg-secondary flex-shrink-0 overflow-hidden">
                                            {server.icon ? (
                                                <img
                                                    alt={server.name}
                                                    className="w-full h-full object-cover"
                                                    src={
                                                        resolveApiUrl(
                                                            server.icon,
                                                        ) || ''
                                                    }
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-primary/10 text-primary">
                                                    {server.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold truncate leading-tight">
                                                {server.name}
                                                {server.isOwner && (
                                                    <span className="ml-1 text-[8px] text-caution font-black uppercase">
                                                        Owner
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground uppercase font-medium">
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
