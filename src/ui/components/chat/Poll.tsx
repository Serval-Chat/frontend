import { useEffect, useMemo, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, Trophy, Users } from 'lucide-react';

import { chatApi } from '@/api/chat/chat.api';
import type { MessagePoll } from '@/api/chat/chat.types';
import { useMe } from '@/api/users/users.queries';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';

import { PollVotersModal } from './PollVotersModal';

interface PollProps {
    poll: MessagePoll;
    messageId: string;
    serverId?: string;
    channelId?: string;
}

function formatTimeLeft(ms: number): string {
    if (ms <= 0) return 'Ended';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m ${seconds}s left`;
    return `${seconds}s left`;
}

export const Poll = ({ poll, messageId, serverId, channelId }: PollProps) => {
    const { data: me } = useMe();
    const queryClient = useQueryClient();
    const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);
    const [now, setNow] = useState((): number => Date.now());

    const expiresAt = poll.expiresAt
        ? new Date(poll.expiresAt).getTime()
        : null;
    const isExpired = expiresAt !== null && now >= expiresAt;
    const timeLeftMs = expiresAt === null ? null : Math.max(0, expiresAt - now);

    useEffect((): (() => void) | undefined => {
        if (isExpired || expiresAt === null) return;
        const interval = setInterval((): void => {
            setNow(Date.now());
        }, 1000);
        return (): void => {
            clearInterval(interval);
        };
    }, [isExpired, expiresAt]);

    const totalVotes = useMemo((): number => {
        let count = 0;
        if (!poll?.options) return 0;
        for (const opt of poll.options) {
            count += opt.votes?.length || 0;
        }
        return count;
    }, [poll.options]);

    const myVotes = useMemo((): Set<string> => {
        const votes = new Set<string>();
        if (!me || !poll?.options) return votes;
        for (const opt of poll.options) {
            if (opt.votes?.includes(me.id)) {
                votes.add(opt.id);
            }
        }
        return votes;
    }, [poll.options, me]);

    const winnerIds = useMemo((): Set<string> => {
        if (!poll?.options || totalVotes === 0) {
            return new Set<string>();
        }

        let highestVoteCount = 0;
        const winningOptions = new Set<string>();
        for (const option of poll.options) {
            const voteCount = option.votes?.length || 0;
            if (voteCount > highestVoteCount) {
                highestVoteCount = voteCount;
                winningOptions.clear();
            }
            if (voteCount === highestVoteCount) {
                winningOptions.add(option.id);
            }
        }

        return isExpired ? winningOptions : new Set<string>();
    }, [isExpired, poll.options, totalVotes]);

    const { mutate: votePoll, isPending } = useMutation({
        mutationFn: async (optionIds: string[]) =>
            serverId && channelId
                ? chatApi.votePollServer(
                      serverId,
                      channelId,
                      messageId,
                      optionIds,
                  )
                : chatApi.votePollDm(messageId, optionIds),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['chat', 'messages'],
            });
        },
    });

    const handleVote = (optionId: string): void => {
        if (!me || isExpired) return;
        const newVotes = new Set(myVotes);
        if (poll.multiSelect) {
            if (newVotes.has(optionId)) {
                newVotes.delete(optionId);
            } else {
                newVotes.add(optionId);
            }
        } else {
            if (newVotes.has(optionId)) {
                newVotes.clear();
            } else {
                newVotes.clear();
                newVotes.add(optionId);
            }
        }
        votePoll([...newVotes]);
    };

    const showVotersButton = totalVotes > 0 || isExpired;

    return (
        <Box
            className="mt-2 flex w-full max-w-[420px] flex-col gap-3 rounded-lg border border-border-subtle bg-bg-secondary p-4 shadow-sm"
            data-poll-id={messageId}
        >
            {/* Header row */}
            <Box className="flex items-center justify-between">
                <Box className="flex items-center gap-2">
                    <Text className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-50">
                        Poll
                    </Text>
                    {isExpired ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-[9px] font-bold tracking-widest text-danger uppercase">
                            Ended
                        </span>
                    ) : null}
                </Box>
                <Box className="flex items-center gap-2">
                    {poll.multiSelect && !isExpired ? (
                        <Text className="text-[10px] font-medium tracking-wider text-primary/70 uppercase">
                            Multiple Choice
                        </Text>
                    ) : null}
                    {timeLeftMs !== null && !isExpired ? (
                        <Box className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                            <Clock size={10} />
                            <span
                                className={cn(
                                    timeLeftMs < 5 * 60 * 1000 && 'text-danger',
                                )}
                            >
                                {formatTimeLeft(timeLeftMs)}
                            </span>
                        </Box>
                    ) : null}
                </Box>
            </Box>

            {/* Title */}
            <Text className="text-sm font-semibold break-words text-foreground">
                {poll.title || 'Untitled Poll'}
            </Text>

            {/* Options */}
            <Box className="flex flex-col gap-2">
                {poll.options && poll.options.length > 0 ? (
                    poll.options.map((option, index) => {
                        const voteCount = option.votes?.length || 0;
                        const percentage =
                            totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        const isVoted = myVotes.has(option.id);
                        const isWinner = winnerIds.has(option.id);

                        return (
                            <Box
                                className={cn(
                                    'relative flex cursor-pointer items-center justify-between overflow-hidden rounded-md border p-2 transition-colors',
                                    isExpired
                                        ? isWinner
                                            ? 'cursor-default border-caution/60 bg-caution-muted'
                                            : 'bg-bg-tertiary cursor-default border-border-subtle opacity-70'
                                        : isVoted
                                          ? 'border-primary/50 bg-primary/10 hover:bg-primary/20'
                                          : 'bg-bg-tertiary border-border-subtle hover:bg-white/5',
                                    !isExpired &&
                                        isPending &&
                                        'pointer-events-none cursor-not-allowed opacity-70',
                                )}
                                key={option.id || index}
                                onClick={(): false | void =>
                                    !isExpired && handleVote(option.id)
                                }
                            >
                                {/* Progress bar */}
                                {totalVotes > 0 ? (
                                    <Box
                                        className={cn(
                                            'absolute inset-y-0 left-0 transition-all duration-500 ease-in-out',
                                            isExpired && isWinner
                                                ? 'bg-caution/20'
                                                : 'bg-primary/20',
                                        )}
                                        style={{ width: `${percentage}%` }}
                                    />
                                ) : null}

                                <Box className="relative z-10 flex items-center gap-2">
                                    {isExpired ? (
                                        isWinner ? (
                                            <Trophy className="h-4 w-4 shrink-0 text-caution" />
                                        ) : (
                                            <Box className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30" />
                                        )
                                    ) : isVoted ? (
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                    ) : (
                                        <Box className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/50" />
                                    )}
                                    {option.emoji ? (
                                        <Box className="flex items-center justify-center">
                                            {option.emojiType === 'custom' &&
                                            option.emojiId ? (
                                                <ParsedEmoji
                                                    className="h-6 w-6"
                                                    emojiId={option.emojiId}
                                                />
                                            ) : (
                                                <ParsedUnicodeEmoji
                                                    className="text-xl"
                                                    content={option.emoji}
                                                />
                                            )}
                                        </Box>
                                    ) : null}
                                    <Text
                                        className={cn(
                                            'text-sm font-medium',
                                            isExpired && isWinner
                                                ? 'text-caution-muted-text'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {option.text || 'Untitled Option'}
                                    </Text>
                                </Box>

                                <Box className="relative z-10 flex items-center gap-2">
                                    {totalVotes > 0 ? (
                                        <Text className="text-xs font-semibold text-foreground">
                                            {Math.round(percentage)}%
                                        </Text>
                                    ) : null}
                                    <Text className="text-xs text-muted-foreground">
                                        {voteCount}
                                    </Text>
                                </Box>
                            </Box>
                        );
                    })
                ) : (
                    <Text className="text-xs text-muted-foreground italic">
                        No options available
                    </Text>
                )}
            </Box>

            {/* Footer row */}
            <Box className="mt-1 flex items-center justify-between">
                <Text className="text-[10px] text-muted-foreground">
                    {totalVotes} vote{totalVotes === 1 ? '' : 's'}
                    {!isExpired && expiresAt !== null ? ' · closes ' : null}
                    {!isExpired && expiresAt !== null ? (
                        <span
                            title={new Date(expiresAt).toLocaleString(
                                APP_LOCALE,
                            )}
                        >
                            {new Date(expiresAt).toLocaleDateString(
                                APP_LOCALE,
                                {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                },
                            )}
                        </span>
                    ) : null}
                </Text>

                {showVotersButton ? (
                    <button
                        className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all hover:bg-white/5 hover:text-foreground active:scale-[0.98]"
                        type="button"
                        onClick={(): void => {
                            setIsVotersModalOpen(true);
                        }}
                    >
                        <Users size={10} />
                        View voters
                    </button>
                ) : null}
            </Box>

            <PollVotersModal
                isOpen={isVotersModalOpen}
                poll={poll}
                serverId={serverId}
                onClose={(): void => {
                    setIsVotersModalOpen(false);
                }}
            />
        </Box>
    );
};
