import React from 'react';

import {
    CornerUpLeft,
    Edit,
    Pin,
    RefreshCw,
    SmilePlus,
    StickyNote,
    Trash2,
} from 'lucide-react';

import type { QuickReactionEmoji } from '@/hooks/useFrequentlyUsedEmojis';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Button } from '@/ui/components/common/Button';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { emojiMap } from '@/utils/emoji';

const quickReactionLabel = (quickReaction: QuickReactionEmoji): string =>
    quickReaction.emojiType === 'custom'
        ? `:${quickReaction.name}:`
        : `:${emojiMap.get(quickReaction.emoji)?.short_name ?? quickReaction.emoji}:`;

interface MessageActionsProps {
    message: ProcessedChatMessage;
    canEdit: boolean;
    canDelete: boolean;
    canPin: boolean;
    canReact: boolean;
    showPicker: boolean;
    quickReactions?: QuickReactionEmoji[];
    onQuickReact?: (emoji: QuickReactionEmoji) => void;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    onTogglePicker: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onToggleSticky: () => void;
    reactRef: React.RefObject<HTMLButtonElement | null>;
    onRetry?: () => void;
    onDiscard?: () => void;
}

export const MessageActions = React.memo(
    ({
        message,
        canEdit,
        canDelete,
        canPin,
        canReact,
        showPicker,
        quickReactions,
        onQuickReact,
        onReplyToMessage,
        onTogglePicker,
        onEdit,
        onDelete,
        onTogglePin,
        onToggleSticky,
        reactRef,
        onRetry,
        onDiscard,
    }: MessageActionsProps) => {
        if (message._pending === 'failed') {
            return (
                <Box className="flex items-center gap-1 rounded border border-white/5 bg-background px-1 py-1 shadow-xl">
                    {onRetry ? (
                        <Tooltip content="Try again" position="top">
                            <Button
                                className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                                size="sm"
                                title="Try again"
                                variant="ghost"
                                onClick={onRetry}
                            >
                                <RefreshCw size={18} />
                            </Button>
                        </Tooltip>
                    ) : null}
                    {onDiscard || onDelete ? (
                        <Tooltip content="Delete message" position="top">
                            <Button
                                className="h-8 w-8 rounded p-1.5 text-danger transition-colors hover:bg-danger/20 hover:text-danger"
                                size="sm"
                                variant="ghost"
                                onClick={onDiscard || onDelete}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </Tooltip>
                    ) : null}
                </Box>
            );
        }

        return (
            <Box className="flex items-center gap-1 rounded border border-white/5 bg-background px-1 py-1 shadow-xl max-md:hidden">
            {canReact && quickReactions && quickReactions.length > 0
                ? quickReactions.map((quickReaction) => (
                      <Tooltip
                          content={quickReactionLabel(quickReaction)}
                          key={quickReaction.key}
                          position="top"
                      >
                          <Button
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-white/5"
                              size="sm"
                              variant="ghost"
                              onClick={(): void => {
                                  onQuickReact?.(quickReaction);
                              }}
                          >
                              {quickReaction.emojiType === 'custom' ? (
                                  <img
                                      alt={quickReaction.name}
                                      className="h-7 w-7 object-contain"
                                      src={
                                          resolveApiUrl(
                                              quickReaction.imageUrl,
                                          ) || ''
                                      }
                                  />
                              ) : (
                                  <ParsedUnicodeEmoji
                                      className="top-0! h-7 w-7"
                                      content={quickReaction.emoji}
                                  />
                              )}
                          </Button>
                      </Tooltip>
                  ))
                : null}

            {onReplyToMessage ? (
                <Button
                    className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    size="sm"
                    title="Reply"
                    variant="ghost"
                    onClick={(): void => {
                        onReplyToMessage(message);
                    }}
                >
                    <CornerUpLeft size={18} />
                </Button>
            ) : null}
            {canReact ? (
                <Button
                    className={cn(
                        'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                        showPicker && 'bg-white/10 text-foreground',
                    )}
                    ref={reactRef}
                    size="sm"
                    title="Add Reaction"
                    variant="ghost"
                    onClick={onTogglePicker}
                >
                    <SmilePlus size={18} />
                </Button>
            ) : null}

            {canEdit ? (
                <Button
                    className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    size="sm"
                    title="Edit Message"
                    variant="ghost"
                    onClick={onEdit}
                >
                    <Edit size={18} />
                </Button>
            ) : null}

            {canPin && message.serverId && message.channelId ? (
                <>
                    <Button
                        className={cn(
                            'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                            message.isPinned && 'text-primary',
                        )}
                        size="sm"
                        title={
                            message.isPinned ? 'Unpin Message' : 'Pin Message'
                        }
                        variant="ghost"
                        onClick={onTogglePin}
                    >
                        <Pin
                            className={cn(
                                'h-4 w-4',
                                message.isPinned && 'fill-primary',
                            )}
                            size={18}
                        />
                    </Button>
                    <Button
                        className={cn(
                            'h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                            message.isSticky && 'text-primary',
                        )}
                        size="sm"
                        title={
                            message.isSticky
                                ? 'Unsticky Message'
                                : 'Sticky Message'
                        }
                        variant="ghost"
                        onClick={onToggleSticky}
                    >
                        <StickyNote
                            className={cn(
                                'h-4 w-4',
                                message.isSticky && 'fill-primary',
                            )}
                            size={18}
                        />
                    </Button>
                </>
            ) : null}

            {canDelete ? (
                <Button
                    className="h-8 w-8 rounded p-1.5 text-muted-foreground transition-colors hover:bg-danger/20 hover:text-danger"
                    size="sm"
                    title="Delete Message"
                    variant="ghost"
                    onClick={onDelete}
                >
                    <Trash2 size={18} />
                </Button>
            ) : null}
        </Box>
    );
});

MessageActions.displayName = 'MessageActions';
