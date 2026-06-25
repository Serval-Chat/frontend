import { useMemo, useState } from 'react';

import type { MessageReaction } from '@/api/chat/chat.types';
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
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { emojiMap } from '@/utils/emoji';

interface ReactionVotersModalProps {
    isOpen: boolean;
    onClose: () => void;
    reactions: MessageReaction[];
    serverId?: string;
    initialEmoji?: string;
}

export const ReactionVotersModal = ({
    isOpen,
    onClose,
    reactions,
    serverId,
    initialEmoji,
}: ReactionVotersModalProps) => {
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
    const normalizedInitialEmoji = initialEmoji || null;
    const syncKey = `${String(isOpen)}:${String(normalizedInitialEmoji)}`;
    const [syncedKey, setSyncedKey] = useState(syncKey);
    if (syncKey !== syncedKey) {
        setSyncedKey(syncKey);
        if (isOpen) {
            setSelectedEmoji(
                normalizedInitialEmoji || reactions[0]?.emoji || null,
            );
        }
    }

    const allVoterIds = useMemo((): string[] => {
        const ids = new Set<string>();
        reactions.forEach((reaction): void =>
            reaction.users.forEach((id): Set<string> => ids.add(id)),
        );
        return Array.from(ids);
    }, [reactions]);

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

    const votersForSelected = useMemo(() => {
        if (!users) return [];
        const selectedReaction = reactions.find(
            (r): boolean => r.emoji === selectedEmoji,
        );
        const voterIds = selectedReaction?.users || [];
        return users.filter((u): boolean => voterIds.includes(u.id));
    }, [users, reactions, selectedEmoji]);

    return (
        <Modal
            noPadding
            className="max-w-3xl"
            isOpen={isOpen}
            title="Reactions"
            onClose={onClose}
        >
            <Box className="flex h-[500px]">
                <Box className="flex w-1/3 flex-col overflow-y-auto border-r border-border-subtle bg-bg-subtle">
                    {reactions.map((reaction) => (
                        <button
                            className={cn(
                                'flex items-center justify-between px-4 py-3 text-left transition-colors',
                                selectedEmoji === reaction.emoji
                                    ? 'border-r-2 border-r-primary bg-primary/10 text-primary'
                                    : 'hover:bg-white/5',
                            )}
                            key={reaction.emoji}
                            type="button"
                            onClick={(): void =>
                                setSelectedEmoji(reaction.emoji)
                            }
                        >
                            <Box className="flex min-w-0 items-center gap-2">
                                <Box className="flex shrink-0 items-center justify-center">
                                    {reaction.emojiType === 'custom' ? (
                                        reaction.emojiUrl ? (
                                            <img
                                                alt={reaction.emoji}
                                                className="inline-block h-5 w-5 cursor-pointer object-contain align-middle"
                                                src={
                                                    resolveApiUrl(
                                                        reaction.emojiUrl,
                                                    ) || ''
                                                }
                                                title={
                                                    reaction.emojiName ||
                                                    reaction.emoji
                                                }
                                            />
                                        ) : (
                                            <ParsedEmoji
                                                className="inline-block h-5 w-5 align-middle"
                                                emojiId={reaction.emojiId}
                                            />
                                        )
                                    ) : (
                                        <ParsedUnicodeEmoji
                                            className="text-base"
                                            content={reaction.emoji}
                                        />
                                    )}
                                </Box>
                                <span
                                    className={cn(
                                        'truncate text-sm font-medium',
                                        selectedEmoji === reaction.emoji
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    {reaction.emojiType === 'custom'
                                        ? reaction.emojiName || reaction.emoji
                                        : emojiMap
                                              .get(reaction.emoji)
                                              ?.name.toLowerCase() ||
                                          reaction.emoji}
                                </span>
                            </Box>
                            <Text className="ml-2 rounded bg-muted-foreground/10 px-1.5 py-0.5 text-[10px] font-bold opacity-60">
                                {reaction.count}
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
                                Users who reacted
                            </Text>
                            {votersForSelected.map((user) => {
                                const member = members?.find(
                                    (m): boolean => m.userId === user.id,
                                );
                                const userRoles =
                                    roles?.filter((r): boolean | undefined =>
                                        member?.roles.includes(r.id),
                                    ) || [];
                                const sortedRoles = userRoles.slice();
                                sortedRoles.sort(
                                    (a, b): number => b.position - a.position,
                                );
                                const role = sortedRoles[0];
                                const iconRole = sortedRoles.find(
                                    (r): string | undefined => r.icon,
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
                                        key={user.id}
                                        role={role}
                                        serverId={serverId}
                                        serverRoles={roles}
                                        user={user}
                                        userId={user.id}
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <Box className="flex h-full flex-col items-center justify-center text-muted-foreground italic opacity-50">
                            <Text className="text-sm">
                                No reactions for this emoji.
                            </Text>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};
