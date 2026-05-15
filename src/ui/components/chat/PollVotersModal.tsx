import React, { useMemo, useState } from 'react';

import type { MessagePoll } from '@/api/chat/chat.types';
import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import { useUsers } from '@/hooks/useUsers';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Text } from '@/ui/components/common/Text';
import { UserItem } from '@/ui/components/common/UserItem';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface PollVotersModalProps {
    isOpen: boolean;
    onClose: () => void;
    poll: MessagePoll;
    serverId?: string;
}

export const PollVotersModal: React.FC<PollVotersModalProps> = ({
    isOpen,
    onClose,
    poll,
    serverId,
}) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
        poll.options?.[0]?.id || null,
    );

    const allVoterIds = useMemo(() => {
        const ids = new Set<string>();
        poll.options?.forEach((opt) => opt.votes?.forEach((id) => ids.add(id)));
        return Array.from(ids);
    }, [poll.options]);

    const { data: users, isLoading } = useUsers(isOpen ? allVoterIds : []);
    const { data: members } = useMembers(serverId || null, {
        enabled: isOpen && !!serverId,
    });
    const { data: roles } = useRoles(serverId || null, {
        enabled: isOpen && !!serverId,
    });
    const { data: serverDetails } = useServerDetails(serverId || null, {
        enabled: isOpen && !!serverId,
    });

    const selectedOption = poll.options?.find(
        (opt) => opt.id === selectedOptionId,
    );

    const votersForSelected = useMemo(() => {
        if (!users) return [];
        const selectedOption = poll.options?.find(
            (opt) => opt.id === selectedOptionId,
        );
        const voterIds = selectedOption?.votes || [];
        return users.filter((u) => voterIds.includes(u._id));
    }, [users, poll.options, selectedOptionId]);

    return (
        <Modal
            noPadding
            className="max-w-3xl"
            isOpen={isOpen}
            title="Poll Voters"
            onClose={onClose}
        >
            <Box className="flex h-[500px]">
                <Box className="flex w-1/3 flex-col overflow-y-auto border-r border-border-subtle bg-bg-subtle">
                    {poll.options?.map((option) => (
                        <button
                            className={cn(
                                'flex items-center justify-between px-4 py-3 text-left transition-colors',
                                selectedOptionId === option.id
                                    ? 'border-r-2 border-r-primary bg-primary/10 text-primary'
                                    : 'hover:bg-white/5',
                            )}
                            key={option.id}
                            onClick={() => setSelectedOptionId(option.id)}
                        >
                            <Box className="flex min-w-0 items-center gap-2">
                                {option.emoji && (
                                    <Box className="flex shrink-0 items-center justify-center">
                                        {option.emojiType === 'custom' &&
                                        option.emojiId ? (
                                            <ParsedEmoji
                                                className="h-4 w-4"
                                                emojiId={option.emojiId}
                                            />
                                        ) : (
                                            <ParsedUnicodeEmoji
                                                className="text-base"
                                                content={option.emoji}
                                            />
                                        )}
                                    </Box>
                                )}
                                <span
                                    className={cn(
                                        'truncate text-sm font-medium',
                                        selectedOptionId === option.id
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    {option.text || 'Untitled Option'}
                                </span>
                            </Box>
                            <Text className="ml-2 rounded bg-muted-foreground/10 px-1.5 py-0.5 text-[10px] font-bold opacity-60">
                                {option.votes?.length || 0}
                            </Text>
                        </button>
                    ))}
                </Box>

                <Box className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <Box className="flex h-full items-center justify-center">
                            <LoadingSpinner size="lg" />
                        </Box>
                    ) : votersForSelected.length > 0 ? (
                        <>
                            <Text className="mb-2 px-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                Users who voted for "{selectedOption?.text}"
                            </Text>
                            {votersForSelected.map((user) => {
                                const member = members?.find(
                                    (m) => m.userId === user._id,
                                );
                                const userRoles =
                                    roles?.filter((r) =>
                                        member?.roles.includes(r._id),
                                    ) || [];
                                const sortedRoles = [...userRoles].sort(
                                    (a, b) => b.position - a.position,
                                );
                                const role = sortedRoles[0];
                                const iconRole = sortedRoles.find(
                                    (r) => r.icon,
                                );

                                return (
                                    <UserItem
                                        noFetch
                                        allRoles={userRoles}
                                        disableCustomFonts={
                                            serverDetails?.disableCustomFonts
                                        }
                                        disableGlowAndColors={
                                            serverDetails?.disableUsernameGlowAndCustomColor
                                        }
                                        iconRole={iconRole}
                                        key={user._id}
                                        role={role}
                                        serverId={serverId}
                                        serverRoles={roles}
                                        user={user}
                                        userId={user._id}
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <Box className="flex h-full flex-col items-center justify-center text-muted-foreground italic opacity-50">
                            <Text className="text-sm">
                                No votes for this option yet.
                            </Text>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};
