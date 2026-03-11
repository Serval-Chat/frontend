import React, { useMemo, useState } from 'react';

import { CheckCheck, Inbox, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { PingNotification } from '@/api/pings';
import { useClearAllPings, usePings } from '@/api/pings';
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
                'flex flex-col w-[380px] max-w-[95vw] h-[500px] max-h-[80vh]',
                'bg-[var(--color-background)] border border-[var(--color-border-subtle)] rounded-md overflow-hidden',
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]">
                <div className="flex items-center gap-2">
                    <Inbox
                        className="text-[var(--color-muted-foreground)]"
                        size={16}
                    />
                    <Text leading="none" size="sm" weight="bold">
                        Inbox
                    </Text>
                    {pings.length > 0 && (
                        <div className="bg-[var(--color-primary)] text-[var(--color-foreground-inverse)] text-[10px] font-bold px-1.5 h-4 flex items-center justify-center rounded-full">
                            {pings.length}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    {pings.length > 0 && (
                        <IconButton
                            className="w-8 h-8 p-0"
                            icon={CheckCheck}
                            iconSize={16}
                            size="sm"
                            title="Clear all"
                            variant="ghost"
                            onClick={() => setIsClearModalOpen(true)}
                        />
                    )}
                    <IconButton
                        className="w-8 h-8 p-0"
                        icon={X}
                        iconSize={16}
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-[var(--color-border-subtle)]">
                <Input
                    placeholder="Search..."
                    size="sm"
                    value={searchQuery}
                    variant="secondary"
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto flex flex-col bg-[var(--color-background)] scrollbar-none">
                {isLoading ? (
                    <div className="flex flex-col p-2 gap-1">
                        {[1, 2, 3].map((i) => (
                            <div
                                className="h-16 bg-[var(--color-bg-subtle)] animate-pulse"
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
                    <div className="flex flex-col items-center justify-center grow text-[var(--color-muted-foreground)] p-10">
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

            <div className="flex items-center justify-center h-10 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-3">
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
