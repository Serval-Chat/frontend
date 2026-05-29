import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { useLocation, useParams } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { RolePermissions } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';

export interface UsePermissionsReturn {
    permissions: Record<keyof RolePermissions, boolean>;
    hasPermission: (permission: keyof RolePermissions) => boolean;
    isOwner: boolean;
    isTimedOut: boolean;
    remainingTimeoutMs: number;
    isLoading: boolean;
}

let globalNow = Date.now();
let intervalId: ReturnType<typeof setInterval> | null = null;
const timeListeners = new Set<() => void>();

const startTimeInterval = (): void => {
    if (intervalId !== null) return;
    intervalId = setInterval((): void => {
        globalNow = Date.now();
        timeListeners.forEach((l): void => l());
    }, 1000);
};

const stopTimeInterval = (): void => {
    if (timeListeners.size === 0 && intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
};

const subscribeTime = (callback: () => void): (() => void) => {
    timeListeners.add(callback);
    startTimeInterval();
    return (): void => {
        timeListeners.delete(callback);
        stopTimeInterval();
    };
};

const getTimeSnapshot = (): number => globalNow;
const getServerTimeSnapshot = (): number => 0;

export const usePermissions = (
    serverId: string | null,
    channelId?: string | null,
    options?: { enabled?: boolean },
): UsePermissionsReturn => {
    const location = useLocation();
    const params = useParams();
    const isServerRoute = location.pathname.includes('/@server/');
    const isEnabled =
        (options?.enabled ?? true) &&
        isServerRoute &&
        serverId === params.serverId;

    const { data: currentUser } = useMe();
    const { data: members } = useMembers(serverId, { enabled: isEnabled });
    const { data: roles } = useRoles(serverId, { enabled: isEnabled });
    const { data: server } = useServerDetails(serverId, { enabled: isEnabled });
    const { data: channels } = useChannels(serverId, {
        enabled: isEnabled && !!channelId,
    });
    const { data: categories } = useCategories(serverId, {
        enabled: isEnabled && !!channelId,
    });

    const memberByUserId = useMemo(() => {
        const map = new Map<string, NonNullable<typeof members>[number]>();
        members?.forEach((serverMember): void => {
            map.set(serverMember.userId, serverMember);
        });
        return map;
    }, [members]);

    const channelById = useMemo(() => {
        const map = new Map<string, NonNullable<typeof channels>[number]>();
        channels?.forEach((channel): void => {
            map.set(channel._id, channel);
        });
        return map;
    }, [channels]);

    const categoryById = useMemo(() => {
        const map = new Map<string, NonNullable<typeof categories>[number]>();
        categories?.forEach((category): void => {
            map.set(category._id, category);
        });
        return map;
    }, [categories]);

    const member = useMemo(() => {
        if (!members || !currentUser || !serverId) return null;
        return memberByUserId.get(currentUser._id) ?? null;
    }, [members, currentUser, serverId, memberByUserId]);

    const isOwner = !!(
        server?.ownerId &&
        currentUser?._id &&
        server.ownerId === currentUser._id
    );

    const shouldTrackTime = !!member?.communicationDisabledUntil && !isOwner;

    const now = useSyncExternalStore(
        shouldTrackTime ? subscribeTime : (): (() => void) => (): void => {},
        shouldTrackTime ? getTimeSnapshot : (): number => 0,
        shouldTrackTime ? getServerTimeSnapshot : (): number => 0,
    );

    const userRoles = useMemo(() => {
        if (!member || !roles) return [];
        return roles
            .filter((role): boolean => member.roles.includes(role._id))
            .sort((a, b): number => b.position - a.position);
    }, [member, roles]);

    const everyoneRole = useMemo(
        () => roles?.find((r): boolean => r.name === '@everyone'),
        [roles],
    );

    const permissions = useMemo((): Record<keyof RolePermissions, boolean> => {
        const perms: Record<keyof RolePermissions, boolean> = {
            sendMessages: false,
            manageMessages: false,
            deleteMessagesOfOthers: false,
            manageChannels: false,
            manageRoles: false,
            banMembers: false,
            kickMembers: false,
            manageInvites: false,
            manageServer: false,
            manageWebhooks: false,
            administrator: false,
            pingRolesAndEveryone: false,
            manageReactions: false,
            addReactions: false,
            viewCategories: false,
            viewChannels: false,
            connect: false,
            exportChannelMessages: false,
            bypassSlowmode: false,
            bypassMarkdownRestrictions: false,
            pinMessages: false,
            seeDeletedMessages: false,
            moderateMembers: false,
            manageStickers: false,
        };

        if (!serverId || !currentUser) return perms;

        // Owner has all permissions
        if (
            server?.ownerId &&
            currentUser?._id &&
            server.ownerId === currentUser._id
        ) {
            Object.keys(perms).forEach((key): void => {
                perms[key as keyof RolePermissions] = true;
            });
            return perms;
        }

        if (!member) {
            if (import.meta.env.DEV) {
                console.warn(
                    '[usePermissions] No member record found for current user - all permissions default to false.',
                    {
                        serverId,
                        currentUserId: currentUser?._id,
                        memberUserIds: members?.map((m): string => m.userId),
                    },
                );
            }
            return perms;
        }

        // Administrator has all permissions
        if (
            userRoles.some(
                (r): boolean | undefined => r.permissions?.administrator,
            )
        ) {
            Object.keys(perms).forEach((key): void => {
                perms[key as keyof RolePermissions] = true;
            });
            return perms;
        }

        const evaluatePermission = (
            permKey: keyof RolePermissions,
        ): boolean => {
            const getOverride = (
                overrides?: Record<string, Record<string, boolean>>,
            ): boolean | undefined => {
                if (!overrides) return undefined;
                let hasDeny = false;

                for (const role of userRoles) {
                    const roleOver = overrides[role._id];
                    if (roleOver && roleOver[permKey] !== undefined) {
                        if (roleOver[permKey]) return true;
                        hasDeny = true;
                    }
                }

                const everyoneId = everyoneRole?._id;
                const everyoneOver =
                    (everyoneId ? overrides[everyoneId] : undefined) ??
                    overrides['everyone'];

                if (everyoneOver && everyoneOver[permKey] !== undefined) {
                    if (everyoneOver[permKey]) return true;
                    hasDeny = true;
                }

                return hasDeny ? false : undefined;
            };

            if (channelId && channels) {
                const channel = channelById.get(channelId);

                // 1. Channel Overrides
                if (permKey !== 'viewCategories') {
                    const channelOverride = getOverride(channel?.permissions);
                    if (channelOverride !== undefined) return channelOverride;
                }

                // 2. Category Overrides
                const category =
                    channel?.categoryId && categories
                        ? categoryById.get(channel.categoryId)
                        : null;
                const categoryOverride = getOverride(category?.permissions);
                if (categoryOverride !== undefined) return categoryOverride;
            }

            // 3. Base Server Permissions
            if (
                userRoles.some(
                    (r): boolean | undefined => r.permissions?.[permKey],
                )
            )
                return true;
            if (everyoneRole?.permissions?.[permKey]) return true;

            if (
                permKey === 'viewCategories' ||
                permKey === 'viewChannels' ||
                permKey === 'connect'
            )
                return true;
            return false;
        };

        Object.keys(perms).forEach((key): void => {
            perms[key as keyof RolePermissions] = evaluatePermission(
                key as keyof RolePermissions,
            );
        });

        if (!perms.viewChannels || !perms.viewCategories) {
            perms.sendMessages = false;
        }

        if (!perms.viewChannels && channelId) {
            if (import.meta.env.DEV) {
                console.warn(
                    `[usePermissions] viewChannels=false for channel ${channelId} (server ${serverId})`,
                    {
                        channelPermissions:
                            channelById.get(channelId)?.permissions,
                        userRoles: userRoles.map(
                            (
                                r,
                            ): {
                                id: string;
                                name: string;
                                position: number;
                            } => ({
                                id: r._id,
                                name: r.name,
                                position: r.position,
                            }),
                        ),
                        everyonePermissions: everyoneRole?.permissions,
                        computedPerms: perms,
                    },
                );
            }
        }
        return perms;
    }, [
        serverId,
        currentUser,
        server,
        member,
        userRoles,
        everyoneRole,
        channelId,
        channels,
        categories,
        members,
        channelById,
        categoryById,
    ]);

    const isTimedOut =
        !!member?.communicationDisabledUntil &&
        !isOwner &&
        new Date(member.communicationDisabledUntil).getTime() > now;

    const remainingTimeoutMs =
        !member?.communicationDisabledUntil || isOwner
            ? 0
            : Math.max(
                  0,
                  new Date(member.communicationDisabledUntil).getTime() - now,
              );

    const hasPermission = useCallback(
        (permission: keyof RolePermissions): boolean =>
            permissions[permission] || false,
        [permissions],
    );

    return useMemo(
        () => ({
            permissions,
            hasPermission,
            isOwner,
            isTimedOut,
            remainingTimeoutMs,
            isLoading:
                !currentUser ||
                !members ||
                !roles ||
                !server ||
                (!!channelId && (!channels || !categories)),
        }),
        [
            permissions,
            hasPermission,
            isOwner,
            isTimedOut,
            remainingTimeoutMs,
            currentUser,
            members,
            roles,
            server,
            channelId,
            channels,
            categories,
        ],
    );
};
