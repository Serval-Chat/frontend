import React, { useMemo, useState } from 'react';

import { CheckCheck, Inbox, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useClearAllPings, usePings } from '@/api/pings/pings.queries';
import type { PingNotification } from '@/api/pings/pings.types';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { PingItem } from './PingItem';
import { ClearPingsModal } from './modals/ClearPingsModal';

interface PingInboxProps {
    onClose: () => void;
}

export const PingInbox: React.FC<PingInboxProps> = ({ onClose }) => {
    const { data, isLoading } = usePings();
    const { mutate: clearAll } = useClearAllPings();
    const [searchQuery, setSearchQuery] = useState('');
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const navigate = useNavigate();

    const pings = useMemo(() => data?.pings || [], [data?.pings]);

    const filteredPings = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) return pings;
        return pings.filter(
            (p: PingNotification) =>
                p.sender.toLowerCase().includes(query) ||
                (typeof p.message.content === 'string' &&
                    p.message.content.toLowerCase().includes(query)),
        );
    }, [pings, searchQuery]);

    const handlePingClick = (ping: PingNotification): void => {
        if (ping.serverId && ping.channelId) {
            void navigate(
                `/chat/@server/${ping.serverId}/channel/${ping.channelId}`,
            );
        } else if (ping.senderId) {
            void navigate(`/chat/@user/${ping.senderId}`);
        }
        onClose();
    };

    return (
        <Box
            className={cn(
                'flex h-[500px] max-h-[80vh] w-[380px] max-w-[95vw] flex-col',
                'overflow-hidden rounded-md border border-border-subtle bg-background',
            )}
        >
            {/* Header */}
            <div className="flex h-10 items-center justify-between border-b border-border-subtle bg-bg-subtle px-3">
                <div className="flex items-center gap-2">
                    <Inbox className="text-muted-foreground" size={16} />
                    <Text leading="none" size="sm" weight="bold">
                        Inbox
                    </Text>
                    {pings.length > 0 && (
                        <div className="flex h-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-foreground-inverse">
                            {pings.length}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    {pings.length > 0 && (
                        <IconButton
                            className="h-8 w-8 p-0"
                            icon={CheckCheck}
                            iconSize={16}
                            size="sm"
                            title="Clear all"
                            variant="ghost"
                            onClick={() => setIsClearModalOpen(true)}
                        />
                    )}
                    <IconButton
                        className="h-8 w-8 p-0"
                        icon={X}
                        iconSize={16}
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>
            </div>

            {/* Search */}
            <div className="border-b border-border-subtle p-2">
                <Input
                    placeholder="Search..."
                    size="sm"
                    value={searchQuery}
                    variant="secondary"
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="scrollbar-none flex flex-1 flex-col overflow-y-auto bg-background">
                {isLoading ? (
                    <div className="flex flex-col gap-1 p-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                className="h-16 animate-pulse bg-bg-subtle"
                                key={i}
                            />
                        ))}
                    </div>
                ) : filteredPings.length > 0 ? (
                    filteredPings.map((ping: PingNotification) => (
                        <PingItem
                            key={ping.id}
                            ping={ping}
                            onClick={() => handlePingClick(ping)}
                        />
                    ))
                ) : (
                    <div className="flex grow flex-col items-center justify-center p-10 text-muted-foreground">
                        <Inbox
                            className="mb-2 opacity-20"
                            size={32}
                            strokeWidth={1}
                        />
                        <Text size="xs" variant="muted">
                            {searchQuery ? 'No results.' : 'Inbox is empty.'}
                        </Text>
                    </div>
                )}
            </div>

            <div className="flex h-10 items-center justify-center border-t border-border-subtle bg-bg-subtle px-3">
                <Text
                    size="2xs"
                    tracking="wider"
                    transform="uppercase"
                    variant="muted"
                    weight="bold"
                >
                    Notifications
                </Text>
            </div>

            <ClearPingsModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={clearAll}
            />
        </Box>
    );
};
