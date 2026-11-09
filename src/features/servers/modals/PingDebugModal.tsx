import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Copy } from 'lucide-react';

import { usePings } from '@/api/pings/pings.queries';
import { SERVERS_QUERY_KEYS, useChannels } from '@/api/servers/servers.queries';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/ui/primitives/Button';
import { Modal } from '@/ui/primitives/Modal';
import { Text } from '@/ui/primitives/Text';
import { useToast } from '@/ui/primitives/Toast';
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
        <Text className="tabular-nums" size="lg" weight="bold">
            {value}
        </Text>
        <Text className="opacity-70" size="xs">
            {label}
        </Text>
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
                    <Text
                        className="opacity-60"
                        size="xs"
                        transform="uppercase"
                        weight="semibold"
                    >
                        Unread
                    </Text>
                    <div className="flex flex-wrap items-center gap-2">
                        <Text
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                unreadStatus?.hasUnread
                                    ? 'bg-caution/10 text-caution'
                                    : 'bg-bg-secondary opacity-70'
                            }`}
                        >
                            {unreadStatus?.hasUnread ? 'UNREAD' : 'read'}
                        </Text>
                        <Text className="opacity-70" size="xs">
                            pill tracks messages, pings track mentions only
                        </Text>
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
                                        <Text
                                            className="w-28 shrink-0 truncate"
                                            weight="medium"
                                        >
                                            #{row.name}
                                        </Text>
                                        <Text className="flex-1 truncate opacity-70">
                                            msg{' '}
                                            {formatTimeAgo(row.lastMessageAt)}
                                        </Text>
                                        <Text className="flex-1 truncate opacity-70">
                                            read {formatTimeAgo(row.lastReadAt)}
                                        </Text>
                                        <Text
                                            className={
                                                row.unread
                                                    ? 'shrink-0 font-bold text-caution'
                                                    : 'shrink-0 opacity-40'
                                            }
                                        >
                                            {row.unread ? 'UNREAD' : '-'}
                                        </Text>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs opacity-70">
                        <Text>
                            last unread sync {formatTimeAgo(lastSyncAt)}
                        </Text>
                        <Text>WS: {status}</Text>
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-divider pt-3">
                    <Text
                        className="opacity-60"
                        size="xs"
                        transform="uppercase"
                        weight="semibold"
                    >
                        Pings
                    </Text>
                    <div className="flex items-end gap-2">
                        <Stat label="Badge" value={report.badgeCount} />
                        <Stat label="In list" value={report.listCount} />
                        <Stat label="Total cached" value={report.totalCount} />
                    </div>
                </div>

                {report.mismatch ? (
                    <Text className="text-caution">
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
                                        <Text
                                            className="truncate font-mono"
                                            size="xs"
                                        >
                                            {row.id}
                                        </Text>
                                        <Text
                                            className="shrink-0 opacity-70"
                                            size="xs"
                                        >
                                            {formatAge(row.ageMs)} ago
                                        </Text>
                                    </div>
                                    <div className="flex items-baseline gap-2 text-xs">
                                        <Text className="shrink-0 rounded bg-bg-secondary px-1.5 py-0.5 font-mono">
                                            {row.channelId ?? 'DM'}
                                        </Text>
                                        <Text
                                            className="shrink-0"
                                            weight="medium"
                                        >
                                            {row.sender}
                                        </Text>
                                        <Text className="truncate opacity-80">
                                            {row.detail}
                                        </Text>
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
