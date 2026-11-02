import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { useLocation, useParams } from 'react-router-dom';

import {
    useCategories,
    useChannels,
    useMemberByUserId,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type {
    Category,
    Channel,
    RolePermissions,
} from '@/api/servers/servers.types';
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
        for (const l of timeListeners) l();
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

export const useChannelAccessMap = (
    serverId: string | null,
    channels: Channel[],
    categories: Category[],
): {
    accessByChannelId: Map<
        string,
        { canViewChannels: boolean; canConnect: boolean }
    >;
    canManageChannels: boolean;
    isOwner: boolean;
    isLoading: boolean;
} => {
    const { data: currentUser } = useMe();
    const { data: member, isLoading: isLoadingMember } = useMemberByUserId(
        serverId,
        currentUser?.id,
        { enabled: !!serverId },
    );
    const { data: roles } = useRoles(serverId, { enabled: !!serverId });
    const { data: server } = useServerDetails(serverId, {
        enabled: !!serverId,
    });

    const isOwner = !!(
        server?.ownerId &&
        currentUser?.id &&
        server.ownerId === currentUser.id
    );

    const { accessByChannelId, canManageChannels } = useMemo(() => {
        const access = new Map<
            string,
            { canViewChannels: boolean; canConnect: boolean }
        >();
        const assignedRoles = (roles ?? []).filter(
            (role): boolean => !!member?.roles.includes(role.id),
        );
        const everyoneRole = roles?.find(
            (role): boolean => role.name === '@everyone',
        );
        const isAdministrator =
            isOwner ||
            assignedRoles.some(
                (role): boolean | undefined => role.permissions?.administrator,
            );
        const categoryById = new Map(
            categories.map((category): [string, Category] => [
                category.id,
                category,
            ]),
        );

        const getOverride = (
            overrides: Record<string, Record<string, boolean>> | undefined,
            permission: keyof RolePermissions,
        ): boolean | undefined => {
            if (!overrides) return undefined;

            for (const role of assignedRoles) {
                if (overrides[role.id]?.[permission] === true) return true;
            }

            const everyoneOverrides =
                (everyoneRole ? overrides[everyoneRole.id] : undefined) ??
                overrides.everyone;
            if (everyoneOverrides?.[permission] === true) return true;

            const hasExplicitDeny =
                assignedRoles.some(
                    (role): boolean =>
                        overrides[role.id]?.[permission] === false,
                ) || everyoneOverrides?.[permission] === false;
            return hasExplicitDeny ? false : undefined;
        };

        const evaluateBasePermission = (
            permission: keyof RolePermissions,
        ): boolean => {
            if (isAdministrator) return true;

            const values = [
                ...assignedRoles.map(
                    (role): boolean | undefined =>
                        role.permissions?.[permission],
                ),
                everyoneRole?.permissions?.[permission],
            ];
            if (values.some((value): boolean => value === true)) return true;
            if (values.some((value): boolean => value !== undefined)) {
                return false;
            }

            return permission === 'viewChannels' || permission === 'connect';
        };

        for (const channel of channels) {
            if (!member && !isOwner) {
                access.set(channel.id, {
                    canViewChannels: false,
                    canConnect: false,
                });
                continue;
            }

            const category = channel.categoryId
                ? categoryById.get(channel.categoryId)
                : undefined;
            const evaluateChannelPermission = (
                permission: 'viewChannels' | 'connect',
            ): boolean => {
                if (isAdministrator) return true;

                const override =
                    getOverride(channel.permissions, permission) ??
                    getOverride(category?.permissions, permission);
                return override ?? evaluateBasePermission(permission);
            };

            access.set(channel.id, {
                canViewChannels: evaluateChannelPermission('viewChannels'),
                canConnect: evaluateChannelPermission('connect'),
            });
        }

        return {
            accessByChannelId: access,
            canManageChannels: evaluateBasePermission('manageChannels'),
        };
    }, [channels, categories, roles, member, isOwner]);

    return {
        accessByChannelId,
        canManageChannels,
        isOwner,
        isLoading: !currentUser || isLoadingMember || !roles || !server,
    };
};

const usePermissionData = (
    serverId: string | null,
    channelId: string | null | undefined,
    isEnabled: boolean,
): UsePermissionsReturn => {
    const { data: currentUser } = useMe();
    const { data: currentMember, isLoading: isLoadingMembers } =
        useMemberByUserId(serverId, currentUser?.id, { enabled: isEnabled });
    const { data: roles } = useRoles(serverId, { enabled: isEnabled });
    const { data: server } = useServerDetails(serverId, { enabled: isEnabled });
    const { data: channels } = useChannels(serverId, {
        enabled: isEnabled && !!channelId,
    });
    const { data: categories } = useCategories(serverId, {
        enabled: isEnabled && !!channelId,
    });

    const channelById = useMemo(() => {
        const map = new Map<string, NonNullable<typeof channels>[number]>();
        if (channels)
            for (const channel of channels) {
                map.set(channel.id, channel);
            }
        return map;
    }, [channels]);

    const categoryById = useMemo(() => {
        const map = new Map<string, NonNullable<typeof categories>[number]>();
        if (categories)
            for (const category of categories) {
                map.set(category.id, category);
            }
        return map;
    }, [categories]);

    const member = currentMember ?? null;

    const isOwner = !!(
        server?.ownerId &&
        currentUser?.id &&
        server.ownerId === currentUser.id
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
            .filter((role): boolean => member.roles.includes(role.id))
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
            inviteUsers: false,
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
            useExternalEmojisAndStickers: false,
        };

        if (!serverId || !currentUser) return perms;

        // Owner has all permissions
        if (
            server?.ownerId &&
            currentUser?.id &&
            server.ownerId === currentUser.id
        ) {
            for (const key of Object.keys(perms)) {
                perms[key as keyof RolePermissions] = true;
            }
            return perms;
        }

        if (!member) {
            if (import.meta.env.DEV) {
                console.warn(
                    '[usePermissions] No member record found for current user - all permissions default to false.',
                    {
                        serverId,
                        currentUserId: currentUser?.id,
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
            for (const key of Object.keys(perms)) {
                perms[key as keyof RolePermissions] = true;
            }
            return perms;
        }

        const evaluatePermission = (
            permKey: keyof RolePermissions,
        ): boolean => {
            const getOverride = (
                overrides?: Record<string, Record<string, boolean>>,
            ): boolean | undefined => {
                if (!overrides) return undefined;

                for (const role of userRoles) {
                    const roleOver = overrides[role.id];
                    if (roleOver?.[permKey] === true) {
                        return true;
                    }
                }

                const everyoneId = everyoneRole?.id;
                const everyoneOver =
                    (everyoneId ? overrides[everyoneId] : undefined) ??
                    overrides.everyone;

                if (everyoneOver?.[permKey] === true) {
                    return true;
                }

                let hasExplicitDeny = false;
                for (const role of userRoles) {
                    const roleOver = overrides[role.id];
                    if (roleOver?.[permKey] === false) {
                        hasExplicitDeny = true;
                    }
                }

                if (everyoneOver?.[permKey] === false) {
                    hasExplicitDeny = true;
                }

                return hasExplicitDeny ? false : undefined;
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
            const roleValues = [
                ...userRoles.map(
                    (r): boolean | undefined => r.permissions?.[permKey],
                ),
                everyoneRole?.permissions?.[permKey],
            ];
            if (roleValues.some((v): boolean => v === true)) return true;
            if (roleValues.some((v): boolean => v !== undefined)) return false;

            if (
                permKey === 'viewCategories' ||
                permKey === 'viewChannels' ||
                permKey === 'connect' ||
                permKey === 'useExternalEmojisAndStickers'
            )
                return true;
            return false;
        };

        for (const key of Object.keys(perms)) {
            perms[key as keyof RolePermissions] = evaluatePermission(
                key as keyof RolePermissions,
            );
        }

        if (!perms.viewChannels || !perms.viewCategories) {
            perms.sendMessages = false;
        }

        if (!perms.viewChannels && channelId && import.meta.env.DEV) {
            console.warn(
                `[usePermissions] viewChannels=false for channel ${channelId} (server ${serverId})`,
                {
                    channelPermissions: channelById.get(channelId)?.permissions,
                    userRoles: userRoles.map(
                        (
                            r,
                        ): {
                            id: string;
                            name: string;
                            position: number;
                        } => ({
                            id: r.id,
                            name: r.name,
                            position: r.position,
                        }),
                    ),
                    everyonePermissions: everyoneRole?.permissions,
                    computedPerms: perms,
                },
            );
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
                isLoadingMembers ||
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
            isLoadingMembers,
            roles,
            server,
            channelId,
            channels,
            categories,
        ],
    );
};

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

    return usePermissionData(serverId, channelId, isEnabled);
};

export const usePermissionsForActiveServer = (
    serverId: string | null,
    channelId: string,
): UsePermissionsReturn => usePermissionData(serverId, channelId, !!serverId);
