import React from 'react';

import { SmilePlus, Trash2, Users } from 'lucide-react';

import type { MessageReaction } from '@/api/chat/chat.types';
import { useRemoveReaction } from '@/api/reactions/reactions.queries';
import type { AddReactionRequest } from '@/api/reactions/reactions.types';
import { EmojiPicker } from '@/features/emoji/EmojiPicker';
import { ParsedEmoji } from '@/features/messages/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/features/messages/ParsedUnicodeEmoji';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { useFrequentlyUsedEmojis } from '@/hooks/useFrequentlyUsedEmojis';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { ContextMenu } from '@/ui/primitives/ContextMenu';
import type { ContextMenuItem } from '@/ui/primitives/ContextMenu';
import { Text } from '@/ui/primitives/Text';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

import { ReactionVotersModal } from './ReactionVotersModal';

interface ReactionsProps {
    messageId: string;
    reactions: MessageReaction[];
    serverId?: string;
    channelId?: string;
    isDeleted?: boolean;
    canManageReactions?: boolean;
    currentUserId?: string;
    isMobile?: boolean;
    onAddReaction?: (variables: {
        messageId: string;
        serverId?: string;
        channelId?: string;
        data: AddReactionRequest;
    }) => void;
    onAddClick?: () => void;
}

