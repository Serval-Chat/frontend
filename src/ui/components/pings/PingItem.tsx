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
                'group flex cursor-pointer flex-col gap-0.5 border-b border-border-subtle p-3 select-none last:border-0',
                'bg-background hover:bg-bg-subtle',
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
                <div className="flex min-w-0 items-center gap-1.5">
                    <Text className="truncate" size="sm" weight="bold">
                        {ping.sender}
                    </Text>
                    <span className="rounded bg-bg-secondary px-1 text-[10px] font-bold text-muted-foreground uppercase">
                        {ping.type}
                    </span>
                    <Text className="ml-1 shrink-0" size="2xs" variant="muted">
                        {formatDate(new Date(ping.timestamp))}
                    </Text>
                </div>

                <IconButton
                    className="h-6 w-6 shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger-muted hover:text-danger"
                    icon={X}
                    iconSize={14}
                    title="Dismiss"
                    onClick={handleDelete}
                />
            </div>

            <div className="mb-1 flex items-center gap-1 truncate text-[10px] font-medium text-primary">
                {serverName && <span>{serverName}</span>}
                {serverName && channelName && <span>/</span>}
                {channelName && <span>#{channelName}</span>}
            </div>

            <div className="line-clamp-3 overflow-hidden text-sm text-foreground opacity-90">
                <MessageContent text={snippet} />
            </div>
        </div>
    );
};
