import React from 'react';

import { X } from 'lucide-react';

import { useDeletePing } from '@/api/pings/pings.queries';
import type { PingNotification } from '@/api/pings/pings.types';
import { useChannels, useServers } from '@/api/servers/servers.queries';
import type { Channel } from '@/api/servers/servers.types';
import { MessageContent } from '@/ui/components/chat/MessageContent';
import { IconButton } from '@/ui/components/common/IconButton';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/timestamp';

interface PingItemProps {
    ping: PingNotification;
    onClick: () => void;
}

export const PingItem: React.FC<PingItemProps> = ({ ping, onClick }) => {
    const { mutate: deletePing } = useDeletePing();
    const { data: servers } = useServers();
    const { data: channels } = useChannels(ping.serverId || null);

    const server = servers?.find((s) => s._id === ping.serverId);
    const serverName = server?.name;
    const channelName = channels?.find(
        (c: Channel) => c._id === ping.channelId,
    )?.name;

    const handleDelete = (e: React.MouseEvent): void => {
        e.stopPropagation();
        void deletePing(ping.id);
    };

    let snippet = '';
    if (ping.message && typeof ping.message.content === 'string') {
        snippet = ping.message.content;
    }

    return (
        <div
            className={cn(
                'group flex flex-col gap-0.5 p-3 cursor-pointer select-none border-b border-[var(--color-border-subtle)] last:border-0',
                'bg-[var(--color-background)] hover:bg-[var(--color-bg-subtle)]',
            )}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Text className="truncate" size="sm" weight="bold">
                        {ping.sender}
                    </Text>
                    <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase font-bold px-1 rounded bg-[var(--color-bg-secondary)]">
                        {ping.type}
                    </span>
                    <Text className="ml-1 shrink-0" size="2xs" variant="muted">
                        {formatDate(new Date(ping.timestamp))}
                    </Text>
                </div>

                <IconButton
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]"
                    icon={X}
                    iconSize={14}
                    title="Dismiss"
                    onClick={handleDelete}
                />
            </div>

            <div className="flex items-center gap-1 text-[10px] text-[var(--color-primary)] font-medium truncate mb-1">
                {serverName && <span>{serverName}</span>}
                {serverName && channelName && <span>/</span>}
                {channelName && <span>#{channelName}</span>}
            </div>

            <div className="text-sm text-[var(--color-foreground)] line-clamp-3 overflow-hidden opacity-90">
                <MessageContent text={snippet} />
            </div>
        </div>
    );
};
