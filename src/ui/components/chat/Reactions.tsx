import React from 'react';

import { SmilePlus, Trash2, Users } from 'lucide-react';

import type { MessageReaction } from '@/api/chat/chat.types';
import {
    useAddReaction,
    useRemoveReaction,
} from '@/api/reactions/reactions.queries';
import { useMe } from '@/api/users/users.queries';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import { Button } from '@/ui/components/common/Button';
import { ContextMenu } from '@/ui/components/common/ContextMenu';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Text } from '@/ui/components/common/Text';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

import { ReactionVotersModal } from './ReactionVotersModal';

interface ReactionsProps {
    messageId: string;
    reactions: MessageReaction[];
    serverId?: string;
    channelId?: string;
    onAddClick?: () => void;
}

export const Reactions = React.memo(
    ({ messageId, reactions, serverId, channelId }: ReactionsProps) => {
        const { data: me } = useMe();
        const blocks = useAppSelector(
            (state): Record<string, number> => state.blocking.blocks,
        );
        const addReaction = useAddReaction();
        const removeReaction = useRemoveReaction();
        const [showPicker, setShowPicker] = React.useState(false);
        const [isVotersModalOpen, setIsVotersModalOpen] = React.useState(false);
        const [votersModalEmoji, setVotersModalEmoji] = React.useState<
            string | undefined
        >();

        const pickerRef = React.useRef<HTMLDivElement>(null);
        const { customCategories } = useCustomEmojis({ enabled: showPicker });
        const { hasPermission } = usePermissions(
            serverId ?? null,
            channelId ?? null,
        );
        const canManageReactions = hasPermission('manageReactions');

        // Close picker when clicking outside
        React.useEffect((): (() => void) | undefined => {
            if (!showPicker) return;

            const handleClickOutside = (event: MouseEvent): void => {
                if (
                    pickerRef.current &&
                    !pickerRef.current.contains(event.target as Node)
                ) {
                    setShowPicker(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return (): void => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [showPicker]);

        const handleEmojiSelect = React.useCallback(
            (emoji: string): void => {
                addReaction.mutate({
                    messageId,
                    serverId,
                    channelId,
                    data: { emoji, emojiType: 'unicode' },
                });
                setShowPicker(false);
            },
            [addReaction, messageId, serverId, channelId],
        );

        const handleCustomEmojiSelect = React.useCallback(
            (emoji: { id: string; name: string }): void => {
                addReaction.mutate({
                    messageId,
                    serverId,
                    channelId,
                    data: {
                        emoji: emoji.name,
                        emojiType: 'custom',
                        emojiId: emoji.id,
                    },
                });
                setShowPicker(false);
            },
            [addReaction, messageId, serverId, channelId],
        );

        const handleReactionClick = React.useCallback(
            (reaction: MessageReaction): void => {
                const hasReacted = reaction.users.includes(me?._id || '');

                if (hasReacted) {
                    removeReaction.mutate({
                        messageId,
                        serverId,
                        channelId,
                        data: {
                            emoji: reaction.emoji,
                            emojiId:
                                reaction.emojiType === 'custom'
                                    ? reaction.emojiId
                                    : undefined,
                            scope: 'me',
                        },
                    });
                } else {
                    addReaction.mutate({
                        messageId,
                        serverId,
                        channelId,
                        data: {
                            emoji: reaction.emoji,
                            emojiType: reaction.emojiType,
                            emojiId:
                                reaction.emojiType === 'custom'
                                    ? reaction.emojiId
                                    : undefined,
                        },
                    });
                }
            },
            [
                addReaction,
                removeReaction,
                messageId,
                serverId,
                channelId,
                me?._id,
            ],
        );

        if (!reactions.length && !showPicker) return null;

        const filteredReactions = reactions
            .map((r) => {
                const filteredUsers = r.users.filter((uid): boolean => {
                    if (uid === me?._id) return true;
                    const userBlocks = blocks[uid] || 0;
                    return !(userBlocks & BlockFlags.HIDE_THEIR_REACTIONS);
                });
                return {
                    ...r,
                    users: filteredUsers,
                    count: filteredUsers.length,
                };
            })
            .filter((r): boolean => r.count > 0);

        return (
            <Box className="mt-1 mb-1 flex flex-wrap gap-1">
                {filteredReactions.map((reaction) => {
                    const hasReacted = reaction.users.includes(me?._id || '');
                    const reactionKey =
                        reaction.emojiType === 'custom'
                            ? reaction.emojiId
                            : reaction.emoji;

                    const reactionElement = (
                        <Box
                            className={cn(
                                'flex cursor-pointer items-center gap-1.5 rounded-md border px-1.5 py-0.5 transition-all select-none',
                                hasReacted
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border-subtle bg-bg-subtle text-muted-foreground hover:border-border-subtle/80 hover:bg-bg-subtle-hover',
                            )}
                            title={
                                reaction.users.length > 0
                                    ? `${reaction.count} reactions`
                                    : undefined
                            }
                            onClick={(): void => handleReactionClick(reaction)}
                        >
                            <Text className="text-base leading-none">
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
                                        className="!top-0 h-5 w-5"
                                        content={reaction.emoji}
                                    />
                                )}
                            </Text>
                            <Text className="font-semibold" size="xs">
                                {reaction.count}
                            </Text>
                        </Box>
                    );

                    const contextMenuItems: ContextMenuItem[] = [
                        {
                            id: 'view-reactions',
                            label: 'View Reactions',
                            icon: Users,
                            onClick: (): void => {
                                setVotersModalEmoji(reaction.emoji);
                                setIsVotersModalOpen(true);
                            },
                        },
                    ];

                    if (canManageReactions && serverId && channelId) {
                        contextMenuItems.push({
                            id: 'remove-reaction',
                            label: 'Remove Emoji',
                            icon: Trash2,
                            variant: 'danger',
                            onClick: (): void => {
                                removeReaction.mutate({
                                    messageId,
                                    serverId,
                                    channelId,
                                    data: {
                                        emoji: reaction.emoji,
                                        emojiId:
                                            reaction.emojiType === 'custom'
                                                ? reaction.emojiId
                                                : undefined,
                                        scope: 'all',
                                    },
                                });
                            },
                        });
                    }

                    return (
                        <ContextMenu items={contextMenuItems} key={reactionKey}>
                            {reactionElement}
                        </ContextMenu>
                    );
                })}

                <Box className="relative h-full">
                    <Button
                        className="h-full min-h-[24px] border border-border-subtle bg-bg-subtle text-muted-foreground hover:border-border-subtle/80 hover:bg-bg-subtle-hover"
                        size="sm"
                        title="Add Reaction"
                        variant="ghost"
                        onClick={(): void => setShowPicker(!showPicker)}
                    >
                        <SmilePlus size={16} />
                    </Button>

                    {showPicker && (
                        <div
                            className="absolute bottom-full left-0 z-[var(--z-index-popover)] pb-2"
                            ref={pickerRef}
                        >
                            <EmojiPicker
                                customCategories={customCategories}
                                onCustomEmojiSelect={handleCustomEmojiSelect}
                                onEmojiSelect={handleEmojiSelect}
                            />
                        </div>
                    )}
                </Box>

                <ReactionVotersModal
                    initialEmoji={votersModalEmoji}
                    isOpen={isVotersModalOpen}
                    reactions={filteredReactions}
                    serverId={serverId}
                    onClose={(): void => setIsVotersModalOpen(false)}
                />
            </Box>
        );
    },
);

Reactions.displayName = 'Reactions';
