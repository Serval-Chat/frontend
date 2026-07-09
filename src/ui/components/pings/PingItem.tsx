import React from 'react';

import { X } from 'lucide-react';

import { useDeletePing } from '@/api/pings/pings.queries';
import type { PingNotification } from '@/api/pings/pings.types';
import { useServers } from '@/api/servers/servers.queries';
import { MessageContent } from '@/ui/components/chat/MessageContent';
import { IconButton } from '@/ui/components/common/IconButton';
import { Text } from '@/ui/components/common/Text';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/timestamp';

interface PingItemProps {
    ping: PingNotification;
    onClick: () => void;
}

export const PingItem = ({ ping, onClick }: PingItemProps) => {
    const { mutate: deletePing } = useDeletePing();
    const { data: servers } = useServers();

    const server = servers?.find((s): boolean => s.id === ping.serverId);

    const handleDelete = (e: React.MouseEvent): void => {
        e.stopPropagation();
        deletePing(ping.id);
    };

    let snippet = '';
    if (ping.message && 'text' in ping.message) {
        snippet = ping.message.text;
    }

    return (
        <button
            aria-label="Go to ping"
            className={cn(
                'group flex w-full cursor-pointer flex-col gap-0.5 border-b border-border-subtle p-3 text-left select-none last:border-0',
                'bg-background hover:bg-bg-subtle',
            )}
            type="button"
            onClick={onClick}
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

            {server ? (
                <div className="mb-1 flex items-center gap-1.5 truncate text-[10px] font-medium text-primary">
                    <ServerIcon
                        className="pointer-events-none shrink-0"
                        server={server}
                        size="xxs"
                    />
                    <span className="truncate">
                        {ping.sender} mentioned you in {server.name}
                    </span>
                </div>
            ) : null}

            <div className="line-clamp-3 overflow-hidden text-sm text-foreground opacity-90">
                <MessageContent text={snippet} />
            </div>
        </button>
    );
};
