import React from 'react';

import { SmilePlus } from 'lucide-react';

import type { MessageReaction } from '@/api/chat/chat.types';
import {
    useAddReaction,
    useRemoveReaction,
} from '@/api/reactions/reactions.queries';
import { useMe } from '@/api/users/users.queries';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Text } from '@/ui/components/common/Text';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface ReactionsProps {
    messageId: string;
    reactions: MessageReaction[];
    serverId?: string;
    channelId?: string;
    onAddClick?: () => void;
}

export const Reactions: React.FC<ReactionsProps> = ({
    messageId,
    reactions,
    serverId,
    channelId,
}) => {
    const { data: me } = useMe();
    const addReaction = useAddReaction();
    const removeReaction = useRemoveReaction();
    const [showPicker, setShowPicker] = React.useState(false);
    const pickerRef = React.useRef<HTMLDivElement>(null);
    const { customCategories } = useCustomEmojis();

    // Close picker when clicking outside
    React.useEffect(() => {
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPicker]);

    const handleEmojiSelect = (emoji: string): void => {
        addReaction.mutate({
            messageId,
            serverId,
            channelId,
            data: { emoji, emojiType: 'unicode' },
        });
        setShowPicker(false);
    };

    const handleCustomEmojiSelect = (emoji: {
        id: string;
        name: string;
    }): void => {
        addReaction.mutate({
            messageId,
            serverId,
            channelId,
            data: { emoji: emoji.name, emojiType: 'custom', emojiId: emoji.id },
        });
        setShowPicker(false);
    };

    if (!reactions.length && !showPicker) return null;

    const handleReactionClick = (reaction: MessageReaction): void => {
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
    };

    return (
        <Box className="flex flex-wrap gap-1 mt-1 mb-1">
            {reactions.map((reaction) => {
                const hasReacted = reaction.users.includes(me?._id || '');
                return (
                    <Box
                        className={cn(
                            'flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border transition-all cursor-pointer select-none',
                            hasReacted
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10',
                        )}
                        key={`${reaction.emoji}-${reaction.users.join(',')}`}
                        title={
                            reaction.users.length > 0
                                ? `${reaction.count} reactions`
                                : undefined
                        }
                        onClick={() => handleReactionClick(reaction)}
                    >
                        <Text className="text-base leading-none">
                            {reaction.emojiType === 'custom' &&
                            reaction.emojiUrl ? (
                                <img
                                    alt={reaction.emoji}
                                    className="w-4 h-4 object-contain"
                                    src={resolveApiUrl(reaction.emojiUrl) || ''}
                                />
                            ) : (
                                <ParsedUnicodeEmoji content={reaction.emoji} />
                            )}
                        </Text>
                        <Text className="font-semibold" size="xs">
                            {reaction.count}
                        </Text>
                    </Box>
                );
            })}

            <Box className="relative">
                <button
                    className="flex items-center justify-center px-1.5 py-0.5 rounded-md border border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10 cursor-pointer transition-all h-full"
                    title="Add Reaction"
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    <SmilePlus size={16} />
                </button>

                {showPicker && (
                    <div
                        className="absolute bottom-full left-0 mb-2 z-[var(--z-popover)]"
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
        </Box>
    );
};