interface ActiveReactionsProps extends ReactionsProps {
    showPicker: boolean;
    setShowPicker: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ReactionEmojiPickerProps {
    serverId?: string;
    channelId?: string;
    pickerRef: React.RefObject<HTMLDivElement | null>;
    onClickAway: () => void;
    onCustomEmojiSelect: (emoji: { id: string; name: string }) => void;
    onEmojiSelect: (emoji: string) => void;
}

const ReactionEmojiPicker = ({
    serverId,
    channelId,
    pickerRef,
    onClickAway,
    onCustomEmojiSelect,
    onEmojiSelect,
}: ReactionEmojiPickerProps) => {
    const { customCategories, hasExternalEmojiPermission } = useCustomEmojis({
        serverId,
        channelId,
    });
    const { frequentlyUsedCategory } = useFrequentlyUsedEmojis();
    const pickerCategories = React.useMemo(
        () =>
            frequentlyUsedCategory
                ? [...customCategories, frequentlyUsedCategory]
                : customCategories,
        [customCategories, frequentlyUsedCategory],
    );

    return (
        <div
            className="absolute bottom-full left-0 z-[var(--z-index-popover)] pb-2"
            ref={pickerRef}
        >
            <EmojiPicker
                customCategories={pickerCategories}
                hasExternalEmojiPermission={hasExternalEmojiPermission}
                onClickAway={onClickAway}
                onCustomEmojiSelect={onCustomEmojiSelect}
                onEmojiSelect={onEmojiSelect}
            />
        </div>
    );
};

const ReactionsContent = React.memo(
    ({
        messageId,
        reactions,
        serverId,
        channelId,
        isDeleted,
        canManageReactions = false,
        currentUserId,
        isMobile = false,
        onAddReaction,
        showPicker,
        setShowPicker,
    }: ActiveReactionsProps) => {
        const hiddenReactionUsersKey = useAppSelector((state): string => {
            const hiddenUsers = new Set<string>();
            for (const reaction of reactions) {
                for (const userId of reaction.users) {
                    if (
                        userId !== currentUserId &&
                        (state.blocking.blocks[userId] || 0) &
                            BlockFlags.HIDE_THEIR_REACTIONS
                    ) {
                        hiddenUsers.add(userId);
                    }
                }
            }
            return [...hiddenUsers].sort().join('\u0000');
        });
        const hiddenReactionUsers = React.useMemo(
            () =>
                new Set(
                    hiddenReactionUsersKey
                        ? hiddenReactionUsersKey.split('\u0000')
                        : [],
                ),
            [hiddenReactionUsersKey],
        );
        const removeReaction = useRemoveReaction();
        const [isVotersModalOpen, setIsVotersModalOpen] = React.useState(false);
        const [votersModalEmoji, setVotersModalEmoji] = React.useState<
            string | undefined
        >();

        const pickerRef = React.useRef<HTMLDivElement>(null);

        // Close picker when clicking outside
        React.useEffect((): (() => void) | undefined => {
            if (!showPicker) return;

            const handleClickOutside = (event: MouseEvent): void => {
                if (isMobile) return;
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
        }, [isMobile, setShowPicker, showPicker]);

        const handleEmojiSelect = React.useCallback(
            (emoji: string): void => {
                onAddReaction?.({
                    messageId,
                    serverId,
                    channelId,
                    data: { emoji, emojiType: 'unicode' },
                });
                setShowPicker(false);
            },
            [onAddReaction, messageId, serverId, channelId, setShowPicker],
        );

        const handleCustomEmojiSelect = React.useCallback(
            (emoji: { id: string; name: string }): void => {
                onAddReaction?.({
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
            [onAddReaction, messageId, serverId, channelId, setShowPicker],
        );

        const handleReactionClick = React.useCallback(
            (reaction: MessageReaction): void => {
                const hasReacted = reaction.users.includes(currentUserId || '');

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
                    onAddReaction?.({
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
                removeReaction,
                messageId,
                serverId,
                channelId,
                currentUserId,
                onAddReaction,
            ],
        );

        const filteredReactions = React.useMemo(
            () =>
                reactions.flatMap((reaction) => {
                    const filteredUsers = reaction.users.filter(
                        (userId): boolean =>
                            userId === currentUserId ||
                            !hiddenReactionUsers.has(userId),
                    );
                    if (filteredUsers.length === 0) return [];
                    return [
                        {
                            ...reaction,
                            users: filteredUsers,
                            count: filteredUsers.length,
                        },
                    ];
                }),
            [currentUserId, hiddenReactionUsers, reactions],
        );

        return (
            <Box className="mt-1 mb-1 flex flex-wrap gap-1">
                {filteredReactions.map((reaction) => {
                    const hasReacted = reaction.users.includes(
                        currentUserId || '',
                    );
                    const reactionKey =
                        reaction.emojiType === 'custom'
                            ? reaction.emojiId
                            : reaction.emoji;

                    const reactionElement = (
                        <Box
                            className={cn(
                                'flex items-center gap-1.5 rounded-md border px-2 py-1 transition-all select-none',
                                isDeleted ? 'cursor-default' : 'cursor-pointer',
                                hasReacted
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border-subtle bg-bg-subtle text-muted-foreground hover:border-border-subtle/80 hover:bg-bg-subtle-hover',
                            )}
                            title={
                                reaction.users.length > 0
                                    ? `${reaction.count} reactions`
                                    : undefined
                            }
                            onClick={
                                isDeleted
                                    ? undefined
                                    : (): void => {
                                          handleReactionClick(reaction);
                                      }
                            }
                        >
                            <Text className="text-base leading-none">
                                {reaction.emojiType === 'custom' ? (
                                    reaction.emojiUrl ? (
                                        <img
                                            alt={reaction.emoji}
                                            className="inline-block h-6 w-6 cursor-pointer object-contain align-middle"
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
                                            className="inline-block h-6 w-6 align-middle"
                                            emojiId={reaction.emojiId}
                                        />
                                    )
                                ) : (
                                    <ParsedUnicodeEmoji
                                        className="!top-0 h-6 w-6"
                                        content={reaction.emoji}
                                    />
                                )}
                            </Text>
                            <Text className="font-semibold" size="sm">
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

                    if (
                        canManageReactions &&
                        serverId &&
                        channelId &&
                        !isDeleted
                    ) {
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

                {isDeleted ? null : (
                    <Box className="relative h-full">
                        <Button
                            className="h-full min-h-[32px] border border-border-subtle bg-bg-subtle text-muted-foreground hover:border-border-subtle/80 hover:bg-bg-subtle-hover"
                            size="sm"
                            title="Add Reaction"
                            variant="ghost"
                            onClick={(): void => {
                                setShowPicker((previous): boolean => !previous);
                            }}
                        >
                            <SmilePlus size={18} />
                        </Button>

                        {showPicker ? (
                            <ReactionEmojiPicker
                                channelId={channelId}
                                pickerRef={pickerRef}
                                serverId={serverId}
                                onClickAway={(): void => setShowPicker(false)}
                                onCustomEmojiSelect={handleCustomEmojiSelect}
                                onEmojiSelect={handleEmojiSelect}
                            />
                        ) : null}
                    </Box>
                )}

                <ReactionVotersModal
                    initialEmoji={votersModalEmoji}
                    isOpen={isVotersModalOpen}
                    reactions={filteredReactions}
                    serverId={serverId}
                    onClose={(): void => {
                        setIsVotersModalOpen(false);
                    }}
                />
            </Box>
        );
    },
);

ReactionsContent.displayName = 'ReactionsContent';

export const Reactions = React.memo((props: ReactionsProps) => {
    const [showPicker, setShowPicker] = React.useState(false);
    if (props.reactions.length === 0 && !showPicker) return null;

    return (
        <ReactionsContent
            canManageReactions={props.canManageReactions}
            channelId={props.channelId}
            currentUserId={props.currentUserId}
            isDeleted={props.isDeleted}
            isMobile={props.isMobile}
            messageId={props.messageId}
            reactions={props.reactions}
            serverId={props.serverId}
            setShowPicker={setShowPicker}
            showPicker={showPicker}
            onAddClick={props.onAddClick}
            onAddReaction={props.onAddReaction}
        />
    );
});

Reactions.displayName = 'Reactions';
