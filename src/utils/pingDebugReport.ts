import type { PingNotification } from '@/api/pings/pings.types';
import type { Channel } from '@/api/servers/servers.types';

export interface PingDebugRow {
    id: string;
    type: PingNotification['type'];
    channelId?: string;
    sender: string;
    senderId: string;
    detail: string;
    timestamp: number;
    ageMs: number;
}

export interface PingDebugReport {
    serverId: string;
    badgeCount: number;
    listCount: number;
    totalCount: number;
    mismatch: boolean;
    rows: PingDebugRow[];
}

export interface BuildPingDebugReportInput {
    serverId: string;
    pings: PingNotification[];
    badgeCount: number;
    now?: number;
}

const detailFor = (ping: PingNotification): string =>
    ping.type === 'export_status'
        ? `[${ping.message.type}] ${ping.message.text}`
        : ping.message.text;

export const buildPingDebugReport = ({
    serverId,
    pings,
    badgeCount,
    now = Date.now(),
}: BuildPingDebugReportInput): PingDebugReport => {
    const rows: PingDebugRow[] = pings
        .filter((ping): boolean => ping.serverId === serverId)
        .map(
            (ping): PingDebugRow => ({
                id: ping.id,
                type: ping.type,
                channelId: ping.channelId,
                sender: ping.sender,
                senderId: ping.senderId,
                detail: detailFor(ping),
                timestamp: ping.timestamp,
                ageMs: Math.max(0, now - ping.timestamp),
            }),
        )
        .sort((a, b): number => b.timestamp - a.timestamp);

    return {
        serverId,
        badgeCount,
        listCount: rows.length,
        totalCount: pings.length,
        mismatch: badgeCount !== rows.length,
        rows,
    };
};

export const formatAge = (ageMs: number): string => {
    if (ageMs < 1000) return '0s';
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
};

export const formatTimeAgo = (
    timestamp: string | number | null | undefined,
    now = Date.now(),
): string => {
    if (!timestamp) return 'never';
    return `${formatAge(Math.max(0, now - new Date(timestamp).getTime()))} ago`;
};

export interface UnreadDebugChannelRow {
    id: string;
    name: string;
    unread: boolean;
    lastMessageAt: string | null | undefined;
    lastReadAt: string | null | undefined;
}

export const isChannelUnread = (
    channel: Pick<Channel, 'type' | 'lastMessageAt' | 'lastReadAt'>,
): boolean =>
    channel.type !== 'link' &&
    !!channel.lastMessageAt &&
    (!channel.lastReadAt ||
        new Date(channel.lastMessageAt) > new Date(channel.lastReadAt));

export const buildUnreadDebugRows = (
    channels: Channel[],
): UnreadDebugChannelRow[] =>
    channels
        .filter((channel): boolean => channel.type !== 'link')
        .map(
            (channel): UnreadDebugChannelRow => ({
                id: channel.id,
                name: channel.name,
                unread: isChannelUnread(channel),
                lastMessageAt: channel.lastMessageAt,
                lastReadAt: channel.lastReadAt,
            }),
        )
        .sort((a, b): number => Number(b.unread) - Number(a.unread));
