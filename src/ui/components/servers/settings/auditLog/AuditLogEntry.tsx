import React, { useState } from 'react';

import {
    AtSign,
    ChevronDown,
    ChevronRight,
    Crown,
    Edit2,
    Link,
    PlusCircle,
    Repeat,
    Settings,
    ShieldAlert,
    Smile,
    Trash2,
    UserMinus,
    UserPlus,
    UserX,
} from 'lucide-react';

import type { AuditLogEntry as IAuditLogEntry } from '@/api/auditLog/auditLog.types';
import { useRoles } from '@/api/servers/servers.queries';
import { Text } from '@/ui/components/common/Text';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { getRoleStyle } from '@/utils/roleColor';

import { AuditLogDiff } from './AuditLogDiff';

interface AuditLogEntryProps {
    entry: IAuditLogEntry;
    serverId: string;
    globalExpandState?: 'expanded' | 'collapsed' | null;
}

const getActionDetails = (
    action: string,
): { icon: React.ElementType; color: string; bg: string } => {
    switch (action) {
        case 'create_channel':
        case 'create_category':
        case 'role_created':
        case 'role_create':
            return {
                icon: PlusCircle,
                color: 'text-green-500',
                bg: 'bg-green-500/10',
            };
        case 'edit_channel':
        case 'edit_category':
        case 'role_edited':
        case 'role_update':
        case 'update_server':
        case 'role_icon_updated':
        case 'edit_message':
            return {
                icon: Edit2,
                color: 'text-yellow-500',
                bg: 'bg-yellow-500/10',
            };
        case 'delete_channel':
        case 'delete_category':
        case 'role_removed':
        case 'role_delete':
        case 'delete_message':
        case 'reactions_removed':
        case 'reaction_clear':
            return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' };
        case 'user_kick':
            return {
                icon: UserMinus,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
            };
        case 'user_ban':
            return { icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' };
        case 'user_unban':
            return {
                icon: UserPlus,
                color: 'text-green-500',
                bg: 'bg-green-500/10',
            };
        case 'user_join':
        case 'member_join':
            return {
                icon: UserPlus,
                color: 'text-green-500',
                bg: 'bg-green-500/10',
            };
        case 'user_leave':
            return {
                icon: UserMinus,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
            };
        case 'owner_changed':
            return {
                icon: Crown,
                color: 'text-yellow-400',
                bg: 'bg-yellow-400/10',
            };
        case 'role_given':
            return {
                icon: ShieldAlert,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
            };
        case 'emoji_create':
        case 'emoji_delete':
            return {
                icon: Smile,
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
            };
        case 'invite_create':
        case 'invite_delete':
            return { icon: Link, color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
        case 'roles_reordered':
            return {
                icon: Repeat,
                color: 'text-yellow-500',
                bg: 'bg-yellow-500/10',
            };
        default:
            return {
                icon: Settings,
                color: 'text-gray-500',
                bg: 'bg-gray-500/10',
            };
    }
};

const formatActionName = (action: string): string =>
    action
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export const AuditLogEntry: React.FC<AuditLogEntryProps> = ({
    entry,
    serverId,
    globalExpandState,
}) => {
    const { icon: Icon, color, bg } = getActionDetails(entry.action);
    const [expandedRoles, setExpandedRoles] = useState(false);

    const [prevGlobalExpandState, setPrevGlobalExpandState] =
        useState(globalExpandState);
    if (globalExpandState !== prevGlobalExpandState) {
        setPrevGlobalExpandState(globalExpandState);
        if (globalExpandState === 'expanded') {
            setExpandedRoles(true);
        } else if (globalExpandState === 'collapsed') {
            setExpandedRoles(false);
        }
    }

    const { data: roles } = useRoles(serverId);

    const getTargetDisplay = (): string => {
        if (entry.action === 'role_given' || entry.action === 'role_removed') {
            const roleName = entry.metadata?.roleName
                ? `role "${String(entry.metadata.roleName)}"`
                : 'a role';
            const userName = entry.target?.username
                ? ` @${entry.target.username}`
                : entry.target?.name
                  ? ` @${entry.target.name}`
                  : '';
            const preposition = entry.action === 'role_given' ? 'to' : 'from';
            return `${roleName}${userName ? ` ${preposition}${userName}` : ''}`;
        }

        if (entry.action === 'delete_message') {
            const author = entry.target?.username
                ? `${entry.target.username}'s`
                : 'a';
            const channel = entry.metadata?.channelName
                ? `#${entry.metadata.channelName}`
                : entry.metadata?.channelId
                  ? `channel ${entry.metadata.channelId}`
                  : 'a channel';
            return `${author} message in ${channel}`;
        }

        if (entry.action === 'edit_message') {
            const author = entry.target?.username
                ? `${entry.target.username}'s`
                : 'a';
            const channel = entry.metadata?.channelName
                ? `#${entry.metadata.channelName}`
                : entry.metadata?.channelId
                  ? `channel ${entry.metadata.channelId}`
                  : 'a channel';
            return `${author} message in ${channel}`;
        }

        if (
            entry.action === 'emoji_create' ||
            entry.action === 'emoji_delete'
        ) {
            return entry.metadata?.emojiName
                ? `emoji :${entry.metadata.emojiName}:`
                : 'an emoji';
        }

        if (
            entry.action === 'invite_create' ||
            entry.action === 'invite_delete'
        ) {
            return entry.metadata?.code
                ? `invite ${String(entry.metadata.code)}`
                : 'an invite';
        }

        if (entry.action === 'member_join') {
            const code = entry.metadata?.inviteCode
                ? ` via ${String(entry.metadata.inviteCode)}`
                : '';
            return entry.target?.username
                ? `server${code} as @${entry.target.username}`
                : `server${code}`;
        }

        if (entry.action === 'roles_reordered') return 'role order';
        if (entry.action === 'owner_changed') {
            return entry.target?.username
                ? `@${entry.target.username}`
                : 'new owner';
        }

        if (entry.target?.name) {
            if (entry.targetType === 'channel')
                return `channel "#${entry.target.name}"`;
            if (entry.targetType === 'role')
                return `role "${entry.target.name}"`;
            if (entry.targetType === 'category')
                return `category "${entry.target.name}"`;
            if (entry.targetType === 'user')
                return `user @${entry.target.name}`;
            return `target "${entry.target.name}"`;
        }

        if (entry.metadata?.channelName)
            return `channel "#${entry.metadata.channelName}"`;
        if (entry.metadata?.roleName)
            return `role "${entry.metadata.roleName}"`;
        if (entry.metadata?.categoryName)
            return `category "${entry.metadata.categoryName}"`;

        if (entry.target?.username) return `user @${entry.target.username}`;

        if (entry.targetType === 'server') return 'the server';

        if (entry.metadata?.channelId)
            return `channel ${entry.metadata.channelId}`;
        if (entry.targetId) return `ID: ${entry.targetId}`;

        return 'the server';
    };

    const targetDisplay = getTargetDisplay();

    const renderRoleReorderVisualizer = (
        oldOrder: string[],
        newOrder: string[],
    ): React.ReactNode => {
        const ITEM_HEIGHT_PX = 28;
        const SVG_WIDTH_PX = 50;

        const renderRoleItem = (
            roleName: string,
            indicator?: React.ReactNode,
        ): React.ReactNode => {
            const role = roles?.find((r) => r.name === roleName);
            const style = getRoleStyle(role);

            return (
                <li
                    className={`mb-1.5 flex items-center truncate rounded px-2 text-sm shadow-sm transition-all ${role ? 'font-medium text-white' : 'bg-bg-base text-text-muted border border-border-subtle'}`}
                    key={String(roleName)}
                    style={{
                        height: ITEM_HEIGHT_PX,
                        ...(role ? style : {}),
                    }}
                    title={String(roleName)}
                >
                    <AtSign className="mr-1 shrink-0" size={14} />
                    <span className="truncate">{String(roleName)}</span>
                    {indicator && (
                        <div className="ml-auto flex items-center pl-2">
                            {indicator}
                        </div>
                    )}
                </li>
            );
        };

        return (
            <div className="relative mt-4 flex items-start gap-2 overflow-x-auto pb-2 opacity-90">
                {/* Left List */}
                <div className="min-w-[120px] flex-1">
                    <div className="text-text-muted mb-2 text-xs font-medium tracking-wider uppercase">
                        Previous
                    </div>
                    <ul
                        className="flex flex-col"
                        style={{ padding: 0, margin: 0 }}
                    >
                        {oldOrder.map((roleName) =>
                            renderRoleItem(String(roleName)),
                        )}
                    </ul>
                </div>

                {/* Middle SVG Canvas */}
                <div
                    className="hidden flex-none pt-6 sm:block"
                    style={{ width: SVG_WIDTH_PX }}
                >
                    <svg
                        height={oldOrder.length * (ITEM_HEIGHT_PX + 6)}
                        style={{ overflow: 'visible' }}
                        width={SVG_WIDTH_PX}
                    >
                        <defs>
                            <marker
                                id="arrowhead-moved"
                                markerHeight="8"
                                markerUnits="userSpaceOnUse"
                                markerWidth="8"
                                orient="auto"
                                refX="0"
                                refY="4"
                            >
                                <polygon
                                    fill="#3b82f6"
                                    points="0 0, 8 4, 0 8"
                                />
                            </marker>
                            <marker
                                id="arrowhead-static"
                                markerHeight="8"
                                markerUnits="userSpaceOnUse"
                                markerWidth="8"
                                orient="auto"
                                refX="0"
                                refY="4"
                            >
                                <polygon
                                    fill="#52525b"
                                    opacity="0.5"
                                    points="0 0, 8 4, 0 8"
                                />
                            </marker>
                        </defs>
                        {oldOrder.map((roleName, i) => {
                            const j = newOrder.indexOf(roleName);
                            if (j === -1) return null;

                            const gap = 6;
                            const y1 =
                                i * (ITEM_HEIGHT_PX + gap) + ITEM_HEIGHT_PX / 2;
                            const y2 =
                                j * (ITEM_HEIGHT_PX + gap) + ITEM_HEIGHT_PX / 2;

                            const isMoved = i !== j;
                            const strokeColor = isMoved ? '#3b82f6' : '#52525b';
                            const opacity = isMoved ? 1 : 0.3;
                            const marker = isMoved
                                ? 'url(#arrowhead-moved)'
                                : 'url(#arrowhead-static)';

                            const endX = SVG_WIDTH_PX - 8;
                            const d = `M 0 ${y1} C ${SVG_WIDTH_PX / 2} ${y1}, ${SVG_WIDTH_PX / 2} ${y2}, ${endX} ${y2}`;

                            return (
                                <path
                                    className="transition-all duration-300"
                                    d={d}
                                    fill="none"
                                    key={`path-${roleName}`}
                                    markerEnd={marker}
                                    opacity={opacity}
                                    stroke={strokeColor}
                                    strokeWidth="1.5"
                                />
                            );
                        })}
                    </svg>
                </div>

                {/* Right List */}
                <div className="min-w-[140px] flex-1">
                    <div className="text-text-muted mb-2 text-xs font-medium tracking-wider uppercase">
                        New
                    </div>
                    <ul
                        className="flex flex-col"
                        style={{ padding: 0, margin: 0 }}
                    >
                        {newOrder.map((roleName) => {
                            const oldIndex = oldOrder.indexOf(String(roleName));
                            const newIndex = newOrder.indexOf(String(roleName));
                            const diff =
                                oldIndex !== -1 ? oldIndex - newIndex : 0;
                            let indicator = null;
                            if (diff > 0) {
                                indicator = (
                                    <span className="rounded bg-black/20 px-1 text-xs font-bold text-green-300">
                                        ↑ {diff}
                                    </span>
                                );
                            } else if (diff < 0) {
                                indicator = (
                                    <span className="rounded bg-black/20 px-1 text-xs font-bold text-red-300">
                                        ↓ {Math.abs(diff)}
                                    </span>
                                );
                            }

                            return renderRoleItem(String(roleName), indicator);
                        })}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-bg-surface flex items-center gap-4 rounded-lg border border-border-subtle p-4 transition-colors hover:bg-bg-subtle">
            <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${bg}`}
            >
                <Icon className={`h-5 w-5 ${color}`} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <Box className="mr-0.5 flex items-center gap-2">
                            <UserProfilePicture
                                size="sm"
                                src={entry.moderator.avatarUrl}
                                username={entry.moderator.username}
                            />
                            <Text weight="medium">
                                {entry.moderator.username}
                            </Text>
                        </Box>
                        <Text variant="muted">performed</Text>
                        <Text className={color} weight="medium">
                            {formatActionName(entry.action)}
                        </Text>
                        <Text variant="muted">on</Text>
                        <Text weight="medium">{targetDisplay}</Text>
                    </div>

                    <Tooltip
                        content={new Date(entry.createdAt).toLocaleString()}
                    >
                        <Text
                            className="cursor-help whitespace-nowrap"
                            size="sm"
                            variant="muted"
                        >
                            {new Date(entry.createdAt).toLocaleString()}
                        </Text>
                    </Tooltip>
                </div>

                {entry.reason && (
                    <Text className="mt-2 italic" size="sm" variant="muted">
                        Reason: {entry.reason}
                    </Text>
                )}

                {Boolean(entry.metadata?.messageText) && (
                    <div className="bg-bg-base text-text-muted mt-2 rounded border-l-2 border-red-500/50 p-2 text-sm">
                        {String(entry.metadata!.messageText)}
                    </div>
                )}

                {entry.action !== 'roles_reordered' &&
                    entry.changes &&
                    entry.changes.length > 0 && (
                        <AuditLogDiff changes={entry.changes} />
                    )}

                {entry.action === 'roles_reordered' &&
                    Array.isArray(entry.metadata?.roleOrder) && (
                        <div className="mt-2 text-sm">
                            <button
                                className="text-text-muted hover:text-text flex items-center gap-1 text-xs"
                                onClick={() => setExpandedRoles(!expandedRoles)}
                            >
                                {expandedRoles ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                                {expandedRoles
                                    ? 'Hide Order Changes'
                                    : 'Show Order Changes'}
                            </button>
                            {expandedRoles && (
                                <div className="bg-bg-surface mt-2 rounded-md p-3">
                                    {entry.metadata.oldRoleOrder &&
                                    Array.isArray(
                                        entry.metadata.oldRoleOrder,
                                    ) ? (
                                        renderRoleReorderVisualizer(
                                            entry.metadata
                                                .oldRoleOrder as string[],
                                            entry.metadata
                                                .roleOrder as string[],
                                        )
                                    ) : (
                                        <>
                                            <div className="text-text-muted mb-2 text-xs font-medium">
                                                New Order (Highest to Lowest):
                                            </div>
                                            <ol className="text-text-muted ml-1 list-inside list-decimal space-y-0.5">
                                                {(
                                                    entry.metadata
                                                        .roleOrder as string[]
                                                ).map((roleName, i) => (
                                                    // eslint-disable-next-line react/no-array-index-key
                                                    <li key={i}>
                                                        {String(roleName)}
                                                    </li>
                                                ))}
                                            </ol>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                {!!(
                    entry.metadata?.uses !== undefined ||
                    entry.metadata?.inviteUses !== undefined ||
                    entry.metadata?.maxUses !== undefined ||
                    entry.metadata?.inviteMaxUses !== undefined ||
                    entry.metadata?.expiresAt ||
                    entry.metadata?.inviteExpiresAt
                ) && (
                    <div className="text-text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-subtle pt-2 text-sm">
                        {!!(
                            entry.metadata?.uses !== undefined ||
                            entry.metadata?.inviteUses !== undefined
                        ) && (
                            <Text size="sm">
                                Uses:{' '}
                                <span className="text-text-base">
                                    {
                                        (entry.metadata?.uses ??
                                            entry.metadata?.inviteUses) as
                                            | string
                                            | number
                                    }
                                </span>
                            </Text>
                        )}
                        {!!(
                            entry.metadata?.maxUses !== undefined ||
                            entry.metadata?.inviteMaxUses !== undefined
                        ) && (
                            <Text size="sm">
                                Max Uses:{' '}
                                <span className="text-text-base">
                                    {Number(
                                        entry.metadata?.maxUses ??
                                            entry.metadata?.inviteMaxUses,
                                    ) > 0
                                        ? ((entry.metadata?.maxUses ??
                                              entry.metadata?.inviteMaxUses) as
                                              | string
                                              | number)
                                        : 'Infinite'}
                                </span>
                            </Text>
                        )}
                        {!!(
                            entry.metadata?.expiresAt ||
                            entry.metadata?.inviteExpiresAt
                        ) && (
                            <Text size="sm">
                                Expires:{' '}
                                <span className="text-text-base">
                                    {new Date(
                                        String(
                                            entry.metadata?.expiresAt ??
                                                entry.metadata?.inviteExpiresAt,
                                        ),
                                    ).toLocaleString()}
                                </span>
                            </Text>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
