import React, { useMemo } from 'react';

import {
    Calendar,
    Camera,
    Check,
    Globe,
    HelpCircle,
    MessageSquare,
    Plus,
    Server,
    UserMinus,
    UserPlus,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useFriends,
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
import { useAppSelector } from '@/store/hooks';
import type { AdminExtendedUser } from '@/types/admin';
import { BotTag } from '@/ui/components/common/BotTag';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Link } from '@/ui/components/common/Link';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Popover } from '@/ui/components/common/Popover';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { UserBadge } from '@/ui/components/common/UserBadge';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { type UserStatus } from '@/ui/components/common/UserProfileStatusIndicator';
import { Box } from '@/ui/components/layout/Box';
import { ProfileBanner } from '@/ui/components/profile/ProfileBanner';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';
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
    nickname?: string;

    allServerRoles?: Role[];
    canManageRoles?: boolean;
    isOwner?: boolean;
    myHighestRolePosition?: number;
    serverId?: string;
    userId?: string;
}

const RoleSelector = ({
    allRoles,
    userRoles,
    isOwner,
    myHighestRolePosition,
    onAddRole,
    onRemoveRole,
}: {
    allRoles: Role[];
    userRoles?: Role[];
    isOwner: boolean;
    myHighestRolePosition?: number;
    onAddRole: (roleId: string) => void;
    onRemoveRole: (roleId: string) => void;
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const rolesToDisplay = allRoles.filter(
        (r): boolean => r.name !== '@everyone',
    );
    rolesToDisplay.sort((a, b): number => b.position - a.position);

    return (
        <>
            <button
                className="hover:bg-bg-tertiary flex h-5 w-5 items-center justify-center rounded-md border border-border-subtle bg-bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                ref={triggerRef}
                title="Add Role"
                type="button"
                onClick={(): void => setIsOpen(true)}
            >
                <Plus size={14} />
            </button>

            <Popover
                className="w-48 p-1"
                isOpen={isOpen}
                triggerRef={triggerRef}
                onClose={(): void => setIsOpen(false)}
            >
                <Box className="flex flex-col gap-0.5">
                    {rolesToDisplay.length > 0 ? (
                        rolesToDisplay.map((role) => {
                            const hasRole = userRoles?.some(
                                (ur): boolean => ur.id === role.id,
                            );
                            const canManageThisRole =
                                isOwner ||
                                (myHighestRolePosition !== undefined &&
                                    myHighestRolePosition > role.position);

                            return (
                                <button
                                    className={cn(
                                        'flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors',
                                        canManageThisRole
                                            ? 'hover:bg-bg-tertiary cursor-pointer'
                                            : 'cursor-not-allowed opacity-50',
                                    )}
                                    disabled={!canManageThisRole}
                                    key={role.id}
                                    type="button"
                                    onClick={(): void => {
                                        if (hasRole) {
                                            onRemoveRole(role.id);
                                        } else {
                                            onAddRole(role.id);
                                        }
                                    }}
                                >
                                    <Box className="flex items-center gap-2 truncate">
                                        <RoleDot role={role} size={8} />
                                        <span className="truncate">
                                            {role.name}
                                        </span>
                                    </Box>
                                    {hasRole && (
                                        <Check
                                            className="text-primary"
                                            size={14}
                                        />
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <Box className="px-2 py-1.5 text-xs text-muted-foreground">
                            No roles available
                        </Box>
                    )}
                </Box>
            </Popover>
        </>
    );
};

const yiqOf = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
};

const shouldApplyDarkFilter = (hex: string): boolean => yiqOf(hex) < 128;

const mixHex = (a: string, b: string, t: number): string => {
    const ar = parseInt(a.slice(1, 3), 16),
        ag = parseInt(a.slice(3, 5), 16),
        ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16),
        bg = parseInt(b.slice(3, 5), 16),
        bb = parseInt(b.slice(5, 7), 16);
    return `#${Math.round(ar + (br - ar) * t)
        .toString(16)
        .padStart(2, '0')}${Math.round(ag + (bg - ag) * t)
        .toString(16)
        .padStart(2, '0')}${Math.round(ab + (bb - ab) * t)
        .toString(16)
        .padStart(2, '0')}`;
};

const toHex = ([r, g, b]: [number, number, number]): string =>
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

const toRgba = ([r, g, b]: [number, number, number], a: number): string =>
    `rgba(${r},${g},${b},${a})`;

const cardTextVars = (
    primary: string,
): { vars: Record<string, string>; color: string } => {
    const onDark = yiqOf(primary) < 128;
    const fg: [number, number, number] = onDark ? [255, 255, 255] : [0, 0, 0];
    const fgMuted: [number, number, number] = onDark
        ? [213, 213, 213]
        : [30, 30, 30];
    const neutral = onDark
        ? ([255, 255, 255] as [number, number, number])
        : ([0, 0, 0] as [number, number, number]);
    const fgHex = toHex(fg);
    const fgMutedHex = toHex(fgMuted);
    const fgMutedHoverHex = onDark ? '#ffffff' : '#000000';
    const linkHex = fgMutedHex;
    const linkHoverHex = fgMutedHoverHex;
    const vars: Record<string, string> = {
        '--color-foreground': fgHex,
        '--color-muted-foreground': fgMutedHex,
        '--color-muted-foreground-hover': fgMutedHoverHex,
        '--color-text-subtle': fgMutedHex,
        '--color-text-normal': fgHex,
        '--color-border-subtle': toRgba(neutral, 0.15),
        '--color-bg-secondary': toRgba(neutral, 0.1),
        '--color-primary': linkHex,
        '--color-primary-hover': linkHoverHex,
        '--foreground': fgHex,
        '--muted-foreground': fgMutedHex,
        '--muted-foreground-hover': fgMutedHoverHex,
        '--text-normal': fgHex,
        '--text-subtle': fgMutedHex,
        '--border-subtle': toRgba(neutral, 0.15),
        '--bg-secondary': toRgba(neutral, 0.1),
        '--divider': toRgba(neutral, 0.12),
        '--placeholder': toRgba(neutral, 0.3),
        '--primary': linkHex,
        '--primary-hover': linkHoverHex,
    };
    return { vars, color: fgHex };
};

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
}: UserProfileCardProps) => {
    const { data: currentUser } = useMe();
    const navigate = useNavigate();
    const { data: friends } = useFriends();
    const { mutate: sendFriendRequest } = useSendFriendRequest();
    const { mutate: removeFriend } = useRemoveFriend();

    const { mutate: addRole } = useAddRoleToMember(serverId || '');
    const { mutate: removeRole } = useRemoveRoleFromMember(serverId || '');

    const userId = propUserId || user?.id;
    const presence = useAppSelector((state) =>
        userId ? state.presence.users[userId] : undefined,
    );

    const finalStatus = (presence?.status ??
        propPresenceStatus ??
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
            user!.profilePrimaryColor || user!.profileAccentColor!,
        );

    const isOwnProfile = currentUser?.id === user?.id;
    const ps = user?.privacySettings;

    const renderPrivateFieldHint = (field: keyof NonNullable<typeof ps>) =>
        isOwnProfile && ps?.[field] === true ? (
            <Tooltip content="You made this field private" position="top">
                <HelpCircle
                    className="ml-1 shrink-0 text-muted-foreground/60"
                    size={12}
                />
            </Tooltip>
        ) : null;

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
            {cardOnDark && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-negative bg-black/35"
                />
            )}
            <ProfileBanner
                banner={user?.banner}
                bannerColor={user?.bannerColor}
                height={120}
                usernameGradient={user?.usernameGradient}
                onBannerClick={onBannerClick}
            />
            {user?.isPrivate === true && currentUser?.id !== user?.id && (
                <div className="absolute top-3 right-3 z-10">
                    <Tooltip
                        content="This profile is private. Some fields may be hidden from you."
                        position="left"
                    >
                        <div className="flex cursor-default items-center justify-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm">
                            <HelpCircle size={16} />
                        </div>
                    </Tooltip>
                </div>
            )}

            <Box className="pointer-events-none relative z-content -mt-[50px] px-4">
                <Box
                    className={`pointer-events-auto relative flex h-[92px] w-[92px] items-center justify-center rounded-full bg-background p-1.5 ${onAvatarClick ? 'group/avatar cursor-pointer' : ''}`}
                    style={
                        hasCustomColors
                            ? {
                                  backgroundColor: cardOnDark
                                      ? mixHex(
                                            user!.profilePrimaryColor ||
                                                user!.profileAccentColor!,
                                            '#000000',
                                            0.35,
                                        )
                                      : user!.profilePrimaryColor ||
                                        user!.profileAccentColor!,
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
                            {nickname || user?.displayName || user?.username}
                        </StyledUserName>
                        {user?.isBot && <BotTag className="ml-0" />}
                        {renderPrivateFieldHint('hideDisplayName')}
                    </Box>

                    <Box className="mt-1 text-sm font-medium text-muted-foreground select-text">
                        @{user?.username}
                        {user?.pronouns && (
                            <Text
                                as="span"
                                className={
                                    hasCustomColors
                                        ? 'ml-1 inline-flex items-center gap-1 text-foreground/70'
                                        : 'ml-1 inline-flex items-center gap-1 text-muted-foreground/60'
                                }
                            >
                                <span>•</span>
                                {user.pronouns}
                                {renderPrivateFieldHint('hidePronouns')}
                            </Text>
                        )}
                    </Box>
                    {user?.badges && user?.badges.length > 0 && (
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
                    )}
                </Box>

                {(finalCustomText || finalCustomEmoji) && (
                    <Box className="mb-4 flex min-w-0 items-start gap-2 text-xs text-muted-foreground">
                        {finalCustomEmoji && (
                            <Box className="flex shrink-0 items-center">
                                {/^[0-9a-fA-F]{24}$/.test(finalCustomEmoji) ? (
                                    <ParsedEmoji
                                        nonInteractive
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
                        <Text
                            as="span"
                            className="min-w-0 flex-1 break-words whitespace-normal"
                            size="xs"
                            variant="muted"
                        >
                            {finalCustomText}
                            {renderPrivateFieldHint('hideStatus')}
                        </Text>
                    </Box>
                )}

                <Box className="my-3 h-px w-full bg-divider" />

                {user?.bio && (
                    <Box className="mb-4">
                        <div className="mb-2 flex items-center gap-1.5">
                            <Heading
                                className="text-xs font-bold text-muted-foreground uppercase"
                                level={3}
                            >
                                About Me
                            </Heading>
                            {renderPrivateFieldHint('hideBio')}
                        </div>
                        <Box className="text-[10px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                            <ParsedText
                                nodes={bioNodes}
                                size="xs"
                                wrap="preWrap"
                            />
                        </Box>
                    </Box>
                )}

                {visibleConnections.length > 0 && (
                    <Box className="mb-4">
                        <div className="mb-2 flex items-center gap-1.5">
                            <Heading
                                className="text-xs font-bold text-muted-foreground uppercase"
                                level={3}
                            >
                                Connections
                            </Heading>
                            {renderPrivateFieldHint('hideConnections')}
                        </div>
                        <Box className="flex flex-col gap-1.5">
                            {visibleConnections.map((connection) => (
                                <Link
                                    external
                                    className="flex min-w-0 items-center gap-2 text-xs"
                                    href={`https://${connection.value}`}
                                    key={connection.id}
                                    size="xs"
                                >
                                    <Globe className="shrink-0" size={13} />
                                    <span className="truncate">
                                        {connection.value}
                                    </span>
                                </Link>
                            ))}
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
                                        APP_LOCALE,
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
                                        APP_LOCALE,
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

                {((roles && roles.length > 0) ||
                    (canManageRoles && allServerRoles)) && (
                    <Box className="mb-4">
                        <Box className="mb-2 flex items-center justify-between">
                            <Heading
                                className="text-xs font-bold text-muted-foreground uppercase"
                                level={3}
                            >
                                Roles
                            </Heading>
                            {canManageRoles &&
                                allServerRoles &&
                                serverId &&
                                userId && (
                                    <Box className="relative">
                                        <RoleSelector
                                            allRoles={allServerRoles}
                                            isOwner={!!isOwner}
                                            myHighestRolePosition={
                                                myHighestRolePosition
                                            }
                                            userRoles={roles}
                                            onAddRole={(roleId): void =>
                                                addRole({ userId, roleId })
                                            }
                                            onRemoveRole={(roleId): void =>
                                                removeRole({ userId, roleId })
                                            }
                                        />
                                    </Box>
                                )}
                        </Box>
                        <Box className="flex flex-wrap gap-2">
                            {roles &&
                                roles
                                    .slice()
                                    .sort(
                                        (a, b): number =>
                                            b.position - a.position,
                                    )
                                    .map((r) => {
                                        const canManageThisRole =
                                            isOwner ||
                                            (myHighestRolePosition !==
                                                undefined &&
                                                myHighestRolePosition >
                                                    r.position);

                                        const pill = (
                                            <Box
                                                className={cn(
                                                    'group flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary px-2 py-1 transition-all',
                                                    canManageRoles &&
                                                        canManageThisRole &&
                                                        'hover:border-danger/30 hover:bg-danger/5',
                                                )}
                                                key={r.id}
                                            >
                                                <RoleDot role={r} />
                                                <Text
                                                    as="span"
                                                    className="text-xs font-medium text-foreground/90"
                                                >
                                                    {r.name}
                                                </Text>
                                                {canManageRoles &&
                                                    canManageThisRole &&
                                                    userId && (
                                                        <button
                                                            className="ml-0.5 hidden text-muted-foreground group-hover:block hover:text-danger"
                                                            title="Remove Role"
                                                            type="button"
                                                            onClick={(): void =>
                                                                removeRole({
                                                                    userId,
                                                                    roleId: r.id,
                                                                })
                                                            }
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                            </Box>
                                        );

                                        return r.description ? (
                                            <Tooltip
                                                className="z-[10000] max-w-[200px] font-normal whitespace-normal"
                                                content={r.description}
                                                key={r.id}
                                                position="top"
                                            >
                                                {pill}
                                            </Tooltip>
                                        ) : (
                                            <React.Fragment key={r.id}>
                                                {pill}
                                            </React.Fragment>
                                        );
                                    })}
                        </Box>
                    </Box>
                )}

                {currentUser?.id !== user?.id && !user?.isBot && (
                    <Box className="mt-4 flex gap-2">
                        <Button
                            className="flex-1 gap-2"
                            size="sm"
                            style={
                                hasCustomColors
                                    ? {
                                          backgroundColor: cardOnDark
                                              ? 'rgba(255,255,255,0.15)'
                                              : 'rgba(0,0,0,0.1)',
                                          borderColor: cardOnDark
                                              ? 'rgba(255,255,255,0.3)'
                                              : 'rgba(0,0,0,0.2)',
                                          color: cardOnDark
                                              ? '#ffffff'
                                              : '#000000',
                                      }
                                    : undefined
                            }
                            onClick={(): void => {
                                if (user?.id) {
                                    void navigate(`/chat/@user/${user.id}`);
                                }
                            }}
                        >
                            <MessageSquare size={14} />
                            Message
                        </Button>
                        {friends?.some((f): boolean => f.id === user?.id) ? (
                            <Button
                                className="gap-2"
                                size="sm"
                                variant="danger"
                                onClick={(): void => {
                                    if (user?.id) {
                                        removeFriend(user.id);
                                    }
                                }}
                            >
                                <UserMinus size={14} />
                            </Button>
                        ) : (
                            <Button
                                className="gap-2"
                                size="sm"
                                style={
                                    hasCustomColors
                                        ? {
                                              backgroundColor: cardOnDark
                                                  ? 'rgba(255,255,255,0.15)'
                                                  : 'rgba(0,0,0,0.1)',
                                              borderColor: cardOnDark
                                                  ? 'rgba(255,255,255,0.3)'
                                                  : 'rgba(0,0,0,0.2)',
                                              color: cardOnDark
                                                  ? '#ffffff'
                                                  : '#000000',
                                          }
                                        : undefined
                                }
                                variant="normal"
                                onClick={(): void => {
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
                                    ).toLocaleString(APP_LOCALE)}
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
                                        key={server.id}
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
                                                ).toLocaleDateString(
                                                    APP_LOCALE,
                                                )}
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
