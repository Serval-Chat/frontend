import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';

import { usePings } from '@/api/pings/pings.queries';
import { SERVERS_QUERY_KEYS, useChannels } from '@/api/servers/servers.queries';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/ui/components/common/Button';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import {
    buildPingDebugReport,
    buildUnreadDebugRows,
    formatAge,
    formatTimeAgo,
} from '@/utils/pingDebugReport';

interface PingDebugModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
    serverName: string;
    badgeCount?: number;
    isActive?: boolean;
}

const Stat = ({
    label,
    value,
}: {
    label: string;
    value: number;
}): React.ReactElement => (
    <div className="flex flex-col items-center rounded-md bg-bg-secondary px-3 py-2">
        <span className="text-lg font-bold tabular-nums">{value}</span>
        <span className="text-xs opacity-70">{label}</span>
    </div>
);

export const PingDebugModal = ({
    isOpen,
    onClose,
    serverId,
    serverName,
    badgeCount = 0,
    isActive = false,
}: PingDebugModalProps): React.ReactElement => {
    const { data } = usePings();
    const { showToast } = useToast();
    const { data: channels } = useChannels(serverId);
    const { status } = useConnectivity();
    const queryClient = useQueryClient();
    const unreadStatus = useAppSelector(
        (state): { hasUnread: boolean; pingCount: number } | undefined =>
            state.unread.unreadServers[serverId],
    );

    const report = buildPingDebugReport({
        serverId,
        pings: data?.pings ?? [],
        badgeCount,
    });
    const unreadRows = buildUnreadDebugRows(channels ?? []);
    const lastSyncAt = queryClient.getQueryState(
        SERVERS_QUERY_KEYS.unread(),
    )?.dataUpdatedAt;

    const handleCopyJson = (): void => {
        void navigator.clipboard.writeText(
            JSON.stringify(
                {
                    ...report,
                    unread: {
                        hasUnread: unreadStatus?.hasUnread ?? false,
                        pingCount: unreadStatus?.pingCount ?? 0,
                        lastSyncAt: lastSyncAt ?? null,
                        connectivity: status,
                        channels: unreadRows,
                    },
                },
                null,
                2,
            ),
        );
        showToast('Debug report copied as JSON');
    };

    return (
        <Modal
            isOpen={isOpen}
            title={`State (Debug): ${serverName}`}
            onClose={onClose}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase opacity-60">
                        Unread
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                unreadStatus?.hasUnread
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-bg-secondary opacity-70'
                            }`}
                        >
                            {unreadStatus?.hasUnread ? 'UNREAD' : 'read'}
                        </span>
                        <span className="text-xs opacity-70">
                            pill tracks messages, pings track mentions only
                        </span>
                    </div>
                    {isActive ? (
                        <Text className="text-xs opacity-60">
                            The list hides this server&apos;s pill and badge
                            while you are in it.
                        </Text>
                    ) : null}
                    {unreadRows.length === 0 ? (
                        <Text className="opacity-70">
                            No channel data for this server.
                        </Text>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {unreadRows.map(
                                (row): React.ReactElement => (
                                    <div
                                        className="flex items-baseline gap-2 rounded-md border border-divider px-3 py-2 text-xs"
                                        key={row.id}
                                    >
                                        <span className="w-28 shrink-0 truncate font-medium">
                                            #{row.name}
                                        </span>
                                        <span className="flex-1 truncate opacity-70">
                                            msg{' '}
                                            {formatTimeAgo(row.lastMessageAt)}
                                        </span>
                                        <span className="flex-1 truncate opacity-70">
                                            read {formatTimeAgo(row.lastReadAt)}
                                        </span>
                                        <span
                                            className={
                                                row.unread
                                                    ? 'text-warning shrink-0 font-bold'
                                                    : 'shrink-0 opacity-40'
                                            }
                                        >
                                            {row.unread ? 'UNREAD' : '-'}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs opacity-70">
                        <span>
                            last unread sync {formatTimeAgo(lastSyncAt)}
                        </span>
                        <span>WS: {status}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-divider pt-3">
                    <span className="text-xs font-semibold uppercase opacity-60">
                        Pings
                    </span>
                    <div className="flex items-end gap-2">
                        <Stat label="Badge" value={report.badgeCount} />
                        <Stat label="In list" value={report.listCount} />
                        <Stat label="Total cached" value={report.totalCount} />
                    </div>
                </div>

                {report.mismatch ? (
                    <Text className="text-warning">
                        Badge and list disagree ({report.badgeCount} vs{' '}
                        {report.listCount}). The badge is maintained live by
                        WebSocket events; the list is the last REST fetch of{' '}
                        <code>/api/v1/pings</code>.
                    </Text>
                ) : (
                    <Text className="opacity-70">
                        Badge matches the list ({report.listCount} ping
                        {report.listCount === 1 ? '' : 's'}).
                    </Text>
                )}

                {report.rows.length === 0 ? (
                    <Text className="opacity-70">
                        No cached pings for this server.
                    </Text>
                ) : (
                    <div className="flex flex-col gap-2">
                        {report.rows.map(
                            (row): React.ReactElement => (
                                <div
                                    className="flex flex-col gap-0.5 rounded-md border border-divider px-3 py-2"
                                    key={row.id}
                                >
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="truncate font-mono text-xs">
                                            {row.id}
                                        </span>
                                        <span className="shrink-0 text-xs opacity-70">
                                            {formatAge(row.ageMs)} ago
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 text-xs">
                                        <span className="shrink-0 rounded bg-bg-secondary px-1.5 py-0.5 font-mono">
                                            {row.channelId ?? 'DM'}
                                        </span>
                                        <span className="shrink-0 font-medium">
                                            {row.sender}
                                        </span>
                                        <span className="truncate opacity-80">
                                            {row.detail}
                                        </span>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={handleCopyJson}>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy JSON
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
